import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vendorService from "../../services/vendorService";
import {
  getImageUrl,
  uploadProfileImage,
} from "../../services/vendorProfileImageService";
import "./editProfile.scss";

const EditProfile = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData"));
  const vendorId = vendorData?.id;

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    vendorName: "",
    mobile: "",
    profileImagePath: "",
  });

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    const loadData = async () => {
      if (!vendorId) {
        setError("Vendor ID not found");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await vendorService.getVendorById(vendorId);
        const vendor = res?.data || res;

        const profileImageUrl = getImageUrl(vendor.profileImage);

        setFormData({
          vendorName: vendor.vendorName || "",
          mobile: vendor.mobile || "",
          profileImagePath: profileImageUrl,
        });
        console.log(profileImageUrl);
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load profile data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [vendorId]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImageLoading(true);
      setError("");

      const uploadRes = await uploadProfileImage(file);

      const imageUrl = uploadRes?.profileImage;

      if (imageUrl) {
        setFormData((prev) => ({
          ...prev,
          profileImagePath: imageUrl,
        }));

        const updatedVendorData = {
          ...vendorData,
          profileImage: imageUrl,
        };

        localStorage.setItem("vendorData", JSON.stringify(updatedVendorData));

        setSuccess("Profile image updated successfully!");
      }
    } catch (err) {
      console.error("Upload failed", err);
      setError("Image upload failed");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSave = async () => {
    if (!vendorId) return;

    if (!formData.vendorName.trim()) {
      setError("Vendor name is required");
      return;
    }

    if (!formData.mobile.trim()) {
      setError("Mobile number is required");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.mobile.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        vendorName: formData.vendorName.trim(),
        mobile: formData.mobile.trim(),
      };

      const res = await vendorService.updateVendor(vendorId, payload);
      const updatedVendor = res?.data || res;

      const updatedVendorData = {
        ...vendorData,
        ...updatedVendor,
        profileImage: formData.profileImagePath,
      };
      localStorage.setItem("vendorData", JSON.stringify(updatedVendorData));

      setSuccess("Profile updated successfully! Redirecting...");

      setTimeout(() => {
        navigate("/vendor/account");
      }, 1500);
    } catch (err) {
      console.error("Profile update failed", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to update profile. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayImage = () => {
    if (formData.profileImagePath) return formData.profileImagePath;
    return "";
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="edit-profile-page">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
          disabled={loading}
          aria-label="Go back"
        >
          ←
        </button>
        <h1>Edit Profile</h1>
      </div>

      <div className="form-container">
        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="success-message" role="status">
            {success}
          </div>
        )}

        {/* PROFILE IMAGE */}
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <label
              className={`avatar-large ${imageLoading ? "loading" : ""}`}
              style={{ cursor: imageLoading ? "wait" : "pointer" }}
              title="Click to upload profile image"
            >
              {getDisplayImage() ? (
                <img
                  src={getDisplayImage()}
                  alt="Profile"
                  className="profile-img"
                  onError={(e) => {
                    console.log("IMAGE LOAD FAILED:", getDisplayImage());
                    e.target.src = "";
                  }}
                />
              ) : (
                <span>
                  {formData.vendorName
                    ? formData.vendorName.charAt(0).toUpperCase()
                    : "👤"}
                </span>
              )}
              <div className="camera-icon">{imageLoading ? "⏳" : "📷"}</div>

              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                disabled={imageLoading}
                hidden
                aria-label="Upload profile image"
              />
            </label>
          </div>

          <div className="upload-hint">
            Click to upload image (Max 5MB)
            <span className="file-types">Supported: JPEG, PNG, GIF, WebP</span>
          </div>
        </div>

        {/* PROFILE INFO */}
        <div className="form-group">
          <label>
            <span className="icon">👤</span>
            Vendor Name
            <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.vendorName}
            onChange={(e) => handleInputChange("vendorName", e.target.value)}
            disabled={loading}
            placeholder="Enter your full name"
            maxLength={50}
            aria-required="true"
          />
          {formData.vendorName && (
            <div className="char-counter">{formData.vendorName.length}/50</div>
          )}
        </div>

        <div className="form-group">
          <label>
            <span className="icon">📱</span>
            Mobile Number
            <span className="required">*</span>
          </label>
          <input
            type="tel"
            value={formData.mobile}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              handleInputChange("mobile", value);
            }}
            disabled={loading}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            pattern="[0-9]{10}"
            aria-required="true"
          />
          {formData.mobile && (
            <div className="char-counter">
              {formData.mobile.length}/10 digits
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            className="cancel-btn"
            onClick={() => navigate("/vendor/account")}
            disabled={loading}
            aria-label="Cancel editing"
          >
            Cancel
          </button>
          <button
            className={`save-btn ${loading ? "loading" : ""}`}
            onClick={handleSave}
            disabled={loading || imageLoading}
            aria-label="Save changes"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
