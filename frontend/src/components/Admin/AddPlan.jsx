import React, { useState, useEffect } from "react";
import "./AddPlan.css";
const API_URL = process.env.REACT_APP_API_URL;

const AddPlan = () => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [featureHeading, setFeatureHeading] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [newPromotion, setNewPromotion] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [planTitles, setPlanTitles] = useState([]); // ✅ State for fetched titles

  // 🟢 Fetch Titles on Dropdown Click
  const fetchTitles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/collections/titles`);
      if (!response.ok) throw new Error(`Failed to fetch titles: ${response.statusText}`);
      const data = await response.json();
      
      // Ensure data is in the correct format
      if (Array.isArray(data)) {
        setPlanTitles(data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching titles:", error);
      setMessage("❌ Failed to fetch titles. Please try again.");
    }
  };
  

  // 🟢 Add a new feature
  const addFeature = () => {
    if (featureHeading.trim() && featureDescription.trim()) {
      setFeatures([...features, { heading: featureHeading, description: featureDescription }]);
      setFeatureHeading("");
      setFeatureDescription("");
    }
  };

  // 🟢 Remove a feature
  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // 🟢 Add a new promotion
  const addPromotion = () => {
    if (newPromotion.trim()) {
      setPromotions([...promotions, newPromotion]);
      setNewPromotion("");
    }
  };

  // 🟢 Remove a promotion
  const removePromotion = (index) => {
    setPromotions(promotions.filter((_, i) => i !== index));
  };

  // 🟢 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");

    if (!title || !type || !price) {
      setMessage("Title, Type, and Price are required!");
      setLoading(false);
      return;
    }

    const newPlan = { title, type, price, features, promotions };

    try {
      const response = await fetch(`${API_URL}/api/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage("✅ Plan added successfully!");
        setTitle("");
        setType("");
        setPrice("");
        setFeatures([]);
        setPromotions([]);
      } else {
        setMessage(result.message || "❌ Error adding plan");
      }
    } catch (error) {
      setMessage("❌ Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-plan-container">
      <h2>Add a New Plan</h2>
      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit}>
        {/* First Row - Title, Type, Price */}
        <div className="row">
        <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

<select onFocus={fetchTitles} value={type} onChange={(e) => setType(e.target.value)} required>
  <option value="">Select Type</option>
  {planTitles.map((planTitle, index) => (
    <option key={index} value={planTitle.title}>
      {planTitle.title}
    </option>
  ))}
</select>



          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="feature-input">
            <input type="text" placeholder="Feature Heading" value={featureHeading} onChange={(e) => setFeatureHeading(e.target.value)} />
            <input type="text" placeholder="Feature Description" value={featureDescription} onChange={(e) => setFeatureDescription(e.target.value)} />
            <button type="button" onClick={addFeature}>Add Feature</button>
          </div>
          <ul>
            {features.map((feature, index) => (
              <li key={index}>
                <strong>{feature.heading}:</strong> {feature.description}
                <button type="button" onClick={() => removeFeature(index)}>❌</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Promotions Section */}
        <div className="promotions-section">
          <div className="promotion-input">
            <input type="text" placeholder="Enter Promotion" value={newPromotion} onChange={(e) => setNewPromotion(e.target.value)} />
            <button type="button" onClick={addPromotion}>Add Promotion</button>
          </div>
          <ul>
            {promotions.map((promo, index) => (
              <li key={index}>
                {promo}
                <button type="button" onClick={() => removePromotion(index)}>❌</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Uploading..." : "Add Plan"}
        </button>
      </form>
    </div>
  );
};

export default AddPlan;
