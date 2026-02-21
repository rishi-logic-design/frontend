import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUndo } from "react-icons/fa";
import "./addPaymentMade.scss";

const AddPaymentMade = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const purchaseData = location.state?.purchase;

  const [paymentData, setPaymentData] = useState({
    prefix: "Prefix",
    receiptNo: "1",
    date: new Date().toISOString().split("T")[0],
    treatment: "AGAINST BILL",
    paymentMode: "",
    amount: purchaseData ? purchaseData.totalAmount : 0,
    remark: "",
    sellerName: purchaseData
      ? purchaseData.seller?.vendorName || purchaseData.Vendor?.name || ""
      : "",
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = () => {
    alert("Payment submitted successfully!");
    navigate("/vendor/payments-made");
  };

  return (
    <div className="add-payment-made-page">
      <div className="payment-form-section">
        <div className="section-header-main">
          <h2>Create Payment Made</h2>
          <div className="header-actions">
            <button className="cancel-btn" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button className="submit-btn" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>

        <div className="form-container-inner">
          <div className="back-nav">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <FaUndo />
            </button>
          </div>

          <div className="form-grid">
            <div className="form-section">
              <div className="input-group-row">
                <div className="input-field">
                  <label>Prefix</label>
                  <input type="text" value={paymentData.prefix} readOnly />
                </div>
                <div className="input-field">
                  <label>Receipt No.</label>
                  <input type="text" value={paymentData.receiptNo} readOnly />
                </div>
                <div className="input-field">
                  <label>Payment Made Date</label>
                  <input
                    type="date"
                    value={paymentData.date}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="input-field full-width">
                <label>Seller Name</label>
                <select value={paymentData.sellerName}>
                  <option>{paymentData.sellerName || "Select Seller"}</option>
                </select>
              </div>

              <div className="input-field full-width">
                <label>Enter Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: e.target.value })
                  }
                />
              </div>

              <div className="input-field full-width">
                <label>Enter Remark</label>
                <input
                  type="text"
                  placeholder="Remark"
                  value={paymentData.remark}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, remark: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-section">
              <div className="input-field full-width">
                <label>Select Treatment</label>
                <select value={paymentData.treatment}>
                  <option>AGAINST BILL</option>
                  <option>ADVANCE</option>
                </select>
              </div>
              <div className="input-field full-width">
                <label>Select Payment Mode</label>
                <select
                  value={paymentData.paymentMode}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentMode: e.target.value,
                    })
                  }
                >
                  <option value="">Choose mode of payment</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>
            </div>
          </div>

          {purchaseData && (
            <div className="unpaid-list-section">
              <div className="section-title">UNPAID PURCHASE LIST</div>
              <div className="unpaid-table-wrapper">
                <table className="unpaid-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>
                        <input type="checkbox" checked readOnly />
                      </th>
                      <th>Purchase Date</th>
                      <th>Purchase No</th>
                      <th>Total Amt</th>
                      <th>Pending Amt</th>
                      <th>Payment Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>
                        <input type="checkbox" checked readOnly />
                      </td>
                      <td>{formatDate(purchaseData.purchaseDate)}</td>
                      <td>{purchaseData.purchaseNumber}</td>
                      <td>{purchaseData.totalAmount}</td>
                      <td>
                        {(
                          purchaseData.totalAmount -
                          (purchaseData.paidAmount || 0)
                        ).toFixed(2)}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="payment-amt-input"
                          value={paymentData.amount}
                          readOnly
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="payment-summary">
                <div className="summary-row">
                  <label>Paid Against Purchase :</label>
                  <input type="text" value={paymentData.amount} readOnly />
                </div>
                <div className="summary-row">
                  <label>Advance Amount :</label>
                  <input type="text" value="0.00" readOnly />
                </div>
                <div className="summary-row total">
                  <label>Total Amount :</label>
                  <input type="text" value={paymentData.amount} readOnly />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPaymentMade;
