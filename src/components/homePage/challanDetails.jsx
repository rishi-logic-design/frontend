import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./challanDetails.scss";
import challanService from "../../services/challanService";

const ChallanDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [challanData, setChallanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchChallanDetails();
  }, [id]);

  const fetchChallanDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await challanService.getChallanById(id);
      console.log(data);
      setChallanData(data);
    } catch (error) {
      console.error("Failed to fetch challan details", error);
      setError("Failed to load challan details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (sending) return;

    setSending(true);
    try {
      await challanService.sendWhatsAppReminder(id);
      alert("Payment reminder sent successfully!");
    } catch (error) {
      console.error("Failed to send reminder", error);
      alert("Failed to send reminder. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await challanService.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `challan_${challanData?.challanNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleRecordPayment = () => {
    navigate(`/vendor/record-payment/${id}?type=challan`);
  };

  if (loading) {
    return (
      <div className="challan-details-page">
        <div className="loading-state">
          <p>Loading challan details...</p>
        </div>
      </div>
    );
  }

  if (error || !challanData) {
    return (
      <div className="challan-details-page">
        <div className="error-state">
          <p>{error || "Challan not found"}</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }
  const formatAddress = (address) => {
    if (!address) return "Address not provided";

    try {
      const addr = typeof address === "string" ? JSON.parse(address) : address;

      const parts = [
        addr.houseNo,
        addr.streetNo,
        addr.residencyName,
        addr.areaCity,
        addr.state,
        addr.pincode,
      ].filter(Boolean);

      return parts.join(", ");
    } catch {
      return address;
    }
  };

  const customer = challanData.challan.customer || {};
  console.log(customer);
  const items = challanData.challan.items || [];
  const subtotal = Number(
    challanData.challan.subtotal ?? challanData.challan.totalWithoutGST ?? 0,
  );

  const totalAmount = Number(
    challanData.challan.totalWithGST ??
      challanData.challan.totalWithoutGST ??
      challanData.due ??
      0,
  );
  const status =
    challanData.challan.status || challanData.paymentStatus ;
  const gst = challanData.challan.gst || 0;

  return (
    <div className="challan-details-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Challan Details</h1>
      </div>

      <div className="page-content">
        <div className="details-container">
          {/* Header Card */}
          <div className="header-card">
            <div className="header-info">
              <h2 className="challan-number">
                #{challanData.challanNumber || challanData.challanNo || id}
              </h2>
              <span className={`status-badge ${status.toLowerCase()}`}>
                {status === "paid" ? "Paid" : "Unpaid"}
              </span>
            </div>
            <div className="amount-section">
              <p className="amount-label">Total Amount Due</p>
              <h3 className="amount-value">₹{subtotal.toLocaleString()}</h3>
            </div>
            {status !== "paid" && (
              <button
                className="reminder-btn"
                onClick={handleSendReminder}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Payment Reminder"}
              </button>
            )}
          </div>

          {/* Customer Details Card */}
          <div className="customer-card">
            <h3 className="card-title">{customer.customerName || "N/A"}</h3>
            <p className="company-name">
              {customer.company || customer.businessName || "N/A"}
            </p>
            <div className="customer-info">
              <div className="info-row">
                <span className="info-icon">📍</span>
                <span className="info-text">
                  {formatAddress(customer.homeAddress)}
                </span>
              </div>
              {customer.gstNumber && (
                <div className="info-row">
                  <span className="info-label">GSTIN:</span>
                  <span className="info-value">{customer.gstNumber}</span>
                </div>
              )}
              {customer.mobileNumber && (
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{customer.mobileNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="items-card">
              <div className="table-responsive">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty/Unit</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item._id || index}>
                        <td>
                          <span className="item-number">{index + 1}.</span>{" "}
                          {item.name || item.productName || "N/A"}
                        </td>
                        <td>
                          {item.quantity || item.qty || 0}
                          {item.unit || ""}
                        </td>
                        <td>
                          ₹
                          {(
                            item.rate ||
                            item.pricePerUnit ||
                            0
                          ).toLocaleString()}
                        </td>
                        <td>
                          ₹{(item.amount || item.total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Summary Card */}
          <div className="payment-card">
            <h3 className="card-title">Payment</h3>
            <div className="payment-details">
              <div className="payment-row">
                <span className="payment-label">Subtotal:</span>
                <span className="payment-value">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
              {gst > 0 && (
                <div className="payment-row">
                  <span className="payment-label">GST:</span>
                  <span className="payment-value">₹{gst.toLocaleString()}</span>
                </div>
              )}
              <div className="payment-row total">
                <span className="payment-label">Total Amount:</span>
                <span className="payment-value">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="download-btn" onClick={handleDownloadPDF}>
              Download PDF
            </button>
            {status !== "paid" && (
              <button className="record-btn" onClick={handleRecordPayment}>
                Record Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanDetails;
