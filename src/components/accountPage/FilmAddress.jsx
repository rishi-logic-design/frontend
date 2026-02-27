import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiMapPin,
  FiHome,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiLoader,
  FiBriefcase,
  FiMap,
} from "react-icons/fi";
import firmService from "../../services/firmService";
import "./filmAddress.scss";

const FirmAddress = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firmName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    const fetchFirm = async () => {
      try {
        setLoading(true);
        const firm = await firmService.getFirm();

        if (firm) {
          setFormData({
            firmName: firm.firmName || "",
            addressLine1: firm.addressLine1 || "",
            addressLine2: firm.addressLine2 || "",
            city: firm.city || "",
            state: firm.state || "",
            pincode: firm.pincode || "",
          });
        }
      } catch (err) {
        console.log("Firm details not added yet");
      } finally {
        setLoading(false);
      }
    };

    fetchFirm();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.firmName || !formData.city || !formData.state) {
      setError("Firm Name, City and State are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await firmService.saveFirm({
        firmName: formData.firmName,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });

      navigate("/vendor/account");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save firm details");
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
      className="firm-address-v2"
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
        <div className="title-group">
          <h1 className="title">Business Presence</h1>
          <p className="subtitle">
            Update the official operating address for your firm/business.
          </p>
        </div>
      </div>

      <div className="firm-layout">
        {/* Left Aspect - Visual Summary */}
        <aside className="firm-aside">
          <motion.div className="firm-hero" variants={itemVariants}>
            <div className="icon-box">
              <FiMapPin />
            </div>
            <h3>Location Identity</h3>
            <p>
              This address will be displayed on all your professional invoices,
              quotations, and reports.
            </p>

            <div className="address-preview">
              <div className="preview-header">LIVE PREVIEW</div>
              <div className="p-card">
                <strong>{formData.firmName || "Firm Name"}</strong>
                <p>{formData.addressLine1 || "Line 1"}</p>
                <p>
                  {formData.city}
                  {formData.city && ","} {formData.state}
                </p>
                <p>{formData.pincode}</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="mapping-tip" variants={itemVariants}>
            <FiMap />
            <div className="text">
              <strong>Geo Precision</strong>
              <span>
                Please double-check the pincode to ensure accurate tax
                calculations for regional compliance.
              </span>
            </div>
          </motion.div>
        </aside>

        {/* Right Aspect - Detailed Form */}
        <main className="firm-main">
          <motion.div className="config-card" variants={itemVariants}>
            <div className="card-header">
              <FiBriefcase /> <span>Establishment Details</span>
            </div>

            <div className="form-body">
              <div className="input-group full">
                <label>
                  <FiHome /> Professional Firm Name
                </label>
                <input
                  type="text"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation Pvt Ltd"
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="Office No. / Landmark"
                  />
                </div>
                <div className="input-group">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="Building / Street"
                  />
                </div>

                <div className="input-group">
                  <label>City / Hub</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                  />
                </div>

                <div className="input-group">
                  <label>State / Region</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  >
                    <option value="">Select State</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Postal Index (Pincode)</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6 Digit PIN"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="alert-box error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
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
                    <FiCheck /> Save Presence
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

export default FirmAddress;
