import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdAdd, MdCloudUpload } from "react-icons/md";
import billService from "../../services/billService";
import challanService from "../../services/challanService";
import customerService from "../../services/customerService";
import invoiceSettingsService from "../../services/invoiceServiceSettings";
import { useNotifications } from "../../context/NotificationContext";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import "./newBill.scss";

const toNum = (v) => parseFloat(v || 0);
const gstValToPercent = (v) =>
  v?.startsWith?.("gst_") ? parseFloat(v.replace("gst_", "")) : 0;

const EMPTY_ITEM = {
  itemName: "",
  hsn: "",
  qty: "",
  unit: "",
  price: "",
  discount: 0,
  gst: "not_applicable",
};

const DEFAULT_TERMS = [
  "This is an electronically generated document.",
  "All disputes are subject to seller city jurisdiction.",
];

const NewBill = () => {
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [availableChallans, setAvailableChallans] = useState([]);
  const [selectedChallans, setSelectedChallans] = useState([]);

  // mode
  const [useManualMode, setUseManualMode] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    note: "",
  });

  // invoice number
  const [invoiceSettings, setInvoiceSettings] = useState(null);
  const [customPrefix, setCustomPrefix] = useState("");
  const [useCustomPrefix, setUseCustomPrefix] = useState(false);

  // manual items
  const [manualItems, setManualItems] = useState([{ ...EMPTY_ITEM }]);

  // bill-level discount + GST
  const [discount, setDiscount] = useState(0);
  const [gstType, setGstType] = useState("not_applicable");
  const [gst, setGst] = useState(0);

  // terms
  const [terms, setTerms] = useState([...DEFAULT_TERMS]);
  const [newTerm, setNewTerm] = useState("");
  const [showTermModal, setShowTermModal] = useState(false);

  // stamp
  const [enableStamp, setEnableStamp] = useState(false);
  const [stampFile, setStampFile] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);
  const [stampUrl, setStampUrl] = useState(null); // firebase URL
  const [stampUploading, setStampUploading] = useState(false);
  const [stampProgress, setStampProgress] = useState(0);

  // ── vendor id ──────────────────────────────────────────────────────────────
  const getVendorId = () => {
    for (const key of ["vendorData", "userData"]) {
      try {
        const p = JSON.parse(localStorage.getItem(key) || "{}");
        const id = p.vendorId || p._id || p.id;
        if (id) return id;
      } catch {}
    }
    return null;
  };

  // ── init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const vendorId = getVendorId();
        if (!vendorId) {
          navigate("/login");
          return;
        }
        const res = await customerService.getCustomers(vendorId);
        const list =
          res?.data?.rows || res?.rows || (Array.isArray(res) ? res : []);
        setCustomers(list);
        const settings = await invoiceSettingsService.getInvoiceSettings();
        setInvoiceSettings(settings);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── customer change ────────────────────────────────────────────────────────
  const handleCustomerChange = async (customerId) => {
    setFormData((p) => ({ ...p, customer: customerId }));
    setSelectedChallans([]);
    setAvailableChallans([]);
    if (!customerId) return;
    try {
      setLoading(true);
      const res = await challanService.getChallans({
        customerId,
        status: "unpaid",
      });
      const list = res?.data || res?.rows || (Array.isArray(res) ? res : []);
      setAvailableChallans(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── mode toggle ────────────────────────────────────────────────────────────
  const handleModeToggle = (checked) => {
    setUseManualMode(checked);
    setSelectedChallans([]);
    if (checked && manualItems.length === 0)
      setManualItems([{ ...EMPTY_ITEM }]);
  };

  // ── challan helpers ────────────────────────────────────────────────────────
  const toggleChallan = (id) =>
    setSelectedChallans((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const getChallanItems = () =>
    availableChallans
      .filter((c) => selectedChallans.includes(c._id || c.id))
      .flatMap((c) =>
        (c.items || []).map((it) => ({
          ...it,
          challanNo: c.challanNo || c.challanNumber || c.id,
        })),
      );

  // ── manual item helpers ────────────────────────────────────────────────────
  const addItem = () => setManualItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) =>
    manualItems.length > 1 &&
    setManualItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i, f, v) =>
    setManualItems((p) => {
      const n = [...p];
      n[i] = { ...n[i], [f]: v };
      return n;
    });

  const calcItemTotal = (it) => {
    const base = toNum(it.qty) * toNum(it.price);
    const afterDisc = base - (base * toNum(it.discount)) / 100;
    const gstAmt = (afterDisc * gstValToPercent(it.gst)) / 100;
    return +(afterDisc + gstAmt).toFixed(2);
  };

  // ── summary maths ──────────────────────────────────────────────────────────
  const challanItems = getChallanItems();

  const subtotal = useManualMode
    ? +manualItems
        .reduce((s, it) => s + toNum(it.qty) * toNum(it.price), 0)
        .toFixed(2)
    : +challanItems
        .reduce((s, it) => s + (it.pricePerUnit || 0) * (it.qty || 0), 0)
        .toFixed(2);

  const discountAmt = +((subtotal * discount) / 100).toFixed(2);
  const gstAmt =
    gstType === "percentage"
      ? +(((subtotal - discountAmt) * gst) / 100).toFixed(2)
      : 0;
  const total = +(subtotal - discountAmt + gstAmt).toFixed(2);

  const getPreviewNum = () => {
    const prefix =
      useCustomPrefix && customPrefix.trim()
        ? customPrefix.trim().toUpperCase()
        : invoiceSettings?.prefix || "INV";
    const num = String(invoiceSettings?.currentCount || 1001).padStart(
      String(invoiceSettings?.startCount || 1001).length,
      "0",
    );
    return `${prefix}${num}`;
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  // ── stamp upload → firebase ────────────────────────────────────────────────
  const handleStampSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStampFile(file);
    setStampUrl(null);
    const reader = new FileReader();
    reader.onloadend = () => setStampPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadStampToFirebase = () => {
    if (!stampFile) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      setStampUploading(true);
      setStampProgress(0);
      const path = `stamps/${getVendorId()}/${Date.now()}_${stampFile.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, stampFile);
      task.on(
        "state_changed",
        (snap) =>
          setStampProgress(
            Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
          ),
        (err) => {
          setStampUploading(false);
          reject(err);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setStampUrl(url);
          setStampUploading(false);
          resolve(url);
        },
      );
    });
  };

  // ── terms helpers ──────────────────────────────────────────────────────────
  const addTerm = () => {
    if (newTerm.trim()) {
      setTerms((p) => [...p, newTerm.trim()]);
      setNewTerm("");
      setShowTermModal(false);
    }
  };
  const removeTerm = (i) => setTerms((p) => p.filter((_, idx) => idx !== i));

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.customer) return alert("Please select a customer");

    if (useManualMode) {
      const valid = manualItems.filter(
        (it) => it.itemName && toNum(it.qty) > 0 && toNum(it.price) > 0,
      );
      if (!valid.length)
        return alert("Add at least one item with name, qty and price");
    } else {
      if (!selectedChallans.length)
        return alert("Please select at least one challan");
    }

    try {
      setLoading(true);

      // Upload stamp if needed
      let finalStampUrl = stampUrl;
      if (enableStamp && stampFile && !stampUrl) {
        finalStampUrl = await uploadStampToFirebase();
      }

      const payload = {
        customerId: formData.customer,
        billDate: formData.invoiceDate,
        note: formData.note || undefined,
        discountPercent: discount,
        gstPercent: gstType === "percentage" ? gst : 0,
        termsAndConditions: terms,
        signatureStamp: enableStamp ? finalStampUrl || null : null,
        showSignatureStamp: enableStamp,
      };

      if (useCustomPrefix && customPrefix.trim())
        payload.customInvoicePrefix = customPrefix.trim().toUpperCase();

      if (useManualMode) {
        payload.items = manualItems
          .filter(
            (it) => it.itemName && toNum(it.qty) > 0 && toNum(it.price) > 0,
          )
          .map((it) => ({
            itemName: it.itemName,
            hsn: it.hsn || null,
            qty: toNum(it.qty),
            unit: it.unit || null,
            price: toNum(it.price),
            discount: toNum(it.discount),
            gstPercent: gstValToPercent(it.gst),
          }));
      } else {
        payload.challanIds = selectedChallans;
      }

      await billService.createBill(payload);
      await fetchNotifications();
      alert("Bill generated successfully!");
      navigate("/vendor/bills");
    } catch (e) {
      console.error(e);
      alert(
        e.response?.data?.message || e.message || "Failed to generate bill",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-bill-page">
      <div className="nb-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="nb-header__text">
          <h1>✨ Create New Invoice</h1>
          <p>Generate professional invoices in seconds</p>
        </div>
      </div>

      <div className="nb-body">
        <div className="nb-main">
          <div className="nb-card">
            <div className="nb-card__title">Basic Information</div>
            <div className="nb-row">
              <div className="nb-group">
                <label>
                  Customer <span className="req">*</span>
                </label>
                <select
                  value={formData.customer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.customerName || c.name} — {c.businessName || "N/A"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="nb-group">
                <label>
                  Invoice Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Invoice Number & Mode Selection ── */}
          {invoiceSettings && (
            <div className="nb-card nb-invoice-mode-card">
              <div className="nb-card__title">Invoice Configuration</div>

              {/* Mode Toggle */}
              <div className="mode-toggle-section">
                <label className="mode-option" data-active={!useManualMode}>
                  <input
                    type="radio"
                    name="billMode"
                    checked={!useManualMode}
                    onChange={() => handleModeToggle(false)}
                  />
                  <div className="mode-option__content">
                    <div className="mode-icon">📋</div>
                    <div className="mode-text">
                      <span className="mode-title">From Challans</span>
                      <span className="mode-desc">Select unpaid challans</span>
                    </div>
                  </div>
                </label>

                <label className="mode-option" data-active={useManualMode}>
                  <input
                    type="radio"
                    name="billMode"
                    checked={useManualMode}
                    onChange={() => handleModeToggle(true)}
                  />
                  <div className="mode-option__content">
                    <div className="mode-icon">✍️</div>
                    <div className="mode-text">
                      <span className="mode-title">Manual Entry</span>
                      <span className="mode-desc">Add items directly</span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Invoice Number Preview */}
              <div className="nb-inv-preview">
                <span className="nb-inv-preview__label">
                  Next Invoice Number
                </span>
                <span className="nb-inv-preview__num">{getPreviewNum()}</span>
              </div>

              <label className="nb-check-row">
                <input
                  type="checkbox"
                  checked={useCustomPrefix}
                  onChange={(e) => setUseCustomPrefix(e.target.checked)}
                />
                <span>Use custom prefix for this bill</span>
              </label>
              {useCustomPrefix && (
                <div className="nb-group mt8">
                  <label>Custom Prefix</label>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    placeholder={invoiceSettings.prefix}
                    maxLength={10}
                  />
                  <span className="nb-hint">
                    Default: {invoiceSettings.prefix}
                  </span>
                </div>
              )}
            </div>
          )}

          {!useManualMode && formData.customer && (
            <div className="nb-card">
              <div className="nb-card__title">Select Challans</div>
              {availableChallans.length === 0 ? (
                <div className="nb-empty">
                  No unpaid challans found for this customer.
                </div>
              ) : (
                <div className="nb-challans">
                  {availableChallans.map((ch) => {
                    const id = ch._id || ch.id;
                    const sel = selectedChallans.includes(id);
                    return (
                      <label
                        key={id}
                        className={`nb-challan-card${sel ? " sel" : ""}`}
                      >
                        <div className="nb-challan-card__head">
                          <span className="ch-num">
                            {ch.challanNo || ch.challanNumber || id}
                          </span>
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => toggleChallan(id)}
                          />
                        </div>
                        <div className="ch-row">
                          <span>Date</span>
                          <span>
                            {ch.challanDate
                              ? formatDate(ch.challanDate)
                              : "N/A"}
                          </span>
                        </div>
                        <div className="ch-row">
                          <span>Amount</span>
                          <span>
                            ₹{(ch.subtotal || ch.total || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="ch-badge">
                          {(ch.items || []).length} items
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* items preview */}
              {challanItems.length > 0 && (
                <div className="nb-items-preview">
                  <div className="nb-card__sub">
                    Items from selected challans
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Item</th>
                          <th>Challan</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {challanItems.map((it, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{it.productName || "—"}</td>
                            <td>
                              <span className="badge">{it.challanNo}</span>
                            </td>
                            <td>{it.qty || 0}</td>
                            <td>
                              ₹
                              {(
                                it.pricePerUnit ||
                                it.price ||
                                0
                              ).toLocaleString()}
                            </td>
                            <td className="amt">
                              ₹
                              {(
                                (it.pricePerUnit || it.price || 0) *
                                (it.qty || 0)
                              ).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ MANUAL MODE ═══════════════════════════════════════════════════ */}
          {useManualMode && (
            <div className="nb-card">
              <div className="nb-card__title-row">
                <span className="nb-card__title">Items</span>
                <button className="btn-add-item" onClick={addItem}>
                  <MdAdd /> Add Item
                </button>
              </div>
              <div className="nb-items-scroll">
                <table className="nb-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Name</th>
                      <th>HSN</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Price ₹</th>
                      <th>Disc %</th>
                      <th>GST</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualItems.map((item, i) => (
                      <tr key={i} className={item.itemName ? "filled" : ""}>
                        <td className="idx">{i + 1}</td>
                        <td>
                          <input
                            className="inp inp-name"
                            type="text"
                            placeholder="Item name"
                            value={item.itemName}
                            onChange={(e) =>
                              updateItem(i, "itemName", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="inp inp-sm"
                            type="text"
                            placeholder="—"
                            value={item.hsn}
                            onChange={(e) =>
                              updateItem(i, "hsn", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="inp inp-sm"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(i, "qty", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="inp inp-sm"
                            type="text"
                            placeholder="pcs"
                            value={item.unit}
                            onChange={(e) =>
                              updateItem(i, "unit", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="inp inp-sm"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(i, "price", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="inp inp-sm"
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={item.discount}
                            onChange={(e) =>
                              updateItem(i, "discount", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="sel-gst"
                            value={item.gst}
                            onChange={(e) =>
                              updateItem(i, "gst", e.target.value)
                            }
                          >
                            <option value="not_applicable">—</option>
                            <option value="gst_0">0%</option>
                            <option value="gst_5">5%</option>
                            <option value="gst_12">12%</option>
                            <option value="gst_18">18%</option>
                            <option value="gst_28">28%</option>
                          </select>
                        </td>
                        <td className="total-cell">
                          ₹{calcItemTotal(item).toLocaleString()}
                        </td>
                        <td>
                          <button
                            className="btn-del"
                            onClick={() => removeItem(i)}
                            disabled={manualItems.length === 1}
                          >
                            <MdDelete />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Terms & Conditions ── */}
          <div className="nb-card">
            <div className="nb-card__title-row">
              <span className="nb-card__title">Terms &amp; Conditions</span>
              <div className="terms-actions">
                <button
                  className="btn-sm btn-outline"
                  onClick={() => setTerms([...DEFAULT_TERMS])}
                >
                  Reset
                </button>
                <button
                  className="btn-sm btn-primary"
                  onClick={() => setShowTermModal(true)}
                >
                  + Add Term
                </button>
                {terms.length > 0 && (
                  <button
                    className="btn-sm btn-ghost"
                    onClick={() => setTerms([])}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            <div className="nb-terms-list">
              {terms.length === 0 ? (
                <p className="nb-empty-txt">No terms added.</p>
              ) : (
                terms.map((t, i) => (
                  <div key={i} className="nb-term-item">
                    <span className="ti-num">{i + 1}.</span>
                    <span className="ti-txt">{t}</span>
                    <button className="ti-del" onClick={() => removeTerm(i)}>
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
            {/* quick adds */}
            <div className="nb-term-suggestions">
              {[
                "Goods once sold will not be taken back.",
                "Payment due within 30 days.",
                "Subject to local jurisdiction.",
              ]
                .filter((d) => !terms.includes(d))
                .map((s, i) => (
                  <button
                    key={i}
                    className="sug-chip"
                    onClick={() => setTerms((p) => [...p, s])}
                  >
                    + {s.slice(0, 38)}…
                  </button>
                ))}
            </div>
          </div>

          {/* ── Signature & Stamp ── */}
          <div className="nb-card">
            <div className="nb-card__title-row">
              <span className="nb-card__title">Signature &amp; Stamp</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={enableStamp}
                  onChange={(e) => setEnableStamp(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {enableStamp && (
              <div className="nb-stamp-body">
                <p className="stamp-cert">
                  Certified that the particulars given above are true and
                  correct,
                  <br />
                  <strong>For My Company</strong>
                </p>

                {stampPreview ? (
                  <div className="stamp-preview-wrap">
                    <img src={stampPreview} alt="Stamp" className="stamp-img" />
                    {stampUploading ? (
                      <div className="stamp-progress">
                        <div
                          className="stamp-progress__bar"
                          style={{ width: `${stampProgress}%` }}
                        />
                        <span>{stampProgress}%</span>
                      </div>
                    ) : stampUrl ? (
                      <div className="stamp-uploaded">✓ Uploaded</div>
                    ) : (
                      <button
                        className="btn-sm btn-primary"
                        onClick={uploadStampToFirebase}
                        disabled={stampUploading}
                      >
                        <MdCloudUpload /> Upload to Cloud
                      </button>
                    )}
                    <button
                      className="btn-sm btn-ghost"
                      onClick={() => {
                        setStampFile(null);
                        setStampPreview(null);
                        setStampUrl(null);
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="stamp-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStampSelect}
                      style={{ display: "none" }}
                    />
                    <MdCloudUpload className="dropzone-icon" />
                    <p>Click to select stamp / signature image</p>
                    <span>PNG, JPG — max 2 MB</span>
                  </label>
                )}

                <p className="auth-sig">Authorised Signatory</p>
              </div>
            )}
          </div>
        </div>
        {/* /nb-main */}

        {/* ── Summary Sidebar ── */}
        <div className="nb-aside">
          <div className="nb-summary">
            <div className="nb-summary__title">Summary</div>

            <div className="nb-summary__row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            <div className="nb-summary__row">
              <span>Discount</span>
              <div className="nb-inline-inp">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discount}
                  onChange={(e) => setDiscount(toNum(e.target.value))}
                />
                <span>%</span>
              </div>
            </div>
            {discount > 0 && (
              <div className="nb-summary__row sub">
                <span>Discount amt</span>
                <span>−₹{discountAmt.toLocaleString()}</span>
              </div>
            )}

            <div className="nb-summary__row">
              <span>GST</span>
              <select
                value={gstType === "percentage" ? `gst_${gst}` : gstType}
                onChange={(e) => {
                  const v = e.target.value;
                  if (["not_applicable", "exempted", "non_gst"].includes(v)) {
                    setGstType(v);
                    setGst(0);
                  } else {
                    setGstType("percentage");
                    setGst(parseFloat(v.replace("gst_", "")));
                  }
                }}
              >
                <option value="not_applicable">Not Applicable</option>
                <option value="gst_0">GST @ 0%</option>
                <option value="exempted">Exempted</option>
                <option value="non_gst">Non-GST</option>
                <option value="gst_5">GST @ 5%</option>
                <option value="gst_12">GST @ 12%</option>
                <option value="gst_18">GST @ 18%</option>
                <option value="gst_28">GST @ 28%</option>
              </select>
            </div>
            {gstType === "percentage" && gst > 0 && (
              <div className="nb-summary__row sub">
                <span>GST ({gst}%)</span>
                <span>₹{gstAmt.toLocaleString()}</span>
              </div>
            )}

            <div className="nb-summary__divider" />
            <div className="nb-summary__row total">
              <span>Total Due</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            <div className="nb-actions">
              <button
                className="nb-btn nb-btn--cancel"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                className="nb-btn nb-btn--generate"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !formData.customer ||
                  (useManualMode ? false : selectedChallans.length === 0) ||
                  stampUploading
                }
              >
                {loading ? "Generating…" : "Generate Bill"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /nb-body */}

      {/* ── Terms Modal ── */}
      {showTermModal && (
        <div
          className="nb-modal-overlay"
          onClick={() => setShowTermModal(false)}
        >
          <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nb-modal__head">
              <span>Add Term</span>
              <button onClick={() => setShowTermModal(false)}>✕</button>
            </div>
            <textarea
              autoFocus
              rows={4}
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                (e.preventDefault(), addTerm())
              }
              placeholder="Enter your term or condition…"
            />
            <div className="nb-modal__foot">
              <button
                className="nb-btn nb-btn--cancel"
                onClick={() => {
                  setNewTerm("");
                  setShowTermModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="nb-btn nb-btn--generate"
                onClick={addTerm}
                disabled={!newTerm.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBill;
