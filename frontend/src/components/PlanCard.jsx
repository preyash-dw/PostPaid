import React, { useState } from "react";
import "./PlanCard.css";

const PlanCard = ({ plan }) => {
  const [showAllPromotions, setShowAllPromotions] = useState(false);

  return (
    <div className="plan-card">
      {/* Badge */}
      <div className="badge">{plan.type}</div>

      {/* Plan Title */}
      <h3 className="plan-title">New Freedom Non-Stop Data {plan.title}</h3>

      {/* Plan Details */}
      <div className="plan-details">
        {plan.features.map((feature, index) => (
          <div key={index}>
            <p>{feature.heading}</p>
            <p className="highlight">
              <strong>{feature.description}</strong>
            </p>
          </div>
        ))}
      </div>


      {/* Promotion Section */}
      {plan.promotions.length > 0 && (
        <div className="promotion-section">
          <p className="promotion-title">Promotion</p>
          <ul>
            {plan.promotions
              .slice(0, showAllPromotions ? plan.promotions.length : 2)
              .map((promo, index) => (
                <li key={index}>✩ {promo}</li> 
              ))}
            {!showAllPromotions && plan.promotions.length > 2 && (
              <li
                className="prommore"
                style={{ cursor: "pointer", color: "white", textDecoration: "underline" }}
                onClick={() => setShowAllPromotions(true)}
              >
                +{plan.promotions.length - 2} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Price Section */}
      <div className="price-section">
        <p>12-month commitment</p>
      </div>

      <div className="vat-section">
        <p className="aed">AED {plan.price} /month</p>
        <p className="vat-text">5% VAT excluded</p>
      </div>

      {/* Buttons */}
      {/* <div className="buttons">
        <button className="select-btn">Select plan</button>
      </div> */}
    </div>
  );
};

export default PlanCard;
