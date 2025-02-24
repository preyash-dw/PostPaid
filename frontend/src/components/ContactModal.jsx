import React from "react";
import "./ContactModal.css";

const ContactModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="contact-modal-overlay" onClick={onClose}>
      <div className="contact-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="contact-modal-title">Contact Us</h2>
        <p className="contact-contact-item">📧 Email: contact@yourcompany.com</p>
        <p className="contact-contact-item">📞 Mobile: +123 456 7890</p>
        <p className="contact-contact-item">💬 WhatsApp: +123 456 7890</p>
        <button className="contact-close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ContactModal;
