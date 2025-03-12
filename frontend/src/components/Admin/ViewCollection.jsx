import React, { useEffect, useState } from "react";
import "./ViewCollection.css";

const API_URL = process.env.REACT_APP_API_URL;

const ViewCollection = () => {
  const [collections, setCollections] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");

  // Fetch collections from API
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`${API_URL}/api/collections`);
        const result = await response.json();
        setCollections(result.data);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };
    fetchCollections();
  }, []);

  // Handle card click to open modal with selected item
  const handleCardClick = (collection) => {
    setSelectedItem(collection);
    setUpdateTitle(collection.title);
    setUpdateDescription(collection.description);
    setModalOpen(true);
  };

  // Handle update collection
  const handleUpdate = async () => {
    try {
      const updatedData = {
        title: updateTitle.trim(),
        description: updateDescription.trim(),
        image: selectedItem.image || "",
      };

      const response = await fetch(`${API_URL}/api/collections/${selectedItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        setCollections((prev) =>
          prev.map((item) =>
            item._id === selectedItem._id ? { ...item, ...updatedData } : item
          )
        );
        setModalOpen(false);
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      alert("Error updating collection");
    }
  };

  // Handle delete collection
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this collection?")) return;
    try {
      const response = await fetch(`${API_URL}/api/collections/${selectedItem._id}`, { method: "DELETE" });
      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        setCollections((prev) => prev.filter((item) => item._id !== selectedItem._id));
        setModalOpen(false);
      }
    } catch (error) {
      alert("Error deleting collection");
    }
  };

  return (
    <div className="view-collection-container">
      <h2>View Collections</h2>
      
      <div className="viewcollection-grid">
        {collections.map((collection) => (
          <div key={collection._id} className="viewcollection-card" onClick={() => handleCardClick(collection)}>
            <img src={collection.image || "placeholder.jpg"} alt={collection.title} className="viewcollection-image" />
            <h3>{collection.title}</h3>
            <p>{collection.description}</p>
          </div>
        ))}
      </div>

      {modalOpen && selectedItem && (
        <div className="view-modal">
          <div className="view-modal-content">
            <h3>Update Collection</h3>
            <img src={selectedItem.image || "placeholder.jpg"} alt="Preview" className="modal-image" />

            <label>Title:</label>
            <input type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} />

            <label>Description:</label>
            <textarea value={updateDescription} onChange={(e) => setUpdateDescription(e.target.value)} />

            <button onClick={handleUpdate} className="update-btn">Update</button>
            <button onClick={handleDelete} className="delete-btn">Delete</button>
            <button onClick={() => setModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCollection;
