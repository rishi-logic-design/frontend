import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiCreditCard,
  FiSettings,
  FiMapPin,
  FiPackage,
  FiShield,
  FiInfo,
  FiDatabase,
  FiLogOut,
  FiEdit3,
  FiChevronRight,
  FiArrowLeft,
  FiCheckCircle,
  FiFileText,
  FiHash,
} from "react-icons/fi";
import "./accountPage.scss";
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
    localStorage.removeItem("vendorData");
    navigate("/login");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const menuSections = [
    {
      title: "Personal Information",
      items: [
        {
          label: "My Profile",
          icon: <FiUser />,
          path: "/vendor/account/edit-profile",
          color: "#3b82f6",
        },
        {
          label: "Payment & Subscription",
          icon: <FiCreditCard />,
          path: "/vendor/account/payment",
          color: "#10b981",
        },
      ],
    },
    {
      title: "Business Settings",
      items: [
        {
          label: "Billing Settings",
          icon: <FiFileText />,
          path: "/vendor/account/billing-settings",
          color: "#6366f1",
        },
        {
          label: "GST Slabs",
          icon: <FiDatabase />,
          path: "/vendor/account/gst-slabs",
          color: "#f59e0b",
        },
        {
          label: "GST Number",
          icon: <FiHash />,
          path: "/vendor/account/gst-number",
          color: "#8b5cf6",
        },
        {
          label: "Firm Address",
          icon: <FiMapPin />,
          path: "/vendor/account/firm-address",
          color: "#ef4444",
        },
      ],
    },
    {
      title: "Application",
      items: [
        {
          label: "Products",
          icon: <FiPackage />,
          path: "/vendor/product",
          color: "#06b6d4",
        },
        {
          label: "Security & Backup",
          icon: <FiShield />,
          path: "/vendor/account/backup",
          color: "#f43f5e",
        },
        {
          label: "About Auditra",
          icon: <FiInfo />,
          path: "/vendor/account/about",
          color: "#64748b",
        },
      ],
    },
  ];

  return (
    <motion.div
      className="account-page-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="account-header">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/dashboard")}
        >
          <FiArrowLeft /> Dashboard
        </button>
        <h1 className="header-title">Account Settings</h1>
      </div>

      <div className="account-layout">
        {/* Left Column - Profile Summary */}
        <aside className="profile-summary">
          <motion.div className="profile-hero-card" variants={itemVariants}>
            <div className="avatar-wrapper">
              <div className="avatar-container">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {userData?.vendorName?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="verified-badge">
                  <FiCheckCircle />
                </div>
              </div>
              <button
                className="edit-overlay"
                onClick={() => navigate("/vendor/account/edit-profile")}
              >
                <FiEdit3 />
              </button>
            </div>

            <div className="hero-text">
              <h2>{userData?.vendorName || "Business Owner"}</h2>
              <p>{userData?.mobile || "No mobile set"}</p>
              <div className="account-badge">Premium Vendor</div>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="val">Active</span>
                <span className="lbl">Status</span>
              </div>
              <div className="stat-sep" />
              <div className="stat">
                <span className="val">
                  {userData?.businessName ? "Linked" : "Direct"}
                </span>
                <span className="lbl">Type</span>
              </div>
            </div>
          </motion.div>

          <motion.button
            className="logout-action-btn"
            variants={itemVariants}
            onClick={handleLogout}
          >
            <FiLogOut /> Sign Out
          </motion.button>
        </aside>

        {/* Right Column - Menu Sections */}
        <main className="account-menus">
          {menuSections.map((section, idx) => (
            <motion.div
              key={idx}
              className="menu-group"
              variants={itemVariants}
            >
              <h3 className="group-title">{section.title}</h3>
              <div className="menu-grid">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="menu-card"
                    onClick={() => item.path !== "#" && navigate(item.path)}
                  >
                    <div
                      className="card-icon"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="card-info">
                      <span className="label">{item.label}</span>
                      <span className="sub-label">
                        Manage your {item.label.toLowerCase()} settings
                      </span>
                    </div>
                    <FiChevronRight className="arrow" />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    </motion.div>
  );
};

export default AccountPage;
