const axios = require("axios");

async function test() {
  try {
    console.log("Sending /send-email to localhost:5000...");
    const emailRes = await axios.post("http://localhost:5000/send-email", {
      text: "Raw text content",
      extractedData: "{\"Name\":\"Anup\"}",
      question: "what is this",
      email: "test@example.com"
    });
    console.log("Email Res:", emailRes.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
