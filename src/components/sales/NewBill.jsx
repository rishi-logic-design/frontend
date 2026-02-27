import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiSettings,
  FiCheckCircle,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiClock,
  FiPlusCircle,
  FiSlash,
  FiInfo,
  FiChevronDown,
  FiAlertCircle,
  FiRefreshCcw,
} from "react-icons/fi";
import { MdCloudUpload } from "react-icons/md";
import billService from "../../services/billService";
import challanService from "../../services/challanService";
import customerService from "../../services/customerService";
import invoiceSettingsService from "../../services/invoiceServiceSettings";
import productService from "../../services/productService";
import { toast } from "react-toastify";
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
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [availableChallans, setAvailableChallans] = useState([]);
  const [selectedChallans, setSelectedChallans] = useState([]);
  const [useManualMode, setUseManualMode] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [formData, setFormData] = useState({
    customer: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    note: "",
  });

  const [invoiceSettings, setInvoiceSettings] = useState(null);
  const [customPrefix, setCustomPrefix] = useState("");
  const [useCustomPrefix, setUseCustomPrefix] = useState(false);

  const [manualItems, setManualItems] = useState([{ ...EMPTY_ITEM }]);

  const [discount, setDiscount] = useState(0);
  const [gstType, setGstType] = useState("not_applicable");
  const [gst, setGst] = useState(0);

  const [terms, setTerms] = useState([...DEFAULT_TERMS]);
  const [newTerm, setNewTerm] = useState("");
  const [showTermModal, setShowTermModal] = useState(false);

  const [enableStamp, setEnableStamp] = useState(false);
  const [stampFile, setStampFile] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);
  const [stampUrl, setStampUrl] = useState(null);
  const [stampUploading, setStampUploading] = useState(false);
  const [stampProgress, setStampProgress] = useState(0);

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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const vendorId = getVendorId();
        if (!vendorId) {
          navigate("/login");
          return;
        }
        const [custRes, settingsRes, prodRes, catRes, sizeRes] =
          await Promise.all([
            customerService.getCustomers(vendorId),
            invoiceSettingsService.getInvoiceSettings(),
            productService.getProducts(),
            productService.getCategories(vendorId),
            productService.getSizes(vendorId),
          ]);
        const list =
          custRes?.data?.rows ||
          custRes?.rows ||
          (Array.isArray(custRes) ? custRes : []);
        setCustomers(list);
        setInvoiceSettings(settingsRes);
        const productList = Array.isArray(prodRes?.products)
          ? prodRes.products
          : Array.isArray(prodRes)
            ? prodRes
            : [];
        setProducts(productList);
        setCategories(catRes || []);
        setSizes(sizeRes || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const handleModeToggle = (checked) => {
    setUseManualMode(checked);
    setSelectedChallans([]);
    if (checked) {
      if (manualItems.length === 0) setManualItems([{ ...EMPTY_ITEM }]);
      setDiscount(0);
      setGstType("not_applicable");
      setGst(0);
    }
  };

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
          challanNo: chNo(c),
        })),
      );

  const chNo = (ch) => ch.challanNo || ch.challanNumber || ch._id || ch.id;

  const addItem = () => setManualItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) =>
    manualItems.length > 1 &&
    setManualItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i, f, v) =>
    setManualItems((p) => {
      const n = [...p];
      n[i] = { ...n[i], [f]: v };

      // If choosing a product by name from datalist
      if (f === "itemName") {
        const cleanV = v.split(" (")[0].trim();
        const found = products.find(
          (x) => (x.name || "").toLowerCase() === cleanV.toLowerCase(),
        );
        if (found) {
          const firstSize = found.productSizes?.[0] || {};
          n[i] = {
            ...n[i],
            itemName: found.name, // normalize name
            hsn: found.hsn || n[i].hsn,
            unit: found.unit || n[i].unit || "pcs",
            price:
              firstSize.price || found.salePrice || found.price || n[i].price,
            gst: found.gst ? `gst_${found.gst}` : n[i].gst,
            productId: found._id || found.id,
          };
        } else {
          n[i].productId = null; // Mark as new product
        }
      }
      return n;
    });

  const calcItemTotal = (it) => {
    const base = toNum(it.qty) * toNum(it.price);
    const afterDisc = base - (base * toNum(it.discount)) / 100;
    const gstAmt = (afterDisc * gstValToPercent(it.gst)) / 100;
    return +(afterDisc + gstAmt).toFixed(2);
  };

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
    const numValue = invoiceSettings?.currentCount || 1001;
    const num = String(numValue).padStart(
      String(invoiceSettings?.startCount || 1001).length,
      "0",
    );
    return `${prefix}${num}`;
  };

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

  const addTerm = () => {
    if (newTerm.trim()) {
      setTerms((p) => [...p, newTerm.trim()]);
      setNewTerm("");
      setShowTermModal(false);
    }
  };
  const removeTerm = (i) => setTerms((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!formData.customer) return toast.error("Please select a customer");
    if (useManualMode) {
      const valid = manualItems.filter(
        (it) => it.itemName && toNum(it.qty) > 0 && toNum(it.price) > 0,
      );
      if (!valid.length) return toast.error("Add at least one item");
    } else {
      if (!selectedChallans.length)
        return toast.error("Please select at least one challan");
    }

    try {
      setLoading(true);
      let finalStampUrl = stampUrl;
      if (enableStamp && stampFile && !stampUrl)
        finalStampUrl = await uploadStampToFirebase();

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
        // Create new products first if they don't exist in our list
        for (let i = 0; i < manualItems.length; i++) {
          const it = manualItems[i];
          if (it.itemName && !it.productId) {
            try {
              const newProd = await productService.createProduct({
                name: it.itemName,
                categoryId: categories[0]?.id || 1, // Fallback to first cat
                productSizes: [
                  {
                    sizeId: sizes[0]?.id || 1, // Fallback to first size
                    price: parseFloat(it.price) || 0,
                    stock: 0,
                  },
                ],
              });
              it.productId = newProd._id || newProd.id;
            } catch (err) {
              console.error("Auto-product creation failed:", err);
            }
          }
        }

        payload.items = manualItems
          .filter(
            (it) => it.itemName && toNum(it.qty) > 0 && toNum(it.price) > 0,
          )
          .map((it) => ({
            productId: it.productId || null,
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
      toast.success("Invoice generated!");
      navigate("/vendor/bills");
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Failed to generate bill",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-bill-page">
      {/* ── Header ── */}
      <div className="nb-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <div className="nb-header__text">
          <h1>Create New Invoice</h1>
          <p>Fill in the details to generate a professional tax invoice.</p>
        </div>
      </div>

      <div className="nb-body">
        <div className="nb-main">
          {/* 1. Basic Information */}
          <div className="nb-card">
            <div className="nb-card__title">
              <FiUser className="title-icon" /> Basic Information
            </div>
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
                      {c.customerName || c.name}{" "}
                      {c.businessName ? `— ${c.businessName}` : ""}
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

            {formData.customer && (
              <div className="nb-customer-preview">
                {(() => {
                  const sel = customers.find(
                    (c) => (c._id || c.id) === formData.customer,
                  );
                  if (!sel) return null;
                  return (
                    <>
                      <div className="cp-row">
                        <strong>Business:</strong>{" "}
                        <span>{sel.businessName || "N/A"}</span>
                      </div>
                      <div className="cp-row">
                        <strong>GSTIN:</strong>{" "}
                        <span>{sel.gstNumber || "N/A"}</span>
                      </div>
                      <div className="cp-row">
                        <strong>Address:</strong>{" "}
                        <span>{sel.address || "N/A"}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 2. Configuration & Items */}
          {!formData.customer ? (
            <div className="nb-card nb-card--empty">
              <div className="nb-empty-state">
                <FiUser />
                <p>Please select a customer to continue with the invoice.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="nb-card">
                <div className="nb-card__title">
                  <FiSettings className="title-icon" /> Invoice Configuration
                </div>

                <div className="mode-toggle-section">
                  <label className="mode-option" data-active={!useManualMode}>
                    <input
                      type="radio"
                      name="billMode"
                      checked={!useManualMode}
                      onChange={() => handleModeToggle(false)}
                    />
                    <div className="mode-option__content">
                      <div className="mode-icon">
                        <FiFileText />
                      </div>
                      <div className="mode-text">
                        <span className="mode-title">From Challans</span>
                        <span className="mode-desc">
                          Link unpaid delivery notes
                        </span>
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
                      <div className="mode-icon">
                        <FiPlusCircle />
                      </div>
                      <div className="mode-text">
                        <span className="mode-title">Manual Entry</span>
                        <span className="mode-desc">Individual line items</span>
                      </div>
                    </div>
                  </label>
                </div>

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
                  <div className="nb-group" style={{ marginTop: 12 }}>
                    <label>Custom Prefix</label>
                    <input
                      type="text"
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value)}
                      placeholder={invoiceSettings?.prefix || "INV"}
                      maxLength={10}
                    />
                  </div>
                )}
              </div>

              {/* 3. Dynamic Items Mode */}
              {!useManualMode && formData.customer && (
                <div className="nb-card">
                  <div className="nb-card__title">
                    <FiClock /> Select Unpaid Challans
                  </div>
                  {availableChallans.length === 0 ? (
                    <div className="nb-empty">
                      <FiAlertCircle style={{ marginRight: 8 }} /> No unpaid
                      challans for this customer.
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
                                #{chNo(ch).slice(-8)}
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
                                {new Date(ch.challanDate).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" },
                                )}
                              </span>
                            </div>
                            <div className="ch-row">
                              <span>Amount</span>
                              <span>
                                ₹
                                {(
                                  ch.subtotal ||
                                  ch.total ||
                                  0
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="ch-badge">
                              {(ch.items || []).length} Items
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {challanItems.length > 0 && (
                    <div className="nb-items-preview">
                      <div className="nb-card__sub">Selected Items Preview</div>
                      <div className="tbl-wrap">
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Description</th>
                              <th style={{ textAlign: "center" }}>Qty</th>
                              <th style={{ textAlign: "right" }}>Rate</th>
                              <th style={{ textAlign: "right" }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {challanItems.map((it, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>
                                  {it.productName || "—"}{" "}
                                  <span
                                    className="badge"
                                    style={{ fontSize: 9, padding: "1px 5px" }}
                                  >
                                    {it.challanNo}
                                  </span>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  {it.qty} {it.unit}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  ₹
                                  {toNum(
                                    it.pricePerUnit || it.price,
                                  ).toLocaleString()}
                                </td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    fontWeight: 700,
                                    color: "#2563eb",
                                  }}
                                >
                                  ₹
                                  {(
                                    toNum(it.pricePerUnit || it.price) *
                                    toNum(it.qty)
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

              {useManualMode && (
                <div className="nb-card">
                  <div className="nb-card__title-row">
                    <span className="nb-card__title">Line Items</span>
                    <button className="btn-add-item" onClick={addItem}>
                      <FiPlus /> Add Item
                    </button>
                  </div>
                  <div className="nb-items-scroll">
                    <table className="nb-items-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Item Name</th>
                          <th style={{ width: 80 }}>HSN</th>
                          <th style={{ width: 60 }}>Qty</th>
                          <th style={{ width: 60 }}>Unit</th>
                          <th style={{ width: 100 }}>Price</th>
                          <th style={{ width: 60 }}>Disc %</th>
                          <th style={{ width: 90 }}>GST</th>
                          <th style={{ textAlign: "right", width: 120 }}>
                            Total
                          </th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {manualItems.map((item, i) => (
                          <tr key={i}>
                            <td className="idx">{i + 1}</td>
                            <td>
                              <input
                                className="inp"
                                type="text"
                                placeholder="Description"
                                list="product-list"
                                value={item.itemName}
                                onChange={(e) =>
                                  updateItem(i, "itemName", e.target.value)
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="inp"
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
                                className="inp"
                                type="number"
                                value={item.qty}
                                onChange={(e) =>
                                  updateItem(i, "qty", e.target.value)
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="inp"
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
                                className="inp"
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  updateItem(i, "price", e.target.value)
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="inp"
                                type="number"
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
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Notes & Terms */}
              <div className="nb-card">
                <div className="nb-card__title-row">
                  <span className="nb-card__title">Terms & Conditions</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className="nb-btn-dashed"
                      onClick={() => setShowTermModal(true)}
                    >
                      <FiPlusCircle /> Manual Term
                    </button>
                    <button
                      className="nb-btn-outline-sm"
                      onClick={() => setTerms([...DEFAULT_TERMS])}
                    >
                      <FiRefreshCcw /> Reset Default
                    </button>
                  </div>
                </div>
                <div className="nb-terms-list">
                  {terms.length === 0 ? (
                    <p className="nb-empty">No terms added.</p>
                  ) : (
                    terms.map((t, i) => (
                      <div key={i} className="nb-term-item">
                        <span className="ti-num">{i + 1}</span>
                        <span className="ti-txt">{t}</span>
                        <button
                          className="ti-del"
                          onClick={() => removeTerm(i)}
                        >
                          <FiSlash />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="nb-term-suggestions">
                  {[
                    "Goods once sold will not be taken back.",
                    "Subject to local jurisdiction.",
                  ]
                    .filter((d) => !terms.includes(d))
                    .map((s, i) => (
                      <button
                        key={i}
                        className="sug-chip"
                        onClick={() => setTerms((p) => [...p, s])}
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>

              {/* 5. Additional Remarks */}
              <div className="nb-card">
                <div className="nb-card__title">Additional Remarks</div>
                <div className="nb-group">
                  <textarea
                    rows={3}
                    placeholder="Add any notes or internal remarks here…"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="nb-aside">
          <div className="nb-summary">
            <div className="nb-summary__title">Quick Summary</div>
            <div className="nb-summary__row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            {!useManualMode && (
              <>
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
                    <span>Reduction</span>
                    <span>−₹{discountAmt.toLocaleString()}</span>
                  </div>
                )}
                <div className="nb-summary__row">
                  <span>Tax (GST)</span>
                  <select
                    value={gstType === "percentage" ? `gst_${gst}` : gstType}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (
                        ["not_applicable", "exempted", "non_gst"].includes(v)
                      ) {
                        setGstType(v);
                        setGst(0);
                      } else {
                        setGstType("percentage");
                        setGst(parseFloat(v.replace("gst_", "")));
                      }
                    }}
                  >
                    <option value="not_applicable">None</option>
                    <option value="gst_5">5%</option>
                    <option value="gst_12">12%</option>
                    <option value="gst_18">18%</option>
                    <option value="gst_28">28%</option>
                  </select>
                </div>
                {gstType === "percentage" && gst > 0 && (
                  <div className="nb-summary__row sub">
                    <span>GST {gst}%</span>
                    <span>+₹{gstAmt.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}

            <div className="nb-summary__row total">
              <span>Total Due</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            <div className="nb-actions">
              <button
                className="nb-btn nb-btn--generate"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !formData.customer ||
                  (useManualMode ? false : selectedChallans.length === 0)
                }
              >
                {loading ? "Generating…" : "Generate Invoice"}
              </button>
              <button
                className="nb-btn nb-btn--cancel"
                onClick={() => navigate(-1)}
              >
                Discard
              </button>
            </div>
          </div>

          <div
            className="nb-card"
            style={{
              borderStyle: "dashed",
              background: "#f8fafc",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                color: "#64748b",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <FiInfo style={{ color: "#2563eb" }} />
              <span>
                Invoice will be recorded as pending until payment is received.
              </span>
            </div>
          </div>
        </div>
      </div>

      <datalist id="product-list">
        {products.map((p) => {
          const size = p.productSizes?.[0]?.size?.inches || "";
          const display = size ? `${p.name} (${size}")` : p.name;
          return <option key={p._id || p.id} value={display} />;
        })}
      </datalist>

      {/* Term Modal */}
      {showTermModal && (
        <div
          className="nb-modal-overlay"
          onClick={() => setShowTermModal(false)}
        >
          <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nb-modal__head">
              <span>Add Condition</span>
              <button onClick={() => setShowTermModal(false)}>✕</button>
            </div>
            <textarea
              autoFocus
              rows={4}
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Type a new term or condition…"
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
                Add Term
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBill;
