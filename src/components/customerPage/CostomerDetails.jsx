import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import customerService from "../../services/customerService";
import "./customerDetails.scss";

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const vendorData = JSON.parse(localStorage.getItem("vendorData"));
  const vendorId = vendorData?.id;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!vendorId || !id) {
      navigate("/vendor/customer");
      return;
    }
    loadCustomer();
  }, [id, vendorId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomerById(id, vendorId);
      console.log(res);
      setData(res.data);
    } catch (err) {
      console.error(err);
      navigate("/vendor/customer");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-center">Loading...</div>;
  if (!data || !data.customer)
    return <div className="page-center">Customer not found</div>;

  const { customer, challans = [], due = 0 } = data;

  const formatAmount = (v) => Number(v || 0).toLocaleString();

  const parseAddress = (addr) => {
    if (!addr) return "No address";

    let obj = addr;

    try {
      if (typeof obj === "string") obj = JSON.parse(obj);

      if (typeof obj === "string") obj = JSON.parse(obj);
    } catch (e) {
      console.log("Address parse error:", e);
      return "No address";
    }

    if (!obj || typeof obj !== "object") return "No address";

    return [
      obj.streetNo,
      obj.houseNo,
      obj.residencyName,
      obj.officeNo,
      obj.buildingNo,
      obj.areaCity,
      obj.state,
      obj.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="customer-details-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Customer Details</h1>
      </div>

      <div className="page-content">
        <div className="details-container">
          {/* Customer Info */}
          <div className="customer-info-card">
            <div className="customer-header">
              <div className="customer-avatar">
                {customer.customerImage ? (
                  <img
                    src={customer.customerImage}
                    alt="Customer"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "";
                    }}
                  />
                ) : (
                  customer.customerName?.charAt(0)?.toUpperCase() || "👤"
                )}
              </div>

              <div className="customer-text">
                <h2 className="customer-name">
                  {customer.customerName || "N/A"}
                </h2>
                <p className="contact-person">{customer.mobileNumber || "-"}</p>
                <div className="address">
                  📍 {parseAddress(customer.homeAddress)}
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="action-btn call"
                onClick={() =>
                  customer.mobileNumber &&
                  (window.location.href = `tel:${customer.mobileNumber}`)
                }
              >
                📞 Call
              </button>

              <button className="action-btn alert">🔔 Alert</button>

              <button
                className="action-btn export"
                onClick={() => navigate(`/vendor/export-ledger/${id}`)}
              >
                📊 Export Ledger
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="summary-cards">
            <div className="summary-card">
              <p className="card-label">Price Of Product</p>
              <h3 className="card-value">
                ₹{formatAmount(customer.pricePerProduct)}
              </h3>
            </div>

            <div className="summary-card">
              <p className="card-label">Payment Due Amount</p>
              <h3 className="card-value">₹{formatAmount(due)}</h3>
            </div>
          </div>

          {/* Purchase History */}
          <div className="purchase-history-card">
            <h3 className="section-title">Purchase History</h3>

            {challans.length === 0 ? (
              <p className="empty-text">No purchase history available</p>
            ) : (
              <div className="history-list">
                {challans.map((c) => (
                  <div
                    key={c.id}
                    className="history-item"
                    onClick={() => navigate(`/challan/${c.id}`)}
                  >
                    <div className="item-info">
                      <h4 className="item-name">{c.challanNumber}</h4>
                      <p className="item-amount">
                        ₹{formatAmount(c.totalAmount)}
                      </p>
                    </div>

                    <div className="item-meta">
                      <span className="item-date">
                        {new Date(c.challanDate).toLocaleDateString()}
                      </span>
                      <span className="item-due">
                        Due: ₹{formatAmount(c.due)}
                      </span>
                      <span className={`item-status ${c.status}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
