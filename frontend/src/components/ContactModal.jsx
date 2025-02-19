import React from "react";
import { motion } from "framer-motion";
import "./ContactModal.css";

const ContactModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: "0%", opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 className="modal-title">Contact Us</h2>
        <motion.p
          className="contact-item"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          📧 Email: contact@yourcompany.com
        </motion.p>
        <motion.p
          className="contact-item"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          📞 Mobile: +123 456 7890
        </motion.p>
        <motion.p
          className="contact-item"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          💬 WhatsApp: +123 456 7890
        </motion.p>
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </motion.div>
    </div>
  );
};

export default ContactModal;
