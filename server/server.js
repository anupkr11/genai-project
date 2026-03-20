const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

/**
 * ROUTE 1: Upload + AI Extraction (Groq)
 */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // ✅ 1. Check file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { question } = req.body;

    let text = "";

    // ✅ 2. Extract text
    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      text = req.file.buffer.toString();
    }

    // 🔥 3. LIMIT TEXT (THIS FIXES YOUR ERROR)
    const limitedText = text.split(" ").slice(0, 1500).join(" ");
    // OR: text.substring(0, 4000)

    // ✅ 4. Groq API Call
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
Extract 5-8 important key-value pairs based on user query.

Return ONLY valid JSON format like the example below. Do NOT add explanation or markdown blocks.

Example:
{
  "Name": "...",
  "Date": "...",
  "Amount": "..."
}
`,
          },
          {
            role: "user",
            content: `Document:\n${limitedText}\n\nQuestion:\n${question}`,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let aiText = response.data.choices[0].message.content;

    // Sometimes the model might wrap JSON in markdown blocks despite instructions, so we clean it up
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    res.json({
      extractedData: aiText,
      rawText: text,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Error processing document" });
  }
});

/**
 * ROUTE 2: Send data to n8n webhook
 */
app.post("/send-email", async (req, res) => {
  try {
    const { text, extractedData, question, email } = req.body;

    // Format extractedData properly so n8n JSON evaluation doesn't break
    let formattedData = extractedData;
    try {
      const parsed = typeof extractedData === "string" ? JSON.parse(extractedData) : extractedData;
      if (typeof parsed === "object" && parsed !== null) {
        // Use bullet points so it is formatted cleanly on a single line
        // This avoids JSON parsing errors in n8n while still looking nice in the email.
        formattedData = Object.entries(parsed)
          .map(([key, value]) => `${key}: ${value}`)
          .join(" • ");
      }
    } catch (e) {
      console.log("Could not parse extractedData; sending as is.");
    }

    // Send payload to the n8n webhook
    const response = await axios.post(process.env.N8N_WEBHOOK_URL, {
      text,
      extractedData: formattedData,
      question,
      email,
    });

    res.json(response.data);
  } catch (err) {
    console.error("N8N ERROR:", err.message);
    res.status(500).json({ error: "n8n webhook failed" });
  }
});

// ✅ Start server
app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);