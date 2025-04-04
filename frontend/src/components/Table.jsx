import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import "./Table.css";

// Get API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL;

// Connect to Socket.io Server
const socket = io(API_URL, {
  transports: ["websocket", "polling"], // Ensures it works on Vercel
  withCredentials: true,
});

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
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const debouncedSearch = useDebounce(search, 500);
  const debouncedStartWith = useDebounce(startWith, 500);
  const debouncedStatus=useDebounce(selectedStatus,500);

  // Store cache in a ref so it persists across renders
  const cache = useRef(new Map());

 const fetchData = useCallback(
  async (forceUpdate = false) => {
    try {
      setLoading(true);
      const cacheKey = `${page}-${limit}-${debouncedSearch}-${debouncedStartWith}-${selectedTypes.join(",")}-${debouncedStatus}`;

      if (forceUpdate) {
        cache.current.clear();
      }

      if (!forceUpdate && cache.current.has(cacheKey)) {
        setData(cache.current.get(cacheKey));
        setLoading(false);
        return;
      }

      // Check for Initial Load
      if (isFirstLoad) {
        const initialResponse = await fetch(`${API_URL}/api/data`);
        if (!initialResponse.ok) throw new Error("Failed to fetch initial data");

        const initialResult = await initialResponse.json();
        cache.current.set(cacheKey, initialResult.data);
        setData(initialResult.data);
        setTotal(initialResult.total);
        setLoading(false);
        setIsFirstLoad(false);

        // Immediately call /api/data for further data
        fetchData(false);
        return;
      }

      const queryParams = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        startWith: debouncedStartWith,
        type: selectedTypes.join(","),
      });

      if (debouncedStatus?.trim()) {
        queryParams.append("status", debouncedStatus);
      }

      const url = `${API_URL}/api/data?${queryParams}`;
      const response = await fetch(url);
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
  [isFirstLoad, page, limit, debouncedSearch, debouncedStartWith, selectedTypes, debouncedStatus]
);


  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedStartWith, selectedTypes, debouncedStatus]);

  useEffect(() => {
    fetchData();
  }, [page, limit, debouncedSearch, debouncedStartWith, selectedTypes,debouncedStatus, fetchData]);
  
  useEffect(() => {
    if (selectedTypes.length === 0) {
      fetchData(true); // Fetch data only when selectedTypes is fully updated
    }
  }, [selectedTypes, fetchData]);
  
  useEffect(() => {
    const handleDataUpdate = (data) => {
      console.log("🔄 Data updated via socket:", data);
      fetchData(true); // Force update to fetch new data
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
          type="text"
          value={selectedStatus}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedStatus(value);
            if (!value) {
              fetchData(true); 
            }
          }}
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
            <th>Status</th>
            <th>Remarks</th>
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
                  <td>{item.status}</td>
                </tr>
              ))}
        </tbody>
      </table>

      <div className="pagination">
  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="prev-button">
    Prev
  </button>
  <div className="page">
  <span>Page</span>
  <input
  type="number"
  value={page > 0 && page <= Math.ceil(total / limit) ? page : ""}
  min="1"
  placeholder="Page"
  max={Math.ceil(total / limit) || 1}
  onChange={(e) => {
    const pageNumber = e.target.value === "" ? "" : Number(e.target.value);
    setPage(pageNumber);
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      const pageNumber = Number(e.target.value);
      if (pageNumber > 0 && pageNumber <= Math.ceil(total / limit)) {
        setPage(pageNumber);
      }
    }
  }}
  className="page-input"
/>
  <span>of {Math.ceil(total / limit)}</span>

  </div>
  
  <button disabled={page * limit >= total} onClick={() => setPage(page + 1)} className="next-button">
    Next
  </button>
  
</div>

    </div>
  );
};

export default Table;
