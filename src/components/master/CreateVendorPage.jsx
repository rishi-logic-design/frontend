import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./addVendorPage.scss";
import vendorVendorApiService from "../../services/vendorVendorService";
import { IoClose } from "react-icons/io5";
import { FiChevronsLeft } from "react-icons/fi";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
];

const INITIAL_FORM = {
  vendorName: "",
  email: "",
  gst: "",
  mobile: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  status: "Active",
};

const CreateVendorPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "gst") value = value.toUpperCase();
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const validate = () => {
    if (!form.vendorName.trim()) return "Vendor name is required.";
    if (!form.mobile.trim()) return "Mobile number is required.";
    if (form.mobile.length !== 10)
      return "Enter a valid 10-digit mobile number.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Enter a valid email address.";
    if (form.pinCode && form.pinCode.length !== 6)
      return "Pin code must be 6 digits.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await vendorVendorApiService.createVendor({
        ...form,
        vendorName: form.vendorName.trim(),
        email: form.email.trim() || undefined,
        gst: form.gst.trim() || undefined,
        mobile: form.mobile.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state || undefined,
        pinCode: form.pinCode.trim() || undefined,
      });
      setSuccess("Vendor created successfully!");
      setTimeout(() => navigate("/vendor/vendors"), 1200);
    } catch (err) {
      console.error("Create vendor failed:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to create vendor. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setError("");
    setSuccess("");
  };

  return (
    <div className="create-vendor-page">
      <div className="create-vendor-header">
        <div className="sidebar-toggle" onClick={() => navigate(-1)}>
          <FiChevronsLeft />
        </div>
        <h1>
          Create Vendor <span className="version-badge">v2</span>
        </h1>
      </div>

      <div className="create-vendor-card">
        {error && <div className="form-alert form-alert--error">{error}</div>}
        {success && (
          <div className="form-alert form-alert--success">{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Basic Information</div>

          <div className="create-form-grid">
            <div className="form-group full-width">
              <label>
                Vendor Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="vendorName"
                value={form.vendorName}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Mobile No. <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="10-digit number"
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>GSTIN</label>
              <input
                type="text"
                name="gst"
                value={form.gst}
                onChange={handleChange}
                placeholder="15-character GSTIN"
                maxLength={15}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: "32px" }}>
            Address Details
          </div>

          <div className="create-form-grid">
            <div className="form-group full-width">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter full address"
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
            </div>

            <div className="form-group">
              <label>State</label>
              <select name="state" value={form.state} onChange={handleChange}>
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Pin Code</label>
              <input
                type="text"
                name="pinCode"
                value={form.pinCode}
                onChange={handleChange}
                placeholder="6-digit code"
                maxLength={6}
              />
            </div>
          </div>

          <div className="create-form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Creating..." : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVendorPage;
