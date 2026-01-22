import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./accountPage.scss";

const AccountPage = () => {
  const navigate = useNavigate();
  const [userData] = useState({
    name: "Mr. John Doe",
    phone: "+91 8956481245",
  });

  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    navigate("/login");
  };

  return (
    <div className="account-page">
      <div className="account-container">
        <h1 className="page-title">Account</h1>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-info">
            <div className="avatar">
              <span>JD</span>
            </div>
            <div className="user-details">
              <h2>{userData.name}</h2>
              <p>{userData.phone}</p>
            </div>
          </div>
          <button
            className="edit-btn"
            onClick={() => navigate("/vendor/account/edit-profile")}
          >
            <span className="icon">✎</span>
            Edit Profile
          </button>
        </div>

        {/* Personal Information */}
        <div className="info-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="menu-list">
            <button
              className="menu-item"
              onClick={() => navigate("/vendor/account/edit-profile")}
            >
              <div className="menu-left">
                <span className="menu-icon">👤</span>
                <span className="menu-label">My Details</span>
              </div>
              <span className="arrow">›</span>
            </button>
            <button
              className="menu-item"
              onClick={() => navigate("/vendor/account/payment")}
            >
              <div className="menu-left">
                <span className="menu-icon">💳</span>
                <span className="menu-label">Payment</span>
              </div>
              <span className="arrow">›</span>
            </button>
          </div>
        </div>

        {/* Other Information */}
        <div className="info-section">
          <h3 className="section-title">Other Information</h3>
          <div className="menu-list">
            <button
              className="menu-item"
              onClick={() => navigate("/vendor/account/gst-slabs")}
            >
              <div className="menu-left">
                <span className="menu-icon">📄</span>
                <span className="menu-label">GST SLABS</span>
              </div>
              <span className="arrow">›</span>
            </button>
            <button
              className="menu-item"
              onClick={() => navigate("/vendor/account/gst-number")}
            >
              <div className="menu-left">
                <span className="menu-icon">#</span>
                <span className="menu-label">GST Number</span>
              </div>
              <span className="arrow">›</span>
            </button>
            <button
              className="menu-item"
              onClick={() => navigate("/vendor/account/firm-address")}
            >
              <div className="menu-left">
                <span className="menu-icon">📍</span>
                <span className="menu-label">Firm Address</span>
              </div>
              <span className="arrow">›</span>
            </button>
            <button
              className="menu-item"
              onClick={() => navigate("/vendor/product")}
            >
              <div className="menu-left">
                <span className="menu-icon">📦</span>
                <span className="menu-label">Product</span>
              </div>
              <span className="arrow">›</span>
            </button>
            <button className="menu-item">
              <div className="menu-left">
                <span className="menu-icon">ℹ️</span>
                <span className="menu-label">About Us</span>
              </div>
              <span className="arrow">›</span>
            </button>
            <button className="menu-item">
              <div className="menu-left">
                <span className="menu-icon">💾</span>
                <span className="menu-label">Backup</span>
              </div>
              <span className="arrow">›</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AccountPage;
