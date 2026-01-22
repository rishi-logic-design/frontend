import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./payment.scss";

const Payment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    console.log("Saving payment info:", formData);
    navigate("/vendor/account");
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
        <h1>Payment</h1>
      </div>

      <div className="form-container">
        <div className="form-group">
          <label>Bank Name</label>
          <input
            type="text"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            placeholder="Enter Bank Name"
          />
        </div>

        <div className="form-group">
          <label>Account Number</label>
          <input
            type="text"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            placeholder="Enter Account Number"
          />
        </div>

        <div className="form-group">
          <label>IFSC Code</label>
          <input
            type="text"
            name="ifscCode"
            value={formData.ifscCode}
            onChange={handleChange}
            placeholder="Enter IFSC Code"
          />
        </div>

        <div className="form-group">
          <label>UPI ID</label>
          <input
            type="text"
            name="upiId"
            value={formData.upiId}
            onChange={handleChange}
            placeholder="Enter UPI ID"
          />
        </div>

        <div className="form-group">
          <label>Attachment</label>
          <div className="upload-box">
            <div className="upload-icon">📁</div>
            <p>Please Upload Your QR Code for Customer Payments</p>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="cancel-btn"
            onClick={() => navigate("/vendor/account")}
          >
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
