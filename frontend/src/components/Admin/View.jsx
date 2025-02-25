import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./View.css";

const API_URL = process.env.REACT_APP_API_URL;

const socket = io(API_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const View = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [startWith, setStartWith] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateType, setUpdateType] = useState("");
  const [updateStatus, setUpdateStatus] = useState("false");
  const [updateMessage, setUpdateMessage] = useState("");

  const debouncedSearch = useDebounce(search, 500);
  const debouncedStartWith = useDebounce(startWith, 500);

  const cache = useRef(new Map());

  const fetchData = useCallback(
    async (forceUpdate = false) => {
      try {
        setLoading(true);
        const cacheKey = `${page}-${limit}-${debouncedSearch}-${debouncedStartWith}-${selectedTypes.join(",")}-${selectedDate}`;

        if (forceUpdate) {
          cache.current.clear();
        }

        if (!forceUpdate && cache.current.has(cacheKey)) {
          setData(cache.current.get(cacheKey));
          setLoading(false);
          return;
        }

        const queryParams = new URLSearchParams({
          page,
          limit,
          search: debouncedSearch,
          startWith: debouncedStartWith,
          type: selectedTypes.join(","),
          date: selectedDate,
        });

        const response = await fetch(`${API_URL}/api/data?${queryParams}`);
        if (!response.ok) throw new Error("Failed to fetch data");

        const result = await response.json();
        cache.current.set(cacheKey, result.data);

        setData(result.data);
        setTotal(result.total);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    },
    [page, limit, debouncedSearch, debouncedStartWith, selectedTypes, selectedDate]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedStartWith, selectedTypes, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [page, limit, debouncedSearch, debouncedStartWith, selectedTypes, selectedDate, fetchData]);

  useEffect(() => {
    if (selectedTypes.length === 0) {
      fetchData(true);
    }
  }, [selectedTypes, fetchData]);

  useEffect(() => {
    const handleDataUpdate = () => {
      fetchData(true);
    };

    socket.on("connect", () => console.log("Connected to Socket.io server"));
    socket.on("disconnect", () => console.log("Disconnected from Socket.io server"));
    socket.on("dataUpdated", handleDataUpdate);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("dataUpdated", handleDataUpdate);
    };
  }, [fetchData]);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const formatStatus = (status) => {
    if (status === "Booked") return "Booked";
    const date = new Date(status);
    return !isNaN(date) ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Invalid Date";
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setUpdateType(item.type);
    setUpdateStatus(item.status === "Booked" ? "true" : "false");
    setModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    setUpdateMessage("Updating...");

    try {
      await axios.put(`${API_URL}/api/data/${selectedItem._id}`, {
        type: updateType,
        status: updateStatus === "true" ? "Booked" : new Date().toDateString(),
      });

      setUpdateMessage("✅ Data updated successfully!");
      setModalOpen(false);
      setUpdateMessage("");
      fetchData(true);
    } catch (error) {
      setUpdateMessage("❌ Error updating data.");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setUpdateMessage("Deleting...");

    try {
      await axios.delete(`${API_URL}/api/data/${selectedItem._id}`);

      setUpdateMessage("✅ Data deleted successfully!");
      setModalOpen(false);
      setUpdateMessage("");
      fetchData(true);
    } catch (error) {
      setUpdateMessage("❌ Error deleting data.");
      console.error(error);
    }
  };

  return (
    <div className="view-table-container">
        <div className="view-table-buttons">
        {["Standard", "Silver", "Silver Plus", "Gold", "Gold Plus", "Platinum"].map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={selectedTypes.includes(type) ? "view-selected" : ""}
          >
            {type}
          </button>
        ))}
        <button onClick={() => setSelectedTypes([])}>Clear All</button>
      </div>

      <div className="view-search-section">
        <input
          type="number"
          placeholder="Start with..."
          value={startWith}
          onChange={(e) => setStartWith(e.target.value)}
          className="view-search-box"
        />

        <input
          type="number"
          placeholder="Search by number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="view-search-box"
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="view-search-box"
        />
        <input
          type="number"
          value={limit}
          min="50"
          max="100"
          onChange={(e) => setLimit(Number(e.target.value))}
          className="view-limit-box"
        />
      </div>
      <table className="view-table">
        <thead>
          <tr>
            <th>Mobile Number</th>
            <th>Type</th>
            <th>Availability</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? [...Array(limit)].map((_, i) => (
                <tr key={i}>
                  <td>Loading...</td>
                  <td>Loading...</td>
                  <td>Loading...</td>
                </tr>
              ))
            : data.map((item) => (
                <tr key={item._id} onClick={() => openModal(item)}>
                  <td>{item.number}</td>
                  <td>{item.type}</td>
                  <td>{formatStatus(item.status)}</td>
                </tr>
              ))}
        </tbody>
      </table>

      {modalOpen && selectedItem && (
        <div className="view-modal">
          <div className="view-modal-content">
            <h3>Update Record</h3>

            <label>Number:</label>
            <input type="text" value={selectedItem.number} readOnly />

            <label>Type:</label>
            <select value={updateType} onChange={(e) => setUpdateType(e.target.value)}>
              {["Standard", "Silver", "Silver Plus", "Gold", "Gold Plus", "Platinum"].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <label>Status:</label>
            <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
              <option value="false">Not Booked</option>
              <option value="true">Booked</option>
            </select>

            <button onClick={handleUpdate} className="update-btn">Update</button>
            <button onClick={handleDelete} className="delete-btn">Delete</button>
            <button onClick={() => setModalOpen(false)}>Close</button>

            {updateMessage && <p>{updateMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default View;
