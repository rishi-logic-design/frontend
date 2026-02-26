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
} from "react-icons/fi";
import "./billDetails.scss";
import billService from "../../services/billService";
import { toast } from "react-toastify";

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
      console.log("🔄 Refreshing bill data...");
      fetchBillDetails();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchBillDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("📥 Fetching bill details for ID:", id);
      const data = await billService.getBillById(id);
      console.log("✅ Bill data received:", data);
      setBillData(data);
    } catch (error) {
      console.error("❌ Failed to fetch bill details:", error);
      toast.error("Failed to load bill details. Please try again.");
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
      toast.success("Payment reminder sent successfully!");
    } catch (error) {
      console.error("Failed to send reminder", error);
      toast.error("Failed to send reminder. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (downloading) return;

    setDownloading(true);
    try {
      const result = await billService.downloadPDF(id);
      if (result.success) {
        console.log("✅ PDF download initiated for bill:", result.billNumber);
      }
    } catch (error) {
      console.error("Failed to download PDF", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleRecordPayment = () => {
    const customerId =
      billData?.bill?.customer?.id || billData?.bill?.customerId;
    console.log("🔗 Navigating to payment with:", { billId: id, customerId });
    navigate(
      `/vendor/add-payment?billId=${id}&type=bill&customerId=${customerId}`,
    );
  };

  const formatAddress = (address) => {
    if (!address) return "Address not provided";

    try {
      const addr = typeof address === "string" ? JSON.parse(address) : address;

      const parts = [
        addr.houseNo,
        addr.streetNo,
        addr.residencyName,
        addr.areaCity,
        addr.state,
        addr.pincode,
      ].filter(Boolean);

      return parts.join(", ");
    } catch (e) {
      return address;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bill-details-page">
        <div className="modern-loader">
          <div className="loader-spinner"></div>
          <p className="loader-text">Loading bill details...</p>
        </div>
      </div>
    );
  }

  if (error || !billData) {
    return (
      <div className="bill-details-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error || "Bill not found"}</p>
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

  const totalAmount = parseFloat(
    bill?.totalWithGST || bill?.totalAmount || billData.totalAmount || 0,
  );

  const paidAmount = parseFloat(bill?.paidAmount || billData.paidAmount || 0);

  const pendingAmount = parseFloat(
    bill?.pendingAmount || billData.pendingAmount || totalAmount - paidAmount,
  );

  const status = bill?.status || billData.status || "pending";
  const subtotal = parseFloat(bill?.subtotal || bill?.totalWithoutGST || 0);
  const gstTotal = parseFloat(bill?.gstTotal || 0);
  const invoiceNumber = bill?.billNumber;

  return (
    <div className="bill-details-page">
      {/* Header */}
      <div className="bd-header">
        <button className="bd-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div className="bd-header-content">
          <h1 className="bd-title">Invoice Details</h1>
          <p className="bd-subtitle">Complete invoice information</p>
        </div>
      </div>

      <div className="bd-container">
        {/* Invoice Number & Status Card */}
        <div className="bd-card bd-invoice-header">
          <div className="bd-invoice-info">
            <div className="invoice-badge">
              <span className="invoice-label">Invoice Number</span>
              <h2 className="invoice-number">{invoiceNumber}</h2>
            </div>
            <span className={`status-pill status-${status.toLowerCase()}`}>
              {status === "paid"
                ? "✓ Paid"
                : status === "partial"
                  ? "⏳ Partially Paid"
                  : "⏱ Pending"}
            </span>
          </div>

          <div className="bd-invoice-meta">
            <div className="meta-item">
              <FiCalendar className="meta-icon" />
              <div className="meta-content">
                <span className="meta-label">Bill Date</span>
                <span className="meta-value">{formatDate(bill?.billDate)}</span>
              </div>
            </div>
            {bill?.customInvoicePrefix && (
              <div className="meta-item">
                <FiFileText className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Custom Prefix</span>
                  <span className="meta-value">{bill.customInvoicePrefix}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Details Card */}
        <div className="bd-card bd-customer-card">
          <h3 className="bd-card-title">
            <FiUser className="title-icon" />
            Customer Information
          </h3>
          <div className="customer-details">
            <div className="customer-header">
              <h4 className="customer-name">
                {customer.customerName || "N/A"}
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
                    <span className="info-value">{customer.mobileNumber}</span>
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
              {customer.homeAddress && (
                <div className="info-item full-width">
                  <FiMapPin className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Address</span>
                    <span className="info-value">
                      {formatAddress(customer.homeAddress)}
                    </span>
                  </div>
                </div>
              )}
              {customer.gstNumber && (
                <div className="info-item">
                  <FiFileText className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">GSTIN</span>
                    <span className="info-value">{customer.gstNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div className="bd-card bd-items-card">
            <h3 className="bd-card-title">
              <FiFileText className="title-icon" />
              Items ({items.length})
            </h3>
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item._id || item.id || index}>
                      <td className="item-number">{index + 1}</td>
                      <td className="item-desc">
                        {item.description || item.itemName || "N/A"}
                      </td>
                      <td>{item.quantity || item.qty || 0}</td>
                      <td>{item.unit || "-"}</td>
                      <td className="item-rate">
                        ₹
                        {parseFloat(
                          item.rate || item.price || 0,
                        ).toLocaleString()}
                      </td>
                      <td className="item-amount">
                        ₹
                        {parseFloat(
                          item.totalWithGst || item.totalWithGst || 0,
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bd-card bd-payment-card">
          <h3 className="bd-card-title">
            <FiDollarSign className="title-icon" />
            Payment Summary
          </h3>
          <div className="payment-summary">
            <div className="summary-row">
              <span className="summary-label">Subtotal (without GST)</span>
              <span className="summary-value">
                ₹{subtotal.toLocaleString()}
              </span>
            </div>
            {gstTotal > 0 && (
              <div className="summary-row">
                <span className="summary-label">GST</span>
                <span className="summary-value">
                  ₹{gstTotal.toLocaleString()}
                </span>
              </div>
            )}
            <div className="summary-row summary-total">
              <span className="summary-label">Total Amount</span>
              <span className="summary-value">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
            {paidAmount > 0 && (
              <>
                <div className="summary-row summary-paid">
                  <span className="summary-label">Paid Amount</span>
                  <span className="summary-value">
                    ₹{paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="summary-row summary-pending">
                  <span className="summary-label">Pending Amount</span>
                  <span className="summary-value">
                    ₹{pendingAmount.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        {bill?.termsAndConditions && (
          <div className="bd-card bd-terms-card">
            <h3 className="bd-card-title">
              <FiFileText className="title-icon" />
              Terms & Conditions
            </h3>
            {typeof bill.termsAndConditions === "string" ? (
              <div className="terms-text">
                <p>{bill.termsAndConditions}</p>
              </div>
            ) : Array.isArray(bill.termsAndConditions) &&
              bill.termsAndConditions.length > 0 ? (
              <ul className="terms-list">
                {bill.termsAndConditions.map((term, index) => (
                  <li key={index} className="term-item">
                    <span className="term-bullet">{index + 1}</span>
                    <span className="term-text">{term}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {/* Signature/Stamp */}
        {bill?.showSignatureStamp && bill?.signatureStamp && (
          <div className="bd-card bd-signature-card">
            <h3 className="bd-card-title">
              <FiFileText className="title-icon" />
              Authorized Signature
            </h3>
            <div className="signature-wrapper">
              <img
                src={bill.signatureStamp}
                alt="Signature/Stamp"
                className="signature-img"
              />
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {bill?.note && (
          <div className="bd-card bd-note-card">
            <h3 className="bd-card-title">
              <FiFileText className="title-icon" />
              Additional Notes
            </h3>
            <p className="note-text">{bill.note}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bd-actions">
          <button
            className="bd-btn bd-btn-download"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            <FiDownload />
            {downloading ? "Preparing..." : "Download PDF"}
          </button>
          {status !== "paid" && (
            <>
              <button
                className="bd-btn bd-btn-reminder"
                onClick={handleSendReminder}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Reminder"}
              </button>
              <button
                className="bd-btn bd-btn-payment"
                onClick={handleRecordPayment}
              >
                <FiDollarSign />
                Record Payment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillDetails;
