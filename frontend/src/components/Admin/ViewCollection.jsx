import React, { useEffect, useState } from "react";
import "./ViewCollection.css";

const API_URL = process.env.REACT_APP_API_URL;

const ViewCollection = () => {
  const [collections, setCollections] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [updatePrice, setUpdatePrice] = useState("");
  const [updateFeatures, setUpdateFeatures] = useState([]);
  const [originalFeatures, setOriginalFeatures] = useState([]); // Store original features
  const [newFeature, setNewFeature] = useState("");

  // 🟢 Fetch collections from API
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

  // 🟢 Handle row click to open modal with selected item
  const handleRowClick = (collection) => {
    setSelectedItem(collection);
    setUpdateTitle(collection.title);
    setUpdateDescription(collection.description);
    setUpdatePrice(collection.price);
    setUpdateFeatures([...collection.features]); // Store a copy of features
    setOriginalFeatures([...collection.features]); // Store original features separately
    setModalOpen(true);
  };

  // 🟢 Handle feature removal
  const removeFeature = (index) => {
    setUpdateFeatures(updateFeatures.filter((_, i) => i !== index));
  };

  // 🟢 Handle adding a new feature
  const addFeature = () => {
    if (newFeature.trim() !== "" && !updateFeatures.includes(newFeature)) {
      setUpdateFeatures([...updateFeatures, newFeature]);
      setNewFeature("");
    }
  };

  // 🟢 Handle update collection
  const handleUpdate = async () => {
    try {
      // Ensure `features` is always an array
      let finalFeatures = Array.isArray(updateFeatures) ? updateFeatures : [];
  
      const updatedData = {
        title: updateTitle.trim(),
        description: updateDescription.trim(),
        price: parseFloat(updatePrice) || 0,
        features: finalFeatures, // Always send an array
        image: selectedItem.image || "",
      };
  
  
      const response = await fetch(`${API_URL}/api/collections/${selectedItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
  
      const result = await response.json();
      console.log("Response from API:", result); // Log API response
  
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
  
  

  // 🟢 Handle delete collection
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
      <table className="collection-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection) => (
            <tr key={collection._id} onClick={() => handleRowClick(collection)}>
              <td>{collection.title}</td>
              <td>${collection.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && selectedItem && (
        <div className="view-modal">
          <div className="view-modal-content">
            <h3>Update Collection</h3>

            <label>Title:</label>
            <input type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} />

            <label>Description:</label>
            <textarea value={updateDescription} onChange={(e) => setUpdateDescription(e.target.value)} />

            <label>Price:</label>
            <input type="number" value={updatePrice} onChange={(e) => setUpdatePrice(e.target.value)} />

            <label>Features:</label>
            <div className="feature-input-container">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Enter a feature"
              />
              <button type="button" onClick={addFeature}>Add</button>
            </div>
            <ul className="feature-list">
              {updateFeatures.map((feature, index) => (
                <li key={index}>
                  {feature} <button type="button" onClick={() => removeFeature(index)}>❌</button>
                </li>
              ))}
            </ul>

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
