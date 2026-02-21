import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUndo,
  FaCheckCircle,
  FaExclamationCircle,
  FaSave,
  FaArrowLeft,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaUser,
  FaCreditCard,
  FaStickyNote,
} from "react-icons/fa";
import purchasePaymentService from "../../services/purchasePaymentService";
import vendorVendorService from "../../services/vendorVendorService";
import "./addPaymentMade.scss";

const AddPaymentMade = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPurchase = location.state?.purchase;

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [sellerOutstanding, setSellerOutstanding] = useState(0);
  const [showModal, setShowModal] = useState({
    show: false,
    success: true,
    message: "",
  });

  const [paymentData, setPaymentData] = useState({
    date: new Date().toISOString().split("T")[0],
    treatment: "AGAINST BILL",
    paymentMode: "Cash",
    amount: initialPurchase
      ? parseFloat(initialPurchase.totalAmount) -
        parseFloat(initialPurchase.paidAmount || 0)
      : 0,
    remark: "",
    sellerId: initialPurchase
      ? initialPurchase.sellerId || initialPurchase.Vendor?.id
      : "",
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (paymentData.sellerId) {
      fetchSellerDetails(paymentData.sellerId);
    } else {
      setPendingPurchases([]);
      setSellerOutstanding(0);
    }
  }, [paymentData.sellerId]);

  const fetchSellers = async () => {
    try {
      const res = await vendorVendorService.getVendors();
      setSellers(res?.data?.rows || res?.rows || res?.data || []);
    } catch (err) {
      console.error("Error fetching sellers:", err);
    }
  };

  const fetchSellerDetails = async (sellerId) => {
    try {
      const [pendingRes, outstandingRes] = await Promise.all([
        purchasePaymentService.getSellerPendingPurchases(sellerId),
        purchasePaymentService.getSellerOutstanding(sellerId),
      ]);

      const purchasesRes = pendingRes?.data || pendingRes || [];
      const outstandingData = outstandingRes?.data || outstandingRes || {};

      let purchaseList = Array.isArray(purchasesRes)
        ? purchasesRes
        : purchasesRes.rows || [];

      if (initialPurchase) {
        const alreadyInList = purchaseList.find(
          (p) => p.id === initialPurchase.id,
        );
        if (!alreadyInList) {
          purchaseList = [initialPurchase, ...purchaseList];
        }
      }

      setPendingPurchases(
        purchaseList.map((p) => {
          const isTarget = initialPurchase && p.id === initialPurchase.id;
          return {
            ...p,
            payAmount: isTarget ? paymentData.amount : 0,
          };
        }),
      );

      setSellerOutstanding(outstandingData.outstanding || 0);
    } catch (err) {
      console.error("Error fetching seller details:", err);
    }
  };

  const handleAdjustAmount = (purchaseId, value) => {
    const amount = parseFloat(value || 0);
    setPendingPurchases((prev) => {
      const updated = prev.map((p) => {
        if (p.id === purchaseId) {
          return { ...p, payAmount: amount };
        }
        return p;
      });

      const total = updated.reduce((sum, p) => sum + p.payAmount, 0);
      setPaymentData((prevData) => ({ ...prevData, amount: total }));

      return updated;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!paymentData.sellerId) {
      setShowModal({
        show: true,
        success: false,
        message: "Please select a seller",
      });
      return;
    }
    if (paymentData.amount <= 0) {
      setShowModal({
        show: true,
        success: false,
        message: "Amount must be greater than 0",
      });
      return;
    }

    try {
      setLoading(true);

      const adjustedPurchases = pendingPurchases
        .filter((p) => p.payAmount > 0)
        .map((p) => ({
          purchaseId: parseInt(p.id),
          payAmount: parseFloat(p.payAmount),
        }));

      const methodMap = {
        Cash: "cash",
        Cheque: "cheque",
        UPI: "upi",
        "Net Banking": "online",
      };

      const payload = {
        sellerId: parseInt(paymentData.sellerId),
        amount: parseFloat(paymentData.amount),
        advanceAmount:
          paymentData.treatment === "ADVANCE"
            ? parseFloat(paymentData.amount)
            : 0,
        paymentDate: paymentData.date,
        method: methodMap[paymentData.paymentMode] || "other",
        note: paymentData.remark || "",
        status: "completed",
        adjustedPurchases: adjustedPurchases,
      };

      const res = await purchasePaymentService.createPayment(payload);
      if (res.success || res.id) {
        setShowModal({
          show: true,
          success: true,
          message: "Purchase payment recorded successfully!",
        });
        setTimeout(() => navigate("/vendor/payments-made"), 2000);
      } else {
        throw new Error(res.message || "Failed to save payment");
      }
    } catch (err) {
      console.error("Error submitting payment:", err);
      setShowModal({
        show: true,
        success: false,
        message: err.message || "Failed to record payment",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-payment-made-page">
      {showModal.show && (
        <div className="custom-modal-overlay">
          <div
            className={`custom-modal ${showModal.success ? "success" : "error"}`}
          >
            <div className="modal-icon">
              {showModal.success ? <FaCheckCircle /> : <FaExclamationCircle />}
            </div>
            <h3>{showModal.success ? "Success" : "Error"}</h3>
            <p>{showModal.message}</p>
            {!showModal.success && (
              <button
                className="close-btn"
                onClick={() => setShowModal({ ...showModal, show: false })}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      <div className="page-header-container">
        <div className="header-info">
          <button className="back-btn-pill" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
          <h1>Record Purchase Payment</h1>
          <p>Settle unpaid purchase bills and track advance payments</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Discard
          </button>
          <button
            className={`btn btn-dark ${loading ? "disabled" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <FaSave /> Save Payment
              </>
            )}
          </button>
        </div>
      </div>

      <div className="main-form-card">
        <div className="form-grid">
          <div className="form-section left">
            <div className="section-title-light">
              <FaFileInvoiceDollar /> General Information
            </div>

            <div className="input-group-row">
              <div className="input-field">
                <label>Voucher Type</label>
                <input
                  type="text"
                  value="Purchase Payment"
                  readOnly
                  className="read-only-input"
                />
              </div>
              <div className="input-field">
                <label>Receipt No.</label>
                <input
                  type="text"
                  value="AUTO-GEN"
                  readOnly
                  className="read-only-input accent"
                />
              </div>
              <div className="input-field">
                <label>Payment Date</label>
                <div className="icon-input-wrapper">
                  <FaCalendarAlt className="field-icon" />
                  <input
                    type="date"
                    value={paymentData.date}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="input-field full-width">
              <label>Select Seller</label>
              <div className="icon-input-wrapper">
                <FaUser className="field-icon" />
                <select
                  value={paymentData.sellerId}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, sellerId: e.target.value })
                  }
                >
                  <option value="">Choose a seller...</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.vendorName}{" "}
                      {s.businessName ? `(${s.businessName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-field full-width">
              <label>Total Payment Amount</label>
              <div className="icon-input-wrapper">
                <span className="field-icon-text">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={paymentData.amount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value || 0);
                    setPaymentData({ ...paymentData, amount: val });
                  }}
                  className="big-amount-input"
                />
              </div>
            </div>

            <div className="input-field full-width">
              <label>Note / Remarks</label>
              <div className="icon-input-wrapper">
                <FaStickyNote className="field-icon" />
                <input
                  type="text"
                  placeholder="Payment details, reference no, etc."
                  value={paymentData.remark}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, remark: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="form-section right">
            <div className="section-title-light">
              <FaCreditCard /> Payment Settings
            </div>

            <div className="input-field full-width">
              <label>Payment Treatment</label>
              <select
                value={paymentData.treatment}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    treatment: e.target.value,
                  })
                }
              >
                <option value="AGAINST BILL">Adjust Against Bills</option>
                <option value="ADVANCE">Apply as Advance</option>
              </select>
            </div>

            <div className="input-field full-width">
              <label>Payment Mode</label>
              <select
                value={paymentData.paymentMode}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    paymentMode: e.target.value,
                  })
                }
              >
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque / DD</option>
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Net Banking">Net Banking / NEFT</option>
              </select>
            </div>

            <div className="outstanding-balance-card">
              <span className="lbl">Sellers Current Balance</span>
              <div className="val">
                ₹{" "}
                {parseFloat(sellerOutstanding).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="tag">Outstanding</div>
            </div>
          </div>
        </div>

        <div className="unpaid-bills-section">
          <div className="section-header">
            <h3>Unpaid Purchase Bills</h3>
            <span className="count-badge">
              {pendingPurchases.length} Bills Pending
            </span>
          </div>

          <div className="table-wrapper">
            <table className="unpaid-table">
              <thead>
                <tr>
                  <th width="60">No.</th>
                  <th width="60">Pay</th>
                  <th>Date</th>
                  <th>Invoice Number</th>
                  <th>Total Bill</th>
                  <th>Pending Amount</th>
                  <th width="150">This Payment</th>
                </tr>
              </thead>
              <tbody>
                {pendingPurchases.length > 0 ? (
                  pendingPurchases.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={p.payAmount > 0 ? "active-row" : ""}
                    >
                      <td>{idx + 1}</td>
                      <td>
                        <div className="custom-checkbox">
                          <input
                            type="checkbox"
                            checked={p.payAmount > 0}
                            onChange={(e) => {
                              if (!e.target.checked)
                                handleAdjustAmount(p.id, 0);
                              else
                                handleAdjustAmount(
                                  p.id,
                                  p.pendingAmount || p.totalAmount,
                                );
                            }}
                          />
                        </div>
                      </td>
                      <td>{formatDate(p.purchaseDate)}</td>
                      <td className="inv-no-cell">
                        <span>{p.purchaseNumber}</span>
                      </td>
                      <td className="amt text-muted">
                        ₹ {parseFloat(p.totalAmount).toFixed(2)}
                      </td>
                      <td className="amt text-danger">
                        ₹{" "}
                        {parseFloat(
                          p.pendingAmount ||
                            parseFloat(p.totalAmount) -
                              parseFloat(p.paidAmount || 0),
                        ).toFixed(2)}
                      </td>
                      <td>
                        <div className="pay-input-group">
                          <span>₹</span>
                          <input
                            type="number"
                            value={p.payAmount}
                            onChange={(e) =>
                              handleAdjustAmount(p.id, e.target.value)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data-msg">
                      {paymentData.sellerId
                        ? "Great! No pending bills for this seller."
                        : "Please select a seller to view pending bills."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="payment-summary-footer">
            <div className="summary-card">
              <div className="s-item">
                <label>Bill Allocation</label>
                <span>
                  ₹{" "}
                  {pendingPurchases
                    .reduce((s, p) => s + p.payAmount, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="s-item">
                <label>Advance Balance</label>
                <span className="text-accent">
                  ₹{" "}
                  {(
                    paymentData.amount -
                    pendingPurchases.reduce((s, p) => s + p.payAmount, 0)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="divider"></div>
              <div className="s-item total">
                <label>Final Payment</label>
                <span className="total-val">
                  ₹ {parseFloat(paymentData.amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentMade;
