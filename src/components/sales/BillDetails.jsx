import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FiArrowLeft,
  FiDownload,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiInfo,
  FiCheckCircle,
  FiPrinter,
  FiSend,
} from "react-icons/fi";
import "./billDetails.scss";
import billService from "../../services/billService";
import { toast } from "react-toastify";

const fmtAmt = (v) =>
  `₹${parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const BillDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchBillDetails();
  }, [id]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchBillDetails();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchBillDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billService.getBillById(id);
      setBillData(data);
    } catch (error) {
      console.error("Failed to fetch bill details:", error);
      toast.error("Failed to load bill details.");
      setError("Failed to load bill details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (sending) return;
    setSending(true);
    try {
      await billService.sendWhatsAppReminder(id);
      toast.success("Payment reminder sent!");
    } catch (error) {
      toast.error("Failed to send reminder.");
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await billService.downloadPDF(id);
    } catch (error) {
      toast.error("Failed to download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleRecordPayment = () => {
    const customerId =
      billData?.bill?.customer?.id || billData?.bill?.customerId;
    navigate(
      `/vendor/add-payment?billId=${id}&type=bill&customerId=${customerId}`,
    );
  };

  if (loading) {
    return (
      <div className="bill-details-page">
        <div className="modern-loader">
          <div className="loader-spinner"></div>
          <p className="loader-text">Fetching entry details…</p>
        </div>
      </div>
    );
  }

  if (error || !billData) {
    return (
      <div className="bill-details-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error || "Entry not found"}</p>
          <button onClick={() => navigate(-1)} className="back-btn-error">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const bill = billData.bill || billData;
  const customer = bill?.customer || {};
  const items = bill?.items || [];
  const totalAmount = parseFloat(bill?.totalWithGST || bill?.totalAmount || 0);
  const paidAmount = parseFloat(bill?.paidAmount || 0);
  const pendingAmount = totalAmount - paidAmount;
  const status = bill?.status || "pending";
  const subtotal = parseFloat(bill?.subtotal || bill?.totalWithoutGST || 0);
  const gstTotal = parseFloat(bill?.gstTotal || 0);

  return (
    <div className="bill-details-page">
      {/* ─── Top Header Bar ─── */}
      <div className="bd-header">
        <button
          className="bd-back-btn"
          onClick={() => navigate(-1)}
          title="Go Back"
        >
          <FiArrowLeft />
        </button>
        <div className="bd-header-content">
          <h1 className="bd-title">Invoice Details</h1>
          <p className="bd-subtitle">Tracking ID: {id}</p>
        </div>
      </div>

      <div className="bd-container">
        {/* ════ LEFT: Main Info ════ */}
        <div className="bd-section">
          {/* 1. Invoice Summary Header */}
          <div className="bd-card bd-invoice-header">
            <div className="bd-invoice-info">
              <div className="invoice-badge">
                <span className="invoice-label">Invoice Number</span>
                <h2 className="invoice-number">{bill?.billNumber || "—"}</h2>
              </div>
              <span className={`status-pill status-${status.toLowerCase()}`}>
                {status === "paid"
                  ? "Paid"
                  : status === "partial"
                    ? "Partial"
                    : "Unpaid"}
              </span>
            </div>

            <div className="bd-invoice-meta">
              <div className="meta-item">
                <FiCalendar className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Date</span>
                  <span className="meta-value">
                    {bill?.billDate
                      ? new Date(bill.billDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
              {bill?.customInvoicePrefix && (
                <div className="meta-item">
                  <FiFileText className="meta-icon" />
                  <div className="meta-content">
                    <span className="meta-label">Prefix</span>
                    <span className="meta-value">
                      {bill.customInvoicePrefix}
                    </span>
                  </div>
                </div>
              )}
              <div className="meta-item">
                <FiPrinter className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Type</span>
                  <span className="meta-value">GST Tax Invoice</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Customer Information */}
          <div className="bd-card bd-customer-card">
            <h3 className="bd-card-title">
              <FiUser className="title-icon" />
              Customer Details
            </h3>
            <div className="customer-details">
              <div className="customer-header">
                <h4 className="customer-name">
                  {customer.customerName || "—"}
                </h4>
                {customer.businessName && (
                  <p className="customer-business">{customer.businessName}</p>
                )}
              </div>
              <div className="customer-info-grid">
                {customer.mobileNumber && (
                  <div className="info-item">
                    <FiPhone className="info-icon" />
                    <div className="info-content">
                      <span className="info-label">Phone</span>
                      <span className="info-value">
                        {customer.mobileNumber}
                      </span>
                    </div>
                  </div>
                )}
                {customer.email && (
                  <div className="info-item">
                    <FiMail className="info-icon" />
                    <div className="info-content">
                      <span className="info-label">Email</span>
                      <span className="info-value">{customer.email}</span>
                    </div>
                  </div>
                )}
                {customer.gstNumber && (
                  <div className="info-item">
                    <FiCheckCircle className="info-icon" />
                    <div className="info-content">
                      <span className="info-label">GSTIN</span>
                      <span className="info-value">{customer.gstNumber}</span>
                    </div>
                  </div>
                )}
                {(customer.homeAddress ||
                  customer.officeAddress ||
                  customer.address) && (
                  <div className="info-item full-width">
                    <FiMapPin className="info-icon" />
                    <div className="info-content">
                      <span className="info-label">Address</span>
                      <span className="info-value">
                        {typeof customer.homeAddress === "object"
                          ? Object.values(customer.homeAddress)
                              .filter(Boolean)
                              .join(", ")
                          : customer.homeAddress || customer.address || "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Items Table */}
          {items.length > 0 && (
            <div className="bd-card bd-items-card">
              <h3 className="bd-card-title">
                <FiPackage icon="package" className="title-icon" />
                Line Items
              </h3>
              <div className="items-table-wrapper">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Description</th>
                      <th style={{ width: 80, textAlign: "center" }}>Qty</th>
                      <th style={{ width: 120, textAlign: "right" }}>Rate</th>
                      <th style={{ width: 140, textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="item-number">{idx + 1}</td>
                        <td className="item-desc">
                          {item.description || item.itemName || "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {item.quantity || item.qty || 0} {item.unit}
                        </td>
                        <td className="item-rate">
                          {fmtAmt(item.rate || item.price)}
                        </td>
                        <td className="item-amount">
                          {fmtAmt(item.totalWithGst || item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Notes & Terms */}
          {(bill?.note ||
            (bill?.termsAndConditions &&
              bill.termsAndConditions.length > 0)) && (
            <div
              className="bd-section-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {bill?.note && (
                <div className="bd-card">
                  <h3 className="bd-card-title">
                    <FiInfo className="title-icon" /> Remarks
                  </h3>
                  <div className="note-text">{bill.note}</div>
                </div>
              )}
              {bill?.termsAndConditions && (
                <div className="bd-card">
                  <h3 className="bd-card-title">
                    <FiFileText className="title-icon" /> Terms
                  </h3>
                  <div className="terms-text">{bill.termsAndConditions}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════ RIGHT: Actions & Summary ════ */}
        <div className="bd-sidebar">
          {/* Action Buttons */}
          <div className="bd-card">
            <h3 className="bd-card-title">Actions</h3>
            <div className="bd-actions-grid">
              <button
                className="bd-btn bd-btn-download"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                <FiDownload /> {downloading ? "Preparing..." : "Download PDF"}
              </button>
              <button
                className="bd-btn bd-btn-reminder"
                onClick={handleSendReminder}
                disabled={sending}
              >
                <FiSend /> {sending ? "Sending..." : "WhatsApp Reminder"}
              </button>
              {status !== "paid" && (
                <button
                  className="bd-btn bd-btn-payment"
                  onClick={handleRecordPayment}
                >
                  <FiDollarSign /> Record Payment
                </button>
              )}
            </div>
          </div>

          {/* Payment Summary Box */}
          <div className="bd-card">
            <h3 className="bd-card-title">Financial Summary</h3>
            <div className="payment-summary">
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">{fmtAmt(subtotal)}</span>
              </div>
              {gstTotal > 0 && (
                <div className="summary-row">
                  <span className="summary-label">Tax (GST)</span>
                  <span className="summary-value">{fmtAmt(gstTotal)}</span>
                </div>
              )}
              <div className="summary-row summary-total">
                <span className="summary-label">Total Amount</span>
                <span className="summary-value">{fmtAmt(totalAmount)}</span>
              </div>
              {paidAmount > 0 && (
                <div className="summary-row summary-paid">
                  <span className="summary-label">Paid to date</span>
                  <span className="summary-value">{fmtAmt(paidAmount)}</span>
                </div>
              )}
              <div className="summary-row summary-pending">
                <span className="summary-label">Balance Due</span>
                <span className="summary-value">{fmtAmt(pendingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bd-card" style={{ background: "#f8fafc" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span
                  style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}
                >
                  CREATED ON
                </span>
                <span
                  style={{ fontSize: 11, color: "#1e293b", fontWeight: 700 }}
                >
                  {formatDate(bill.createdAt)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span
                  style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}
                >
                  SYSTEM ID
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#1e293b",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  #{id.slice(-6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const FiPackage = ({ className }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16.5 9.4L7.5 4.21"></path>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

export default BillDetails;
