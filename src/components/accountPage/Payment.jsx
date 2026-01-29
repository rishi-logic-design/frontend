import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      setFormData({ ...formData, qrCodeAttachment: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError(null);
  };

  const validateForm = () => {
    const { bankName, accountNumber, ifscCode, upiId } = formData;
    if (!bankName && !accountNumber && !ifscCode && !upiId) {
      setError("Please add Bank details or UPI ID");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
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

  return (
    <div className="payment-page">
      <div className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          ←
        </button>
        <h1>Payment Settings</h1>
      </div>

      <div className="card">
        {error && <div className="error-message">{error}</div>}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === "bank" ? "tab active" : "tab"}
            onClick={() => setActiveTab("bank")}
          >
            Bank Details
          </button>
          <button
            className={activeTab === "upi" ? "tab active" : "tab"}
            onClick={() => setActiveTab("upi")}
          >
            UPI / QR
          </button>
        </div>

        {/* Bank */}
        {activeTab === "bank" && (
          <div className="grid">
            <div className="form-group">
              <label>Bank Name</label>
              <input
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {/* UPI */}
        {activeTab === "upi" && (
          <div className="upi-wrap">
            <div className="form-group">
              <label>UPI ID</label>
              <input
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
              />
            </div>

            <div className="qr-box">
              <div className="qr-upload">
                <input
                  type="file"
                  name="qrCodeAttachment"
                  accept="image/*"
                  onChange={handleChange}
                />
                <p>Upload QR Code</p>
              </div>
              {formData.qrCodeAttachment && (
                <div className="qr-preview">
                  <img
                    src={URL.createObjectURL(formData.qrCodeAttachment)}
                    alt="QR Preview"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="actions">
          <button
            className="cancel-btn"
            onClick={() => navigate("/vendor/account")}
          >
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
