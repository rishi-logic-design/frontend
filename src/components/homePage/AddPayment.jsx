import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./addPayment.scss";
import paymentService from "../../services/paymentService";
import customerService from "../../services/customerService";
import { uploadPaymentAttachment } from "../../utils/firebaseStorage";

const AddPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL se parameters
  const billIdFromUrl = searchParams.get("billId");
  const typeFromUrl = searchParams.get("type");
  const customerIdFromUrl = searchParams.get("customerId");

  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    creditDebit: "",
    customerId: customerIdFromUrl || "",
    homeAddress: "",
    gstNumber: "",
    totalOutstanding: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "",
    remark: "",
    attachment: null,
    attachmentUrl: null,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    chequeNumber: "",
    chequeDate: "",
    chequeBankName: "",
    reference: "",
  });

  const [invoices, setInvoices] = useState([]);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [outstandingAfterAdjustment, setOutstandingAfterAdjustment] =
    useState(0);

  const getVendorId = () => {
    const vendorData = JSON.parse(localStorage.getItem("vendorData"));
    return vendorData?.id || null;
  };

  // Load customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const vendorId = getVendorId();
        if (vendorId) {
          const res = await customerService.getCustomers();
          setCustomers(res?.data?.rows || []);
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Load customer data and invoices
  useEffect(() => {
    const loadCustomerData = async () => {
      if (!formData.customerId) {
        setInvoices([]);
        setFormData((prev) => ({
          ...prev,
          homeAddress: "",
          gstNumber: "",
          totalOutstanding: 0,
        }));
        return;
      }

      try {
        setLoadingInvoices(true);
        const vendorId = getVendorId();

        const customer = customers.find(
          (c) => c.id === parseInt(formData.customerId),
        );
        if (customer) {
          setFormData((prev) => ({
            ...prev,
            homeAddress: customer.officeAddress || customer.address || "",
            gstNumber:
              customer.gstNumber || customer.gstin || customer.pan || "",
          }));
        }

        // Load customer outstanding
        const outstandingData = await paymentService.getCustomerOutstanding(
          formData.customerId,
        );

        setFormData((prev) => ({
          ...prev,
          totalOutstanding: parseFloat(outstandingData.outstanding || 0),
        }));

        // Load customer's pending invoices
        const pendingInvoicesData =
          await paymentService.getCustomerPendingInvoices(formData.customerId);

        console.log("Pending invoices data:", pendingInvoicesData);

        // Map the invoices with EXPLICIT billId
        const mappedInvoices = (pendingInvoicesData.invoices || []).map(
          (invoice) => {
            const totalAmount = parseFloat(invoice.totalAmount || 0);
            const paidAmount = parseFloat(invoice.paidAmount || 0);
            const pendingAmount = parseFloat(
              invoice.pendingAmount || totalAmount - paidAmount,
            );

            return {
              id: invoice.id,
              billId: invoice.id, // ✅ EXPLICIT billId for backend
              billNo: invoice.billNumber || invoice.billNo,
              invoiceDate: invoice.billDate
                ? new Date(invoice.billDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "",
              totalAmount: totalAmount,
              paidAmount: paidAmount,
              payAmount: "",
              pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
              status:
                pendingAmount <= 0
                  ? "paid"
                  : paidAmount > 0
                    ? "partial"
                    : "pending",
              selected: false,
            };
          },
        );

        // Sort by date (newest first)
        mappedInvoices.sort((a, b) => {
          const dateA = new Date(a.invoiceDate);
          const dateB = new Date(b.invoiceDate);
          return dateB - dateA;
        });

        setInvoices(mappedInvoices);
        setOutstandingAfterAdjustment(
          parseFloat(outstandingData.outstanding || 0),
        );

        // ✅ Auto-select invoice if coming from bill details
        if (billIdFromUrl && typeFromUrl === "bill") {
          const billId = parseInt(billIdFromUrl);
          const targetInvoice = mappedInvoices.find(
            (inv) => inv.billId === billId,
          );

          if (targetInvoice) {
            console.log("Auto-selecting invoice:", targetInvoice);

            // Auto-select and pre-fill amount
            setInvoices((prevInvoices) =>
              prevInvoices.map((inv) =>
                inv.billId === billId
                  ? {
                      ...inv,
                      selected: true,
                      payAmount: inv.pendingAmount.toString(),
                    }
                  : inv,
              ),
            );

            // Set form data
            setFormData((prev) => ({
              ...prev,
              amount: targetInvoice.pendingAmount.toString(),
              creditDebit: "credit", // Auto-select credit for bill payment
            }));
          }
        }
      } catch (err) {
        console.error("Error loading customer data:", err);
        setError("Failed to load customer data");
      } finally {
        setLoadingInvoices(false);
      }
    };

    if (formData.customerId && customers.length > 0) {
      loadCustomerData();
    }
  }, [formData.customerId, customers, billIdFromUrl, typeFromUrl]);

  // Calculate adjustments
  useEffect(() => {
    const selectedInvoices = invoices.filter((inv) => inv.selected);
    const totalAdjusted = selectedInvoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.payAmount) || 0),
      0,
    );
    setAdjustmentAmount(totalAdjusted);

    const outstanding = formData.totalOutstanding;
    const paymentAmt = parseFloat(formData.amount) || 0;

    if (formData.creditDebit === "credit") {
      setOutstandingAfterAdjustment(outstanding - paymentAmt);
    } else if (formData.creditDebit === "debit") {
      setOutstandingAfterAdjustment(outstanding + paymentAmt);
    } else {
      setOutstandingAfterAdjustment(outstanding);
    }
  }, [
    invoices,
    formData.amount,
    formData.creditDebit,
    formData.totalOutstanding,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
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
    const numValue = parseFloat(value) || 0;
    setInvoices(
      invoices.map((invoice) => {
        if (invoice.id === id) {
          const newPendingAmount =
            invoice.totalAmount - invoice.paidAmount - numValue;
          return {
            ...invoice,
            payAmount: value,
            pendingAmount: newPendingAmount > 0 ? newPendingAmount : 0,
          };
        }
        return invoice;
      }),
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and PDF files are allowed");
      return;
    }

    if (file.size > maxSize) {
      setError("File size should not exceed 5MB");
      return;
    }

    setUploadingFile(true);
    setError(null);

    try {
      const url = await uploadPaymentAttachment(file);
      setFormData((prev) => ({
        ...prev,
        attachment: file,
        attachmentUrl: url,
      }));
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  const validateForm = () => {
    if (!formData.customerId) {
      setError("Please select a customer");
      return false;
    }

    if (!formData.creditDebit) {
      setError("Please select credit or debit");
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    if (!formData.paymentDate) {
      setError("Please select a payment date");
      return false;
    }

    if (!formData.paymentMethod) {
      setError("Please select a payment method");
      return false;
    }

    // Method-specific validations
    if (formData.paymentMethod === "bank") {
      if (!formData.bankName || !formData.accountNumber || !formData.ifscCode) {
        setError("Please fill all bank transfer details");
        return false;
      }
    }

    if (
      formData.paymentMethod === "upi" ||
      formData.paymentMethod === "online"
    ) {
      if (!formData.upiId) {
        setError("Please enter UPI ID");
        return false;
      }
    }

    if (formData.paymentMethod === "cheque") {
      if (
        !formData.chequeNumber ||
        !formData.chequeDate ||
        !formData.chequeBankName
      ) {
        setError("Please fill all cheque details");
        return false;
      }
    }

    // Validate adjustment amounts match payment amount
    const selectedInvoices = invoices.filter((inv) => inv.selected);
    if (selectedInvoices.length > 0) {
      const totalAdjusted = selectedInvoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.payAmount) || 0),
        0,
      );
      const paymentAmount = parseFloat(formData.amount);

      if (Math.abs(totalAdjusted - paymentAmount) > 0.01) {
        setError(
          "Sum of adjusted invoice amounts must equal the payment amount",
        );
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // ✅ Prepare adjusted invoices with EXPLICIT billId
      const selectedInvoices = invoices.filter(
        (inv) => inv.selected && parseFloat(inv.payAmount) > 0,
      );

      const adjustedInvoices = selectedInvoices.map((inv) => ({
        billId: inv.billId, // ✅ Use explicit billId
        payAmount: parseFloat(inv.payAmount),
      }));

      console.log("=== PAYMENT DATA ===");
      console.log("Selected Invoices:", selectedInvoices);
      console.log("Adjusted Invoices for Backend:", adjustedInvoices);

      const paymentData = {
        customerId: parseInt(formData.customerId),
        type: formData.creditDebit,
        subType: "customer",
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        method: formData.paymentMethod,
        reference: formData.reference || null,
        note: formData.remark || null,
        attachments: formData.attachmentUrl ? [formData.attachmentUrl] : [],
        adjustedInvoices: adjustedInvoices.length > 0 ? adjustedInvoices : null,
      };

      // Add method-specific fields
      if (formData.paymentMethod === "bank") {
        paymentData.bankName = formData.bankName;
        paymentData.accountNumber = formData.accountNumber;
        paymentData.ifscCode = formData.ifscCode;
      } else if (
        formData.paymentMethod === "upi" ||
        formData.paymentMethod === "online"
      ) {
        paymentData.upiId = formData.upiId;
      } else if (formData.paymentMethod === "cheque") {
        paymentData.chequeNumber = formData.chequeNumber;
        paymentData.chequeDate = formData.chequeDate;
        paymentData.chequeBankName = formData.chequeBankName;
      }

      console.log("Final Payment Data:", paymentData);

      const response = await paymentService.createPayment(paymentData);

      console.log("✅ Payment created successfully:", response);
      setSuccess(true);

      // Show success message
      alert("Payment recorded successfully!");

      // ✅ Navigate based on source
      if (billIdFromUrl && typeFromUrl === "bill") {
        // If came from bill details, go back to bill details with refresh
        navigate(`/vendor/bill-details/${billIdFromUrl}`, {
          replace: true,
          state: { refresh: true },
        });
      } else {
        // Otherwise go to home page for fresh data
        navigate("/vendor/home", { replace: true, state: { refresh: true } });
      }
    } catch (err) {
      console.error("❌ Payment creation error:", err);
      setError(err.message || "Failed to create payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCustomers) {
    return (
      <div className="add-payment-page">
        <div className="loading-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-payment-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-title">Add Payment</h1>
      </div>

      <div className="page-content">
        <div className="form-container">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✓</span>
              <span>Payment recorded successfully!</span>
            </div>
          )}

          {/* Credit/Debit Selection */}
          <div className="form-section">
            <div className="form-group">
              <label>
                Transaction Type <span className="required">*</span>
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="creditDebit"
                    value="credit"
                    checked={formData.creditDebit === "credit"}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <span className="radio-text">Credit (Money In)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="creditDebit"
                    value="debit"
                    checked={formData.creditDebit === "debit"}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <span className="radio-text">Debit (Money Out)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="customerId">
                Customer <span className="required">*</span>
              </label>
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName} - {customer.businessName || "N/A"}
                  </option>
                ))}
              </select>
            </div>

            {formData.customerId && (
              <>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.homeAddress}
                    className="form-input"
                    disabled
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>GST Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    className="form-input"
                    disabled
                    readOnly
                  />
                </div>

                <div className="form-group outstanding-display">
                  <label>Total Outstanding</label>
                  <div className="outstanding-amount">
                    ₹{formData.totalOutstanding.toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Payment Details */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="paymentDate">
                Payment Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">
                Amount <span className="required">*</span>
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                className="form-input"
                step="0.01"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reference">Reference/Transaction ID</label>
              <input
                type="text"
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleInputChange}
                placeholder="Enter reference number"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="remark">Remark</label>
              <textarea
                id="remark"
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Enter any remarks"
                className="form-input"
                rows="3"
                disabled={loading}
              />
            </div>
          </div>

          {/* Invoice Adjustment Section */}
          {formData.customerId && formData.creditDebit === "credit" && (
            <div className="invoice-section">
              <h3 className="section-title">Adjust with Invoices</h3>
              {loadingInvoices ? (
                <div className="loading-invoices">
                  <p>Loading invoices...</p>
                </div>
              ) : invoices.length > 0 ? (
                <div className="invoice-list">
                  {invoices.map((invoice) => (
                    <label
                      key={invoice.id}
                      className={`invoice-item ${invoice.selected ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={invoice.selected}
                        onChange={() => handleInvoiceToggle(invoice.id)}
                        disabled={loading}
                      />
                      <div className="invoice-details">
                        <div className="invoice-header">
                          <span className="invoice-number">
                            #{invoice.billNo}
                          </span>
                          <span className="invoice-date">
                            {invoice.invoiceDate}
                          </span>
                          <span
                            className={`invoice-status ${invoice.status.toLowerCase()}`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                        <div className="invoice-amounts">
                          <div className="amount-row">
                            <span className="amount-label">Total:</span>
                            <span className="amount-value">
                              ₹{invoice.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="amount-row">
                            <span className="amount-label">Paid:</span>
                            <span className="amount-value">
                              ₹{invoice.paidAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="amount-row pending">
                            <span className="amount-label">Pending:</span>
                            <span className="amount-value">
                              ₹{invoice.pendingAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {invoice.selected && (
                          <div className="pay-amount-input">
                            <label>Pay Amount:</label>
                            <input
                              type="number"
                              value={invoice.payAmount}
                              onChange={(e) =>
                                handlePayAmountChange(
                                  invoice.id,
                                  e.target.value,
                                )
                              }
                              placeholder="Enter amount to pay"
                              min="0"
                              max={invoice.pendingAmount}
                              step="0.01"
                              disabled={loading}
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="no-invoices">
                  <p>No pending invoices found for this customer</p>
                </div>
              )}
            </div>
          )}

          {/* Adjustment Section */}
          {formData.customerId && (
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
                  Outstanding after Payment:
                </span>
                <span className="adjustment-value">
                  ₹{outstandingAfterAdjustment.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Section */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="paymentMethod">
                Payment Method <span className="required">*</span>
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              >
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="online">Online</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Bank Transfer Fields */}
            {formData.paymentMethod === "bank" && (
              <>
                <div className="form-group">
                  <label htmlFor="bankName">
                    Bank Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Enter bank name"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="accountNumber">
                    Account Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter account number"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ifscCode">
                    IFSC Code <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="ifscCode"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="Enter IFSC code"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* UPI/Online Fields */}
            {(formData.paymentMethod === "upi" ||
              formData.paymentMethod === "online") && (
              <div className="form-group">
                <label htmlFor="upiId">
                  UPI ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="upiId"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  placeholder="Enter UPI ID"
                  className="form-input"
                  disabled={loading}
                />
              </div>
            )}

            {/* Cheque Fields */}
            {formData.paymentMethod === "cheque" && (
              <>
                <div className="form-group">
                  <label htmlFor="chequeNumber">
                    Cheque Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="chequeNumber"
                    name="chequeNumber"
                    value={formData.chequeNumber}
                    onChange={handleInputChange}
                    placeholder="Enter cheque number"
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="chequeDate">
                    Cheque Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="chequeDate"
                    name="chequeDate"
                    value={formData.chequeDate}
                    onChange={handleInputChange}
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="chequeBankName">
                    Bank Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="chequeBankName"
                    name="chequeBankName"
                    value={formData.chequeBankName}
                    onChange={handleInputChange}
                    placeholder="Enter bank name"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="attachment">Attachment</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="attachment"
                  onChange={handleFileUpload}
                  className="file-input"
                  accept="image/*,.pdf"
                  disabled={loading || uploadingFile}
                />
                <label htmlFor="attachment" className="file-label">
                  <span className="upload-icon">📎</span>
                  <span className="upload-text">
                    {uploadingFile
                      ? "Uploading..."
                      : formData.attachment
                        ? formData.attachment.name
                        : "Click to Upload"}
                  </span>
                </label>
              </div>
              {formData.attachmentUrl && (
                <div className="file-preview">
                  <span className="file-preview-text">
                    ✓ File uploaded successfully
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="cancel-btn"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={loading || uploadingFile}
            >
              {loading ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPayment;
