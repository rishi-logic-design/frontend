import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiCreditCard,
  FiSmartphone,
  FiPlusCircle,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiLoader,
  FiUploadCloud,
  FiHome,
  FiHash,
  FiActivity,
} from "react-icons/fi";
import vendorPaymentService from "../../services/vendorPaymentService";
import "./payment.scss";

const Payment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("bank"); // bank | upi

  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    qrCodeAttachment: null,
  });

  const [qrPreview, setQrPreview] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await vendorPaymentService.getVendorPaymentDetails();
        if (data) {
          setFormData((p) => ({
            ...p,
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
            ifscCode: data.ifscCode || "",
            upiId: data.upiId || "",
          }));
          if (data.upiId && !data.bankName) setActiveTab("upi");
        }
      } catch {
        // ignore 404
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "qrCodeAttachment") {
      const file = files[0];
      setFormData({ ...formData, qrCodeAttachment: file });
      if (file) {
        setQrPreview(URL.createObjectURL(file));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("bankName", formData.bankName);
      payload.append("accountNumber", formData.accountNumber);
      payload.append("ifscCode", formData.ifscCode);
      payload.append("upiId", formData.upiId);
      if (formData.qrCodeAttachment) {
        payload.append("qrCodeAttachment", formData.qrCodeAttachment);
      }
      await vendorPaymentService.saveVendorPaymentDetails(payload);
      navigate("/vendor/account");
    } catch (err) {
      setError(err.message || "Failed to save payment details");
    } finally {
      setLoading(false);
    }
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

  return (
    <motion.div
      className="payment-page-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="header-bar">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          <FiArrowLeft /> <span>Settings</span>
        </button>
        <h1 className="title">Payment Gateways</h1>
      </div>

      <div className="payment-layout">
        {/* Left Aspect - Summary/Status */}
        <aside className="payment-status">
          <motion.div className="status-hero" variants={itemVariants}>
            <div className="icon-box">
              <FiCreditCard />
            </div>
            <h3>Payment Methods</h3>
            <p>
              Set up how your customers will pay you. Choose between Bank
              Transfer or UPI.
            </p>

            <div className="method-indicator">
              <div className={`ind ${activeTab === "bank" ? "active" : ""}`}>
                <FiHome /> Bank
              </div>
              <div className={`ind ${activeTab === "upi" ? "active" : ""}`}>
                <FiSmartphone /> UPI/QR
              </div>
            </div>
          </motion.div>

          <motion.div className="security-tip" variants={itemVariants}>
            <FiActivity />
            <div className="text">
              <strong>Secure Processing</strong>
              <span>
                Your banking info is only used for printing on invoices.
              </span>
            </div>
          </motion.div>
        </aside>

        {/* Right Aspect - Forms */}
        <main className="payment-container">
          <motion.div className="form-wrapper" variants={itemVariants}>
            <div className="tab-switcher">
              <button
                className={activeTab === "bank" ? "active" : ""}
                onClick={() => setActiveTab("bank")}
              >
                <FiHome /> Bank Details
              </button>
              <button
                className={activeTab === "upi" ? "active" : ""}
                onClick={() => setActiveTab("upi")}
              >
                <FiSmartphone /> UPI / QR
              </button>
              <div className={`glider ${activeTab}`} />
            </div>

            <div className="form-content">
              <AnimatePresence mode="wait">
                {activeTab === "bank" ? (
                  <motion.div
                    key="bank"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bank-fields"
                  >
                    <div className="input-group">
                      <label>
                        <FiHome /> Bank Name
                      </label>
                      <input
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        placeholder="e.g. HDFC Bank"
                      />
                    </div>

                    <div className="field-row">
                      <div className="input-group">
                        <label>
                          <FiHash /> Account Number
                        </label>
                        <input
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleChange}
                          placeholder="1234 5678 9012"
                        />
                      </div>
                      <div className="input-group">
                        <label>
                          <FiActivity /> IFSC Code
                        </label>
                        <input
                          name="ifscCode"
                          value={formData.ifscCode}
                          onChange={handleChange}
                          placeholder="HDFC0001234"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upi"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="upi-fields"
                  >
                    <div className="input-group">
                      <label>
                        <FiSmartphone /> UPI Identifier
                      </label>
                      <input
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        placeholder="yourname@upi"
                      />
                    </div>

                    <div className="qr-master-box">
                      <label className="qr-dropzone">
                        <FiUploadCloud className="cloud" />
                        <div className="txt-grp">
                          <h3>Upload Payment QR</h3>
                          <p>Maximum size 2MB. Support JPG & PNG.</p>
                        </div>
                        <input
                          type="file"
                          name="qrCodeAttachment"
                          hidden
                          onChange={handleChange}
                          accept="image/*"
                        />

                        {qrPreview && (
                          <div className="qr-overlay-preview">
                            <img src={qrPreview} alt="QR" />
                            <button className="change-btn">Change Image</button>
                          </div>
                        )}
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="payment-alert">
                  <FiAlertCircle /> {error}
                </div>
              )}

              <div className="form-footer">
                <button
                  className="cancel-action"
                  onClick={() => navigate("/vendor/account")}
                >
                  <FiX /> Cancel
                </button>
                <button
                  className={`save-action ${loading ? "btn-loading" : ""}`}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <FiLoader className="spin" />
                  ) : (
                    <>
                      <FiCheck /> Update Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default Payment;
