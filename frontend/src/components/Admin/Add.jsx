import React, { useState, useRef } from "react";
import "./Add.css";

// Get API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL;

const Add = ({ socket }) => {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const typeOptions = [
    "Standard",
    "Silver",
    "Silver Plus",
    "Gold",
    "Gold Plus",
    "Platinum",
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file || !type) {
      alert("Please select a file and type.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      alert("✅ File uploaded successfully!");
      setFile(null);
      setType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

   
      
    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-container">
      <h2 className="add-title">Upload Excel File</h2>

      <div className="add-form">
        <label>File:</label>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} ref={fileInputRef} />

        <label>Type:</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Select Type</option>
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
};

export default Add;
