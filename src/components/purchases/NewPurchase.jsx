import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdDelete,
  MdAdd,
  MdCloudUpload,
  MdArrowBack,
  MdSave,
  MdShoppingCart,
  MdPerson,
  MdLayers,
  MdDescription,
  MdFingerprint,
} from "react-icons/md";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import purchaseService from "../../services/purchaseService";
import vendorVendorService from "../../services/vendorVendorService";
import productService from "../../services/productService";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import "./newPurchase.scss";

const toNum = (v) => parseFloat(v || 0);

const EMPTY_ITEM = {
  itemName: "",
  hsn: "",
  qty: 1,
  unit: "",
  price: 0,
  gstPercent: 0,
};

const NewPurchase = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorData, setVendorData] = useState(null);
  const [showModal, setShowModal] = useState({
    show: false,
    success: true,
    message: "",
  });

  const [formData, setFormData] = useState({
    purchaseType: "Tax Invoice",
    prefix: "PUR",
    purchaseNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    sellerId: "",
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [terms, setTerms] = useState([
    "This is an electronically generated document.",
  ]);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("vendorData") || "{}");
    setVendorData(data);
    fetchSellers();
    fetchProducts();
  }, []);

  const fetchSellers = async () => {
    try {
      const res = await vendorVendorService.getVendors();
      setSellers(res?.data?.rows || res?.rows || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts();
      setProducts(res?.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "itemName") {
      const product = products.find((p) => p.name === value);
      if (product) {
        newItems[index].price = product.price;
        newItems[index].unit = product.unit || "";
      }
    }

    setItems(newItems);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const storageRef = ref(storage, `signatures/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        setUploadProgress(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      (error) => {
        console.error("Upload error:", error);
        setIsUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setSignatureUrl(url);
        setIsUploading(false);
      },
    );
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + toNum(item.qty) * toNum(item.price),
      0,
    );
  };

  const calculateGst = () => {
    return items.reduce((sum, item) => {
      const amount = toNum(item.qty) * toNum(item.price);
      return sum + (amount * toNum(item.gstPercent)) / 100;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!formData.sellerId) {
      setShowModal({
        show: true,
        success: false,
        message: "Please select a seller",
      });
      return;
    }
    if (!formData.purchaseNumber) {
      setShowModal({
        show: true,
        success: false,
        message: "Please enter purchase number",
      });
      return;
    }

    try {
      setLoading(true);

      // Validation: Check for duplicate invoice number for the same seller
      const existingData = await purchaseService.getPurchases({ size: 1000 });
      const allPurchases = existingData?.data?.rows || existingData?.rows || [];
      const isDuplicate = allPurchases.some(
        (p) =>
          (p.sellerId === formData.sellerId ||
            p.VendorId === formData.sellerId) &&
          p.purchaseNumber === formData.purchaseNumber,
      );

      if (isDuplicate) {
        setLoading(false);
        return setShowModal({
          show: true,
          success: false,
          message: `Invoice number "${formData.purchaseNumber}" already exists for this seller. Please use a unique number.`,
        });
      }

      const subtotal = calculateSubtotal();
      const gstTotal = calculateGst();
      const totalAmount = subtotal + gstTotal;

      const payload = {
        ...formData,
        items: items.filter((i) => i.itemName),
        termsAndConditions: terms.join("\n"),
        signature: signatureUrl,
        status: "unpaid",
        totalAmount: totalAmount,
        paidAmount: 0,
        pendingAmount: totalAmount,
      };

      await purchaseService.createPurchase(payload);
      setShowModal({
        show: true,
        success: true,
        message: "Purchase bill created successfully!",
      });
      setTimeout(() => navigate("/vendor/purchases"), 2000);
    } catch (error) {
      setShowModal({
        show: true,
        success: false,
        message: error.message || "Failed to create purchase",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-purchase-page">
      {showModal.show && (
        <div className="custom-modal-overlay">
          <div
            className={`custom-modal ${showModal.success ? "success" : "error"}`}
          >
            <div
              className={`modal-icon ${showModal.success ? "success" : "error"}`}
            >
              {showModal.success ? <FaCheckCircle /> : <FaExclamationCircle />}
            </div>
            <h3>{showModal.success ? "Success" : "Error"}</h3>
            <p>{showModal.message}</p>
            {!showModal.success && (
              <button
                className="close-btn"
                onClick={() => setShowModal({ ...showModal, show: false })}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      <div className="page-header-container">
        <div className="header-info">
          <button className="back-btn-pill" onClick={() => navigate(-1)}>
            <MdArrowBack /> Back
          </button>
          <h1>Create New Purchase</h1>
          <p>Record a new purchase bill from your vendor</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => navigate(-1)}>
            Discard
          </button>
          <button
            className={`btn-dark ${loading ? "disabled" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            <MdSave /> {loading ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </div>

      <div className="main-form-content">
        <div className="info-grid">
          <div className="form-card">
            <div className="card-header">
              <h3>
                <MdLayers /> Bill Configuration
              </h3>
              <div className="type-radio-group">
                <label>
                  <input
                    type="radio"
                    checked={formData.purchaseType === "Tax Invoice"}
                    onChange={() =>
                      setFormData({ ...formData, purchaseType: "Tax Invoice" })
                    }
                  />{" "}
                  Tax Invoice
                </label>
                <label>
                  <input
                    type="radio"
                    checked={formData.purchaseType === "Bill of Supply"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        purchaseType: "Bill of Supply",
                      })
                    }
                  />{" "}
                  Bill of Supply
                </label>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="input-field">
                  <label>Purchase Prefix</label>
                  <input
                    type="text"
                    value={formData.prefix}
                    onChange={(e) =>
                      setFormData({ ...formData, prefix: e.target.value })
                    }
                  />
                </div>
                <div className="input-field">
                  <label>Invoice Number</label>
                  <input
                    type="text"
                    value={formData.purchaseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchaseNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="input-field">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="buyer-details-box">
            <h4>
              <MdPerson /> Buyer Details
            </h4>
            <p>
              <strong>{vendorData?.businessName || "My Company"}</strong>
            </p>
            <p>{vendorData?.address || "Address not set"}</p>
            <div className="gst-tag">
              GSTIN: {vendorData?.gst || "Not Available"}
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="card-header">
            <h3>
              <MdPerson /> Seller Information
            </h3>
            <button
              className="btn-add-item"
              style={{ marginTop: 0 }}
              onClick={() => navigate("/vendor/vendor")}
            >
              + Add New Seller
            </button>
          </div>
          <div className="card-body">
            <div className="input-field">
              <label>Select Seller</label>
              <select
                value={formData.sellerId}
                onChange={(e) =>
                  setFormData({ ...formData, sellerId: e.target.value })
                }
              >
                <option value="">Search or choose a seller...</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.vendorName} {s.businessName ? `(${s.businessName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="card-header">
            <h3>
              <MdShoppingCart /> Product Items
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item Name & Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Price (₹)</th>
                  <th>GST %</th>
                  <th>Total (₹)</th>
                  <th width="50"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        list="product-list"
                        value={item.itemName}
                        onChange={(e) =>
                          updateItem(index, "itemName", e.target.value)
                        }
                        placeholder="Type item name..."
                      />
                      <datalist id="product-list">
                        {products.map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(index, "qty", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, "unit", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={item.gstPercent}
                        onChange={(e) =>
                          updateItem(index, "gstPercent", e.target.value)
                        }
                      >
                        {[0, 5, 12, 18, 28].map((g) => (
                          <option key={g} value={g}>
                            {g}%
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="item-total-cell">
                      ₹
                      {(
                        toNum(item.qty) *
                        toNum(item.price) *
                        (1 + toNum(item.gstPercent) / 100)
                      ).toFixed(2)}
                    </td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => removeItem(index)}
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "20px 30px" }}>
              <button className="btn-add-item" onClick={addItem}>
                <MdAdd /> Add Row
              </button>
            </div>
          </div>
        </div>

        <div className="purchase-summary-section">
          <div className="footer-inputs">
            <div className="form-card">
              <div className="card-header">
                <h3>
                  <MdDescription /> Notes & Terms
                </h3>
              </div>
              <div className="card-body">
                <textarea
                  rows="4"
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    outline: "none",
                  }}
                  placeholder="Enter terms and conditions..."
                  value={terms.join("\n")}
                  onChange={(e) => setTerms(e.target.value.split("\n"))}
                />
              </div>
            </div>
            <div className="form-card">
              <div className="card-header">
                <h3>
                  <MdFingerprint /> Digital Signature
                </h3>
              </div>
              <div className="card-body">
                <div
                  className="upload-signature-box"
                  onClick={() => document.getElementById("sig-input").click()}
                >
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="sig-preview"
                    />
                  ) : (
                    <div className="upload-prompt">
                      <MdCloudUpload size={40} />
                      <span>
                        {isUploading
                          ? `Uploading... ${uploadProgress}%`
                          : "Click to upload authorized signature"}
                      </span>
                    </div>
                  )}
                  <input
                    id="sig-input"
                    type="file"
                    hidden
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="summary-card-dark">
            <div className="summary-line">
              <label>Subtotal</label>
              <span>
                ₹{" "}
                {calculateSubtotal().toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="summary-line">
              <label>GST Amount</label>
              <span>
                ₹{" "}
                {calculateGst().toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="summary-line grand-total">
              <label>Net Payable</label>
              <span>
                ₹{" "}
                {(calculateSubtotal() + calculateGst()).toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 },
                )}
              </span>
            </div>
            <button
              className={`btn-submit-main ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm & Save Purchase"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn-submit-main {
          margin-top: 20px;
          background: #dbd836;
          color: #000;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          &:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }
          &.loading {
            opacity: 0.7;
            pointer-events: none;
          }
        }
      `}</style>
    </div>
  );
};

export default NewPurchase;
