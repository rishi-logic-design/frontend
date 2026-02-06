import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./billDetails.scss";
import billService from "../../services/billService";

const BillDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchBillDetails();
  }, [id]);

  useEffect(() => {
    if (location.state?.refresh) {
      console.log("🔄 Refreshing bill data...");
      fetchBillDetails();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchBillDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("📥 Fetching bill details for ID:", id);
      const data = await billService.getBillById(id);
      console.log("✅ Bill data received:", data);
      setBillData(data);
    } catch (error) {
      console.error("❌ Failed to fetch bill details:", error);
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
      link.download = `bill_${billData?.bill?.billNumber || billData?.billNumber || id}.pdf`;
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
    const customerId =
      billData?.bill?.customer?.id || billData?.bill?.customerId;
    console.log("🔗 Navigating to payment with:", { billId: id, customerId });
    navigate(
      `/vendor/add-payment?billId=${id}&type=bill&customerId=${customerId}`,
    );
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

  const customer = billData.bill?.customer || {};
  const items = billData.bill?.items || [];

  const totalAmount = parseFloat(
    billData.bill?.totalWithGST ||
      billData.bill?.totalAmount ||
      billData.totalAmount ||
      0,
  );

  const paidAmount = parseFloat(
    billData.bill?.paidAmount || billData.paidAmount || 0,
  );

  const pendingAmount = parseFloat(
    billData.bill?.pendingAmount ||
      billData.pendingAmount ||
      totalAmount - paidAmount,
  );

  const status = billData.bill?.status || billData.status || "pending";
  const subtotal = parseFloat(
    billData.bill?.subtotal || billData.bill?.totalWithoutGST || 0,
  );
  const gst = parseFloat(billData.bill?.gstTotal || billData.gst || 0);

  // Get invoice number (could be from billNumber or invoiceNumber field)
  const invoiceNumber =
    billData.bill?.invoiceNumber ||
    billData.bill?.billNumber ||
    billData.billNumber ||
    id;

  console.log("💰 Bill Amounts:", {
    totalAmount,
    paidAmount,
    pendingAmount,
    status,
    invoiceNumber,
  });

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
          {/* Header Card with Invoice Number */}
          <div className="header-card">
            <div className="header-info">
              <div className="invoice-number-badge">
                <span className="invoice-label">Invoice #</span>
                <h2 className="invoice-number">{invoiceNumber}</h2>
              </div>
              <span className={`status-badge ${status.toLowerCase()}`}>
                {status === "paid"
                  ? "Paid"
                  : status === "partial"
                    ? "Partially Paid"
                    : "Pending"}
              </span>
            </div>
            <div className="amount-section">
              <p className="amount-label">
                {status === "paid" ? "Total Amount" : "Pending Amount"}
              </p>
              <h3 className="amount-value">
                ₹
                {(status === "paid"
                  ? totalAmount
                  : pendingAmount
                ).toLocaleString()}
              </h3>
              {status !== "paid" && paidAmount > 0 && (
                <p className="paid-info">
                  Paid: ₹{paidAmount.toLocaleString()} of ₹
                  {totalAmount.toLocaleString()}
                </p>
              )}
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
                      <tr key={item._id || item.id || index}>
                        <td>
                          <span className="item-number">{index + 1}.</span>{" "}
                          {item.description || item.itemName || "N/A"}
                        </td>
                        <td>
                          {item.quantity || item.qty || 0}
                          {item.unit ? ` ${item.unit}` : ""}
                        </td>
                        <td>
                          ₹
                          {parseFloat(
                            item.rate || item.price || 0,
                          ).toLocaleString()}
                        </td>
                        <td>
                          ₹
                          {parseFloat(
                            item.amount || item.total || 0,
                          ).toLocaleString()}
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
            <h3 className="card-title">Payment Summary</h3>
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
                    GST ({billData.bill?.gstPercentage || 18}%):
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
              {paidAmount > 0 && (
                <>
                  <div className="payment-row paid">
                    <span className="payment-label">Paid Amount:</span>
                    <span className="payment-value">
                      ₹{paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="payment-row pending">
                    <span className="payment-label">Pending Amount:</span>
                    <span className="payment-value">
                      ₹{pendingAmount.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
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
