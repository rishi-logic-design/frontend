import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiCamera,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
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
        const res = await vendorService.getVendorById(vendorId);
        const vendor = res?.data || res;
        const profileImageUrl = getImageUrl(vendor.profileImage);

        setFormData({
          vendorName: vendor.vendorName || "",
          mobile: vendor.mobile || "",
          profileImagePath: profileImageUrl,
        });
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load profile data.");
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
        setSuccess("Profile image updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
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
      setError("Invalid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      setError("");
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

      setSuccess("Profile updated successfully!");
      setTimeout(() => navigate("/vendor/account"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Update failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="edit-profile-v2">
      <div className="header-bar">
        <button
          className="back-btn"
          onClick={() => navigate("/vendor/account")}
        >
          <FiArrowLeft /> <span>Back to Settings</span>
        </button>
        <h1 className="title">Edit Profile</h1>
      </div>

      <motion.div
        className="profile-form-container"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <AnimatePresence>
          {error && (
            <motion.div
              className="alert error"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <FiAlertCircle /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              className="alert success"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <FiCheck /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="profile-hero">
          <div className="avatar-edit-box">
            <div className={`avatar-circle ${imageLoading ? "loading" : ""}`}>
              {formData.profileImagePath ? (
                <img src={formData.profileImagePath} alt="Profile" />
              ) : (
                <div className="placeholder">
                  {formData.vendorName?.charAt(0) || <FiUser />}
                </div>
              )}
              {imageLoading && (
                <div className="img-loader">
                  <FiLoader className="spin" />
                </div>
              )}
            </div>
            <label className="camera-trigger">
              <FiCamera />
              <input
                type="file"
                hidden
                onChange={handleImageChange}
                accept="image/*"
              />
            </label>
          </div>
          <div className="hero-info">
            <h3>{formData.vendorName || "New Vendor"}</h3>
            <p>Member since {new Date().getFullYear()}</p>
          </div>
        </div>

        <div className="form-sections">
          <div className="input-group">
            <label>
              <FiUser /> Vendor Name
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                value={formData.vendorName}
                onChange={(e) =>
                  setFormData({ ...formData, vendorName: e.target.value })
                }
                placeholder="Business or Personal Name"
              />
              <div className="focus-border"></div>
            </div>
          </div>

          <div className="input-group">
            <label>
              <FiPhone /> Mobile Number
            </label>
            <div className="input-wrapper">
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                placeholder="10 digit mobile"
              />
              <div className="focus-border"></div>
            </div>
          </div>
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
            disabled={loading || imageLoading}
          >
            {loading ? (
              <FiLoader className="spin" />
            ) : (
              <>
                <FiCheck /> Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfile;
