import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import vendorGstNumberService from "../../services/vendorGstNumberService";
import "./gstNumber.scss";

const GSTNumber = () => {
  const navigate = useNavigate();

  const [gstNumber, setGstNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGst = async () => {
      try {
        setLoading(true);
        const data = await vendorGstNumberService.getGstNumber();

        if (data?.gstNumber) {
          setGstNumber(data.gstNumber);
        }
      } catch (err) {
        console.log("GST number not found yet");
      } finally {
        setLoading(false);
      }
    };

    fetchGst();
  }, []);

  const handleSave = async () => {
    if (!gstNumber.trim()) {
      setError("GST Number is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await vendorGstNumberService.saveGstNumber({
        gstNumber: gstNumber.trim(),
      });

      navigate("/vendor/account");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save GST Number");
    } finally {
      setLoading(false);
    }
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
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>GST Number</label>
          <input
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            placeholder="Enter GST Number"
            disabled={loading}
          />
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

export default GSTNumber;
