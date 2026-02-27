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
  FaHome,
  FaBolt,
  FaShoppingBasket,
  FaTruck,
  FaBoxes,
  FaChartBar,
  FaBuyNLarge,
  FaStickyNote,
} from "react-icons/fa";
import vendorProfileImageService from "../services/vendorProfileImageService";
import CreateEntryModal from "../components/common/CreateEntryModal";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [vendorData, setVendorData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    sales: true,
    purchase: false,
    master: false,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    if (!isOpen) {
      setIsOpen(true);
      setExpandedSections((prev) => ({ ...prev, [section]: true }));
      return;
    }
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
      label: "GENERAL",
      items: [
        {
          type: "single",
          name: "Dashboard",
          icon: FaHome,
          path: "/vendor/dashboard",
        },
      ],
    },
    {
      label: "ACCOUNTING",
      items: [
        {
          type: "dropdown",
          name: "Sales",
          icon: FaFileInvoice,
          section: "sales",
          items: [
            { name: "Challans", path: "/vendor/challans" },
            { name: "Invoices", path: "/vendor/bills" },
            { name: "Payment Receipts", path: "/vendor/payment-receipts" },
            { name: "Credit Notes", path: "/vendor/credit-notes" },
            { name: "E-Invoice", path: "/vendor/e-invoice" },
            { name: "Sales Debit Notes", path: "/vendor/sales-debit-notes" },
          ],
        },
        {
          type: "dropdown",
          name: "Purchases",
          icon: FaShoppingBasket,
          section: "purchase",
          items: [
            { name: "Purchase", path: "/vendor/purchases" },
            { name: "Payment Made", path: "/vendor/payments-made" },
          ],
        },
      ],
    },
    {
      label: "LOGISTICS",
      items: [
        {
          type: "single",
          name: "e-Waybill",
          icon: FaTruck,
          path: "/vendor/ewaybill",
        },
        {
          type: "single",
          name: "Inventory",
          icon: FaBoxes,
          path: "/vendor/inventory",
        },
        {
          type: "single",
          name: "Ledgers",
          icon: FaBuyNLarge,
          path: "/vendor/ledger",
        },
        {
          type: "single",
          name: "Reports",
          icon: FaChartBar,
          path: "/vendor/reports",
        },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        {
          type: "dropdown",
          name: "Masters",
          icon: FaStickyNote,
          section: "master",
          items: [
            { name: "Customers", path: "/vendor/customer" },
            { name: "Vendors", path: "/vendor/vendor" },
            { name: "Products", path: "/vendor/product" },
          ],
        },
        {
          type: "single",
          name: "Account Details",
          icon: FaCog,
          path: "/vendor/account",
        },
      ],
    },
  ];

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div
            className="brand-section"
            onClick={() => navigate("/vendor/dashboard")}
          >
            <div className="brand-logo">
              <div className="logo-icon">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Logo" className="logo-img" />
                ) : (
                  <FaCalculator />
                )}
              </div>
            </div>
            <div className="brand-info">
              <h1 className="brand-name">
                {vendorData?.businessName || "Auditra"}
              </h1>
              <p className="brand-subtitle">Smart Accounting</p>
            </div>
          </div>

          <button
            className="create-button"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FaBolt className="create-icon" />
            <span className="create-text">Create Entry</span>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="menu-items">
            {menuSections.map((group, groupIdx) => (
              <div key={groupIdx} className="group-wrapper">
                <div className="menu-section-label">{group.label}</div>
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = item.path && location.pathname === item.path;
                  const isSubActive =
                    item.type === "dropdown" &&
                    item.items.some((si) => location.pathname === si.path);
                  const isExpanded =
                    item.type === "dropdown" && expandedSections[item.section];

                  return (
                    <div key={itemIdx} className="menu-item-wrapper">
                      <div
                        className={`menu-item ${isActive || isSubActive ? "active" : ""}`}
                        onClick={() =>
                          item.type === "single"
                            ? handleMenuClick(item.path)
                            : toggleSection(item.section)
                        }
                      >
                        <Icon className="menu-icon" />
                        <span className="menu-text">{item.name}</span>
                        {item.type === "dropdown" && (
                          <FaChevronDown
                            className={`dropdown-arrow ${isExpanded ? "expanded" : ""}`}
                          />
                        )}
                        {!isOpen && <div className="tooltip">{item.name}</div>}
                      </div>

                      {isExpanded && item.type === "dropdown" && (
                        <div className="submenu">
                          {item.items.map((sub, subIdx) => (
                            <div
                              key={subIdx}
                              className={`submenu-item ${location.pathname === sub.path ? "active" : ""}`}
                              onClick={() => handleMenuClick(sub.path)}
                            >
                              {sub.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="footer-item" onClick={handleLogout}>
            <FaSignOutAlt className="menu-icon" />
            {isOpen && <span className="footer-text">Logout</span>}
            {!isOpen && <div className="tooltip">Logout</div>}
          </div>
        </div>
      </div>

      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
      </button>

      <CreateEntryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
