import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./Table.css";

// Get API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL;

// Connect to Socket.io Server
const socket = io(API_URL);

// Debounce Hook (Delays API call until user stops typing)
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

const Table = () => {
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

  const debouncedSearch = useDebounce(search, 500);
  const debouncedStartWith = useDebounce(startWith, 500);

  // Caching API responses
  const cache = new Map();

  const fetchData = async () => {
    try {
      setLoading(true);
      const cacheKey = `${page}-${limit}-${debouncedSearch}-${debouncedStartWith}-${selectedTypes.join(",")}-${selectedDate}`;

      if (cache.has(cacheKey)) {
        setData(cache.get(cacheKey));
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
      cache.set(cacheKey, result.data);

      setData(result.data);
      setTotal(result.total);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedStartWith, selectedTypes, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [page, limit, debouncedSearch, debouncedStartWith, selectedTypes, selectedDate]);

  // Listen for real-time updates
  useEffect(() => {
    socket.on("dataUpdated", fetchData);
    return () => socket.off("dataUpdated", fetchData);
  }, []);

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

  return (
    <div className="table-container">
      <div className="table-buttons">
        {["Standard", "Silver", "Silver Plus", "Gold", "Gold Plus", "Platinum"].map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={selectedTypes.includes(type) ? "selected" : ""}
          >
            {type}
          </button>
        ))}
        <button onClick={() => setSelectedTypes([])}>Clear All</button>
      </div>

      <div className="search-section">
        <input
          type="number"
          placeholder="Start with..."
          value={startWith}
          onChange={(e) => setStartWith(e.target.value)}
          className="search-box"
        />

        <input
          type="number"
          placeholder="Search by number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-box"
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="search-box"
        />
        <input
          type="number"
          value={limit}
          min="50"
          max="100"
          onChange={(e) => setLimit(Number(e.target.value))}
          className="limit-box"
        />
      </div>

      <table>
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
                <tr key={i} className="loading-row">
                  <td>Loading...</td>
                  <td>Loading...</td>
                  <td>Loading...</td>
                </tr>
              ))
            : data.map((item) => (
                <tr key={item._id}>
                  <td>{item.number}</td>
                  <td>{item.type}</td>
                  <td>{formatStatus(item.status)}</td>
                </tr>
              ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="prev-button">
          Prev
        </button>
        <span>Page {page} of {Math.ceil(total / limit)}</span>
        <button disabled={page * limit >= total} onClick={() => setPage(page + 1)} className="next-button">
          Next
        </button>
      </div>
    </div>
  );
};

export default Table;
