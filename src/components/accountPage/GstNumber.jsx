import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./gstNumber.scss";

const GSTNumber = () => {
  const navigate = useNavigate();
  const [gstNumber, setGstNumber] = useState("");

  const handleSave = () => {
    console.log("Saving GST Number:", gstNumber);
    navigate("/vendor/account");
  };

  return (
    <div className="gst-number-page">
      <div className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          ←
        </button>
        <h1>GST Number</h1>
      </div>

      <div className="form-container">
        <div className="form-group">
          <label>GST Number</label>
          <input
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            placeholder="Enter GST Number"
          />
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

export default GSTNumber;
