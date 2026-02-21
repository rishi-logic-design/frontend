import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdAdd, MdCloudUpload } from "react-icons/md";
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

  const [formData, setFormData] = useState({
    purchaseType: "Tax Invoice",
    prefix: "PUR",
    purchaseNumber: "1",
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
    if (!formData.sellerId) return alert("Please select a seller");
    if (!formData.purchaseNumber) return alert("Please enter purchase number");

    try {
      setLoading(true);
      const subtotal = calculateSubtotal();
      const gstTotal = calculateGst();
      const totalAmount = subtotal + gstTotal;

      const payload = {
        ...formData,
        items,
        termsAndConditions: terms.join("\n"),
        signature: signatureUrl,
        status: "Unpaid",
        totalAmount: totalAmount,
        paidAmount: 0,
      };
      await purchaseService.createPurchase(payload);
      alert("Purchase created successfully!");
      navigate("/vendor/purchases");
    } catch (error) {
      alert(error.message || "Failed to create purchase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-purchase-page">
      <div className="np-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>New Purchase</h1>
      </div>

      <div className="np-container">
        {/* Top Section */}
        <div className="np-card top-section">
          <div className="section-left">
            <div className="type-selection">
              <label>
                <input
                  type="radio"
                  name="type"
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
                  name="type"
                  checked={formData.purchaseType === "Bill of Supply"}
                  onChange={() =>
                    setFormData({ ...formData, purchaseType: "Bill of Supply" })
                  }
                />{" "}
                Bill of Supply
              </label>
            </div>
            <div className="invoice-inputs">
              <div className="input-group">
                <label>Invoice Purchase Prefix</label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) =>
                    setFormData({ ...formData, prefix: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
                <label>Invoice Purchase No.</label>
                <input
                  type="text"
                  value={formData.purchaseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseNumber: e.target.value })
                  }
                />
              </div>
              <div className="input-group">
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
          <div className="section-right buyer-details">
            <h3>BUYER DETAILS</h3>
            <div className="buyer-info">
              <strong>{vendorData?.businessName || "My Company"}</strong>
              <p>{vendorData?.address || "N/A"}</p>
              <p>GST: {vendorData?.gst || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Seller Details */}
        <div className="np-card seller-section">
          <div className="section-header">
            <h3>SELLER DETAILS</h3>
            <div className="header-actions">
              <select
                value={formData.sellerId}
                onChange={(e) =>
                  setFormData({ ...formData, sellerId: e.target.value })
                }
              >
                <option value="">Select Seller</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.vendorName} ({s.businessName})
                  </option>
                ))}
              </select>
              <button
                className="btn-secondary"
                onClick={() => navigate("/vendor/vendor")}
              >
                Add New Seller
              </button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="np-card products-section">
          <h3>PRODUCTS</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Price</th>
                <th>GST %</th>
                <th>Total</th>
                <th></th>
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
                      placeholder="Select or enter item"
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
                      onChange={(e) => updateItem(index, "qty", e.target.value)}
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
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="item-total">
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
          <button className="btn-add" onClick={addItem}>
            <MdAdd /> Add Item
          </button>
        </div>

        {/* Footer Section */}
        <div className="np-footer-row">
          <div className="np-card terms-section">
            <h3>Terms & Conditions</h3>
            <textarea
              value={terms.join("\n")}
              onChange={(e) => setTerms(e.target.value.split("\n"))}
            />
          </div>
          <div className="np-card signature-section">
            <h3>UPLOAD SIGNATURE (optional)</h3>
            <div className="upload-box">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Signature"
                  className="sig-preview"
                />
              ) : (
                <label className="upload-label">
                  <MdCloudUpload size={32} />
                  <span>
                    {isUploading
                      ? `Uploading... ${uploadProgress}%`
                      : "Click to upload signature"}
                  </span>
                  <input type="file" hidden onChange={handleFileUpload} />
                </label>
              )}
            </div>
          </div>
          <div className="np-card summary-section">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>GST Total:</span>
              <span>₹{calculateGst().toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Grand Total:</span>
              <span>₹{(calculateSubtotal() + calculateGst()).toFixed(2)}</span>
            </div>
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Creating..." : "SAVE PURCHASE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchase;
