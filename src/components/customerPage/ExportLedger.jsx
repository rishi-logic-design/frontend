import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./exportLedger.scss";

const ExportLedger = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [exportFormat, setExportFormat] = useState("pdf");
  const [emailToMe, setEmailToMe] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState("last1month");
  const [customDates, setCustomDates] = useState({
    fromDate: "01 April 2025",
    toDate: "07 August 2025",
  });

  // Sample data
  const ledgerData = {
    customerName: "Rajesh Sharma",
    period: "Last 3 Months",
    totalInvoices: 35000,
    outstanding: 8000,
  };

  const handleExport = () => {
    console.log("Exporting ledger...", {
      format: exportFormat,
      emailToMe,
      range: selectedRange,
      customDates: selectedRange === "custom" ? customDates : null,
    });
    // Add export logic here
  };

  const handleDateRangeClick = () => {
    setShowDateModal(true);
  };

  const handleApplyDateRange = () => {
    setShowDateModal(false);
    // Apply the selected date range
  };

  return (
    <div className="export-ledger-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Export Ledger</h1>
        <button className="menu-btn">☰</button>
      </div>

      <div className="page-content">
        <div className="export-container">
          {/* Ledger Summary */}
          <div className="summary-card">
            <h3 className="summary-title">Ledger Summary</h3>
            <p className="summary-subtitle">
              Statement for {ledgerData.customerName} for {ledgerData.period}
            </p>
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Total Invoices</span>
                <span className="summary-value">
                  ₹{ledgerData.totalInvoices.toLocaleString()}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Outstanding</span>
                <span className="summary-value outstanding">
                  ₹{ledgerData.outstanding.toLocaleString()}
                </span>
              </div>
              <button className="view-details-btn">View Details</button>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="export-format-card">
            <h3 className="section-title">Export As</h3>
            <div className="format-buttons">
              <button
                className={`format-btn ${exportFormat === "pdf" ? "active" : ""}`}
                onClick={() => setExportFormat("pdf")}
              >
                PDF
              </button>
              <button
                className={`format-btn ${exportFormat === "csv" ? "active" : ""}`}
                onClick={() => setExportFormat("csv")}
              >
                CSV
              </button>
            </div>

            <div className="email-option">
              <label htmlFor="emailToggle" className="email-label">
                Email to me
              </label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="emailToggle"
                  checked={emailToMe}
                  onChange={(e) => setEmailToMe(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Export Button */}
          <button className="export-btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>

      {/* Date Range Modal */}
      {showDateModal && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Select Date Range</h2>
              <button
                className="modal-close"
                onClick={() => setShowDateModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="range-options">
                <button
                  className={`range-btn ${selectedRange === "last1month" ? "active" : ""}`}
                  onClick={() => setSelectedRange("last1month")}
                >
                  Last 1 month
                </button>
                <button
                  className={`range-btn ${selectedRange === "last3months" ? "active" : ""}`}
                  onClick={() => setSelectedRange("last3months")}
                >
                  Last 3 month
                </button>
                <button
                  className={`range-btn ${selectedRange === "last1year" ? "active" : ""}`}
                  onClick={() => setSelectedRange("last1year")}
                >
                  Last 1 Year
                </button>
              </div>

              <button
                className={`custom-range-btn ${selectedRange === "custom" ? "active" : ""}`}
                onClick={() => setSelectedRange("custom")}
              >
                Custom Date Range
              </button>

              {selectedRange === "custom" && (
                <div className="custom-dates">
                  <div className="date-input-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value="2025-04-01"
                      onChange={(e) =>
                        setCustomDates({
                          ...customDates,
                          fromDate: e.target.value,
                        })
                      }
                      className="date-input"
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value="2025-08-07"
                      onChange={(e) =>
                        setCustomDates({
                          ...customDates,
                          toDate: e.target.value,
                        })
                      }
                      className="date-input"
                    />
                  </div>
                </div>
              )}
            </div>

            <button className="apply-btn" onClick={handleApplyDateRange}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportLedger;
