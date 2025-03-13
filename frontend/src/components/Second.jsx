import React, { useEffect, useState, useRef } from "react";
import "./Second.css";
import axios from "axios";
import { io } from "socket.io-client";
import PlanCard from "./PlanCard.jsx"; // Import the PlanCard component

const API_URL = process.env.REACT_APP_API_URL;
const socket = io(API_URL, { transports: ["websocket", "polling"] });

const Second = () => {
  const [collections, setCollections] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const planListRef = useRef(null);

  // Fetch collections
  const fetchCollections = () => {
    axios
      .get(`${API_URL}/api/collections`)
      .then((response) => setCollections(response.data.data))
      .catch((error) => console.error("❌ Error fetching collections:", error));
  };

  useEffect(() => {
    fetchCollections(); // Initial fetch

    // Listen for real-time updates
    socket.on("collectionUpdated", fetchCollections);

    return () => {
      socket.off("collectionUpdated", fetchCollections); // Cleanup
    };
  }, []);

  // Fetch plans when a collection item is clicked
  const fetchPlansByType = async (type) => {
    setLoading(true);
    setPlans([]); // Reset plans before fetching new ones
    try {
      const response = await axios.get(`${API_URL}/api/plans/type/${type}`);
      setPlans(response.data.data);
    } catch (error) {
      console.error("❌ Error fetching plans:", error);
      setPlans([]); // If no plans found, clear
    }
    setLoading(false);
  };

  // Handle collection item click
  const handleItemClick = (item) => {
    setSelectedItem(item);
    fetchPlansByType(item.title);
  };

  // Scroll functionality
  const scrollLeft = () => {
    if (planListRef.current) {
      planListRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (planListRef.current) {
      planListRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  // Check if scrolling is needed
  const checkScroll = () => {
    if (planListRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = planListRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollWidth > clientWidth + scrollLeft);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [plans]); // Check scroll every time plans change

  return (
    <div className="collection-container">
      <h2 className="collection-title">Our Exclusive Collection</h2>
      <div className="collection-grid">
        {collections.map((item, index) => (
          <div
            className="collection-item"
            key={index}
            onClick={() => handleItemClick(item)}
          >
            <img src={item.image} alt={item.title} className="collection-image" />
            <h3 className="collection-item-title">{item.title}</h3>
            <p className="collection-description">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="secondmodal-overlay show" onClick={() => setSelectedItem(null)}>
          <div className="secondmodal-content" onClick={(e) => e.stopPropagation()}>
            {loading ? <p>Loading plans...</p> : null}

            <div className="plan-list-container">
              {canScrollLeft && (
                <button className="scroll-button scroll-left" onClick={scrollLeft}>
                  &lt;
                </button>
              )}
              <div className="plan-list" ref={planListRef} onScroll={checkScroll}>
              {plans.length > 0 ? (
  plans.map((plan, index) => <PlanCard key={index} plan={plan} />)
) : (
  !loading && <p>No plans found for this type.</p>
)}

              </div>
              {canScrollRight && (
                <button className="scroll-button scroll-right" onClick={scrollRight}>
                  &gt;
                </button>
              )}
            </div>

            <button className="close-btn" onClick={() => setSelectedItem(null)}>X</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Second;
