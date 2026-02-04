import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./addPayment.scss";
import customerService from "../../services/customerService";
import paymentService from "../../services/paymentService";
import { uploadPaymentAttachment } from "../../utils/firebaseStorage";
import { useNotifications } from "../../context/NotificationContext";

const AddPayment = () => {
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: "",
    subType: "",
    customerId: "",
    homeAddress: "",
    gstNumber: "",
    totalOutstanding: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    method: "",
    reference: "",
    note: "",
    attachmentFile: null,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    chequeNumber: "",
    chequeDate: "",
    chequeBankName: "",
    adjustedInvoices: [],
  });

  const [customers, setCustomers] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const vendorData = JSON.parse(localStorage.getItem("vendorData"));
    const vendorId = vendorData?.id;
    try {
      const response = await customerService.getCustomers(vendorId);
      let customerList = [];

      if (response?.data?.rows && Array.isArray(response.data.rows)) {
        customerList = response.data.rows;
      } else if (response?.rows && Array.isArray(response.rows)) {
        customerList = response.rows;
      } else if (Array.isArray(response)) {
        customerList = response;
      }
      console.log(response);
      setCustomers(customerList);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCustomerChange = async (e) => {
    const customerId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      customerId,
      adjustedInvoices: [], // Reset adjusted invoices
    }));

    if (!customerId) {
      setSelectedCustomerData(null);
      setPendingInvoices([]);
      setFormData((prev) => ({
        ...prev,
        address: "",
        gstNumber: "",
        totalOutstanding: 0,
      }));
      return;
    }

    try {
      setLoadingInvoices(true);

      // Fetch customer details
      const customerResponse =
        await customerService.getCustomerById(customerId);
      const customerData = customerResponse.data || customerResponse;

      setSelectedCustomerData(customerData);

      // Auto-fill address and GST
      const address =
        customerData.officeAddress?.address ||
        customerData.homeAddress?.address ||
        customerData.address ||
        "";
      const gstNumber = customerData.gstNumber || "";

      // Fetch outstanding and pending invoices in parallel
      const [outstandingResponse, invoicesResponse] = await Promise.all([
        paymentService.getCustomerOutstanding(customerId),
        paymentService.getCustomerPendingInvoices(customerId),
      ]);

      console.log("Outstanding response:", outstandingResponse);
      console.log("Invoices response:", invoicesResponse);

      const outstanding = parseFloat(
        outstandingResponse.outstanding ||
          outstandingResponse.totalOutstanding ||
          0,
      );
      const invoices = invoicesResponse.invoices || [];

      setFormData((prev) => ({
        ...prev,
        address,
        gstNumber,
        totalOutstanding: outstanding,
      }));

      setPendingInvoices(invoices);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      alert("Failed to fetch customer details. Please try again.");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleInvoiceAmountChange = (invoiceId, payAmount) => {
    const amount = parseFloat(payAmount) || 0;

    setFormData((prev) => {
      const existingIndex = prev.adjustedInvoices.findIndex(
        (inv) => inv.billId === invoiceId,
      );

      let newAdjustedInvoices;
      if (amount === 0) {
        // Remove if amount is 0
        newAdjustedInvoices = prev.adjustedInvoices.filter(
          (inv) => inv.billId !== invoiceId,
        );
      } else if (existingIndex !== -1) {
        // Update existing
        newAdjustedInvoices = [...prev.adjustedInvoices];
        newAdjustedInvoices[existingIndex] = {
          billId: invoiceId,
          payAmount: amount,
        };
      } else {
        // Add new
        newAdjustedInvoices = [
          ...prev.adjustedInvoices,
          { billId: invoiceId, payAmount: amount },
        ];
      }

      return {
        ...prev,
        adjustedInvoices: newAdjustedInvoices,
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        attachmentFile: file,
      }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      attachmentFile: null,
    }));
    const fileInput = document.getElementById("attachment");
    if (fileInput) fileInput.value = "";
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate type
    if (!formData.type) {
      newErrors.type = "Payment type (Credit/Debit) is required";
    }

    // Validate subType
    if (!formData.subType) {
      newErrors.subType = "Sub-type is required";
    }

    // Validate customer for customer payments
    if (formData.subType === "customer" && !formData.customerId) {
      newErrors.customerId = "Customer is required";
    }

    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    // Validate payment date
    if (!formData.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    }

    // Validate payment method
    if (!formData.method) {
      newErrors.method = "Payment method is required";
    }

    // Method-specific validation
    if (formData.method === "bank") {
      if (!formData.bankName) newErrors.bankName = "Bank name is required";
      if (!formData.accountNumber)
        newErrors.accountNumber = "Account number is required";
      if (!formData.ifscCode) newErrors.ifscCode = "IFSC code is required";
    }

    if (formData.method === "upi" || formData.method === "online") {
      if (!formData.upiId) newErrors.upiId = "UPI ID is required";
    }

    if (formData.method === "cheque") {
      if (!formData.chequeNumber)
        newErrors.chequeNumber = "Cheque number is required";
      if (!formData.chequeDate)
        newErrors.chequeDate = "Cheque date is required";
      if (!formData.chequeBankName)
        newErrors.chequeBankName = "Bank name is required";
    }

    // Validate adjusted invoices total matches payment amount
    if (formData.adjustedInvoices.length > 0) {
      const totalAdjusted = formData.adjustedInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.payAmount || 0),
        0,
      );
      const paymentAmount = parseFloat(formData.amount);

      if (Math.abs(totalAdjusted - paymentAmount) > 0.01) {
        newErrors.adjustedInvoices =
          "Total adjusted amount must equal payment amount";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the errors before submitting");
      return;
    }

    try {
      setLoading(true);

      let attachmentUrl = null;
      if (formData.attachmentFile) {
        try {
          attachmentUrl = await uploadPaymentAttachment(
            formData.attachmentFile,
          );
        } catch (uploadError) {
          console.error("Error uploading attachment:", uploadError);
          if (
            !window.confirm("Failed to upload attachment. Continue without it?")
          ) {
            setLoading(false);
            return;
          }
        }
      }

      const paymentData = {
        customerId: formData.customerId || null,
        type: formData.type,
        subType: formData.subType,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        method: formData.method,
        reference: formData.reference || null,
        note: formData.note || null,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        status: "completed",
      };

      if (formData.method === "bank") {
        paymentData.bankName = formData.bankName;
        paymentData.accountNumber = formData.accountNumber;
        paymentData.ifscCode = formData.ifscCode;
      }

      if (formData.method === "upi" || formData.method === "online") {
        paymentData.upiId = formData.upiId;
      }

      if (formData.method === "cheque") {
        paymentData.chequeNumber = formData.chequeNumber;
        paymentData.chequeDate = formData.chequeDate;
        paymentData.chequeBankName = formData.chequeBankName;
      }

      if (formData.adjustedInvoices.length > 0) {
        paymentData.adjustedInvoices = formData.adjustedInvoices;
      }

      console.log("Submitting payment data:", paymentData);

      const response = await paymentService.createPayment(paymentData);

      console.log("Payment created successfully:", response);
      await fetchNotifications();

      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/vendor/home", { state: { refresh: true } });
      }, 2000);
    } catch (error) {
      console.error("Error creating payment:", error);
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        "Failed to create payment";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const getTotalAdjustedAmount = () => {
    return formData.adjustedInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.payAmount || 0),
      0,
    );
  };

  return (
    <div className="add-payment-page">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#10B981" />
                <path
                  d="M8 12l3 3 5-6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Payment Successful!</h2>
            <p>Your payment has been recorded successfully</p>
          </div>
        </div>
      )}

      <div className="payment-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>Add Payment</h1>
      </div>

      <div className="payment-form-container">
        <form onSubmit={handleSubmit} className="payment-form">
          {/* Credit/Debit Type */}
          <div className="form-group">
            <label htmlFor="type">Payment Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={errors.type ? "error" : ""}
              required
            >
              <option value="">Select Payment Type</option>
              <option value="credit">Credit (Money Received)</option>
              <option value="debit">Debit (Money Paid)</option>
            </select>
            {errors.type && (
              <span className="error-message">{errors.type}</span>
            )}
          </div>

          {/* Sub Type */}
          <div className="form-group">
            <label htmlFor="subType">Sub Type *</label>
            <select
              id="subType"
              name="subType"
              value={formData.subType}
              onChange={handleInputChange}
              className={errors.subType ? "error" : ""}
              required
            >
              <option value="">Select Sub Type</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="cash-deposit">Cash Deposit</option>
              <option value="cash-withdrawal">Cash Withdrawal</option>
              <option value="bank-charges">Bank Charges</option>
              <option value="electricity-bill">Electricity Bill</option>
              <option value="miscellaneous">Miscellaneous</option>
            </select>
            {errors.subType && (
              <span className="error-message">{errors.subType}</span>
            )}
          </div>

          {formData.subType === "customer" && (
            <>
              <div className="form-group">
                <label htmlFor="customerId">Customer *</label>
                <select
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleCustomerChange}
                  className={errors.customerId ? "error" : ""}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerName ||
                        customer.businessName ||
                        `Customer ${customer.id}`}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <span className="error-message">{errors.customerId}</span>
                )}
              </div>

              {/* Auto-filled fields */}
              {formData.customerId && (
                <>
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.homeAddress}
                      readOnly
                      placeholder="Auto-filled"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gstNumber">GST Number</label>
                    <input
                      type="text"
                      id="gstNumber"
                      name="gstNumber"
                      value={formData.gstNumber}
                      readOnly
                      placeholder="Auto-filled"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="totalOutstanding">Total Outstanding</label>
                    <input
                      type="text"
                      id="totalOutstanding"
                      name="totalOutstanding"
                      value={`₹${formData.totalOutstanding.toLocaleString()}`}
                      readOnly
                      className="outstanding-field"
                    />
                  </div>

                  {/* Pending Invoices */}
                  {loadingInvoices ? (
                    <div className="loading-invoices">
                      <div className="spinner"></div>
                      <p>Loading pending invoices...</p>
                    </div>
                  ) : (
                    pendingInvoices.length > 0 && (
                      <div className="invoices-section">
                        <h3>Adjust Against Invoices (Optional)</h3>
                        <p className="invoices-hint">
                          Allocate payment amount to specific invoices
                        </p>

                        {pendingInvoices.map((invoice) => (
                          <div key={invoice.id} className="invoice-item">
                            <div className="invoice-header">
                              <span className="invoice-number">
                                {invoice.billNumber ||
                                  invoice.challanNumber ||
                                  `Invoice #${invoice.id}`}
                              </span>
                              <span className="invoice-date">
                                {new Date(
                                  invoice.billDate || invoice.invoiceDate,
                                ).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                            <div className="invoice-details">
                              <div className="detail-row">
                                <span>
                                  Total: ₹
                                  {parseFloat(
                                    invoice.totalAmount,
                                  ).toLocaleString()}
                                </span>
                                <span>
                                  Paid: ₹
                                  {parseFloat(
                                    invoice.paidAmount || 0,
                                  ).toLocaleString()}
                                </span>
                                <span className="pending">
                                  Pending: ₹
                                  {parseFloat(
                                    invoice.pendingAmount,
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <div className="pay-amount-input">
                                <label>Pay Amount:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={invoice.pendingAmount}
                                  step="0.01"
                                  placeholder="₹0"
                                  onChange={(e) =>
                                    handleInvoiceAmountChange(
                                      invoice.id,
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {formData.adjustedInvoices.length > 0 && (
                          <div className="adjusted-summary">
                            <strong>
                              Total Adjusted: ₹
                              {getTotalAdjustedAmount().toLocaleString()}
                            </strong>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}

          {/* Payment Date */}
          <div className="form-group">
            <label htmlFor="paymentDate">Payment Date *</label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleInputChange}
              className={errors.paymentDate ? "error" : ""}
              required
            />
            {errors.paymentDate && (
              <span className="error-message">{errors.paymentDate}</span>
            )}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount">Amount *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter Amount"
              className={errors.amount ? "error" : ""}
              required
              min="0"
              step="0.01"
            />
            {errors.amount && (
              <span className="error-message">{errors.amount}</span>
            )}
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label htmlFor="method">Payment Method *</label>
            <select
              id="method"
              name="method"
              value={formData.method}
              onChange={handleInputChange}
              className={errors.method ? "error" : ""}
              required
            >
              <option value="">Select Payment Method</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="online">Online</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
            {errors.method && (
              <span className="error-message">{errors.method}</span>
            )}
          </div>

          {/* Bank Transfer Fields */}
          {formData.method === "bank" && (
            <>
              <div className="form-group">
                <label htmlFor="bankName">Bank Name *</label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Enter Bank Name"
                  className={errors.bankName ? "error" : ""}
                  required
                />
                {errors.bankName && (
                  <span className="error-message">{errors.bankName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter Account Number"
                  className={errors.accountNumber ? "error" : ""}
                  required
                />
                {errors.accountNumber && (
                  <span className="error-message">{errors.accountNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code *</label>
                <input
                  type="text"
                  id="ifscCode"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="Enter IFSC Code"
                  className={errors.ifscCode ? "error" : ""}
                  required
                />
                {errors.ifscCode && (
                  <span className="error-message">{errors.ifscCode}</span>
                )}
              </div>
            </>
          )}

          {/* UPI/Online Fields */}
          {(formData.method === "upi" || formData.method === "online") && (
            <div className="form-group">
              <label htmlFor="upiId">UPI ID *</label>
              <input
                type="text"
                id="upiId"
                name="upiId"
                value={formData.upiId}
                onChange={handleInputChange}
                placeholder="example@upi"
                className={errors.upiId ? "error" : ""}
                required
              />
              {errors.upiId && (
                <span className="error-message">{errors.upiId}</span>
              )}
            </div>
          )}

          {/* Cheque Fields */}
          {formData.method === "cheque" && (
            <>
              <div className="form-group">
                <label htmlFor="chequeNumber">Cheque Number *</label>
                <input
                  type="text"
                  id="chequeNumber"
                  name="chequeNumber"
                  value={formData.chequeNumber}
                  onChange={handleInputChange}
                  placeholder="Enter Cheque Number"
                  className={errors.chequeNumber ? "error" : ""}
                  required
                />
                {errors.chequeNumber && (
                  <span className="error-message">{errors.chequeNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="chequeDate">Cheque Date *</label>
                <input
                  type="date"
                  id="chequeDate"
                  name="chequeDate"
                  value={formData.chequeDate}
                  onChange={handleInputChange}
                  className={errors.chequeDate ? "error" : ""}
                  required
                />
                {errors.chequeDate && (
                  <span className="error-message">{errors.chequeDate}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="chequeBankName">Bank Name *</label>
                <input
                  type="text"
                  id="chequeBankName"
                  name="chequeBankName"
                  value={formData.chequeBankName}
                  onChange={handleInputChange}
                  placeholder="Enter Bank Name"
                  className={errors.chequeBankName ? "error" : ""}
                  required
                />
                {errors.chequeBankName && (
                  <span className="error-message">{errors.chequeBankName}</span>
                )}
              </div>
            </>
          )}

          {/* Reference */}
          <div className="form-group">
            <label htmlFor="reference">Reference / Transaction ID</label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleInputChange}
              placeholder="Enter Reference (Optional)"
            />
          </div>

          {/* Remarks */}
          <div className="form-group">
            <label htmlFor="note">Remarks</label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              placeholder="Enter Remark (Optional)"
              rows="3"
            />
          </div>

          {/* Attachment */}
          <div className="form-group">
            <label htmlFor="attachment">Attachment</label>
            <div className="file-upload">
              <input
                type="file"
                id="attachment"
                name="attachment"
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept="image/*,.pdf"
              />

              {!formData.attachmentFile ? (
                <label htmlFor="attachment" className="file-upload-label">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      stroke="#ccc"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 8V16M8 12H16"
                      stroke="#ccc"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Click to Upload</span>
                </label>
              ) : (
                <div className="file-selected">
                  <div className="file-info">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      <polyline
                        points="13 2 13 9 20 9"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="file-details">
                      <span className="file-name">
                        {formData.attachmentFile.name}
                      </span>
                      <span className="file-size">
                        {(formData.attachmentFile.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={handleRemoveFile}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="error-summary">
              <p>Please fix the following errors:</p>
              <ul>
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Saving...
                </>
              ) : (
                "Save Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayment;
