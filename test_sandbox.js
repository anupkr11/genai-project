const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function test() {
  const dummyFile = Buffer.from("This is a test document with name John Doe and Date 2023-01-01.");
  
  const form = new FormData();
  form.append("file", dummyFile, "test.txt");
  form.append("question", "What is the name and date?");

  try {
    console.log("Sending /upload...");
    const uploadRes = await axios.post("http://localhost:5000/upload", form, {
      headers: form.getHeaders(),
    });
    console.log("Upload Res:", uploadRes.data);

    console.log("\nSending /send-email...");
    const emailRes = await axios.post("http://localhost:5000/send-email", {
      text: uploadRes.data.rawText,
      extractedData: uploadRes.data.extractedData,
      question: "What is the name and date?",
      email: "test@example.com"
    });
    console.log("Email Res:", emailRes.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
