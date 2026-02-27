import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./addPayment.scss";
import customerService from "../../services/customerService";
import paymentService from "../../services/paymentService";
import billService from "../../services/billService";
import { uploadPaymentAttachment } from "../../utils/firebaseStorage";
import { toast } from "react-toastify";

const PAYMENT_METHODS = [
  { value: "cash", label: "💵 Cash" },
  { value: "bank", label: "🏦 Bank Transfer" },
  { value: "upi", label: "📱 UPI" },
  { value: "cheque", label: "📝 Cheque" },
  { value: "card", label: "💳 Card" },
  { value: "online", label: "🌐 Online" },
  { value: "other", label: "💰 Other" },
];

const fmtAmt = (v) =>
  `₹${parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
      if (prefillBillId) prefillFromBill(prefillBillId);
    });
  }, []);

  const parseAddress = (raw) => {
    if (!raw) return "";
    try {
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      return [
        obj.streetNo || obj.street || "",
        obj.houseNo || obj.house || "",
        obj.buildingNo || obj.residencyName || obj.building || "",
        obj.officeNo || obj.office || "",
        obj.area || obj.locality || "",
        // API uses "areaCity" — fall back to "city"
        obj.areaCity || obj.city || "",
        obj.state || "",
        // API uses "pincode" (lowercase c) — fall back to pinCode / pin
        obj.pincode || obj.pinCode || obj.pin || "",
      ]
        .filter(Boolean)
        .join(", ");
    } catch {
      return typeof raw === "string" ? raw : "";
    }
  };

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
      const pending = totalAmt - paidAmt;
      const fillAmt = prefillAction === "paid" ? pending.toString() : "";
      setFormData((p) => ({
        ...p,
        type: "credit",
        subType: "customer",
        customerId: customerId || "",
        amount: fillAmt,
        adjustedInvoices:
          prefillAction === "paid" && pending > 0
            ? [{ billId: bill._id || bill.id, payAmount: pending }]
            : [],
      }));
      if (customerId) {
        setLoadingInvoices(true);
        const cData = bill.customer || {};
        setSelectedCustomerData(cData);
        setFormData((p) => ({
          ...p,
          homeAddress:
            parseAddress(cData.homeAddress) ||
            parseAddress(cData.officeAddress) ||
            cData.address ||
            "",
          gstNumber: cData.gstNumber || "",
          totalOutstanding: pending,
        }));
        setPendingInvoices([
          {
            id: bill._id || bill.id,
            billNumber: bill.billNumber,
            billDate: bill.billDate || bill.createdAt,
            totalAmount: totalAmt,
            paidAmount: paidAmt,
            pendingAmount: pending,
          },
        ]);
        setLoadingInvoices(false);
      }
    } catch (e) {
      console.error("Prefill error:", e);
    } finally {
      setPrefillLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const vendorId = JSON.parse(localStorage.getItem("vendorData"))?.id;
    try {
      const res = await customerService.getCustomers(vendorId);
      const list =
        res?.data?.rows || res?.rows || (Array.isArray(res) ? res : []);
      console.log(list);
      setCustomers(list);
      return list;
    } catch {
      setCustomers([]);
      return [];
    }
  };

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleCustomerChange = async (e) => {
    const cid = e.target.value;
    setFormData((p) => ({ ...p, customerId: cid, adjustedInvoices: [] }));
    if (!cid) {
      setSelectedCustomerData(null);
      setPendingInvoices([]);
      setFormData((p) => ({
        ...p,
        homeAddress: "",
        gstNumber: "",
        totalOutstanding: 0,
      }));
      return;
    }
    try {
      setLoadingInvoices(true);
      const cRes = await customerService.getCustomerById(cid);
      const cData = cRes.data || cRes;
      setSelectedCustomerData(cData);
      const [outRes, invRes] = await Promise.all([
        paymentService.getCustomerOutstanding(cid),
        paymentService.getCustomerPendingInvoices(cid),
      ]);
      console.log("Customer data full:", cData);
      setFormData((p) => ({
        ...p,
        homeAddress:
          parseAddress(cData.homeAddress) ||
          parseAddress(cData.officeAddress) ||
          cData.address ||
          "",
        gstNumber: cData.gstNumber || "",
        totalOutstanding: parseFloat(
          outRes.outstanding || outRes.totalOutstanding || 0,
        ),
      }));
      setPendingInvoices(invRes.invoices || []);
    } catch {
      toast.error("Failed to fetch customer details.");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleInvoiceAmt = (invId, val) => {
    const amt = parseFloat(val) || 0;
    setFormData((p) => {
      const idx = p.adjustedInvoices.findIndex((i) => i.billId === invId);
      let list;
      if (amt === 0)
        list = p.adjustedInvoices.filter((i) => i.billId !== invId);
      else if (idx !== -1) {
        list = [...p.adjustedInvoices];
        list[idx] = { billId: invId, payAmount: amt };
      } else list = [...p.adjustedInvoices, { billId: invId, payAmount: amt }];
      const total = list.reduce((s, i) => s + parseFloat(i.payAmount || 0), 0);
      return {
        ...p,
        adjustedInvoices: list,
        amount: total > 0 ? total.toString() : p.amount,
      };
    });
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5 MB");
      return;
    }
    setFormData((p) => ({ ...p, attachmentFile: f }));
  };

  const removeFile = () => {
    setFormData((p) => ({ ...p, attachmentFile: null }));
    const el = document.getElementById("ap-attachment");
    if (el) el.value = "";
  };

  const totalAdjusted = () =>
    formData.adjustedInvoices.reduce(
      (s, i) => s + parseFloat(i.payAmount || 0),
      0,
    );

  const validate = () => {
    const e = {};
    if (!formData.type) e.type = "Payment type is required";
    if (!formData.subType) e.subType = "Sub-type is required";
    if (formData.subType === "customer" && !formData.customerId)
      e.customerId = "Customer is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      e.amount = "Valid amount is required";
    if (!formData.paymentDate) e.paymentDate = "Date is required";
    if (!formData.method) e.method = "Payment method is required";
    if (formData.adjustedInvoices.length > 0) {
      if (Math.abs(totalAdjusted() - parseFloat(formData.amount)) > 0.01)
        e.adjustedInvoices = "Total adjusted ≠ payment amount";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix errors before submitting");
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
        } catch {
          if (!window.confirm("Attachment failed. Continue?")) {
            setLoading(false);
            return;
          }
        }
      }
      const payload = {
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
        ...(formData.adjustedInvoices.length > 0 && {
          adjustedInvoices: formData.adjustedInvoices,
        }),
      };
      await paymentService.createPayment(payload);
      if (prefillBillId) {
        try {
          const total = parseFloat(
            prefillBill.totalWithGST || prefillBill.totalAmount || 0,
          );
          const already = parseFloat(prefillBill.paidAmount || 0);
          const newPaid = already + parseFloat(formData.amount || 0);
          if (newPaid >= total) await billService.markBillPaid(prefillBillId);
          else
            await billService.editBill(prefillBillId, {
              status: "partially_paid",
              paidAmount: newPaid.toFixed(2),
              pendingAmount: (total - newPaid).toFixed(2),
            });
          await new Promise((r) => setTimeout(r, 800));
        } catch (err) {
          console.error("Bill update error:", err);
        }
      }
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/vendor/bills", { state: { refresh: true } });
      }, 2200);
    } catch (err) {
      toast.error(
        err.message ||
          err.response?.data?.message ||
          "Failed to create payment",
      );
    } finally {
      setLoading(false);
    }
  };

  if (prefillLoading) {
    return (
      <div className="ap-fullscreen-loader">
        <div className="ap-loader-ring">
          <div />
          <div />
          <div />
          <div />
        </div>
        <p>Loading bill details…</p>
      </div>
    );
  }

  const typeLabel =
    formData.type === "credit"
      ? "Credit — Money Received"
      : formData.type === "debit"
        ? "Debit — Money Paid"
        : "—";
  const methodLabel =
    PAYMENT_METHODS.find((m) => m.value === formData.method)?.label || "—";

  return (
    <div className="add-payment-page">
      {/* ─── Success Modal ─── */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#eff6ff" />
                <circle cx="32" cy="32" r="24" fill="#2563eb" />
                <path
                  d="M20 32l9 9 15-15"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Payment Recorded!</h2>
            <p>Payment has been saved and applied successfully.</p>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="payment-header">
        <button
          className="back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>
        <div className="header-divider" />
        <div className="header-text">
          <h1>{prefillBillId ? "Record Payment" : "Add Payment"}</h1>
          {prefillBill && (
            <span className="header-sub">
              {prefillBill.billNumber} ·{" "}
              {prefillBill.customerName || prefillBill.customer?.customerName}
            </span>
          )}
        </div>
        <div className="header-actions">
          <span className="header-badge">New Entry</span>
        </div>
      </div>

      {/* ─── Two-panel body ─── */}
      <div className="ap-body">
        {/* ════ LEFT: Form ════ */}
        <div className="ap-main">
          <form onSubmit={handleSubmit}>
            {/* ── Section 1: Category ── */}
            <div className="ap-section-block">
              <div className="ap-section-label">
                <span className="asl-num">1</span>
                <span className="asl-title">Payment Category</span>
                <span className="asl-line" />
              </div>

              <div className="ap-grid-2">
                <div className="form-group">
                  <label htmlFor="type">
                    Payment Type <span className="fg-req">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInput}
                    className={errors.type ? "has-error" : ""}
                  >
                    <option value="">Select type…</option>
                    <option value="credit">Credit — Money Received</option>
                    <option value="debit">Debit — Money Paid</option>
                  </select>
                  {errors.type && (
                    <span className="fg-error">{errors.type}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="subType">
                    Sub Type <span className="fg-req">*</span>
                  </label>
                  <select
                    id="subType"
                    name="subType"
                    value={formData.subType}
                    onChange={handleInput}
                    className={errors.subType ? "has-error" : ""}
                  >
                    <option value="">Select sub type…</option>
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="cash-deposit">Cash Deposit</option>
                    <option value="cash-withdrawal">Cash Withdrawal</option>
                    <option value="bank-charges">Bank Charges</option>
                    <option value="electricity-bill">Electricity Bill</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                  {errors.subType && (
                    <span className="fg-error">{errors.subType}</span>
                  )}
                </div>
              </div>

              {/* Customer picker */}
              {formData.subType === "customer" && (
                <>
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label htmlFor="customerId">
                      Customer <span className="fg-req">*</span>
                    </label>
                    <select
                      id="customerId"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleCustomerChange}
                      className={errors.customerId ? "has-error" : ""}
                    >
                      <option value="">Select customer…</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.customerName ||
                            c.businessName ||
                            `Customer ${c.id}`}
                        </option>
                      ))}
                    </select>
                    {errors.customerId && (
                      <span className="fg-error">{errors.customerId}</span>
                    )}
                  </div>

                  {/* Customer info strip */}
                  {formData.customerId && (
                    <div
                      className="ap-customer-strip"
                      style={{ marginTop: 12 }}
                    >
                      <div className="ap-cs-item">
                        <div className="ap-cs-lbl">Address</div>
                        <div className="ap-cs-val">
                          {formData.homeAddress || "—"}
                        </div>
                      </div>
                      <div className="ap-cs-item">
                        <div className="ap-cs-lbl">GST Number</div>
                        <div className="ap-cs-val">
                          {formData.gstNumber || "—"}
                        </div>
                      </div>
                      <div className="ap-cs-item">
                        <div className="ap-cs-lbl">
                          {prefillBillId
                            ? "Pending Amount"
                            : "Total Outstanding"}
                        </div>
                        <div className="ap-cs-val big">
                          {fmtAmt(formData.totalOutstanding)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invoices */}
                  {formData.customerId &&
                    (loadingInvoices ? (
                      <div
                        className="loading-invoices"
                        style={{ marginTop: 16 }}
                      >
                        <div className="spinner" />
                        <p>Loading pending invoices…</p>
                      </div>
                    ) : (
                      pendingInvoices.length > 0 && (
                        <div className="invoices-section">
                          <div className="inv-section-header">
                            <h3>Adjust Against Invoices</h3>
                            <span className="inv-count">
                              {pendingInvoices.length}
                            </span>
                          </div>
                          {pendingInvoices.map((inv) => (
                            <div key={inv.id} className="invoice-item">
                              <div className="inv-top">
                                <span className="inv-number">
                                  {inv.billNumber ||
                                    inv.challanNumber ||
                                    `Invoice #${inv.id}`}
                                </span>
                                <span className="inv-date">
                                  {new Date(
                                    inv.billDate || inv.invoiceDate,
                                  ).toLocaleDateString("en-IN")}
                                </span>
                              </div>
                              <div className="inv-chips">
                                <span className="chip total">
                                  Total: {fmtAmt(inv.totalAmount)}
                                </span>
                                <span className="chip paid">
                                  Paid: {fmtAmt(inv.paidAmount || 0)}
                                </span>
                                <span className="chip pend">
                                  Pending: {fmtAmt(inv.pendingAmount)}
                                </span>
                              </div>
                              <div className="inv-pay-row">
                                <span className="ipr-label">Pay Amount:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={
                                    formData.adjustedInvoices.find(
                                      (i) => i.billId === inv.id,
                                    )?.payAmount || ""
                                  }
                                  onChange={(e) =>
                                    handleInvoiceAmt(inv.id, e.target.value)
                                  }
                                />
                                <button
                                  type="button"
                                  className="pay-full-btn"
                                  onClick={() =>
                                    handleInvoiceAmt(
                                      inv.id,
                                      parseFloat(inv.pendingAmount).toFixed(2),
                                    )
                                  }
                                >
                                  Pay Full
                                </button>
                              </div>
                            </div>
                          ))}
                          {formData.adjustedInvoices.length > 0 && (
                            <div className="adjusted-summary">
                              <span className="adj-lbl">Total Adjusted</span>
                              <strong>{fmtAmt(totalAdjusted())}</strong>
                            </div>
                          )}
                          {errors.adjustedInvoices && (
                            <span
                              className="fg-error"
                              style={{ marginTop: 8, display: "flex" }}
                            >
                              {errors.adjustedInvoices}
                            </span>
                          )}
                        </div>
                      )
                    ))}
                </>
              )}
            </div>

            {/* ── Section 2: Payment Details ── */}
            <div className="ap-section-block">
              <div className="ap-section-label">
                <span className="asl-num">2</span>
                <span className="asl-title">Payment Details</span>
                <span className="asl-line" />
              </div>

              <div className="ap-grid-3">
                <div className="form-group">
                  <label htmlFor="paymentDate">
                    Payment Date <span className="fg-req">*</span>
                  </label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInput}
                    className={errors.paymentDate ? "has-error" : ""}
                  />
                  {errors.paymentDate && (
                    <span className="fg-error">{errors.paymentDate}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="amount">
                    Amount (₹) <span className="fg-req">*</span>
                  </label>
                  <div className="ap-amount-row">
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInput}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={errors.amount ? "has-error" : ""}
                    />
                    {prefillBillId && (
                      <button
                        type="button"
                        className="pay-full-btn-main"
                        onClick={() => {
                          const tot = parseFloat(
                            prefillBill.totalWithGST ||
                              prefillBill.totalAmount ||
                              0,
                          );
                          const pd = parseFloat(prefillBill.paidAmount || 0);
                          const pend = (tot - pd).toFixed(2);
                          setFormData((p) => ({ ...p, amount: pend }));
                          if (pendingInvoices.length === 1)
                            handleInvoiceAmt(pendingInvoices[0].id, pend);
                        }}
                      >
                        Full Paid
                      </button>
                    )}
                  </div>
                  {errors.amount && (
                    <span className="fg-error">{errors.amount}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="reference">Reference / UTR</label>
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInput}
                    placeholder="e.g. UTR, cheque no."
                  />
                </div>
              </div>

              {/* Method Pills */}
              <div className="form-group" style={{ marginTop: 18 }}>
                <label>
                  Payment Method <span className="fg-req">*</span>
                </label>
                <div className="ap-method-tabs">
                  {PAYMENT_METHODS.map((m) => (
                    <div className="ap-method-tab" key={m.value}>
                      <input
                        type="radio"
                        id={`m-${m.value}`}
                        name="method"
                        value={m.value}
                        checked={formData.method === m.value}
                        onChange={handleInput}
                      />
                      <label htmlFor={`m-${m.value}`}>{m.label}</label>
                    </div>
                  ))}
                </div>
                {errors.method && (
                  <span className="fg-error" style={{ marginTop: 6 }}>
                    {errors.method}
                  </span>
                )}
              </div>
            </div>

            {/* ── Section 3: Notes & Attachment ── */}
            <div className="ap-section-block">
              <div className="ap-section-label">
                <span className="asl-num">3</span>
                <span className="asl-title">Notes &amp; Attachment</span>
                <span className="asl-line" />
              </div>

              <div className="ap-grid-2">
                <div className="form-group">
                  <label htmlFor="note">Remarks</label>
                  <textarea
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleInput}
                    placeholder="Optional remarks or notes…"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Attachment</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="ap-attachment"
                      name="ap-attachment"
                      onChange={handleFile}
                      style={{ display: "none" }}
                      accept="image/*,.pdf"
                    />
                    {!formData.attachmentFile ? (
                      <label
                        htmlFor="ap-attachment"
                        className="file-upload-label"
                      >
                        <div className="upl-icon">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="3"
                              stroke="#2563eb"
                              strokeWidth="2"
                            />
                            <path
                              d="M12 8v8M8 12h8"
                              stroke="#2563eb"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <span className="upl-main">Click to Upload</span>
                        <span className="upl-hint">
                          Images or PDF · max 5 MB
                        </span>
                      </label>
                    ) : (
                      <div className="file-selected">
                        <div className="file-info">
                          <div className="file-icon">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"
                                stroke="#10b981"
                                strokeWidth="2"
                              />
                              <polyline
                                points="13 2 13 9 20 9"
                                stroke="#10b981"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                          <div className="file-details">
                            <span className="file-name">
                              {formData.attachmentFile.name}
                            </span>
                            <span className="file-size">
                              {(formData.attachmentFile.size / 1024).toFixed(1)}{" "}
                              KB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="remove-file-btn"
                          onClick={removeFile}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 6L6 18M6 6l12 12"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {Object.keys(errors).length > 0 && (
              <div className="error-summary">
                <p>Please fix the following:</p>
                <ul>
                  {Object.values(errors).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small" /> Processing…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12l5 5L19 7"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Save Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ════ RIGHT: Summary Panel ════ */}
        <div className="ap-sidebar">
          <div className="ap-summary-card">
            <div className="asc-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#2563eb"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4l3 3"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Payment Summary
            </div>
            <div className="asc-row">
              <span className="asc-key">Type</span>
              <span className="asc-val">{typeLabel}</span>
            </div>
            <div className="asc-row">
              <span className="asc-key">Sub Type</span>
              <span className="asc-val" style={{ textTransform: "capitalize" }}>
                {formData.subType || "—"}
              </span>
            </div>
            <div className="asc-row">
              <span className="asc-key">Date</span>
              <span className="asc-val">
                {formData.paymentDate
                  ? new Date(formData.paymentDate).toLocaleDateString("en-IN")
                  : "—"}
              </span>
            </div>
            <div className="asc-row">
              <span className="asc-key">Amount</span>
              <span className="asc-val accent">
                {formData.amount ? fmtAmt(formData.amount) : "—"}
              </span>
            </div>
            <div className="asc-row">
              <span className="asc-key">Method</span>
              <span className="asc-val">{methodLabel}</span>
            </div>
            {formData.reference && (
              <div className="asc-row">
                <span className="asc-key">Reference</span>
                <span className="asc-val">{formData.reference}</span>
              </div>
            )}
            <div className="asc-row">
              <span className="asc-key">Status</span>
              <span className="ap-status-pill pending">Pending</span>
            </div>
          </div>

          {/* Customer Outstanding box (if applicable) */}
          {formData.subType === "customer" && formData.customerId && (
            <div className="ap-summary-card">
              <div className="asc-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Customer Info
              </div>
              <div className="asc-row">
                <span className="asc-key">
                  {prefillBillId ? "Pending" : "Outstanding"}
                </span>
                <span className="asc-val accent">
                  {fmtAmt(formData.totalOutstanding)}
                </span>
              </div>
              {formData.adjustedInvoices.length > 0 && (
                <div className="asc-row">
                  <span className="asc-key">Adjusted</span>
                  <span className="asc-val success">
                    {fmtAmt(totalAdjusted())}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPayment;
