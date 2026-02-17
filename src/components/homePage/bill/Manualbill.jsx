import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdAdd } from "react-icons/md";
import billService from "../../../services/billService";
import customerService from "../../../services/customerService";
import invoiceSettingsService from "../../../services/invoiceServiceSettings";
import { useNotifications } from "../../../context/NotificationContext";
import TermsSection from "./TermsSection";
import SignatureSection from "./SignatureSection";
import "./ManualBill.scss";

const EMPTY_ITEM = {
  itemName: "",
  hsn: "",
  qty: 0,
  unit: "",
  price: 0,
  discount: 0,
  gst: "not_applicable",
  taxType: "exclusive",
};

const gstToPercent = (val) =>
  val?.startsWith("gst_") ? parseFloat(val.replace("gst_", "")) : 0;

const calcItemTotal = (item) => {
  const base = (item.qty || 0) * (item.price || 0);
  const afterDisc = base - (base * (item.discount || 0)) / 100;
  const gstAmt = (afterDisc * gstToPercent(item.gst)) / 100;
  return +(afterDisc + gstAmt).toFixed(2);
};

const ManualBill = () => {
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    customer: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    note: "",
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalGstType, setGlobalGstType] = useState("not_applicable");
  const [globalGst, setGlobalGst] = useState(0);

  const [invoiceSettings, setInvoiceSettings] = useState(null);
  const [customPrefix, setCustomPrefix] = useState("");
  const [useCustomPrefix, setUseCustomPrefix] = useState(false);

  // Terms state
  const [termsAndConditions, setTermsAndConditions] = useState([
    "This is an electronically generated document.",
    "All disputes are subject to seller city jurisdiction.",
  ]);

  // Stamp state
  const [enableSignatureStamp, setEnableSignatureStamp] = useState(false);
  const [stampFile, setStampFile] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);

  const getVendorId = () => {
    for (const key of ["vendorData", "userData"]) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const p = JSON.parse(raw);
          const id = p.vendorId || p._id || p.id;
          if (id) return id;
        } catch {}
      }
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

  const addItem = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) =>
    items.length > 1 && setItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) =>
    setItems((p) => {
      const n = [...p];
      n[i] = { ...n[i], [field]: val };
      return n;
    });

  // Totals
  const itemSubtotals = items.map((it) => {
    const base = (it.qty || 0) * (it.price || 0);
    return +(base - (base * (it.discount || 0)) / 100).toFixed(2);
  });
  const subtotal = +itemSubtotals.reduce((s, v) => s + v, 0).toFixed(2);
  const globalDiscAmt = +((subtotal * globalDiscount) / 100).toFixed(2);
  const afterGlobalDisc = +(subtotal - globalDiscAmt).toFixed(2);
  const globalGstAmt =
    globalGstType === "percentage"
      ? +((afterGlobalDisc * globalGst) / 100).toFixed(2)
      : 0;
  const total = +(afterGlobalDisc + globalGstAmt).toFixed(2);

  const getPreviewNumber = () => {
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

  const handleStampUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStampFile(file);
    const r = new FileReader();
    r.onloadend = () => setStampPreview(r.result);
    r.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.customer) return alert("Please select a customer");
    const validItems = items.filter(
      (it) => it.itemName && it.qty > 0 && it.price > 0,
    );
    if (!validItems.length)
      return alert("Add at least one item with name, qty and price");

    try {
      setLoading(true);
      const payload = {
        customerId: formData.customer,
        billDate: formData.invoiceDate,
        note: formData.note || undefined,
        discountPercent: globalDiscount,
        gstPercent: globalGstType === "percentage" ? globalGst : 0,
        termsAndConditions,
        signatureStamp: stampPreview || null,
        showSignatureStamp: enableSignatureStamp,
        items: validItems.map((it) => ({
          itemName: it.itemName,
          hsn: it.hsn || null,
          qty: it.qty,
          unit: it.unit || null,
          price: it.price,
          discount: it.discount || 0,
          gstPercent: gstToPercent(it.gst),
          taxType: it.taxType || "exclusive",
        })),
      };
      if (useCustomPrefix && customPrefix.trim())
        payload.customInvoicePrefix = customPrefix.trim().toUpperCase();

      await billService.createBill(payload);
      await fetchNotifications();
      alert("Bill generated successfully!");
      navigate("/vendor/bills");
    } catch (e) {
      alert(
        e.response?.data?.message || e.message || "Failed to generate bill",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-bill-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="header-text">
          <h1>Create Manual Invoice</h1>
          <p>Add items directly without selecting challans</p>
        </div>
        <button
          className="btn-switch"
          onClick={() => navigate("/vendor/bills/new")}
        >
          ← Switch to Challan Mode
        </button>
      </div>

      <div className="page-body">
        <div className="main-col">
          {/* Basic Info */}
          <div className="card">
            <div className="card-title">Basic Information</div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Customer <span className="req">*</span>
                </label>
                <select
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                  disabled={loading}
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.customerName || c.name} — {c.businessName || "N/A"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
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
            <div className="form-group full">
              <label>Note (optional)</label>
              <textarea
                rows={2}
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="Add a note for this invoice…"
              />
            </div>
          </div>

          {/* Invoice Number */}
          {invoiceSettings && (
            <div className="card">
              <div className="card-title">Invoice Number</div>
              <div className="invoice-preview-box">
                <span className="preview-label">Next Invoice</span>
                <span className="preview-num">{getPreviewNumber()}</span>
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={useCustomPrefix}
                  onChange={(e) => {
                    setUseCustomPrefix(e.target.checked);
                    if (!e.target.checked) setCustomPrefix("");
                  }}
                />
                <span>Use custom prefix for this bill</span>
              </label>
              {useCustomPrefix && (
                <div className="form-group mt-8">
                  <label>Custom Prefix</label>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) =>
                      setCustomPrefix(e.target.value.toUpperCase())
                    }
                    placeholder={invoiceSettings.prefix}
                    maxLength={10}
                  />
                  <span className="hint">
                    Default: {invoiceSettings.prefix}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="card">
            <div className="card-title-row">
              <span className="card-title">Items</span>
              <button className="btn-add-item" onClick={addItem}>
                <MdAdd /> Add Item
              </button>
            </div>

            <div className="items-scroll">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Price (₹)</th>
                    <th>Disc %</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className={item.itemName ? "filled" : ""}>
                      <td className="idx">{i + 1}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Item name"
                          value={item.itemName}
                          onChange={(e) =>
                            updateItem(i, "itemName", e.target.value)
                          }
                          className="inp-name"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="—"
                          value={item.hsn}
                          onChange={(e) => updateItem(i, "hsn", e.target.value)}
                          className="inp-sm"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={item.qty || ""}
                          onChange={(e) =>
                            updateItem(
                              i,
                              "qty",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="inp-sm"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="pcs"
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(i, "unit", e.target.value)
                          }
                          className="inp-sm"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={item.price || ""}
                          onChange={(e) =>
                            updateItem(
                              i,
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="inp-sm"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0"
                          value={item.discount || ""}
                          onChange={(e) =>
                            updateItem(
                              i,
                              "discount",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="inp-sm"
                        />
                      </td>
                      <td>
                        <select
                          value={item.gst}
                          onChange={(e) => updateItem(i, "gst", e.target.value)}
                          className="sel-gst"
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
                          disabled={items.length === 1}
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

          {/* Terms */}
          <TermsSection
            terms={termsAndConditions}
            setTerms={setTermsAndConditions}
          />

          {/* Signature */}
          <SignatureSection
            enabled={enableSignatureStamp}
            setEnabled={setEnableSignatureStamp}
            stampPreview={stampPreview}
            stampFile={stampFile}
            onUpload={handleStampUpload}
            onClear={() => {
              setStampFile(null);
              setStampPreview(null);
            }}
          />
        </div>

        {/* Sidebar Summary */}
        <div className="summary-col">
          <div className="summary-card sticky">
            <div className="summary-title">Summary</div>

            <div className="summary-row">
              <span>Items subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row discount-row">
              <span>Global Discount</span>
              <div className="inline-input">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={globalDiscount}
                  onChange={(e) =>
                    setGlobalDiscount(parseFloat(e.target.value) || 0)
                  }
                />
                <span>%</span>
              </div>
            </div>
            {globalDiscount > 0 && (
              <div className="summary-row sub">
                <span>Discount amount</span>
                <span>−₹{globalDiscAmt.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-row gst-row">
              <span>Global GST</span>
              <select
                value={
                  globalGstType === "percentage"
                    ? `gst_${globalGst}`
                    : globalGstType
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (["not_applicable", "exempted", "non_gst"].includes(v)) {
                    setGlobalGstType(v);
                    setGlobalGst(0);
                  } else {
                    setGlobalGstType("percentage");
                    setGlobalGst(parseFloat(v.replace("gst_", "")));
                  }
                }}
              >
                <option value="not_applicable">Not Applicable</option>
                <option value="gst_0">GST @ 0%</option>
                <option value="gst_5">GST @ 5%</option>
                <option value="gst_12">GST @ 12%</option>
                <option value="gst_18">GST @ 18%</option>
                <option value="gst_28">GST @ 28%</option>
              </select>
            </div>
            {globalGstType === "percentage" && globalGst > 0 && (
              <div className="summary-row sub">
                <span>GST ({globalGst}%)</span>
                <span>₹{globalGstAmt.toLocaleString()}</span>
              </div>
            )}

            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Total Due</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            <div className="action-btns">
              <button className="btn-cancel" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button
                className="btn-generate"
                onClick={handleSubmit}
                disabled={loading || !formData.customer}
              >
                {loading ? "Generating…" : "Generate Bill"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualBill;
