import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");

  const [data, setData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [status, setStatus] = useState("");

  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  // ✅ Upload handler
  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("question", question);

      const res = await axios.post(`${BACKEND}/upload`, formData);

      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  // ✅ Send Email handler
  const handleSendEmail = async () => {
    try {
      const res = await axios.post(`${BACKEND}/send-email`, {
        text: data.rawText,
        extractedData: data.extractedData,
        question,
        email,
      });

      setAnswer(res.data.answer);
      setEmailBody(res.data.email_body);
      setStatus(res.data.status);
    } catch (err) {
      console.error(err);
      alert("Email sending failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">
          AI Document Orchestrator
        </h1>

        {/* File Upload */}
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-3"
        />

        {/* Question */}
        <input
          type="text"
          placeholder="Enter your question"
          className="w-full border p-2 mb-3"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Extract Data
        </button>

        {/* Extracted Data */}
        {data && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-3">Extracted Data</h2>
            
            {(() => {
              try {
                // Remove markdown code blocks if the backend missed it
                let cleanJson = data.extractedData;
                if (typeof cleanJson === 'string') {
                  cleanJson = cleanJson.replace(/```json/gi, '').replace(/```/g, '').trim();
                }
                const parsed = typeof cleanJson === "string" ? JSON.parse(cleanJson) : cleanJson;
                
                return (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4 space-y-2">
                    {Object.entries(parsed).map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:space-x-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-gray-700 min-w-[150px]">{key}:</span>
                        <span className="text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                );
              } catch (e) {
                return (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4 whitespace-pre-wrap text-gray-900">
                    {data.extractedData}
                  </div>
                );
              }
            })()}

            {/* Email */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Send Alert Mail</h3>
              <input
                type="email"
                placeholder="Recipient Email"
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                onClick={handleSendEmail}
                className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 mt-3 rounded shadow-sm w-full sm:w-auto"
              >
                Send Alert Mail
              </button>
            </div>
          </div>
        )}

        {/* Outputs */}
        {answer && (
          <div className="mt-6">
            <h2 className="font-semibold">Final Answer</h2>
            <p>{answer}</p>

            <h2 className="font-semibold mt-4">Email Body</h2>
            <p>{emailBody}</p>

            <h2 className="font-semibold mt-4">Status</h2>
            <p>{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;