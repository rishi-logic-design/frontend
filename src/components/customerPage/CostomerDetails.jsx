import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./customerDetails.scss";

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Sample data - replace with API call
  const customerData = {
    name: "Maruti Textile",
    contactPerson: "Rajesh Sharma",
    address: "201, Market Road, Surat, Gujarat",
    avatar: "👨‍💼",
    avatarBg: "#3b82f6",
    priceOfProduct: 8000,
    paymentDueAmount: 4000,
    purchaseHistory: [
      {
        id: 1,
        product: "Cotton Fabric",
        amount: 3000,
        date: "09 August 2025",
        status: "paid",
      },
      {
        id: 2,
        product: "Denim Fabric",
        amount: 2000,
        date: "09 August 2025",
        status: "pending",
      },
      {
        id: 3,
        product: "Cotton Fabric",
        amount: 3000,
        date: "09 August 2025",
        status: "paid",
      },
      {
        id: 4,
        product: "Denim Fabric",
        amount: 2000,
        date: "09 August 2025",
        status: "pending",
      },
      {
        id: 5,
        product: "Denim Fabric",
        amount: 2000,
        date: "09 August 2025",
        status: "paid",
      },
    ],
  };

  const handleCall = () => {
    console.log("Calling customer...");
    // Add call functionality
  };

  const handleAlert = () => {
    console.log("Sending alert to customer...");
    // Add alert functionality
  };

  const handleExportLedger = () => {
    navigate("/vendor/export-ledger");
  };

  return (
    <div className="customer-details-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Customer Details</h1>
      </div>

      <div className="page-content">
        <div className="details-container">
          {/* Customer Info Card */}
          <div className="customer-info-card">
            <div className="customer-header">
              <div
                className="customer-avatar"
                style={{ background: customerData.avatarBg }}
              >
                <span>{customerData.avatar}</span>
              </div>
              <div className="customer-text">
                <h2 className="customer-name">{customerData.name}</h2>
                <p className="contact-person">{customerData.contactPerson}</p>
                <div className="address">
                  <span className="location-icon">📍</span>
                  <span>{customerData.address}</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="action-btn call" onClick={handleCall}>
                <span className="btn-icon">📞</span>
                <span className="btn-text">Call</span>
              </button>
              <button className="action-btn alert" onClick={handleAlert}>
                <span className="btn-icon">🔔</span>
                <span className="btn-text">Alert</span>
              </button>
              <button
                className="action-btn export"
                onClick={handleExportLedger}
              >
                <span className="btn-icon">📊</span>
                <span className="btn-text">Export Ledger</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <p className="card-label">Price Of Product</p>
                <h3 className="card-value">
                  ₹{customerData.priceOfProduct.toLocaleString()}
                </h3>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">💳</div>
              <div className="card-content">
                <p className="card-label">Payment Due Amount</p>
                <h3 className="card-value">
                  ₹{customerData.paymentDueAmount.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div className="purchase-history-card">
            <h3 className="section-title">Purchase History</h3>
            <div className="history-list">
              {customerData.purchaseHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="item-info">
                    <h4 className="item-name">{item.product}</h4>
                    <p className="item-amount">
                      ₹{item.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="item-meta">
                    <span className="item-date">{item.date}</span>
                    <span className={`item-status ${item.status}`}>
                      {item.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
