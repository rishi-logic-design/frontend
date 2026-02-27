import React from "react";
import "./CreateEntryModal.scss";
import {
  FaFileInvoice,
  FaReceipt,
  FaUndo,
  FaTruck,
  FaShoppingCart,
  FaMoneyCheckAlt,
  FaFileInvoiceDollar,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateEntryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAction = (path) => {
    navigate(path);
    onClose();
  };

  const salesActions = [
    {
      name: "GST Invoice",
      icon: <FaFileInvoice />,
      path: "/vendor/new-bill",
      color: "#f39c12",
    },
    {
      name: "Payment Receipt",
      icon: <FaReceipt />,
      path: "/vendor/add-payment",
      color: "#e74c3c",
    },
    {
      name: "Delivery Challan",
      icon: <FaTruck />,
      path: "/vendor/new-challan",
      color: "#2980b9",
    },
    {
      name: "Credit Note",
      icon: <FaUndo />,
      path: "/vendor/new-credit-note",
      color: "#9b59b6",
    },
  ];

  const purchaseActions = [
    {
      name: "Purchase",
      icon: <FaShoppingCart />,
      path: "/vendor/new-purchase",
      color: "#2c3e50",
    },
    {
      name: "Payment Made",
      icon: <FaMoneyCheckAlt />,
      path: "/vendor/add-payment-made",
      color: "#f1c40f",
    },
    {
      name: "Debit Note",
      icon: <FaFileInvoiceDollar />,
      path: "/vendor/new-sales-debit",
      color: "#2ecc71",
    },
  ];

  return (
    <div className="create-modal-overlay" onClick={onClose}>
      <div
        className="create-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="modal-section">
          <h3 className="section-title">SALES</h3>
          <div className="actions-grid">
            {salesActions.map((action, index) => (
              <div
                key={index}
                className="action-card"
                onClick={() => handleAction(action.path)}
              >
                <div
                  className="icon-wrapper"
                  style={{ backgroundColor: action.color }}
                >
                  {action.icon}
                </div>
                <span className="action-name">{action.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <h3 className="section-title">PURCHASE</h3>
          <div className="actions-grid">
            {purchaseActions.map((action, index) => (
              <div
                key={index}
                className="action-card"
                onClick={() => handleAction(action.path)}
              >
                <div
                  className="icon-wrapper"
                  style={{ backgroundColor: action.color }}
                >
                  {action.icon}
                </div>
                <span className="action-name">{action.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEntryModal;
