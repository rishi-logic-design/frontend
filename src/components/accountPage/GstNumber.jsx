import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiHash,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiLoader,
  FiBriefcase,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import vendorGstNumberService from "../../services/vendorGstNumberService";
import "./gstNumber.scss";

const GSTNumber = () => {
  const navigate = useNavigate();

  const [gstNumber, setGstNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGst = async () => {
      try {
        setLoading(true);
        const data = await vendorGstNumberService.getGstNumber();

        if (data?.gstNumber) {
          setGstNumber(data.gstNumber);
        }
      } catch (err) {
        console.log("GST number not found yet");
      } finally {
        setLoading(false);
      }
    };

    fetchGst();
  }, []);

  const handleSave = async () => {
    if (!gstNumber.trim()) {
      setError("GST Number is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await vendorGstNumberService.saveGstNumber({
        gstNumber: gstNumber.trim(),
      });

      navigate("/vendor/account");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save GST Number");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className="gst-number-v2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Bar */}
      <div className="header-bar">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          <FiArrowLeft /> <span>Settings</span>
        </button>
        <div className="title-group">
          <h1 className="title">Legal Identity</h1>
          <p className="subtitle">
            Configure your official GST registration for tax compliance.
          </p>
        </div>
      </div>

      <div className="gst-layout">
        {/* Left Aspect - Identity Summary */}
        <aside className="identity-aside">
          <motion.div className="identity-hero" variants={itemVariants}>
            <div className="icon-box">
              <FiShield />
            </div>
            <h3>Registration Status</h3>
            <p>
              Your GST number is essential for generating tax-compliant invoices
              and claiming input credits.
            </p>

            <div className="status-indicators">
              <div
                className={`indicator ${gstNumber ? "verified" : "pending"}`}
              >
                <FiCheck /> {gstNumber ? "Configured" : "Awaiting Setup"}
              </div>
            </div>
          </motion.div>

          <motion.div className="compliance-tip" variants={itemVariants}>
            <FiInfo />
            <div className="text">
              <strong>Compliance Tip</strong>
              <span>
                Ensure your GSTIN matches your registration certificate as it
                appears on all printed documents.
              </span>
            </div>
          </motion.div>
        </aside>

        {/* Right Aspect - Form */}
        <main className="gst-main">
          <motion.div className="config-card" variants={itemVariants}>
            <div className="card-header">
              <FiBriefcase /> <span>GSTIN Configuration</span>
            </div>

            <div className="form-body">
              <div className="input-field">
                <label>
                  <FiHash /> GST Identification Number
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 24ABCDE1234F1Z5"
                    disabled={loading}
                  />
                  <div className="focus-line"></div>
                </div>
                <p className="field-hint">
                  Your 15-digit Goods and Services Tax Identification Number.
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="alert error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <FiAlertCircle /> {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="actions-footer">
              <button
                className="secondary-btn"
                onClick={() => navigate("/vendor/account")}
                disabled={loading}
              >
                <FiX /> Cancel
              </button>
              <button
                className={`primary-btn ${loading ? "btn-loading" : ""}`}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <FiLoader className="spin" />
                ) : (
                  <>
                    <FiCheck /> Update Identity
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default GSTNumber;
