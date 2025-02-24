import React, { useState, useRef } from "react";
import "./Add.css";

// Get API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL;

const Add = ({ socket }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
    } catch (error) {
      alert("❌ Error: " + error.message);
      console.log(error.message);
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

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
};

export default Add;
