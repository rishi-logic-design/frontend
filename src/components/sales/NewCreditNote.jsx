import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
  FiUser,
  FiPackage,
  FiX,
  FiPlus,
} from "react-icons/fi";
import customerService from "../../services/customerService";
import productService from "../../services/productService";
import CustomDatePicker from "../common/CustomDatePicker";
import creditNoteService from "../../services/creditNoteService";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { toast } from "react-toastify";
import "./newCreditNote.scss";

const EMPTY_ITEM = {
  productId: "",
  itemName: "",
  hsn: "",
  qty: 1,
  unit: "",
  price: 0,
  gstPercent: 0,
  total: 0,
};

const NewCreditNote = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("Credit Note");
  const [creditNoteNo, setCreditNoteNo] = useState("");
  const [creditNoteDate, setCreditNoteDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [enableSignature, setEnableSignature] = useState(false);
  const [terms, setTerms] = useState(
    "This is an electronically generated document",
  );

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  const [showBuyerSearch, setShowBuyerSearch] = useState(false);
  const [buyerSearchTerm, setBuyerSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState({
    show: false,
    index: -1,
  });
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const [uploading, setUploading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(null);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customProductData, setCustomProductData] = useState({
    name: "",
    price: "",
    gstPercent: "18",
    hsn: "",
    unit: "PCS",
  });

  const vendorData = JSON.parse(localStorage.getItem("vendorData") || "{}");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [custRes, prodRes] = await Promise.all([
        customerService.getCustomers(),
        productService.getProducts(),
      ]);

      console.log("Fetched Customers:", custRes);
      console.log("Fetched Products:", prodRes);

      setCustomers(custRes?.data?.rows || custRes?.rows || custRes || []);
      setProducts(
        prodRes?.products || prodRes?.rows || prodRes?.data || prodRes || [],
      );

      if (isEdit) {
        const cnRes = await creditNoteService.getCreditNoteById(id);
        console.log("Fetched Credit Note:", cnRes);
        const cn = cnRes?.data || cnRes;
        if (cn) {
          setType(cn.type || "Credit Note");
          setCreditNoteNo(cn.noteNumber || "");
          setCreditNoteDate(
            cn.noteDate
              ? new Date(cn.noteDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          );
          setSelectedBuyer(cn.customer);
          setItems(
            cn.items?.length > 0
              ? cn.items.map((it) => ({
                  ...it,
                  productId: it.productId || "",
                  qty: parseFloat(it.qty) || 0,
                  price: parseFloat(it.price) || 0,
                  gstPercent: parseFloat(it.gstPercent) || 0,
                  total: parseFloat(it.total) || 0,
                }))
              : [{ ...EMPTY_ITEM }],
          );
          setTerms(cn.termsAndConditions || "");
          setSignatureUrl(cn.signatureImage);
          setEnableSignature(!!cn.signatureImage);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { ...EMPTY_ITEM }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    const qty = parseFloat(newItems[index].qty) || 0;
    const price = parseFloat(newItems[index].price) || 0;
    const gst = parseFloat(newItems[index].gstPercent) || 0;
    const base = qty * price;
    newItems[index].total = base + (base * gst) / 100;

    setItems(newItems);
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product._id || product.id,
      itemName: product.name,
      hsn: product.hsn || "",
      price: product.price || 0,
      unit: product.unit || "",
      gstPercent: product.gstPercent || 0,
    };

    const qty = parseFloat(newItems[index].qty) || 0;
    const price = parseFloat(newItems[index].price) || 0;
    const gst = parseFloat(newItems[index].gstPercent) || 0;
    const base = qty * price;
    newItems[index].total = base + (base * gst) / 100;

    setItems(newItems);
    setShowProductSearch({ show: false, index: -1 });
    setProductSearchTerm("");
  };

  const handleCreateCustomProduct = async () => {
    if (!customProductData.name || !customProductData.price) {
      return toast.error("Please enter name and price");
    }

    try {
      setLoading(true);
      const newProduct = await productService.createProduct({
        ...customProductData,
        price: parseFloat(customProductData.price),
        gstPercent: parseFloat(customProductData.gstPercent),
      });

      setProducts([...products, newProduct]);

      handleProductSelect(showProductSearch.index, newProduct);

      setIsAddingCustom(false);
      setCustomProductData({
        name: "",
        price: "",
        gstPercent: "18",
        hsn: "",
        unit: "PCS",
      });
      toast.success("Product created and added!");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, it) =>
        sum + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0),
      0,
    );
    const taxTotal = items.reduce((sum, it) => {
      const base = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
      return sum + (base * (parseFloat(it.gstPercent) || 0)) / 100;
    }, 0);
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `signatures/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Upload error:", error);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setSignatureUrl(url);
        setUploading(false);
      },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBuyer) return toast.error("Please select a buyer");
    if (items.some((it) => !it.itemName))
      return toast.error("Please fill all item names");

    const totals = calculateTotals();
    const payload = {
      type,
      noteNumber: creditNoteNo,
      noteDate: creditNoteDate,
      customerId: selectedBuyer._id || selectedBuyer.id,
      items: items.map((it) => ({
        ...it,
        qty: parseFloat(it.qty),
        price: parseFloat(it.price),
        gstPercent: parseFloat(it.gstPercent),
      })),
      subtotal: totals.subtotal,
      gstTotal: totals.taxTotal,
      totalAmount: totals.total,
      termsAndConditions: terms,
      signatureImage: enableSignature ? signatureUrl : null,
      showSignature: enableSignature,
      note: "", // default empty
    };

    try {
      setLoading(true);
      if (isEdit) {
        await creditNoteService.updateCreditNote(id, payload);
        toast.success(`${type} updated successfully!`);
      } else {
        await creditNoteService.createCreditNote(payload);
        toast.success(`${type} created successfully!`);
      }
      navigate("/vendor/credit-notes");
    } catch (error) {
      console.error("Error creating credit note:", error);
      toast.error(error.message || "Failed to create credit note");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="new-credit-note-page">
      {loading && (
        <div className="loading-overlay">
          <div className="loader"></div>
        </div>
      )}

      {/* Top Header */}
      <div className="top-header">
        <div className="header-left">
          <button className="back-circle-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className="title-group">
            <h1>
              {isEdit ? "Edit" : "Create"} Credit Note{" "}
              <span className="version-tag">v2</span>
            </h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="cancel-hero-btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            className="submit-hero-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="form-container">
        {/* Type & Date Section */}
        <div className="grid-section">
          <div className="card type-card">
            <div className="radio-group">
              <label
                className={`radio-label ${type === "Credit Note" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="type"
                  value="Credit Note"
                  checked={type === "Credit Note"}
                  onChange={(e) => setType(e.target.value)}
                />
                <span className="radio-custom"></span>
                Credit Note
              </label>
              <label
                className={`radio-label ${type === "Sales Return" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="type"
                  value="Sales Return"
                  checked={type === "Sales Return"}
                  onChange={(e) => setType(e.target.value)}
                />
                <span className="radio-custom"></span>
                Sales Return
              </label>
            </div>

            <div className="fields-row">
              <div className="input-group">
                <label>Credit Note No.</label>
                <input
                  type="text"
                  value={creditNoteNo}
                  placeholder="Auto-generated if empty"
                  onChange={(e) => setCreditNoteNo(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Credit Note Date</label>
                <CustomDatePicker
                  value={creditNoteDate}
                  onChange={(v) => setCreditNoteDate(v)}
                  placeholder="Select date"
                />
              </div>
            </div>
          </div>

          <div className="card supplier-card">
            <div className="card-header">
              <h3>SUPPLIER DETAILS</h3>
              <button className="edit-icon-btn">
                <FiEdit />
              </button>
            </div>
            <div className="supplier-content">
              <strong>{vendorData.businessName || "My Company"}</strong>
              <p>{vendorData.email || "Email not set"}</p>
              <p style={{ fontSize: "12px" }}>
                {vendorData.mobile || "Phone not set"}
              </p>
              {vendorData.gst && (
                <p className="gst-text">GSTIN: {vendorData.gst}</p>
              )}
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="card buyer-details-card">
          <div className="card-header">
            <h3>BUYER DETAILS</h3>
            <div className="header-btns">
              <button
                className="dark-btn"
                onClick={() => setShowBuyerSearch(true)}
              >
                Select Buyer
              </button>
              <button
                className="outline-btn"
                onClick={() => navigate("/vendor/customer")}
              >
                Add New Buyer
              </button>
            </div>
          </div>
          <div className="card-body">
            {selectedBuyer ? (
              <div className="selected-entity">
                <div className="entity-info">
                  <FiUser className="entity-icon" />
                  <div>
                    <h4>{selectedBuyer.customerName || selectedBuyer.name}</h4>
                    <p>{selectedBuyer.businessName}</p>
                    <p>
                      {selectedBuyer.billingAddress || selectedBuyer.address}
                    </p>
                  </div>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => setSelectedBuyer(null)}
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <div className="empty-state-lite">
                No buyer selected. Use buttons above to select.
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="card products-card">
          <div className="card-header">
            <h3>PRODUCTS</h3>
            <div className="header-btns">
              <button className="dark-btn" onClick={addItem}>
                Add Row
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <table className="items-table-v2">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>HSN</th>
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
                    <td className="searchable-cell">
                      <div className="input-with-search">
                        <input
                          type="text"
                          value={item.itemName}
                          placeholder="Search product..."
                          onChange={(e) =>
                            updateItem(index, "itemName", e.target.value)
                          }
                        />
                        <FiPackage className="package-icon" />
                        <button
                          className="search-trigger"
                          onClick={() =>
                            setShowProductSearch({ show: true, index })
                          }
                        >
                          <FiChevronDown />
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) =>
                          updateItem(index, "hsn", e.target.value)
                        }
                      />
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
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="item-total">
                      ₹{(Number(item.total) || 0).toFixed(2)}
                    </td>
                    <td>
                      <button
                        className="delete-row-btn"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
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

        {/* Summary and Foldables */}
        <div className="bottom-grid">
          <div className="left-col">
            <div className="card terms-card">
              <div className="card-header">
                <h3>Terms & Conditions</h3>
              </div>
              <div className="card-body">
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Enter terms..."
                />
              </div>
            </div>
          </div>

          <div className="right-col">
            <div className="card summary-card-v2">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{(Number(totals.subtotal) || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>GST Amount</span>
                <span>₹{(Number(totals.taxTotal) || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span className="total-val">
                  ₹{(Number(totals.total) || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="card signature-card mt20">
              <div className="card-header">
                <h3>SIGNATURE</h3>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={enableSignature}
                    onChange={(e) => setEnableSignature(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {enableSignature && (
                <div className="signature-content">
                  {signatureUrl ? (
                    <div className="sig-preview">
                      <img src={signatureUrl} alt="Signature" />
                      <button onClick={() => setSignatureUrl(null)}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="sig-upload">
                      <input
                        type="file"
                        id="sig-file"
                        hidden
                        onChange={handleFileUpload}
                      />
                      <button
                        onClick={() =>
                          document.getElementById("sig-file").click()
                        }
                        disabled={uploading}
                      >
                        {uploading ? "Uploading..." : "Upload Signature"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Search Modal */}
      {showBuyerSearch && (
        <div
          className="modal-overlay-lite"
          onClick={() => setShowBuyerSearch(false)}
        >
          <div
            className="modal-content-lite"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Select Buyer</h3>
              <button onClick={() => setShowBuyerSearch(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-search">
              <input
                type="text"
                placeholder="Search buyer name or business..."
                autoFocus
                value={buyerSearchTerm}
                onChange={(e) => setBuyerSearchTerm(e.target.value)}
              />
            </div>
            <div className="modal-list">
              {customers
                .filter((c) =>
                  (c.customerName || c.name || "")
                    .toLowerCase()
                    .includes(buyerSearchTerm.toLowerCase()),
                )
                .map((c) => (
                  <div
                    key={c._id || c.id}
                    className="list-item"
                    onClick={() => {
                      setSelectedBuyer(c);
                      setShowBuyerSearch(false);
                    }}
                  >
                    <strong>{c.customerName || c.name}</strong>
                    <span>{c.businessName}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Search Modal */}
      {showProductSearch.show && (
        <div
          className="modal-overlay-lite"
          onClick={() => setShowProductSearch({ show: false, index: -1 })}
        >
          <div
            className="modal-content-lite"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Select Product</h3>
              <button
                onClick={() => {
                  setShowProductSearch({ show: false, index: -1 });
                  setIsAddingCustom(false);
                }}
              >
                <FiX />
              </button>
            </div>

            {isAddingCustom ? (
              <div className="custom-product-form">
                <div className="form-head">
                  <h4>New Product</h4>
                  <button onClick={() => setIsAddingCustom(false)}>Back</button>
                </div>
                <div className="form-inputs">
                  <div className="input-field">
                    <label>Name</label>
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={customProductData.name}
                      onChange={(e) =>
                        setCustomProductData({
                          ...customProductData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="row">
                    <div className="input-field">
                      <label>Price</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={customProductData.price}
                        onChange={(e) =>
                          setCustomProductData({
                            ...customProductData,
                            price: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="input-field">
                      <label>GST %</label>
                      <select
                        value={customProductData.gstPercent}
                        onChange={(e) =>
                          setCustomProductData({
                            ...customProductData,
                            gstPercent: e.target.value,
                          })
                        }
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="input-field">
                      <label>HSN</label>
                      <input
                        type="text"
                        placeholder="HSN Code"
                        value={customProductData.hsn}
                        onChange={(e) =>
                          setCustomProductData({
                            ...customProductData,
                            hsn: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="input-field">
                      <label>Unit</label>
                      <input
                        type="text"
                        placeholder="PCS, BOX etc."
                        value={customProductData.unit}
                        onChange={(e) =>
                          setCustomProductData({
                            ...customProductData,
                            unit: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <button
                  className="save-custom-btn"
                  onClick={handleCreateCustomProduct}
                >
                  Create & Select
                </button>
              </div>
            ) : (
              <>
                <div className="modal-search">
                  <input
                    type="text"
                    placeholder="Search product name..."
                    autoFocus
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                </div>
                <div className="modal-list">
                  <div
                    className="add-custom-trigger"
                    onClick={() => setIsAddingCustom(true)}
                  >
                    <FiPlus /> Add Custom Product
                  </div>
                  {products
                    .filter((p) =>
                      (p.name || "")
                        .toLowerCase()
                        .includes(productSearchTerm.toLowerCase()),
                    )
                    .map((p) => (
                      <div
                        key={p._id || p.id}
                        className="list-item"
                        onClick={() =>
                          handleProductSelect(showProductSearch.index, p)
                        }
                      >
                        <strong>{p.name}</strong>
                        <span>
                          ₹{p.price} | {p.gstPercent}% GST
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewCreditNote;
