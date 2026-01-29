import React, { useState, useEffect } from "react";
import "./accountPage.scss";
import { useNavigate } from "react-router-dom";
import vendorService from "../services/vendorService";
import vendorProfileImageService from "../services/vendorProfileImageService";

const AccountPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const getVendorId = () => {
    const vendorData = JSON.parse(localStorage.getItem("vendorData"));
    return vendorData?.id || null;
  };
  useEffect(() => {
    const loadVendor = async () => {
      try {
        const vendorId = getVendorId();
        if (!vendorId) return;

        const res = await vendorService.getVendorById(vendorId);

        setUserData(res.data || res);
      } catch (err) {
        console.error("Failed to load vendor:", err);
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, []);
  const profileImageUrl = vendorProfileImageService.getImageUrl(
    userData?.profileImage,
  );

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
            <div className={`avatar ${profileImageUrl ? "has-image" : ""}`}>
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="avatar-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />
              ) : (
                <span>
                  {userData?.vendorName?.charAt(0)?.toUpperCase() || "👤"}
                </span>
              )}
            </div>

            {/* 👇 ADD THIS BLOCK */}
            <div className="user-details">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <h2 className="user-name">{userData?.vendorName || "N/A"}</h2>
                  <p className="user-mobile">{userData?.mobile || ""}</p>
                </>
              )}
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
