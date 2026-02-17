import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.scss";
import {
  FaSignOutAlt,
  FaChevronRight,
  FaChevronLeft,
  FaChevronDown,
  FaFileInvoice,
  FaCalculator,
  FaCog,
  FaPaypal,
  FaBoxOpen,
  FaHome,
  FaUsers,
  FaBolt,
} from "react-icons/fa";
import vendorProfileImageService from "../services/vendorProfileImageService";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [vendorData, setVendorData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    sales: false,
  });

  useEffect(() => {
    const storedData = localStorage.getItem("vendorData");
    if (storedData) {
      setVendorData(JSON.parse(storedData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const profileImageUrl = vendorProfileImageService.getImageUrl(
    vendorData?.profileImage,
  );

  const menuSections = [
    {
      type: "single",
      name: "Dashboard",
      icon: FaHome,
      path: "/vendor/dashboard",
    },
    {
      type: "dropdown",
      name: "Sales",
      icon: FaFileInvoice,
      section: "sales",
      items: [
        { name: "New Challan", path: "/vendor/new-challan" },
        { name: "Invoices", path: "/vendor/bills" },
        { name: "Payment Receipts", path: "/vendor/payment-receipts" },
      ],
    },
    {
      type: "dropdown",
      name: "master",
      icon: FaFileInvoice,
      section: "master",
      items: [
        { name: "New Challan", path: "/vendor/new-challan" },
        { name: "Invoices", path: "/vendor/bills" },
        { name: "Payment Receipts", path: "/vendor/payment-receipts" },
      ],
    },
    {
      type: "single",
      name: "Customer",
      icon: FaUsers,
      path: "/vendor/customer",
    },
    {
      type: "single",
      name: "Product",
      icon: FaBoxOpen,
      path: "/vendor/product",
    },
    {
      type: "single",
      name: "Payment",
      icon: FaPaypal,
      path: "/vendor/payment",
    },
    {
      type: "single",
      name: "Account",
      icon: FaCog,
      path: "/vendor/account",
    },

    {
      type: "dropdown",
      name: "Settings",
      icon: FaCog,
      section: "settings",
      items: [
        { name: "Account Settings", path: "/vendor/account" },
        { name: "Billing Settings", path: "/vendor/account/billing-settings" },
        { name: "GST Settings", path: "/vendor/account/gst-slabs" },
      ],
    },
  ];

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        {/* Brand Section */}
        <div className="sidebar-header">
          <div className="brand-section">
            <div className="brand-logo">
              <div className="logo-icon">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Logo"
                    className="logo-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <FaCalculator />
                )}
              </div>
            </div>
            {isOpen && (
              <div className="brand-info">
                <h1 className="brand-name">
                  {vendorData?.businessName || "GimBooks"}
                </h1>
                <p className="brand-subtitle">GST Invoice Manager</p>
              </div>
            )}
          </div>

          {isOpen && (
            <button className="create-button">
              <FaBolt className="create-icon" />
              <span>Create</span>
            </button>
          )}
        </div>

        {/* Menu Content */}
        <div className="sidebar-content">
          <div className="menu-items">
            {menuSections.map((section, idx) => {
              const Icon = section.icon;
              const isActive =
                section.path && location.pathname === section.path;
              const isExpanded =
                section.type === "dropdown" &&
                expandedSections[section.section];

              if (section.type === "single") {
                return (
                  <div key={idx} className="menu-item-wrapper">
                    <div
                      className={`menu-item ${isActive ? "active" : ""}`}
                      onClick={() => handleMenuClick(section.path)}
                    >
                      <Icon className="menu-icon" />
                      {isOpen && (
                        <span className="menu-text">{section.name}</span>
                      )}
                      {!isOpen && <div className="tooltip">{section.name}</div>}
                    </div>
                  </div>
                );
              }

              // Dropdown type
              return (
                <div key={idx} className="menu-item-wrapper">
                  <div
                    className={`menu-item has-dropdown ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleSection(section.section)}
                  >
                    <Icon className="menu-icon" />
                    {isOpen && (
                      <span className="menu-text">{section.name}</span>
                    )}
                    {isOpen && (
                      <FaChevronDown
                        className={`dropdown-arrow ${isExpanded ? "expanded" : ""}`}
                      />
                    )}
                    {!isOpen && <div className="tooltip">{section.name}</div>}
                  </div>

                  {isOpen && isExpanded && (
                    <div className="submenu">
                      {section.items.map((subItem, subIdx) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <div
                            key={subIdx}
                            className={`submenu-item ${isSubActive ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuClick(subItem.path);
                            }}
                          >
                            {subItem.name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="footer-item logout" onClick={handleLogout}>
            <FaSignOutAlt className="menu-icon" />
            {isOpen && <span className="menu-text">Logout</span>}
            {!isOpen && <div className="tooltip">Logout</div>}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaChevronLeft size={14} /> : <FaChevronRight size={14} />}
      </button>
    </>
  );
};

export default Sidebar;
