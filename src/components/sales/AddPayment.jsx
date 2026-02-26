import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./addPayment.scss";
import customerService from "../../services/customerService";
import paymentService from "../../services/paymentService";
import billService from "../../services/billService";
import { uploadPaymentAttachment } from "../../utils/firebaseStorage";
import { toast } from "react-toastify";

const AddPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillBillId = searchParams.get("billId");
  const prefillAction = searchParams.get("action");

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
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillBill, setPrefillBill] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCustomers().then(() => {
      if (prefillBillId) {
        prefillFromBill(prefillBillId);
      }
    });
  }, []);

  const prefillFromBill = async (billId) => {
    try {
      setPrefillLoading(true);
      const billData = await billService.getBillById(billId);
      const bill = billData?.bill || billData;
      setPrefillBill(bill);

      const customerId =
        bill.customerId || bill.customer?.id || bill.customer?._id;

      const totalAmt = parseFloat(bill.totalWithGST || bill.totalAmount || 0);
      const paidAmt = parseFloat(bill.paidAmount || 0);
      const pendingAmount = totalAmt - paidAmt;

      const fillAmount =
        prefillAction === "paid" ? pendingAmount.toString() : "";

      setFormData((prev) => ({
        ...prev,
        type: "credit",
        subType: "customer",
        customerId: customerId || "",
        amount: fillAmount,
        adjustedInvoices:
          prefillAction === "paid" && pendingAmount > 0
            ? [{ billId: bill._id || bill.id, payAmount: pendingAmount }]
            : [],
      }));

      if (customerId) {
        try {
          setLoadingInvoices(true);

          const customerData = bill.customer || {};
          setSelectedCustomerData(customerData);

          const address =
            parseAddress(
              customerData.officeAddress || customerData.homeAddress,
            ) ||
            customerData.address ||
            "";
          const gstNumber = customerData.gstNumber || "";

          setFormData((prev) => ({
            ...prev,
            homeAddress: address,
            gstNumber,
            totalOutstanding: pendingAmount,
          }));

          // Show ONLY this specific bill in the invoices list
          setPendingInvoices([
            {
              id: bill._id || bill.id,
              billNumber: bill.billNumber,
              billDate: bill.billDate || bill.createdAt,
              totalAmount: totalAmt,
              paidAmount: paidAmt,
              pendingAmount: pendingAmount,
            },
          ]);
        } catch (err) {
          console.error("Error fetching customer data for prefill:", err);
        } finally {
          setLoadingInvoices(false);
        }
      }
    } catch (error) {
      console.error("Error prefilling bill data:", error);
    } finally {
      setPrefillLoading(false);
    }
  };

  const parseAddress = (raw) => {
    if (!raw) return "";
    try {
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      return [
        obj.streetNo || obj.street || "",
        obj.houseNo || obj.house || "",
        obj.residencyName || obj.building || obj.buildingNo || "",
        obj.officeNo || obj.office || "",
        obj.area || obj.locality || "",
        obj.city || "",
        obj.state || "",
        obj.pinCode || obj.pin || "",
      ]
        .filter(Boolean)
        .join(", ");
    } catch {
      return typeof raw === "string" ? raw : "";
    }
  };

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
      setCustomers(customerList);
      return customerList;
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      return [];
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
      adjustedInvoices: [],
    }));

    if (!customerId) {
      setSelectedCustomerData(null);
      setPendingInvoices([]);
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

      // Fetch customer details
      const customerResponse =
        await customerService.getCustomerById(customerId);
      const customerData = customerResponse.data || customerResponse;

      setSelectedCustomerData(customerData);

      const address =
        parseAddress(customerData.officeAddress || customerData.homeAddress) ||
        customerData.address ||
        "";
      const gstNumber = customerData.gstNumber || "";

      const [outstandingResponse, invoicesResponse] = await Promise.all([
        paymentService.getCustomerOutstanding(customerId),
        paymentService.getCustomerPendingInvoices(customerId),
      ]);

      const outstanding = parseFloat(
        outstandingResponse.outstanding ||
          outstandingResponse.totalOutstanding ||
          0,
      );
      const invoices = invoicesResponse.invoices || [];

      setFormData((prev) => ({
        ...prev,
        homeAddress: address,
        gstNumber,
        totalOutstanding: outstanding,
      }));

      setPendingInvoices(invoices);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error("Failed to fetch customer details. Please try again.");
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
        newAdjustedInvoices = prev.adjustedInvoices.filter(
          (inv) => inv.billId !== invoiceId,
        );
      } else if (existingIndex !== -1) {
        newAdjustedInvoices = [...prev.adjustedInvoices];
        newAdjustedInvoices[existingIndex] = {
          billId: invoiceId,
          payAmount: amount,
        };
      } else {
        newAdjustedInvoices = [
          ...prev.adjustedInvoices,
          { billId: invoiceId, payAmount: amount },
        ];
      }

      const totalAdjusted = newAdjustedInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.payAmount || 0),
        0,
      );

      return {
        ...prev,
        adjustedInvoices: newAdjustedInvoices,
        amount: totalAdjusted > 0 ? totalAdjusted.toString() : prev.amount,
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should not exceed 5MB");
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

    if (!formData.type) {
      newErrors.type = "Payment type (Credit/Debit) is required";
    }
    if (!formData.subType) {
      newErrors.subType = "Sub-type is required";
    }

    if (formData.subType === "customer" && !formData.customerId) {
      newErrors.customerId = "Customer is required";
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    }
    if (!formData.method) {
      newErrors.method = "Payment method is required";
    }

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
      toast.error("Please fix the errors before submitting");
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
        paymentMode: formData.method,
        reference: formData.reference || null,
        note: formData.note || null,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        status: "completed",
      };

      if (formData.adjustedInvoices.length > 0) {
        paymentData.adjustedInvoices = formData.adjustedInvoices;
      }

      const response = await paymentService.createPayment(paymentData);

      if (prefillBillId) {
        try {
          const totalAmt = parseFloat(
            prefillBill.totalWithGST || prefillBill.totalAmount || 0,
          );
          const alreadyPaid = parseFloat(prefillBill.paidAmount || 0);
          const currentPay = parseFloat(formData.amount || 0);
          const newPaid = alreadyPaid + currentPay;

          if (newPaid >= totalAmt) {
            await billService.markBillPaid(prefillBillId);
          } else {
            await billService.editBill(prefillBillId, {
              status: "partially_paid",
              paidAmount: newPaid.toFixed(2),
              pendingAmount: (totalAmt - newPaid).toFixed(2),
            });
          }

          await new Promise((resolve) => setTimeout(resolve, 800));
        } catch (billErr) {
          console.error("Could not update bill status:", billErr);
        }
      }

      // await fetchNotifications();
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/vendor/bills", { state: { refresh: true } });
      }, 2000);
    } catch (error) {
      console.error("Error creating payment:", error);
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        "Failed to create payment";
      toast.error(errorMessage);
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

  if (prefillLoading) {
    return (
      <div className="ap-fullscreen-loader">
        <div className="ap-loader-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <p>Loading bill details...</p>
      </div>
    );
  }

  return (
    <div className="add-payment-page">
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#f59e0b" />
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
        <div className="header-text">
          <h1>{prefillBillId ? "Record Payment" : "Add Payment"}</h1>
          {prefillBill && (
            <span className="header-sub">
              {prefillBill.billNumber} &nbsp;·&nbsp;
              {prefillBill.customerName || prefillBill.customer?.customerName}
            </span>
          )}
        </div>
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
                    <label htmlFor="totalOutstanding">
                      {prefillBillId
                        ? "Pending Amount (This Bill)"
                        : "Total Outstanding"}
                    </label>
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
                        <h3>Adjust Against Invoices</h3>
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
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="₹0"
                                    value={
                                      formData.adjustedInvoices.find(
                                        (inv) => inv.billId === invoice.id,
                                      )?.payAmount || ""
                                    }
                                    onChange={(e) =>
                                      handleInvoiceAmountChange(
                                        invoice.id,
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="pay-full-btn"
                                    onClick={() =>
                                      handleInvoiceAmountChange(
                                        invoice.id,
                                        parseFloat(
                                          invoice.pendingAmount,
                                        ).toFixed(2),
                                      )
                                    }
                                  >
                                    Pay Full
                                  </button>
                                </div>
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
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter Amount"
                className={errors.amount ? "error" : ""}
                style={{ flex: 1 }}
                required
                min="0"
                step="0.01"
              />
              {prefillBillId && (
                <button
                  type="button"
                  className="pay-full-btn-main"
                  onClick={() => {
                    const totalAmt = parseFloat(
                      prefillBill.totalWithGST || prefillBill.totalAmount || 0,
                    );
                    const paidAmt = parseFloat(prefillBill.paidAmount || 0);
                    const pending = (totalAmt - paidAmt).toFixed(2);

                    setFormData((prev) => ({ ...prev, amount: pending }));

                    // Also update adjusted invoices if only one
                    if (pendingInvoices.length === 1) {
                      handleInvoiceAmountChange(pendingInvoices[0].id, pending);
                    }
                  }}
                >
                  Full Paid
                </button>
              )}
            </div>
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
              <option value="cash">💵 Cash</option>
              <option value="bank">🏦 Bank Transfer</option>
              <option value="upi">📱 UPI</option>
              <option value="cheque">📝 Cheque</option>
              <option value="card">💳 Card</option>
              <option value="online">🌐 Online</option>
              <option value="other">💰 Other</option>
            </select>
            {errors.method && (
              <span className="error-message">{errors.method}</span>
            )}
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
