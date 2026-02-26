import React, { useState } from "react";
import "./adjustBalanceModal.scss"; // Using same base styles
import { IoClose, IoChevronDownOutline } from "react-icons/io5";
import { FaRupeeSign } from "react-icons/fa";

const ContraEntryModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    voucherNumber: "",
    fromAccount: "",
    toAccount: "",
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
          <h2>Contra Entry (Bank/Cash Transfer)</h2>
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
                  placeholder="Voucher No."
                  value={formData.voucherNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="main-form" style={{ marginTop: "10px" }}>
              <div className="form-group">
                <label>Transfer Money From</label>
                <div className="input-wrapper">
                  <select
                    name="fromAccount"
                    value={formData.fromAccount}
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
                <label>Transfer Money To</label>
                <div className="input-wrapper">
                  <select
                    name="toAccount"
                    value={formData.toAccount}
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
                <label>Transfer Amount</label>
                <div
                  className="input-wrapper with-icon"
                  style={{ borderColor: "#f1c40f" }}
                >
                  <FaRupeeSign className="icon" />
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter Amount"
                    style={{ border: "none", background: "#fff9e6" }}
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

export default ContraEntryModal;
