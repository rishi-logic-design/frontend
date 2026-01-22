import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./addPayment.scss";

const AddPayment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    creditDebit: "",
    customer: "",
    address: "",
    gstin: "",
    totalOutstanding: 50000,
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "",
    remark: "",
    attachment: null,
  });

  const [invoices, setInvoices] = useState([
    {
      id: 1,
      billNo: "1001",
      invoiceDate: "15 may 2025",
      totalAmount: 30000,
      payAmount: "",
      pendingAmount: 0,
      selected: false,
    },
    {
      id: 2,
      billNo: "1012",
      invoiceDate: "12 August 2025",
      totalAmount: 100000,
      payAmount: 80000,
      pendingAmount: 20000,
      selected: true,
    },
  ]);

  const [adjustmentAmount, setAdjustmentAmount] = useState(20000);
  const [outstandingAfterAdjustment, setOutstandingAfterAdjustment] =
    useState(30000);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInvoiceToggle = (id) => {
    setInvoices(
      invoices.map((invoice) =>
        invoice.id === id
          ? { ...invoice, selected: !invoice.selected }
          : invoice,
      ),
    );
  };

  const handlePayAmountChange = (id, value) => {
    setInvoices(
      invoices.map((invoice) =>
        invoice.id === id
          ? {
              ...invoice,
              payAmount: value,
              pendingAmount: invoice.totalAmount - (Number(value) || 0),
            }
          : invoice,
      ),
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      attachment: file,
    }));
  };

  const handleSave = () => {
    const paymentData = {
      ...formData,
      selectedInvoices: invoices.filter((inv) => inv.selected),
      adjustmentAmount,
      outstandingAfterAdjustment,
    };
    console.log("Payment Data:", paymentData);
    // Add your payment save logic here
  };

  return (
    <div className="add-payment-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Create Credit/Debit</h1>
      </div>

      <div className="page-content">
        <div className="payment-form">
          {/* Basic Info Section */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="creditDebit">Credit/Debit</label>
              <select
                id="creditDebit"
                name="creditDebit"
                value={formData.creditDebit}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Credit/Debit type</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customer">Customer</label>
              <select
                id="customer"
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Shiva Raha Houser</option>
                <option value="customer1">Customer 1</option>
                <option value="customer2">Customer 2</option>
                <option value="customer3">Customer 3</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="25, Nasan Road, Surat, Gujarat"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gstin">GSTIN/PAN</label>
              <input
                type="text"
                id="gstin"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                placeholder="22AHCQR1234F1Z5"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalOutstanding">Total Outstanding</label>
                <input
                  type="number"
                  id="totalOutstanding"
                  name="totalOutstanding"
                  value={formData.totalOutstanding}
                  onChange={handleInputChange}
                  className="form-input"
                  readOnly
                />
              </div>

              <div className="form-group">
                <label htmlFor="paymentDate">Payment Date</label>
                <input
                  type="date"
                  id="paymentDate"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter your Amount"
                className="form-input"
              />
            </div>
          </div>

          {/* Invoices Section */}
          <div className="invoices-section">
            <h3 className="section-subtitle">Free payment as Invoice:</h3>
            <div className="invoices-list">
              {invoices.map((invoice) => (
                <label key={invoice.id} className="invoice-card">
                  <input
                    type="checkbox"
                    checked={invoice.selected}
                    onChange={() => handleInvoiceToggle(invoice.id)}
                    className="invoice-checkbox"
                  />
                  <div className="invoice-info">
                    <div className="invoice-row">
                      <span className="invoice-label">Bill No:</span>
                      <span className="invoice-value">{invoice.billNo}</span>
                    </div>
                    <div className="invoice-row">
                      <span className="invoice-label">Invoice Date:</span>
                      <span className="invoice-value">
                        {invoice.invoiceDate}
                      </span>
                    </div>
                    <div className="invoice-row">
                      <span className="invoice-label">Total Amount:</span>
                      <span className="invoice-value">
                        ₹{invoice.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="invoice-row">
                      <span className="invoice-label">Pay Amount:</span>
                      <input
                        type="number"
                        value={invoice.payAmount}
                        onChange={(e) =>
                          handlePayAmountChange(invoice.id, e.target.value)
                        }
                        className="pay-amount-input"
                        placeholder="0"
                      />
                    </div>
                    <div className="invoice-row pending">
                      <span className="invoice-label">Pending Amount:</span>
                      <span className="invoice-value pending-value">
                        ₹ {invoice.pendingAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Adjustment Section */}
          <div className="adjustment-section">
            <div className="adjustment-row">
              <span className="adjustment-label">
                Amount Adjustment with Invoice:
              </span>
              <span className="adjustment-value">
                ₹{adjustmentAmount.toLocaleString()}
              </span>
            </div>
            <div className="adjustment-row">
              <span className="adjustment-label">
                Outstanding after Adjustment Invoice:
              </span>
              <span className="adjustment-value">
                ₹{outstandingAfterAdjustment.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="remark">Remark</label>
              <textarea
                id="remark"
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Enter your Remark (Optional)"
                className="form-input textarea"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="attachment">Attachment</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="attachment"
                  onChange={handleFileUpload}
                  className="file-input"
                  accept="image/*,.pdf"
                />
                <label htmlFor="attachment" className="file-label">
                  <span className="upload-icon">📎</span>
                  <span className="upload-text">
                    {formData.attachment
                      ? formData.attachment.name
                      : "Click to Upload"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPayment;
