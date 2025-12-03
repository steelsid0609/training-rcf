// src/components/common/UI/Modal.jsx
import React from 'react';
import { UI_STYLES } from '../../../utils/constants';

/**
 * Generic Modal Component for Reusability.
 * @param {object} props
 * @param {function} props.onClose - Function to close the modal.
 * @param {React.ReactNode} props.children - Modal content.
 * @param {string} props.title - Modal title.
 * @param {number} props.maxWidth - Maximum width of the modal content.
 */
export default function Modal({ onClose, children, title, maxWidth = 550 }) {
  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={handleOutsideClick}>
      <div style={{ ...modalStyles.modal, maxWidth }}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>{title}</h3>
          <button onClick={onClose} style={modalStyles.closeBtn}>&times;</button>
        </div>
        <div style={modalStyles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)", zIndex: 1100,
    display: "flex", justifyContent: "center", alignItems: "center"
  },
  modal: {
    background: "#fff", width: "90%", maxHeight: "90vh",
    borderRadius: UI_STYLES.BORDER_RADIUS, display: "flex", flexDirection: "column",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
  },
  header: {
    padding: "15px 20px", borderBottom: "1px solid #eee",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexShrink: 0
  },
  title: {
    margin: 0, 
    fontSize: 18, 
    color: UI_STYLES.TEXT_MAIN
  },
  content: {
    padding: "20px", overflowY: "auto", flex: 1
  },
  closeBtn: {
    background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: UI_STYLES.TEXT_MUTED
  },
};