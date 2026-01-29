import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ledgerService from "../../services/ledgerService";
import customerService from "../../services/customerService";
import "./exportLedger.scss";


const ExportLedger = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [ledgerSummary, setLedgerSummary] = useState(null);

  const [exportFormat, setExportFormat] = useState("pdf");
  const [emailToMe, setEmailToMe] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState("last1month");
  const [customDates, setCustomDates] = useState({
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    fetchData();
  }, [id, selectedRange, customDates]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch customer details
      const customerData = await customerService.getCustomerById(id);
      setCustomer(customerData);

      // Calculate date range
      const dateRange = getDateRange();

      // Fetch ledger summary
      const summaryData = await ledgerService.getLedgerSummary(id, dateRange);
      setLedgerSummary(summaryData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load ledger data");
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const today = new Date();
    let fromDate, toDate;

    if (selectedRange === "custom") {
      fromDate = customDates.fromDate;
      toDate = customDates.toDate;
    } else {
      toDate = today.toISOString().split("T")[0];

      switch (selectedRange) {
        case "last1month":
          fromDate = new Date(today.setMonth(today.getMonth() - 1))
            .toISOString()
            .split("T")[0];
          break;
        case "last3months":
          fromDate = new Date(today.setMonth(today.getMonth() - 3))
            .toISOString()
            .split("T")[0];
          break;
        case "last1year":
          fromDate = new Date(today.setFullYear(today.getFullYear() - 1))
            .toISOString()
            .split("T")[0];
          break;
        default:
          fromDate = new Date(today.setMonth(today.getMonth() - 1))
            .toISOString()
            .split("T")[0];
      }
    }

    return { fromDate, toDate };
  };

  const getRangeLabel = () => {
    switch (selectedRange) {
      case "last1month":
        return "Last 1 Month";
      case "last3months":
        return "Last 3 Months";
      case "last1year":
        return "Last 1 Year";
      case "custom":
        return `${customDates.fromDate} to ${customDates.toDate}`;
      default:
        return "Last 1 Month";
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const dateRange = getDateRange();

      const exportData = {
        customerId: id,
        format: exportFormat,
        emailToMe: emailToMe,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
      };

      console.log("Exporting ledger with data:", exportData);

      await ledgerService.exportLedger(exportData);

      console.log(
        `Ledger exported successfully as ${exportFormat.toUpperCase()}!${
          emailToMe ? " Check your email." : ""
        }`,
      );
    } catch (error) {
      console.error("Export error:", error);
      console.log("Failed to export ledger. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDateRangeClick = () => {
    setShowDateModal(true);
  };

  const handleApplyDateRange = () => {
    if (selectedRange === "custom") {
      if (!customDates.fromDate || !customDates.toDate) {
        alert("Please select both from and to dates");
        return;
      }
    }
    setShowDateModal(false);
  };

  if (loading) {
    return (
      <div className="export-ledger-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className="page-title">Export Ledger</h1>
        </div>
        <div className="page-content">
          <div style={{ textAlign: "center", padding: "40px" }}>
            Loading ledger data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="export-ledger-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Export Ledger</h1>
      </div>

      <div className="page-content">
        <div className="export-container">
          {/* Ledger Summary */}
          <div className="summary-card">
            <h3 className="summary-title">Ledger Summary</h3>
            <p className="summary-subtitle">
              Statement for{" "}
              {customer?.customerName || customer?.businessName || "Customer"}{" "}
              for {getRangeLabel()}
            </p>
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Total Invoices</span>
                <span className="summary-value">
                  ₹{(ledgerSummary?.totalInvoices || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Outstanding</span>
                <span className="summary-value outstanding">
                  ₹{(ledgerSummary?.outstanding || 0).toLocaleString()}
                </span>
              </div>
              <button
                className="view-details-btn"
                onClick={handleDateRangeClick}
              >
                Change Date Range
              </button>
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
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export"}
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
                  Last 3 months
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
                      value={customDates.fromDate}
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
                      value={customDates.toDate}
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
