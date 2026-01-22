import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./filmAddress.scss";

const FirmAddress = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    officeNo: "",
    buildingNo: "",
    areaCity: "",
    state: "",
    pincode: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    console.log("Saving firm address:", formData);
    navigate("/vendor/account");
  };

  return (
    <div className="firm-address-page">
      <div className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          ←
        </button>
        <h1>Firm Address</h1>
      </div>

      <div className="form-container">
        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="officeNo"
              value={formData.officeNo}
              onChange={handleChange}
              placeholder="Office No."
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="buildingNo"
              value={formData.buildingNo}
              onChange={handleChange}
              placeholder="Building No."
            />
          </div>
        </div>

        <div className="form-group">
          <input
            type="text"
            name="areaCity"
            value={formData.areaCity}
            onChange={handleChange}
            placeholder="Area / City"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <select name="state" value={formData.state} onChange={handleChange}>
              <option value="">State</option>
              <option value="gujarat">Gujarat</option>
              <option value="maharashtra">Maharashtra</option>
              <option value="delhi">Delhi</option>
            </select>
          </div>
          <div className="form-group">
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Pincode"
            />
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

export default FirmAddress;
