import React, { useState } from "react";
import axios from "axios";
import "./Update.css";


const Update = () => {
  const [searchNumber, setSearchNumber] = useState("");
  const [data, setData] = useState(null);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("false");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
 
  const typeOptions = [
    "Standard",
    "Silver",
    "Silver Plus",
    "Gold",
    "Gold Plus",
    "Platinum",
  ];

  const handleSearch = async () => {
    if (!searchNumber) return setMessage("Please enter a number to search.");

    setLoading(true);
    setMessage("");
    setUpdateMessage("");

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/data?search=${searchNumber}`);

      if (response.data.data.length === 0) {
        setData(null);
        setMessage("No record found");
      } else {
        const record = response.data.data[0];
        setData(record);
        setType(record.type || "");
        setStatus(record.status === "Booked" ? "true" : "false");
      }
    } catch (error) {
      setMessage("Error fetching data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!data) return;

    setLoading(true);
    setUpdateMessage("");

    let newStatus = status === "true" ? "Booked" : new Date().toDateString();

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/data/${data._id}`, {
        type,
        status: newStatus,
      });

      setUpdateMessage("✅ Data updated successfully!");

      setTimeout(() => {
        setSearchNumber("");
        setData(null);
        setType("");
        setStatus("false");
        setUpdateMessage("");
      }, 700);
    } catch (error) {
      setUpdateMessage("❌ Error updating data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-container">
      <h2>Search and Update</h2>
      <div className="update-header">
        <input
          type="text"
          placeholder="Search by Number..."
          value={searchNumber}
          onChange={(e) => setSearchNumber(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>Submit</button>
      </div>

      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}
      {updateMessage && <p>{updateMessage}</p>}

      {data && (
        <div className="update-form">
          <label>Number:</label>
          <input type="text" value={data.number} readOnly />

          <label>Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="false">Not Booked</option>
            <option value="true">Booked</option>
          </select>

          <button className="update-btn" onClick={handleUpdate} disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Update;
