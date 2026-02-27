import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiDownload,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiUser,
  FiPhone,
  FiMapPin,
  FiSend,
  FiLoader,
  FiPrinter,
} from "react-icons/fi";
import "./challanDetails.scss";
import challanService from "../../services/challanService";
import { toast } from "react-toastify";

const ChallanDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [challanData, setChallanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchChallanDetails();
  }, [id]);

  const fetchChallanDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await challanService.getChallanById(id);
      setChallanData(data);
    } catch (error) {
      console.error("Failed to fetch challan details", error);
      toast.error("Failed to load challan details. Please try again.");
      setError("Failed to load challan details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (sending) return;
    setSending(true);
    try {
      await challanService.sendWhatsAppReminder(id);
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
      const blob = await challanService.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `challan_${challanData?.challanNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleRecordPayment = () => {
    navigate(`/vendor/record-payment/${id}?type=challan`);
  };

  const formatAddress = (address) => {
    if (!address) return "Address not provided";
    try {
      const addr = typeof address === "string" ? JSON.parse(address) : address;
      return [
        addr.houseNo,
        addr.streetNo,
        addr.residencyName,
        addr.areaCity,
        addr.state,
        addr.pincode,
      ]
        .filter(Boolean)
        .join(", ");
    } catch {
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
      <div className="challan-details-page">
        <div className="loading-state">
          <FiLoader
            className="spin"
            style={{ fontSize: "32px", color: "#3b82f6" }}
          />
          <p>Loading challan details...</p>
        </div>
      </div>
    );
  }

  if (error || !challanData) {
    return (
      <div className="challan-details-page">
        <div className="error-state">
          <p>{error || "Challan not found"}</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const challan = challanData.challan || {};
  const customer = challan.customer || {};
  const items = challan.items || [];
  const status = challan.status || challanData.paymentStatus || "unpaid";

  const subtotal = Number(challan.subtotal ?? challan.totalWithoutGST ?? 0);
  const gst = Number(challan.gst ?? 0);
  const totalAmount = Number(
    challan.totalWithGST ?? challan.totalWithoutGST ?? 0,
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 },
    },
  };

  return (
    <motion.div
      className="challan-details-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="cd-header">
        <div className="header-left">
          <button className="cd-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className="cd-header-content">
            <h1 className="cd-title">Challan Details</h1>
            <p className="cd-subtitle">Complete delivery challan information</p>
          </div>
        </div>

        <div className="cd-actions">
          <button
            className="cd-btn cd-btn-download"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? <FiLoader className="spin" /> : <FiDownload />}{" "}
            Download PDF
          </button>
          {status !== "paid" && (
            <>
              <button
                className="cd-btn cd-btn-reminder"
                onClick={handleSendReminder}
                disabled={sending}
              >
                {sending ? <FiLoader className="spin" /> : <FiSend />} Send
                Reminder
              </button>
              <button
                className="cd-btn cd-btn-payment"
                onClick={handleRecordPayment}
              >
                <FiDollarSign /> Record Payment
              </button>
            </>
          )}
        </div>
      </div>

      <div className="cd-container">
        <div className="main-content">
          {/* Header Card */}
          <motion.div
            className="cd-card cd-challan-header"
            variants={containerVariants}
          >
            <div className="cd-challan-info">
              <div className="challan-badge">
                <span className="challan-label">Challan Number</span>
                <h2 className="challan-number">
                  #{challanData.challanNumber || challan.challanNo || id}
                </h2>
              </div>
            </div>
            <span className={`status-pill status-${status.toLowerCase()}`}>
              {status === "paid" ? "✓ Paid" : "⏱ Unpaid"}
            </span>
          </motion.div>

          {/* Customer Details Card */}
          <motion.div className="cd-card" variants={containerVariants}>
            <h3 className="cd-card-title">
              <FiUser className="title-icon" />
              Customer Information
            </h3>
            <div className="customer-details">
              <div className="customer-header">
                <h4 className="customer-name">
                  {customer.customerName || "N/A"}
                </h4>
                {(customer.company || customer.businessName) && (
                  <p className="customer-business">
                    {customer.company || customer.businessName}
                  </p>
                )}
              </div>
              <div className="customer-info-grid">
                <div className="info-item">
                  <div className="info-content">
                    <span className="info-label">
                      <FiMapPin /> Address
                    </span>
                    <span className="info-value">
                      {formatAddress(customer.homeAddress)}
                    </span>
                  </div>
                </div>
                {customer.mobileNumber && (
                  <div className="info-item">
                    <div className="info-content">
                      <span className="info-label">
                        <FiPhone /> Phone
                      </span>
                      <span className="info-value">
                        {customer.mobileNumber}
                      </span>
                    </div>
                  </div>
                )}
                {customer.gstNumber && (
                  <div className="info-item">
                    <div className="info-content">
                      <span className="info-label">
                        <FiFileText /> GSTIN
                      </span>
                      <span className="info-value">{customer.gstNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Items Table */}
          {items.length > 0 && (
            <motion.div className="cd-card" variants={containerVariants}>
              <h3 className="cd-card-title">
                <FiFileText className="title-icon" />
                Items ({items.length})
              </h3>
              <div className="items-table-wrapper">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th>Qty/Unit</th>
                      <th style={{ textAlign: "right" }}>Rate</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item._id || index}>
                        <td className="item-number">{index + 1}</td>
                        <td className="item-desc">
                          {item.name || item.productName || "N/A"}
                        </td>
                        <td>
                          {item.quantity || item.qty || 0} {item.unit || ""}
                        </td>
                        <td className="item-rate">
                          ₹
                          {(
                            item.rate ||
                            item.pricePerUnit ||
                            0
                          ).toLocaleString()}
                        </td>
                        <td className="item-amount">
                          ₹{(item.amount || item.total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>

        <aside className="sidebar-content">
          {/* Payment Summary Card */}
          <motion.div className="cd-card" variants={containerVariants}>
            <h3 className="cd-card-title">
              <FiDollarSign className="title-icon" />
              Payment Summary
            </h3>
            <div className="payment-summary">
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
              {gst > 0 && (
                <div className="summary-row">
                  <span className="summary-label">GST</span>
                  <span className="summary-value">₹{gst.toLocaleString()}</span>
                </div>
              )}
              <div className="summary-row total">
                <span className="summary-label">Total Amount</span>
                <span className="summary-value">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Metadata Card */}
          <motion.div className="bd-invoice-meta" variants={containerVariants}>
            <div className="meta-item">
              <FiCalendar />
              <div className="m-text">
                <span className="m-label">Challan Date</span>
                <span className="m-value">
                  {formatDate(challan.challanDate)}
                </span>
              </div>
            </div>
            <div className="meta-item">
              <FiPrinter />
              <div className="m-text">
                <span className="m-label">Document Status</span>
                <span className="m-value">
                  {downloading ? "Processing PDF..." : "Verified Reference"}
                </span>
              </div>
            </div>
          </motion.div>
        </aside>
      </div>
    </motion.div>
  );
};

export default ChallanDetails;
