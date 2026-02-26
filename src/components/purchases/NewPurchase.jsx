import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdDelete,
  MdAdd,
  MdCloudUpload,
  MdArrowBack,
  MdPerson,
  MdDescription,
} from "react-icons/md";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import purchaseService from "../../services/purchaseService";
import vendorVendorService from "../../services/vendorVendorService";
import productService from "../../services/productService";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { toast } from "react-toastify";
import "./newPurchase.scss";

const toNum = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

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

  const [sellerSearch, setSellerSearch] = useState("");
  const [showSellerDropdown, setShowSellerDropdown] = useState(false);
  const sellerDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sellerDropdownRef.current &&
        !sellerDropdownRef.current.contains(event.target)
      ) {
        setShowSellerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    purchaseType: "Tax Invoice",
    prefix: "PUR",
    purchaseNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    sellerId: "",
    consigneeType: "same",
    copies: {
      original: false,
      duplicate: false,
      triplicate: false,
    },
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
      // res is response.data
      const data = res?.data || res;
      setSellers(Array.isArray(data) ? data : data?.rows || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast.error("Failed to fetch sellers.");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts();

      if (Array.isArray(res)) {
        setProducts(res);
      } else if (res?.products && Array.isArray(res.products)) {
        setProducts(res.products);
      } else if (res?.rows && Array.isArray(res.rows)) {
        setProducts(res.rows);
      } else if (res?.data && Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products.");
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
        toast.error("Failed to upload signature. Please try again.");
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
      toast.error("Please select a seller");
      return;
    }
    if (!formData.purchaseNumber) {
      toast.error("Please enter purchase number");
      return;
    }

    try {
      setLoading(true);

      try {
        const existingData = await purchaseService.getPurchases({ size: 50 });
        const allPurchases =
          existingData?.data?.rows || existingData?.rows || [];
        const isDuplicate = allPurchases.some(
          (p) =>
            (p.sellerId === formData.sellerId ||
              p.VendorId === formData.sellerId) &&
            p.purchaseNumber === formData.purchaseNumber,
        );

        if (isDuplicate) {
          setLoading(false);
          toast.error(
            `Invoice number "${formData.purchaseNumber}" already exists for this seller.`,
          );
          return;
        }
      } catch (checkError) {
        console.warn("Duplicate check failed, proceeding anyway:", checkError);
      }

      const subtotal = calculateSubtotal();
      const gstTotal = calculateGst();
      const totalAmount = subtotal + gstTotal;

      const payload = {
        purchaseNumber: `${formData.prefix}-${formData.purchaseNumber}`,
        purchaseDate: formData.purchaseDate,
        totalAmount: parseFloat(totalAmount),
        sellerId: parseInt(formData.sellerId),
        billImage: signatureUrl || null,
        note: terms.join("\n"),
        status: "unpaid",
        consigneeType: formData.consigneeType,
        copies: formData.copies,
        items: items.map((it) => ({
          itemName: it.itemName,
          qty: parseFloat(it.qty) || 0,
          unit: it.unit,
          price: parseFloat(it.price) || 0,
          gstPercent: parseFloat(it.gstPercent) || 0,
          total:
            (parseFloat(it.qty) || 0) *
            (parseFloat(it.price) || 0) *
            (1 + (parseFloat(it.gstPercent) || 0) / 100),
        })),
      };

      await purchaseService.createPurchase(payload);
      setShowModal({
        show: true,
        success: true,
        message: "Purchase bill created successfully!",
      });
      setTimeout(() => navigate("/vendor/purchases"), 2000);
    } catch (error) {
      toast.error(error.message || "Failed to create purchase");
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

      {/* Top Navigation Header */}
      <header className="page-top-nav">
        <div className="left-side">
          <button className="back-circle" onClick={() => navigate(-1)}>
            <MdArrowBack />
          </button>
          <div className="title-v2">
            <h1>Create Purchase</h1>
            <span className="v2-badge">v2</span>
          </div>
        </div>
        <div className="right-side">
          <div className="user-profile">
            <div className="profile-icon">
              <MdPerson />
            </div>
            <span>My Company</span>
            <FaCheckCircle className="down-arrow" />
          </div>
        </div>
      </header>

      {/* Sub Header for Buttons */}
      <div className="action-sub-header">
        <div className="spacer"></div>
        <div className="main-actions">
          <button className="btn-cancel" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className={`btn-submit ${loading ? "loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="main-form-container">
        {/* Row 1: Configurations and Buyer Details */}
        <div className="form-row-split">
          <div className="config-section">
            <div className="type-toggle">
              <label className="radio-label">
                <input
                  type="radio"
                  name="purchaseType"
                  checked={formData.purchaseType === "Tax Invoice"}
                  onChange={() =>
                    setFormData({ ...formData, purchaseType: "Tax Invoice" })
                  }
                />
                <span className="radio-circle"></span>
                Tax Invoice
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="purchaseType"
                  checked={formData.purchaseType === "Bill of Supply"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      purchaseType: "Bill of Supply",
                    })
                  }
                />
                <span className="radio-circle"></span>
                Bill of Supply
              </label>
            </div>

            <div className="input-row">
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
                  placeholder="1"
                  value={formData.purchaseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="input-group full-width">
              <label>Purchase Date</label>
              <div className="date-input-wrapper">
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

          <div className="buyer-detail-card">
            <div className="section-header-lite">
              <h3>BUYER DETAILS</h3>
              <button className="btn-edit-icon">
                <MdDescription />
              </button>
            </div>
            <div className="buyer-content">
              <strong>{vendorData?.businessName || "My Company"}</strong>
              <p>{vendorData?.address || "No address provided"}</p>
              <div className="gst-display">
                GSTIN: {vendorData?.gst || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Seller Details */}
        <div className="full-form-section">
          <div className="section-header-bar">
            <h3>SELLER DETAILS</h3>
            <div className="header-actions">
              <button className="btn-action-dark" onClick={fetchSellers}>
                Select Seller
              </button>
              <button
                className="btn-action-lite"
                onClick={() => navigate("/vendor/vendor")}
              >
                Add New Seller
              </button>
            </div>
          </div>
          <div className="section-body">
            <div className="seller-selector-container" ref={sellerDropdownRef}>
              {!formData.sellerId ? (
                <div className="search-box-v2">
                  <MdPerson className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Seller Name or Business..."
                    value={sellerSearch}
                    onChange={(e) => {
                      setSellerSearch(e.target.value);
                      setShowSellerDropdown(true);
                    }}
                    onFocus={() => setShowSellerDropdown(true)}
                  />
                  {showSellerDropdown && (
                    <div className="search-dropdown">
                      {sellers
                        .filter(
                          (s) =>
                            s.vendorName
                              ?.toLowerCase()
                              .includes(sellerSearch.toLowerCase()) ||
                            s.businessName
                              ?.toLowerCase()
                              .includes(sellerSearch.toLowerCase()),
                        )
                        .map((s) => (
                          <div
                            key={s._id || s.id}
                            className="dropdown-item"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                sellerId: s._id || s.id,
                              });
                              setShowSellerDropdown(false);
                              setSellerSearch("");
                            }}
                          >
                            <strong>{s.vendorName}</strong>
                            {s.businessName && <span> ({s.businessName})</span>}
                          </div>
                        ))}
                      {sellers.length === 0 && (
                        <div className="dropdown-empty">No sellers found</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="selected-seller-display">
                  <div className="seller-info-left">
                    <MdPerson className="avatar-icon" />
                    <div>
                      <h4>
                        {
                          sellers.find(
                            (s) => (s._id || s.id) === formData.sellerId,
                          )?.vendorName
                        }
                      </h4>
                      <p>
                        {
                          sellers.find(
                            (s) => (s._id || s.id) === formData.sellerId,
                          )?.businessName
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn-change"
                    onClick={() => setFormData({ ...formData, sellerId: "" })}
                  >
                    Change Seller
                  </button>
                </div>
              )}
            </div>
            <div className="consignee-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="consignee"
                  checked={formData.consigneeType === "same"}
                  onChange={() =>
                    setFormData({ ...formData, consigneeType: "same" })
                  }
                />
                <span className="radio-circle"></span>
                Show consignee (same as above)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="consignee"
                  checked={formData.consigneeType === "notRequired"}
                  onChange={() =>
                    setFormData({ ...formData, consigneeType: "notRequired" })
                  }
                />
                <span className="radio-circle"></span>
                Consignee not required
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="consignee"
                  checked={formData.consigneeType === "different"}
                  onChange={() =>
                    setFormData({ ...formData, consigneeType: "different" })
                  }
                />
                <span className="radio-circle"></span>
                Add Consignee (if different from above)
              </label>
            </div>
          </div>
        </div>

        {/* Section: Products */}
        <div className="full-form-section">
          <div className="section-header-bar">
            <h3>PRODUCTS</h3>
            <div className="header-actions">
              <button className="btn-action-dark" onClick={fetchProducts}>
                Select Item
              </button>
              <button
                className="btn-action-lite"
                onClick={() => navigate("/vendor/inventory")}
              >
                Add New Item
              </button>
            </div>
          </div>
          <div className="section-body p-0">
            <table className="v2-items-table">
              <thead>
                <tr>
                  <th>Item Name & Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Price (₹)</th>
                  <th>GST %</th>
                  <th>Total (₹)</th>
                  <th width="40"></th>
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
                          <option key={p._id || p.id} value={p.name} />
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
                        className="btn-remove-row"
                        onClick={() => removeItem(index)}
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              <button className="btn-add-row" onClick={addItem}>
                <MdAdd /> Add Row
              </button>
            </div>
          </div>
        </div>

        {/* Row: Checkboxes for Copies */}
        <div className="checkbox-section">
          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={formData.copies.original}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  copies: { ...formData.copies, original: e.target.checked },
                })
              }
            />
            <span className="check-box"></span>
            Original for Recipient
          </label>
          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={formData.copies.duplicate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  copies: { ...formData.copies, duplicate: e.target.checked },
                })
              }
            />
            <span className="check-box"></span>
            Duplicate for Transporter
          </label>
          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={formData.copies.triplicate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  copies: { ...formData.copies, triplicate: e.target.checked },
                })
              }
            />
            <span className="check-box"></span>
            Triplicate for Supplier
          </label>
        </div>

        <div className="bottom-sections">
          <div className="notes-section">
            <div className="section-header-lite">
              <h3>Terms & Conditions</h3>
            </div>
            <div className="section-body">
              <textarea
                rows="3"
                placeholder="Enter terms and conditions..."
                value={terms.join("\n")}
                onChange={(e) => setTerms(e.target.value.split("\n"))}
              ></textarea>
            </div>
          </div>

          <div className="summary-card-v2">
            <div className="summary-row">
              <label>Subtotal</label>
              <span>₹ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <label>GST Amount</label>
              <span>₹ {calculateGst().toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <label>Net Payable</label>
              <span className="amount">
                ₹ {(calculateSubtotal() + calculateGst()).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section">
          <div className="section-header-lite">
            <h3>UPLOAD SIGNATURE (optional)</h3>
          </div>
          <div className="section-body">
            <div
              className="sig-dropzone"
              onClick={() => document.getElementById("sig-v2").click()}
            >
              {isUploading ? (
                <div className="sig-placeholder">
                  <div className="upload-spinner"></div>
                  <span>Uploading {uploadProgress}%</span>
                </div>
              ) : signatureUrl ? (
                <img src={signatureUrl} alt="Signature" />
              ) : (
                <div className="sig-placeholder">
                  <MdCloudUpload />
                  <span>Click to upload authorized signature</span>
                </div>
              )}
            </div>
            <input id="sig-v2" type="file" hidden onChange={handleFileUpload} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchase;
