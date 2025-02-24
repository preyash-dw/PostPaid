import React, { useRef, useState } from "react";
import "./Main.css";
import Maining from "../assets/main.jpg";
import Second from "./Second";
import Table from "./Table";
import ContactModal from "./ContactModal.jsx";

const Main = () => {
  const tableRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
 
  const handleOpenModal = () => {
    console.log("Opening modal...");
    setIsModalOpen(true);
  };
  

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="main">
      <div className="main-container">
        <div className="main-text-content">
          <h2 className="main-title">Your Fancy Number Awaits</h2>
          <p className="main-subtitle">
            Elevate your style with a VIP mobile number
          </p>
          <div className="main-button-group">
            <button className="main-explore-button" onClick={scrollToTable}>
              Explore Numbers
            </button>
            <button
              className="main-contact-button"
              onClick={handleOpenModal}
            >
              Contact Us
            </button>
          </div>
        </div>

        <div className="main-image-container">
          <img src={Maining} alt="Fancy Number" />
        </div>
      </div>

      <section ref={tableRef}>
        <Table />
      </section>

      <Second />

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Main;
