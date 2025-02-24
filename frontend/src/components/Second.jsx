import React, { useState } from "react";
import "./Second.css";
import ContactModal from "../components/ContactModal.jsx";
const collections = [
  {
    title: "Standard",
    description: "Entry-level numbers with a touch of elegance.",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/zHQ2-wioFI6cKcz5ZKck1.jpg",
    price: "$50",
    features: ["Basic number selection", "Standard customer support", "Affordable pricing"],
  },
  {
    title: "Silver",
    description: "More distinct and eye-catching, adding a subtle sense of prestige.",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/uCxyTxcDJn9Pj-W55Y4HG.jpg",
    price: "$100",
    features: ["Priority selection", "Enhanced visibility", "24/7 customer support"],
  },
  {
    title: "Silver Plus",
    description: "Elevated numbers with a noticeable presence, conveying a sophisticated image.",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/3mnB-Vm0ggqdBl6Hez-6u.jpg",
    price: "$150",
    features: ["Premium support", "Exclusive deals", "Extended validity"],
  },
  {
    title: "Gold",
    description: "Numbers that exude luxury and exclusivity, ideal for those who demand the best.",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/Xgh2bfi52zyHg6UxjH79G.jpg",
    price: "$250",
    features: ["VIP selection", "Premium branding", "Exclusive hotline support"],
  },
  {
    title: "Gold Plus",
    description: "A step above Gold with enhanced customization options.",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/_1kcB6OEEXcdNMQ1bkcUH.jpg",
    price: "$350",
    features: ["Ultra-VIP selection", "Custom branding", "Dedicated account manager"],
  },
  {
    title: "Platinum",
    description: "The highest level of exclusivity and prestige in our collection.",
    image: "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:1000/height:1000/https://cdn.gamma.app/x9nevgt5zry9aea/generated-images/mlZq6Xrmsje6siwcK-m4C.jpg",
    price: "$500",
    features: ["Ultimate exclusivity", "Custom concierge service", "Lifetime validity"],
  },
];

const Second = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  
    const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className={`modal-overlay ${selectedItem ? "show" : ""}`} onClick={() => setSelectedItem(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <span className="close-modal" onClick={() => setSelectedItem(null)}>&times;</span>
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
