import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <input
            type="text"
            name="firmName"
            value={formData.firmName}
            onChange={handleChange}
            placeholder="Firm Name *"
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              placeholder="Office No. / Address Line 1"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              placeholder="Building No. / Address Line 2"
            />
          </div>
        </div>

        <div className="form-group">
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Area / City *"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <select name="state" value={formData.state} onChange={handleChange}>
              <option value="">State *</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi</option>
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
            disabled={loading}
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

export default FirmAddress;
