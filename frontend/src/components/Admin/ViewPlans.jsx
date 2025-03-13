import React, { useState, useEffect } from "react";
import "./ViewPlan.css";

const API_URL = process.env.REACT_APP_API_URL;

const ViewPlans = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [newFeature, setNewFeature] = useState({ heading: "", description: "" });
  const [newPromotion, setNewPromotion] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/plans`);
      const data = await response.json();
      setPlans(data.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  // Handle row click (Open modal)
  const handleRowClick = (plan) => {
    setSelectedPlan(plan);
    setNewFeature({ heading: "", description: "" }); // Reset new feature input
    setNewPromotion(""); // Reset new promotion input
  };

  // Close modal
  const closeModal = () => {
    setSelectedPlan(null);
  };

  // Handle input changes for title, type, price
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedPlan({ ...selectedPlan, [name]: value });
  };

  // Handle feature input changes
  const handleFeatureChange = (e) => {
    const { name, value } = e.target;
    setNewFeature({ ...newFeature, [name]: value });
  };

  // Add new feature
  const addFeature = () => {
    if (!newFeature.heading || !newFeature.description) return; // Prevent empty feature

    setSelectedPlan({
      ...selectedPlan,
      features: [...selectedPlan.features, newFeature],
    });

    setNewFeature({ heading: "", description: "" }); // Clear input fields
  };

  // Remove feature
  const removeFeature = (index) => {
    setSelectedPlan({
      ...selectedPlan,
      features: selectedPlan.features.filter((_, i) => i !== index),
    });
  };

  // Handle promotion input change
  const handlePromotionChange = (e) => {
    setNewPromotion(e.target.value);
  };

  // Add new promotion
  const addPromotion = () => {
    if (!newPromotion.trim()) return; // Prevent empty promotion

    setSelectedPlan({
      ...selectedPlan,
      promotions: [...selectedPlan.promotions, newPromotion],
    });

    setNewPromotion(""); // Clear input field
  };

  // Remove promotion
  const removePromotion = (index) => {
    setSelectedPlan({
      ...selectedPlan,
      promotions: selectedPlan.promotions.filter((_, i) => i !== index),
    });
  };

  // Update plan
  const handleUpdate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/plans/${selectedPlan._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedPlan),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage("Plan updated successfully!");
        fetchPlans();
        closeModal();
      } else {
        setMessage(result.message || "Error updating plan");
      }
    } catch (error) {
      setMessage("Server error, please try again.");
    }
  };

  // Delete plan
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;

    try {
      const response = await fetch(`${API_URL}/api/plans/${selectedPlan._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("Plan deleted successfully!");
        fetchPlans();
        closeModal();
      } else {
        setMessage("Error deleting plan");
      }
    } catch (error) {
      setMessage("Server error, please try again.");
    }
  };

  return (
    <div className="plans-list-container">
      <h2>All Plans</h2>
      {message && <p className="message">{message}</p>}

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan._id} onClick={() => handleRowClick(plan)}>
              <td>{plan.title}</td>
              <td>{plan.type}</td>
              <td>${plan.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPlan && (
        <div className="planmodal">
          <div className="planmodal-content">
            <h2>Edit Plan</h2>

            <div className="row">
              <input
                type="text"
                name="title"
                value={selectedPlan.title}
                onChange={handleChange}
                placeholder="Title"
              />

              <select name="type" value={selectedPlan.type} onChange={handleChange}>
                <option value="Standard">Standard</option>
                <option value="Silver">Silver</option>
                <option value="Silver Plus">Silver Plus</option>
                <option value="Gold">Gold</option>
                <option value="Gold Plus">Gold Plus</option>
                <option value="Platinum">Platinum</option>
              </select>

              <input
                type="number"
                name="price"
                value={selectedPlan.price}
                onChange={handleChange}
                placeholder="Price"
              />
            </div>

            {/* Features Section */}
            <div className="feature-section">
              <h3>Features</h3>
              {selectedPlan.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <p>
                    <strong>{feature.heading}:</strong> {feature.description}
                  </p>
                  <button className="remove-btn" onClick={() => removeFeature(index)}>
                    ❌
                  </button>
                </div>
              ))}
              {/* New Feature Input */}
              <div className="feature-input">
                <input
                  type="text"
                  name="heading"
                  value={newFeature.heading}
                  onChange={handleFeatureChange}
                  placeholder="Feature Heading"
                />
                <input
                  type="text"
                  name="description"
                  value={newFeature.description}
                  onChange={handleFeatureChange}
                  placeholder="Feature Description"
                />
                <button className="add-feature-btn" onClick={addFeature}>
                  Add Feature
                </button>
              </div>
            </div>

            {/* Promotions Section */}
            <div className="promotion-section">
              <h3>Promotions</h3>
              {selectedPlan.promotions.map((promo, index) => (
                <div key={index} className="promotion-item">
                  <p>{promo}</p>
                  <button className="remove-btn" onClick={() => removePromotion(index)}>
                    ❌
                  </button>
                </div>
              ))}
              {/* New Promotion Input */}
              <div className="promotion-input">
                <input
                  type="text"
                  value={newPromotion}
                  onChange={handlePromotionChange}
                  placeholder="Enter Promotion"
                />
                <button className="add-promotion-btn" onClick={addPromotion}>
                  Add Promotion
                </button>
              </div>
            </div>

            <div className="button-row">
              <button className="update-btn" onClick={handleUpdate}>Update Plan</button>
              <button className="delete-btn" onClick={handleDelete}>Delete Plan</button>
              <button className="close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPlans;
