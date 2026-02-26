import React, { useState } from "react";
import "./accountModal.scss";
import { IoClose } from "react-icons/io5";

const AccountModal = ({ isOpen, onClose, onConfirm }) => {
  const [accountType, setAccountType] = useState("BANK");
  const [formData, setFormData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    accountName: "",
    branchName: "",
    openingBalance: "0",
    openingBalanceDate: new Date().toISOString().split("T")[0],
    ibanNumber: "",
    swiftCode: "",
    description: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ ...formData, type: accountType });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Account</h2>
          <button className="close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="type-selector">
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="BANK">BANK</option>
                <option value="CASH">CASH</option>
              </select>
            </div>

            {accountType === "BANK" ? (
              <div className="form-grid">
                <div className="input-box">
                  <label>Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    placeholder="Enter Account holder Name"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    placeholder="Account Number"
                    value={formData.accountNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box full-width">
                  <label>IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    placeholder="Enter Ifsc Code"
                    value={formData.ifscCode}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box">
                  <label>Account name *</label>
                  <input
                    type="text"
                    name="accountName"
                    placeholder="Enter Account Name"
                    value={formData.accountName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-box">
                  <label>Account Branch Name</label>
                  <input
                    type="text"
                    name="branchName"
                    placeholder="Enter Branch Name"
                    value={formData.branchName}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box">
                  <label>Account Opening Balance</label>
                  <input
                    type="number"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box">
                  <label>Account opening balance date</label>
                  <input
                    type="date"
                    name="openingBalanceDate"
                    value={formData.openingBalanceDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="other-options-divider">Other Options</div>

                <div className="input-box full-width">
                  <label>IBAN Number</label>
                  <input
                    type="text"
                    name="ibanNumber"
                    placeholder="Enter IBAN Number"
                    value={formData.ibanNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box full-width">
                  <label>Swift Code</label>
                  <input
                    type="text"
                    name="swiftCode"
                    placeholder="Enter Swift Code"
                    value={formData.swiftCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div className="input-box full-width">
                  <label>Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    placeholder="Enter Account Name"
                    value={formData.accountName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-box full-width">
                  <label>Account Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter Description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box">
                  <label>Account Opening Balance</label>
                  <input
                    type="number"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-box">
                  <label>Account opening balance date</label>
                  <input
                    type="date"
                    name="openingBalanceDate"
                    value={formData.openingBalanceDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;
