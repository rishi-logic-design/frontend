import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiPlus } from "react-icons/fi";
import { MdAccountBalance, MdPayments } from "react-icons/md";
import { RiBankLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import { toast } from "react-toastify";
import accountService from "../../services/accountService";
import paymentService from "../../services/paymentService";
import salesDebitNoteService from "../../services/salesDebitNoteService";
import "./recordPaymentDrawer.scss";

const RecordPaymentDrawer = ({
  isOpen,
  onClose,
  data,
  type = "credit_note",
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [formData, setFormData] = useState({
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    receiptPrefix: "PR",
    receiptNo: "1",
    accountId: "",
    note: "",
    applyTds: false,
    tdsAmount: 0,
  });

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      if (data) {
        setFormData({
          ...formData,
          amount: data.totalAmount || data.finalAmount || 0,
          receiptNo: data.noteNumber || data.invoiceNo || "1",
        });
      }
    }
  }, [isOpen, data]);

  const fetchAccounts = async () => {
    try {
      const res = await accountService.getAccounts();
      setAccounts(res?.data || (Array.isArray(res) ? res : []));
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleModeChange = (mode) => {
    setPaymentMode(mode);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.accountId) return toast.error("Please select an account");
    if (formData.amount <= 0)
      return toast.error("Amount must be greater than 0");

    try {
      setLoading(true);

      if (type === "sales_debit_note") {
        const payload = {
          salesDebitNoteId: data._id || data.id,
          amount: parseFloat(formData.amount),
          paymentDate: formData.date,
          method: paymentMode.toLowerCase(),
          accountId: formData.accountId,
          note: formData.note,
          reference: `${formData.receiptPrefix}-${formData.receiptNo}`,
          receiptNumber: `${formData.receiptPrefix}-${formData.receiptNo}`,
        };
        await salesDebitNoteService.recordPayment(payload);
      } else {
        const payload = {
          customerId:
            data.customerId || data.customer?._id || data.customer?.id,
          type: "credit",
          subType: "customer",
          amount: parseFloat(formData.amount),
          paymentDate: formData.date,
          method: paymentMode.toLowerCase(),
          accountId: formData.accountId,
          note: formData.note,
          tdsAmount: formData.applyTds ? parseFloat(formData.tdsAmount) : 0,
          reference: `${type.toUpperCase()}: ${formData.receiptPrefix}-${formData.receiptNo}`,
          adjustedInvoices: [
            {
              billId: data._id || data.id,
              payAmount: parseFloat(formData.amount),
            },
          ],
        };
        await paymentService.createPayment(payload);
      }

      toast.success("Payment recorded successfully!");
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const totalInvoiceAmount = data?.totalAmount || data?.finalAmount || 0;
  const newBalance = (data?.customer?.balance || 0) - formData.amount;

  return (
    <div
      className={`record-payment-drawer-overlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
    >
      <div
        className={`record-payment-drawer ${isOpen ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h2>Record Payment for {data?.noteNumber || data?.invoiceNo}</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="drawer-body">
          <div className="form-section">
            <label>Buyer Name</label>
            <div className="input-wrapper disabled-wrapper">
              <input
                type="text"
                value={
                  data?.customerName || data?.customer?.customerName || "N/A"
                }
                disabled
              />
              <div className="input-icon-right balance-badge">
                <span className="balance-icon">₹</span>
                <span className="balance-val">
                  {data?.customer?.balance?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>Prefix</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="receiptPrefix"
                  value={formData.receiptPrefix}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-section">
              <label>Receipt No.</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="receiptNo"
                  value={formData.receiptNo}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <div className="label-with-hint">
                <label>Pay Amount</label>
                <span className="label-hint">
                  Total Invoice Amount: {totalInvoiceAmount}
                </span>
              </div>
              <div className="input-wrapper">
                <div className="currency-prefix">₹</div>
                <input
                  type="number"
                  name="amount"
                  className="with-prefix"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-section">
              <label>Date</label>
              <div className="input-wrapper">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <label>Payment Mode</label>
            <div className="payment-modes">
              {[
                { id: "Cash", icon: <RiMoneyDollarCircleLine /> },
                { id: "Cheque", icon: <MdPayments /> },
                { id: "Bank", icon: <RiBankLine /> },
                { id: "UPI", icon: <MdAccountBalance /> },
              ].map((mode) => (
                <div
                  key={mode.id}
                  className={`mode-tag ${paymentMode === mode.id ? "active" : ""}`}
                  onClick={() => handleModeChange(mode.id)}
                >
                  {mode.icon} {mode.id}
                </div>
              ))}
              <div className="mode-tag add-mode">
                <FiPlus /> Add Payment Mode
              </div>
            </div>
          </div>

          <div className="form-section">
            <label>
              Select Account <span className="req">*</span>
            </label>
            <div className="input-wrapper">
              <select
                name="accountId"
                value={formData.accountId}
                onChange={handleInputChange}
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.accountType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <label>Note/Remark</label>
            <div className="input-wrapper">
              <textarea
                name="note"
                rows="3"
                placeholder="Enter Notes/Remark"
                maxLength="255"
                value={formData.note}
                onChange={handleInputChange}
              />
              <div className="textarea-char-count">
                {formData.note.length} / 255
              </div>
            </div>
          </div>

          <div className="toggle-section">
            <span style={{ fontSize: "13px", color: "#666", fontWeight: 600 }}>
              Tax Deducted?
            </span>
          </div>
          <div className="toggle-section" style={{ marginTop: "8px" }}>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="applyTds"
                checked={formData.applyTds}
                onChange={handleInputChange}
              />
              <span className="slider"></span>
            </label>
            <span style={{ fontWeight: 700 }}>Yes, Apply TDS</span>
          </div>

          {formData.applyTds && (
            <div className="form-section" style={{ marginTop: "16px" }}>
              <label>TDS Amount</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  name="tdsAmount"
                  value={formData.tdsAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div className="summary-area">
            <div className="summary-item">
              <div className="label">Paid against Invoice</div>
              <div className="value">₹ {formData.amount || 0}</div>
            </div>
            <div className="summary-item">
              <div className="label">TDS Amount</div>
              <div className="value">
                ₹ {formData.applyTds ? formData.tdsAmount : 0}
              </div>
            </div>
            <div className="summary-item">
              <div className="label">New party balance</div>
              <div className="value negative">
                ₹ {newBalance?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <div className="status-badge">
            <FiCheck /> Full Payment
          </div>
          <button
            className="record-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentDrawer;
