import React, { useState, useEffect } from "react";
import "./paymentModal.scss";
import customerService from "../../services/customerService";

const PaymentModal = ({ payment, type, method, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customerId: "",
    type: type || "credit",
    subType: "customer",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: method || "cash",
    reference: "",
    note: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    chequeNumber: "",
    chequeDate: "",
    chequeBankName: "",
    status: "completed",
  });

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (payment && customers.length > 0) {
      console.log("Populating form with payment data:", payment);

      const custId = payment.customerId || payment.Customer?.id || "";

      const customer = customers.find((c) => c.id === custId);

      if (customer) {
        setSelectedCustomer(customer);
        const customerDisplayName =
          customer.businessName || customer.customerName || customer.name || "";
        setSearchTerm(customerDisplayName);
        console.log("Customer found and selected:", customer);
      } else {
        console.warn("Customer not found in list, ID:", custId);
      }

      setFormData({
        customerId: custId,
        type: payment.type || type || "credit",
        subType: payment.subType || "customer",
        amount: payment.amount ? String(payment.amount) : "",
        paymentDate:
          payment.paymentDate?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        method: payment.method || method || "cash",
        reference: payment.reference || "",
        note: payment.note || "",

        // Bank fields
        bankName: payment.bankName || "",
        accountNumber: payment.accountNumber || "",
        ifscCode: payment.ifscCode || "",

        // UPI fields
        upiId: payment.upiId || "",

        // Cheque fields
        chequeNumber: payment.chequeNumber || "",
        chequeDate: payment.chequeDate?.split("T")[0] || "",
        chequeBankName: payment.chequeBankName || "",

        status: payment.status || "completed",
      });

      console.log("Form populated with data");
    }
  }, [payment, customers, type, method]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter((customer) => {
        const name =
          customer.businessName || customer.customerName || customer.name || "";
        const phone = customer.phoneNumber || customer.mobileNumber || "";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.includes(searchTerm)
        );
      });
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await customerService.getCustomers();

      // ✅ FIX HERE
      const customerList = response.data?.rows || [];

      console.log("Customers fetched:", customerList.length);
      setCustomers(customerList);
      setFilteredCustomers(customerList);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowCustomerDropdown(true);

    // Clear selected customer if search is cleared
    if (!value) {
      setSelectedCustomer(null);
      setFormData((prev) => ({ ...prev, customerId: "" }));
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    const displayName =
      customer.businessName || customer.customerName || customer.name || "";
    setSearchTerm(displayName);
    setFormData((prev) => ({ ...prev, customerId: customer.id }));
    setShowCustomerDropdown(false);

    // Clear customer error if exists
    if (errors.customerId) {
      setErrors((prev) => ({ ...prev, customerId: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateIFSC = (ifsc) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  };

  const validateUPI = (upi) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upi);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = "Customer is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    }

    // Payment date should not be in future
    const selectedDate = new Date(formData.paymentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      newErrors.paymentDate = "Payment date cannot be in future";
    }

    // Method-specific validations
    if (formData.method === "bank") {
      if (!formData.bankName) {
        newErrors.bankName = "Bank name is required";
      }
      if (!formData.accountNumber) {
        newErrors.accountNumber = "Account number is required";
      } else if (
        formData.accountNumber.length < 9 ||
        formData.accountNumber.length > 18
      ) {
        newErrors.accountNumber = "Invalid account number";
      }
      if (!formData.ifscCode) {
        newErrors.ifscCode = "IFSC code is required";
      } else if (!validateIFSC(formData.ifscCode.toUpperCase())) {
        newErrors.ifscCode = "Invalid IFSC code format";
      }
    }

    if (formData.method === "upi" || formData.method === "online") {
      if (!formData.upiId) {
        newErrors.upiId = "UPI ID is required";
      } else if (!validateUPI(formData.upiId)) {
        newErrors.upiId = "Invalid UPI ID format";
      }
    }

    if (formData.method === "cheque") {
      if (!formData.chequeNumber) {
        newErrors.chequeNumber = "Cheque number is required";
      }
      if (!formData.chequeDate) {
        newErrors.chequeDate = "Cheque date is required";
      }
      if (!formData.chequeBankName) {
        newErrors.chequeBankName = "Bank name is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = document.querySelector(".error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        customerId: Number(formData.customerId),
        amount: Number(formData.amount),

        // ✅ IMPORTANT FIXES
        ifscCode: formData.ifscCode ? formData.ifscCode.toUpperCase() : null,

        chequeDate:
          formData.method === "cheque" && formData.chequeDate
            ? formData.chequeDate
            : null,

        chequeNumber:
          formData.method === "cheque" ? formData.chequeNumber : null,

        chequeBankName:
          formData.method === "cheque" ? formData.chequeBankName : null,

        bankName: formData.method === "bank" ? formData.bankName : null,

        accountNumber:
          formData.method === "bank" ? formData.accountNumber : null,

        upiId:
          formData.method === "upi" || formData.method === "online"
            ? formData.upiId
            : null,
      };

      console.log("Submitting payment data:", submitData);
      await onSave(submitData);
    } catch (error) {
      console.error("Error saving payment:", error);
      alert(error.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  const getCustomerDisplay = (customer) => {
    const name =
      customer.businessName ||
      customer.customerName ||
      customer.name ||
      "Unknown";
    const phone = customer.phoneNumber || customer.mobileNumber || "";
    return phone ? `${name} (${phone})` : name;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{payment ? "Edit Payment" : "Add Payment"}</h2>
          <button className="close-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          {/* Customer Search */}
          <div className="form-group">
            <label>Customer *</label>
            <div className="customer-search-wrapper">
              <input
                type="text"
                value={searchTerm}
                onChange={handleCustomerSearch}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder={
                  loadingCustomers
                    ? "Loading customers..."
                    : "Search customer by name or phone"
                }
                className={errors.customerId ? "error" : ""}
                disabled={loadingCustomers}
              />
              {selectedCustomer && (
                <button
                  type="button"
                  className="clear-customer-btn"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSearchTerm("");
                    setFormData((prev) => ({ ...prev, customerId: "" }));
                  }}
                  title="Clear selection"
                >
                  ×
                </button>
              )}

              {showCustomerDropdown &&
                !loadingCustomers &&
                filteredCustomers.length > 0 && (
                  <div className="customer-dropdown">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`customer-option ${selectedCustomer?.id === customer.id ? "selected" : ""}`}
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="customer-name">
                          {customer.businessName ||
                            customer.customerName ||
                            customer.name ||
                            "Unknown"}
                        </div>
                        {(customer.phoneNumber || customer.mobileNumber) && (
                          <div className="customer-phone">
                            {customer.phoneNumber || customer.mobileNumber}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {showCustomerDropdown &&
                !loadingCustomers &&
                filteredCustomers.length === 0 &&
                searchTerm && (
                  <div className="customer-dropdown">
                    <div className="no-results">No customers found</div>
                  </div>
                )}
            </div>
            {errors.customerId && (
              <span className="error-message">{errors.customerId}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="credit">Credit (Money In)</option>
                <option value="debit">Debit (Money Out)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sub Type *</label>
              <select
                name="subType"
                value={formData.subType}
                onChange={handleChange}
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="cash-deposit">Cash Deposit</option>
                <option value="cash-withdrawal">Cash Withdrawal</option>
                <option value="bank-charges">Bank Charges</option>
                <option value="electricity-bill">Electricity Bill</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount *</label>
              <div className="amount-input-wrapper">
                <span style={{ left: "6px" }} className="currency-symbol">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={
                    errors.amount ? "error amount-input" : "amount-input"
                  }
                />
              </div>
              {errors.amount && (
                <span className="error-message">{errors.amount}</span>
              )}
            </div>

            <div className="form-group">
              <label>Payment Date *</label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className={errors.paymentDate ? "error" : ""}
              />
              {errors.paymentDate && (
                <span className="error-message">{errors.paymentDate}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Payment Method *</label>
            <select
              name="method"
              value={formData.method}
              onChange={handleChange}
            >
              <option value="cash">💵 Cash</option>
              <option value="bank">🏦 Bank Transfer</option>
              <option value="cheque">📝 Cheque</option>
              <option value="online">🌐 Online</option>
              <option value="upi">📱 UPI</option>
              <option value="card">💳 Card</option>
              <option value="other">💰 Other</option>
            </select>
          </div>

          {/* Bank Transfer Fields */}
          {formData.method === "bank" && (
            <div className="method-fields">
              <div className="method-header">
                <span className="method-icon">🏦</span>
                <span className="method-title">Bank Transfer Details</span>
              </div>

              <div className="form-group">
                <label>Bank Name *</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Enter bank name"
                  className={errors.bankName ? "error" : ""}
                />
                {errors.bankName && (
                  <span className="error-message">{errors.bankName}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Account Number *</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    className={errors.accountNumber ? "error" : ""}
                  />
                  {errors.accountNumber && (
                    <span className="error-message">
                      {errors.accountNumber}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>IFSC Code *</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    placeholder="XXXX0XXXXXX"
                    maxLength="11"
                    className={errors.ifscCode ? "error" : ""}
                    style={{ textTransform: "uppercase" }}
                  />
                  {errors.ifscCode && (
                    <span className="error-message">{errors.ifscCode}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* UPI/Online Fields */}
          {(formData.method === "upi" || formData.method === "online") && (
            <div className="method-fields">
              <div className="method-header">
                <span className="method-icon">📱</span>
                <span className="method-title">UPI Details</span>
              </div>

              <div className="form-group">
                <label>UPI ID *</label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="example@upi"
                  className={errors.upiId ? "error" : ""}
                />
                {errors.upiId && (
                  <span className="error-message">{errors.upiId}</span>
                )}
              </div>
            </div>
          )}

          {/* Cheque Fields */}
          {formData.method === "cheque" && (
            <div className="method-fields">
              <div className="method-header">
                <span className="method-icon">📝</span>
                <span className="method-title">Cheque Details</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cheque Number *</label>
                  <input
                    type="text"
                    name="chequeNumber"
                    value={formData.chequeNumber}
                    onChange={handleChange}
                    placeholder="Enter cheque number"
                    className={errors.chequeNumber ? "error" : ""}
                  />
                  {errors.chequeNumber && (
                    <span className="error-message">{errors.chequeNumber}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Cheque Date *</label>
                  <input
                    type="date"
                    name="chequeDate"
                    value={formData.chequeDate}
                    onChange={handleChange}
                    className={errors.chequeDate ? "error" : ""}
                  />
                  {errors.chequeDate && (
                    <span className="error-message">{errors.chequeDate}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Cheque Bank Name *</label>
                <input
                  type="text"
                  name="chequeBankName"
                  value={formData.chequeBankName}
                  onChange={handleChange}
                  placeholder="Enter bank name"
                  className={errors.chequeBankName ? "error" : ""}
                />
                {errors.chequeBankName && (
                  <span className="error-message">{errors.chequeBankName}</span>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Reference / Transaction ID</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Transaction ID / Reference number"
            />
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="completed"> Completed</option>
              <option value="pending"> Pending</option>
              <option value="failed"> Failed</option>
              <option value="cancelled"> Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Remark / Notes</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add any additional notes or remarks..."
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                <>{payment ? "Update Payment" : "Save Payment"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
