import React, { useState } from "react";
import "./adjustBalanceModal.scss"; // Reuse same styling pattern
import { IoClose, IoChevronDownOutline } from "react-icons/io5";
import { FaRupeeSign } from "react-icons/fa";

const AddBankCashModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    accountName: "",
    accountType: "BANK", // BANK or CASH
    openingBalance: "",
    description: "",
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
          <h2>Add Bank/Cash Account</h2>
          <button className="close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="main-form" style={{ marginTop: "20px" }}>
              <div className="form-group">
                <label>Account Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="accountName"
                    placeholder="Enter account name"
                    value={formData.accountName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Account Type</label>
                <div className="input-wrapper">
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    required
                  >
                    <option value="BANK">Bank Account</option>
                    <option value="CASH">Cash Account</option>
                  </select>
                  <IoChevronDownOutline className="dropdown-arrow" />
                </div>
              </div>

              <div className="form-group">
                <label>Opening Balance</label>
                <div className="input-wrapper with-icon">
                  <FaRupeeSign className="icon" />
                  <input
                    type="number"
                    name="openingBalance"
                    placeholder="0.00"
                    value={formData.openingBalance}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="description"
                    placeholder="Optional description"
                    value={formData.description}
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
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBankCashModal;
