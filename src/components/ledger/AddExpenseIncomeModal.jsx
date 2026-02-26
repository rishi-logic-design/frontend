import React, { useState } from "react";
import "./adjustBalanceModal.scss";
import { IoClose, IoChevronDownOutline } from "react-icons/io5";
import { FaRupeeSign } from "react-icons/fa";

const AddExpenseIncomeModal = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    accountName: "",
    accountType: "EXPENSE", // EXPENSE or INCOME
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
          <h2>Add Expense/Income Account</h2>
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
                    placeholder="e.g. Travel, Rent, Sales"
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
                    <option value="EXPENSE">Expense Account</option>
                    <option value="INCOME">Income Account</option>
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
                    placeholder="Optional details"
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
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseIncomeModal;
