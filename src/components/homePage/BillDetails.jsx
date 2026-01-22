import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./billDetails.scss";
import billService from "../../services/billService";

const BillDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchBillDetails();
  }, [id]);

  const fetchBillDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billService.getBillById(id);
      console.log(data);
      setBillData(data);
    } catch (error) {
      console.error("Failed to fetch bill details", error);
      setError("Failed to load bill details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (sending) return;

    setSending(true);
    try {
      await billService.sendWhatsAppReminder(id);
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
      const blob = await billService.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bill_${billData?.billNumber || id}.pdf`;
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
    navigate(`/vendor/record-payment/${id}?type=bill`);
  };
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
    } catch (e) {
      // agar JSON parse fail ho jaye
      return address;
    }
  };

  if (loading) {
    return (
      <div className="bill-details-page">
        <div className="loading-state">
          <p>Loading bill details...</p>
        </div>
      </div>
    );
  }

  if (error || !billData) {
    return (
      <div className="bill-details-page">
        <div className="error-state">
          <p>{error || "Bill not found"}</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const customer = billData.bill.customer || {};
  const items = billData.bill.items || [];
  console.log(items);
  const totalAmount = billData.totalAmount || billData.total || 0;
  const status = billData.bill.status || billData.paymentStatus || "unpaid";
  const subtotal = billData.bill.subtotal || 0;
  const gst = billData.gst || billData.tax || 0;

  return (
    <div className="bill-details-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Bill Details</h1>
      </div>

      <div className="page-content">
        <div className="details-container">
          {/* Header Card */}
          <div className="header-card">
            <div className="header-info">
              <h2 className="bill-number">
                #{billData.billNumber || billData.billNo || id}
              </h2>
              <span className={`status-badge ${status.toLowerCase()}`}>
                {status === "paid" ? "Paid" : "pending"}
              </span>
            </div>
            <div className="amount-section">
              <p className="amount-label">Total Amount Due</p>
              <h3 className="amount-value">₹{totalAmount.toLocaleString()}</h3>
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
                          {item.description || item.itemName || "N/A"}
                        </td>
                        <td>
                          {item.quantity || item.qty || 0}
                          {item.unit || ""}
                        </td>
                        <td>
                          ₹{(item.rate || item.price || 0).toLocaleString()}
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
                <span className="payment-label">Subtotal (without GST):</span>
                <span className="payment-value">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
              {gst > 0 && (
                <div className="payment-row">
                  <span className="payment-label">
                    GST ({billData.gstPercentage || 18}%):
                  </span>
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

export default BillDetails;
