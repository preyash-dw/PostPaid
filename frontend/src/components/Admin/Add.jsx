import React, { useState, useRef } from "react";
import "./Add.css";

// Get API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL;

const Add = ({ socket }) => {
  const [uploadFile, setUploadFile] = useState(null);
  const [deleteFile, setDeleteFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const uploadFileRef = useRef(null);
  const deleteFileRef = useRef(null);

  // Handle File Changes
  const handleUploadFileChange = (e) => setUploadFile(e.target.files[0]);
  const handleDeleteFileChange = (e) => setDeleteFile(e.target.files[0]);

  // Upload File API Call
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    setLoadingUpload(true);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upload failed");

      alert(`✅ ${result.message}`);
      setUploadFile(null);
      if (uploadFileRef.current) uploadFileRef.current.value = "";
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoadingUpload(false);
    }
  };

  // Delete File API Call
  const handleDeleteSubmit = async () => {
    if (!deleteFile) {
      alert("Please select a file to delete records.");
      return;
    }

    const formData = new FormData();
    formData.append("file", deleteFile);
    setLoadingDelete(true);

    try {
      const response = await fetch(`${API_URL}/api/delete-from-excel`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Deletion failed");

      alert(`✅ ${result.message}`);
      setDeleteFile(null);
      if (deleteFileRef.current) deleteFileRef.current.value = "";
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="add-container">
      <h2 className="add-title">Manage Excel Files</h2>

      {/* Upload Section */}
      <div className="add-form">
        <h3>Upload Excel File</h3>
        <label>File:</label>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleUploadFileChange} 
          ref={uploadFileRef} 
        />
        <button className="submit-btn" onClick={handleUploadSubmit} disabled={loadingUpload}>
          {loadingUpload ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Delete Section */}
      <div className="add-form">
        <h3>Delete Records From Excel</h3>
        <label>File (Only Numbers Column):</label>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleDeleteFileChange} 
          ref={deleteFileRef} 
        />
        <button className="submit-btn" onClick={handleDeleteSubmit} disabled={loadingDelete}>
          {loadingDelete ? "Deleting..." : "Delete Records"}
        </button>
      </div>
    </div>
  );
};

export default Add;
