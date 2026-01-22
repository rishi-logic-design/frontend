import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./editProfile.scss";

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "Mr. John Doe",
    mobile: "+91 8956481245",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // Save logic here
    console.log("Saving profile:", formData);
    navigate("/vendor/account");
  };

  return (
    <div className="edit-profile-page">
      <div className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          ←
        </button>
        <h1>Edit Profile</h1>
      </div>

      <div className="form-container">
        <div className="profile-avatar-section">
          <div className="avatar-large">
            JD
            <div className="camera-icon">📷</div>
          </div>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter Name"
          />
        </div>

        <div className="form-group">
          <label>Mobile Number</label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Enter Name"
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

export default EditProfile;
