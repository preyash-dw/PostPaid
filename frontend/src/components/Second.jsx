import React, { useEffect, useState } from "react";
import "./Second.css";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL;
const socket = io(API_URL, { transports: ["websocket", "polling"] }); // ✅ Connect to the socket server

const Second = () => {
  const [collections, setCollections] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // 🟢 Function to fetch collections
  const fetchCollections = () => {
    axios
      .get(`${API_URL}/api/collections`)
      .then((response) => setCollections(response.data.data))
      .catch((error) => console.error("❌ Error fetching collections:", error));
  };

  useEffect(() => {
    fetchCollections(); // ✅ Initial fetch

    // 🟢 Listen for collection updates
    socket.on("collectionUpdated", fetchCollections);

    return () => {
      socket.off("collectionUpdated", fetchCollections); // Cleanup listener on unmount
    };
  }, []);

  return (
    <div className="collection-container">
      <h2 className="collection-title">Our Exclusive Collection</h2>
      <div className="collection-grid">
        {collections.map((item, index) => (
          <div
            className="collection-item"
            key={index}
            onClick={() => setSelectedItem(item)}
          >
            <img src={item.image} alt={item.title} className="collection-image" />
            <h3 className="collection-item-title">{item.title}</h3>
            <p className="collection-description">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      <div
        className={`modal-overlay ${selectedItem ? "show" : ""}`}
        onClick={() => setSelectedItem(null)}
      >
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close-modal" onClick={() => setSelectedItem(null)}>
            &times;
          </span>
          {selectedItem && (
            <>
              <img src={selectedItem.image} alt={selectedItem.title} className="modal-image" />
              <h3>{selectedItem.title}</h3>
              <p>{selectedItem.description}</p>
              <h4>Price: {selectedItem.price}</h4>
              <ul className="modal-features">
                {selectedItem.features.map((feature, i) => (
                  <li key={i}>✔ {feature}</li>
                ))}
              </ul>
              <button className="contact-button">Contact Us</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Second;
