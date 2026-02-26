import React, { useState } from "react";
import "./adjustBalanceModal.scss";
import { IoClose, IoChevronDownOutline } from "react-icons/io5";
import { FaRupeeSign } from "react-icons/fa";

const AdjustBalanceModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    voucherNumber: "",
    type: "add",
    bank: "",
    amount: "",
    remark: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="adjust-balance-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Adjust Balance</h2>
          <button className="close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="top-section">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Voucher Number</label>
                <input
                  type="text"
                  name="voucherNumber"
                  placeholder=".........................................."
                  value={formData.voucherNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="selection-section">
              <div
                className={`selection-card ${formData.type === "add" ? "active" : ""}`}
                onClick={() => setFormData((p) => ({ ...p, type: "add" }))}
              >
                <div
                  className={`radio-circle ${formData.type === "add" ? "checked" : ""}`}
                />
                <span className="add-text">₹ Add Money</span>
              </div>
              <div
                className={`selection-card ${formData.type === "withdraw" ? "active" : ""}`}
                onClick={() => setFormData((p) => ({ ...p, type: "withdraw" }))}
              >
                <div
                  className={`radio-circle ${formData.type === "withdraw" ? "checked" : ""}`}
                />
                <span className="withdraw-text">₹ Withdraw Money</span>
              </div>
            </div>

            <div className="main-form">
              <div className="form-group">
                <label>
                  {formData.type === "add"
                    ? "Add Money In"
                    : "Withdraw Money From"}
                </label>
                <div className="input-wrapper">
                  <select
                    name="bank"
                    value={formData.bank}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Bank</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="SBI Bank">SBI Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                  <IoChevronDownOutline className="dropdown-arrow" />
                </div>
              </div>

              <div className="form-group">
                <label>
                  {formData.type === "add" ? "Add Amount" : "Withdraw Amount"}
                </label>
                <div className="input-wrapper with-icon">
                  <FaRupeeSign className="icon" />
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter Amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Remark</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="remark"
                    placeholder="Add a remark"
                    value={formData.remark}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="confirm-btn">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustBalanceModal;
