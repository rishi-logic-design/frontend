import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiFileText,
  FiTrendingUp,
  FiUsers,
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiDatabase,
  FiArchive,
  FiActivity,
  FiBookOpen,
  FiPieChart,
  FiLayers,
  FiUpload,
} from "react-icons/fi";
import { FaFileInvoice, FaFileInvoiceDollar } from "react-icons/fa";
import "./report.scss";

const Report = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData") || "{}");

  const reports = [
    {
      title: "Product Wise Sales Report",
      icon: <FiTrendingUp />,
      bgColor: "#909ea3",
      path: "/vendor/reports/product-wise-sales",
    },
    {
      title: "Product Wise Purchase Report",
      icon: <FiPackage />,
      bgColor: "#7ca2b8",
      path: "/vendor/reports/product-wise-purchase",
    },
    {
      title: "Party Wise Sales Report",
      icon: <FiUsers />,
      bgColor: "#d1a084",
      path: "/vendor/reports/party-wise-sales",
    },
    {
      title: "Party Wise Purchase Report",
      icon: <FiDatabase />,
      bgColor: "#8ba38d",
      path: "/vendor/reports/party-wise-purchase",
    },
    {
      title: "GST Sales Report",
      icon: <FaFileInvoice />,
      bgColor: "#cfb08b",
      path: "/vendor/reports/gst-sales",
    },
    {
      title: "GST Purchase Report",
      icon: <FaFileInvoiceDollar />,
      bgColor: "#afc1d0",
      path: "/vendor/reports/gst-purchase",
    },
    {
      title: "HSN Sales Report",
      icon: <FiArchive />,
      bgColor: "#7b8ba1",
      path: null,
    },
    {
      title: "Delivery Challan Report",
      icon: <FiTruck />,
      bgColor: "#8fa1b5",
      path: "/vendor/reports/delivery-challan",
    },
    {
      title: "Bulk Export",
      icon: <FiLayers />,
      bgColor: "#a59da5",
      path: "/vendor/reports/bulk-export",
    },
    {
      title: "Bulk Import",
      icon: <FiUpload />,
      bgColor: "#8fa1b5",
      path: "/vendor/reports/bulk-import",
    },
    {
      title: "Invoice Details Report",
      icon: <FiFileText />,
      bgColor: "#7ca2b8",
      path: "/vendor/reports/invoice-details",
    },
    {
      title: "Purchase Details Report",
      icon: <FiShoppingCart />,
      bgColor: "#d1a084",
      path: "/vendor/reports/purchase-details",
    },
    {
      title: "TDS Summary Payable",
      icon: <FiActivity />,
      bgColor: "#8fb59c",
      path: null,
    },
    {
      title: "TDS Summary Receivable",
      icon: <FiActivity />,
      bgColor: "#afc1d0",
      path: null,
    },
    {
      title: "Current Stock Report",
      icon: <FiDatabase />,
      bgColor: "#cfb08b",
      path: "/vendor/reports/current-stock",
    },
    {
      title: "Delivery Challan Details Report",
      icon: <FiTruck />,
      bgColor: "#8ba38d",
      path: "/vendor/reports/challan-details",
    },
    {
      title: "Audit Trail",
      icon: <FiBookOpen />,
      bgColor: "#8fa1b5",
      path: "/vendor/reports/audit-trail",
    },
    {
      title: "Balance Sheet",
      icon: <FiPieChart />,
      bgColor: "#909ea3",
      path: null,
    },
    {
      title: "Profit and Loss Report",
      icon: <FiTrendingUp />,
      bgColor: "#d1a084",
      path: null,
    },
  ];

  return (
    <div className="report-page">
      <header className="report-header">
        <div className="header-left">
          <h1>
            Reports <span className="version">v2</span>
          </h1>
        </div>
        <div className="header-right">
          <div className="profile-dropdown">
            <div className="profile-img">
              {vendorData?.businessName?.charAt(0) || "M"}
            </div>
            <span className="business-name">
              {vendorData?.businessName || "My Company"}
            </span>
            <FiChevronDown />
          </div>
        </div>
      </header>

      <main className="report-container">
        <div className="category-banner">ALL TYPE OF REPORTS</div>

        <div className="report-grid">
          {reports.map((report, index) => (
            <div
              key={index}
              className={`report-card ${report.path ? "clickable" : "coming-soon"}`}
              onClick={() => report.path && navigate(report.path)}
              title={report.path ? report.title : "Coming Soon"}
            >
              <div
                className="icon-wrapper"
                style={{ backgroundColor: report.bgColor }}
              >
                {report.icon}
              </div>
              <h3>{report.title}</h3>
              {!report.path && <span className="soon-tag">Soon</span>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Report;
