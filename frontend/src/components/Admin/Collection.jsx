import React, { useState } from "react";
import "./Collection.css";

const API_URL = process.env.REACT_APP_API_URL;

const collections = [
  {
    title: "Standard",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/zHQ2-wioFI6cKcz5ZKck1.jpg",
  },
  {
    title: "Silver",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/uCxyTxcDJn9Pj-W55Y4HG.jpg",
  },
  {
    title: "Silver Plus",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/3mnB-Vm0ggqdBl6Hez-6u.jpg",
  },
  {
    title: "Gold",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/Xgh2bfi52zyHg6UxjH79G.jpg",
  },
  {
    title: "Gold Plus",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/_1kcB6OEEXcdNMQ1bkcUH.jpg",
  },
  {
    title: "Platinum",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/mlZq6Xrmsje6siwcK-m4C.jpg",
  },
];

const Collection = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newCollection = {
      title,
      description,
      image: selectedImage,
    };

    try {
      const response = await fetch(`${API_URL}/api/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCollection),
      });

      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        setTitle("");
        setDescription("");
        setSelectedTitle("");
        setSelectedImage("");
      }
    } catch (error) {
      alert("Error storing collection");
    }
  };

  const handleImageSelection = (selectedTitle) => {
    setSelectedTitle(selectedTitle);
    const selectedCollection = collections.find((col) => col.title === selectedTitle);
    if (selectedCollection) {
      setSelectedImage(selectedCollection.image);
    }
  };

  return (
    <div className="collection-form-container">
      <h2>Create New Collection</h2>
      <form onSubmit={handleSubmit} className="collection-form-grid">
        <div className="collection-form-field">
          <label htmlFor="title">Title</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="collection-form-field">
          <label htmlFor="description">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div className="collection-form-field">
          <label htmlFor="image">Select Image</label>
          <select id="image" value={selectedTitle} onChange={(e) => handleImageSelection(e.target.value)} required>
            <option value="">Choose an image</option>
            {collections.map((collection, index) => (
              <option key={index} value={collection.title}>
                {collection.title}
              </option>
            ))}
          </select>
        </div>

        <div className="submit-btn-container">
          <button type="submit">Create Collection</button>
        </div>
      </form>
    </div>
  );
};

export default Collection;
