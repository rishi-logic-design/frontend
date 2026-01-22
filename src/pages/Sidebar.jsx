import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.scss";
import {
  FaHome,
  FaUsers,
  FaSignOutAlt,
  FaChevronRight,
  FaChevronLeft,
  FaPaypal,
  FaBoxOpen,
  FaAccusoft,
} from "react-icons/fa";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://accountsoft.onrender.com";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedItems,] = useState({ Income: true });
  const [vendorData, setVendorData] = useState(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const token = localStorage.getItem("vendorToken");
        const storedData = localStorage.getItem("vendorData");

        if (storedData) {
          setVendorData(JSON.parse(storedData));
        }

        if (token) {
          const { data } = await axios.get(`${API_URL}/auth/vendor/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (data.success) {
            setVendorData(data.data);
            localStorage.setItem("vendorData", JSON.stringify(data.data));
          }
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
        if (error.response?.status === 401) {
          handleLogout();
        }
      }
    };

    fetchVendorData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");

    sessionStorage.clear();
    window.location.href = "/login";
  };
  const menuItems = [
    { name: "Dashboard", icon: FaHome, path: "/vendor/dashboard" },
    { name: "Customer", icon: FaUsers, path: "/vendor/customer" },
    { name: "Product", icon: FaBoxOpen, path: "/vendor/product" },
    { name: "Payment", icon: FaPaypal, path: "/vendor/subscriptions" },
    { name: "Account", icon: FaAccusoft, path: "/vendor/account" },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const getInitials = (name) => {
    if (!name) return "VN";
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="profile-avatar">
              {vendorData
                ? getInitials(vendorData.vendorName || vendorData.businessName)
                : "VN"}
            </div>
            {isOpen && (
              <div className="user-info">
                <span className="user-role">
                  {vendorData?.businessName
                    ? vendorData.businessName.toUpperCase().substring(0, 20)
                    : "VENDOR"}
                </span>
                <span className="user-name">
                  {vendorData?.vendorName || "Loading..."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Menu */}
        <div className="sidebar-content">
          {isOpen && <div className="section-label">MAIN</div>}

          <div className="menu-items">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <div key={idx} className="menu-item-wrapper">
                  <div
                    className={`menu-item ${isActive ? "active" : ""}`}
                    onClick={() => handleMenuClick(item.path)}
                  >
                    <Icon className="menu-icon" />
                    {isOpen && (
                      <>
                        <span className="menu-text">{item.name}</span>
                        {item.hasDropdown && (
                          <FaChevronRight
                            className={`dropdown-arrow ${expandedItems[item.name] ? "expanded" : ""}`}
                          />
                        )}
                      </>
                    )}
                    {!isOpen && <div className="tooltip">{item.name}</div>}
                  </div>

                  {/* Submenu - Expanded */}
                  {isOpen && item.subItems && expandedItems[item.name] && (
                    <div className="submenu">
                      {item.subItems.map((subItem, subIdx) => (
                        <div key={subIdx} className="submenu-item">
                          {subItem}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submenu - Collapsed (Hover Tooltip) */}
                  {!isOpen && item.subItems && (
                    <div className="hover-submenu">
                      <div className="hover-submenu-title">{item.name}</div>
                      {item.subItems.map((subItem, subIdx) => (
                        <div key={subIdx} className="hover-submenu-item">
                          {subItem}
                        </div>
                      ))}
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
            {isOpen && <span className="menu-text">Logout Account</span>}
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
