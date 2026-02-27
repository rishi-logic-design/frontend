import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiChevronDown,
  FiTrash2,
  FiUser,
  FiPackage,
  FiX,
  FiSearch,
} from "react-icons/fi";
import customerService from "../../services/customerService";
import productService from "../../services/productService";
import salesDebitNoteService from "../../services/salesDebitNoteService";
import CustomDatePicker from "../common/CustomDatePicker";
import { toast } from "react-toastify";
import "./newSalesDebit.scss";

const EMPTY_ITEM = {
  productId: "",
  itemName: "Select Product",
  hsn: "",
  qty: 1,
  unit: "PCS",
  price: 0,
  taxType: "Exclusive",
  discount: 0,
  taxableValue: 0,
  gstPercent: 18,
  total: 0,
};

const NewSalesDebit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  const [invoicePrefix, setInvoicePrefix] = useState("No Prefix");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
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

  const [enableSignature, setEnableSignature] = useState(false);
  const [otherCharge, setOtherCharge] = useState(0);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [note, setNote] = useState("");

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
      const fetchedCustomers =
        custRes?.data?.rows || custRes?.rows || custRes || [];
      const fetchedProducts =
        prodRes?.products || prodRes?.rows || prodRes?.data || prodRes || [];

      setCustomers(fetchedCustomers);
      setProducts(fetchedProducts);

      if (isEdit) {
        const res = await salesDebitNoteService.getSalesDebitNoteById(id);
        const data = res?.data || res;
        setInvoiceNo(data.invoiceNo || "");
        setInvoicePrefix(data.invoicePrefix || "No Prefix");
        setInvoiceDate(data.noteDate || "");
        setSelectedBuyer(
          fetchedCustomers.find((c) => c.id === data.customerId),
        );
        setItems(
          data.items.map((it) => ({
            ...it,
            qty: parseFloat(it.qty) || 0,
            price: parseFloat(it.price) || 0,
            taxableValue: parseFloat(it.taxableValue) || 0,
            total: parseFloat(it.total) || 0,
            gstPercent: parseFloat(it.gstPercent) || 18,
          })),
        );
        setOtherCharge(data.otherCharge || 0);
        setInvoiceDiscount(data.invoiceDiscount || 0);
        setNote(data.note || "");
        setEnableSignature(!!data.showSignature);
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
    const item = { ...newItems[index], [field]: value };

    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.price) || 0;
    const discount = parseFloat(item.discount) || 0;

    let taxableValue = qty * price;
    taxableValue -= (taxableValue * discount) / 100;

    const gstPercent = parseFloat(item.gstPercent) || 0;
    const total = taxableValue + (taxableValue * gstPercent) / 100;

    item.taxableValue = taxableValue;
    item.total = total;

    newItems[index] = item;
    setItems(newItems);
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      itemName: product.name,
      hsn: product.hsn || "N/A",
      price: parseFloat(product.price) || 0,
      unit: product.unit || "PCS",
      gstPercent: parseFloat(product.gstPercent) || 18,
      qty: 1,
      discount: 0,
    };
    setItems(newItems);
    updateItem(index, "qty", 1);
    setShowProductSearch({ show: false, index: -1 });
    setProductSearchTerm("");
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBuyer) return toast.error("Please select a buyer");
    if (items.every((it) => !it.productId && !it.itemName)) {
      return toast.error("Please add at least one item");
    }

    try {
      setLoading(true);
      const payload = {
        invoicePrefix,
        invoiceNo,
        noteDate: invoiceDate,
        customerId: selectedBuyer.id,
        items: items
          .filter((it) => it.productId || it.itemName !== "Select Product")
          .map((it) => ({
            itemName: it.itemName,
            hsn: it.hsn,
            qty: parseFloat(it.qty) || 0,
            unit: it.unit,
            price: parseFloat(it.price) || 0,
            taxType: it.taxType,
            discount: parseFloat(it.discount) || 0,
            gstPercent: parseFloat(it.gstPercent) || 0,
          })),
        otherCharge,
        invoiceDiscount,
        termsAndConditions:
          "1. Subject to seller jurisdiction.\n2. Goods once sold will not be taken back.",
        showSignature: enableSignature,
        note,
      };

      if (isEdit) {
        await salesDebitNoteService.updateSalesDebitNote(id, payload);
        toast.success("Sales Debit Note Updated Successfully!");
      } else {
        await salesDebitNoteService.createSalesDebitNote(payload);
        toast.success("Sales Debit Note Created Successfully!");
      }
      navigate("/vendor/sales-debit-notes");
    } catch (error) {
      console.error("Error saving debit note:", error);
      toast.error(error.message || "Failed to save debit note");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, it) => sum + (it.taxableValue || 0), 0);
    const total = items.reduce((sum, it) => sum + (it.total || 0), 0);
    const taxTotal = total - subtotal;
    const finalAmount =
      total + parseFloat(otherCharge) - parseFloat(invoiceDiscount);
    return { subtotal, taxTotal, total, finalAmount };
  };

  const totals = calculateTotals();

  return (
    <div className="new-sales-debit-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <h1>
            {isEdit ? "Edit" : "Create"} Sales Debit Note
            <span className="v2-badge">v2</span>
          </h1>
        </div>
        <div className="header-right">
          <button className="cancel-btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="form-content">
        <div className="info-grid">
          <div className="card invoice-card">
            <div className="fields-grid">
              <div className="field-group">
                <label>INVOICE PREFIX</label>
                <div className="select-wrapper">
                  <select
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                  >
                    <option value="No Prefix">No Prefix</option>
                    <option value="SDN">SDN</option>
                  </select>
                  <FiChevronDown />
                </div>
              </div>
              <div className="field-group">
                <label>INVOICE NO.</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="001"
                />
              </div>
            </div>
            <div className="field-group date-field">
              <label>INVOICE DATE</label>
              <CustomDatePicker
                value={invoiceDate}
                onChange={(v) => setInvoiceDate(v)}
                placeholder="Select date"
              />
            </div>
          </div>

          <div className="card supplier-card">
            <div className="card-header-band">
              <div className="title-with-icon">
                <FiUser />
              </div>
              <div className="band-right">SUPPLIER DETAILS</div>
            </div>
            <div className="supplier-body">
              <div className="supplier-main">
                <div className="supplier-info">
                  <strong>{vendorData.businessName || "My Company"}</strong>
                </div>
                <div className="supplier-contact">
                  <p>{vendorData.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card buyer-section">
          <div className="card-header-band">
            <div className="title-with-icon">
              <FiUser />
            </div>
            <div className="band-right">BUYER DETAILS</div>
          </div>
          <div className="buyer-body">
            {selectedBuyer ? (
              <div className="selected-buyer">
                <FiUser className="buyer-icon" />
                <strong>{selectedBuyer.customerName}</strong>
                <span className="buyer-email">{selectedBuyer.email || ""}</span>
                <button
                  className="change-btn"
                  onClick={() => setSelectedBuyer(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                className="select-btn"
                onClick={() => setShowBuyerSearch(true)}
              >
                <FiUser /> Select Buyer
              </button>
            )}
          </div>
        </div>

        <div className="card items-section">
          <div className="card-header-band">
            <div className="title-with-icon">
              <FiPackage />
            </div>
            <div className="band-right">ITEM DETAILS</div>
          </div>
          <div className="table-container">
            <table className="debit-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ITEM NAME</th>
                  <th>HSN</th>
                  <th>QTY</th>
                  <th>PRICE</th>
                  <th>DISCOUNT %</th>
                  <th>GST %</th>
                  <th>TOTAL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td
                      className="item-name-cell"
                      onClick={() =>
                        setShowProductSearch({ show: true, index })
                      }
                    >
                      <input type="text" value={item.itemName} readOnly />
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
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(index, "discount", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <div className="gst-select-wrapper">
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
                        <FiChevronDown />
                      </div>
                    </td>
                    <td className="total-val">{item.total.toFixed(2)}</td>
                    <td>
                      <button
                        className="remove-item-btn"
                        onClick={() => removeItem(index)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <button className="add-more-btn" onClick={addItem}>
              + Add More Item
            </button>
          </div>
        </div>

        <div className="bottom-summary">
          <div className="totals-card">
            <div className="summary-row">
              <span className="label">Taxable Amount</span>
              <span className="value">₹ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="label">GST Amount</span>
              <span className="value">₹ {totals.taxTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="label">Other Charges</span>
              <input
                type="number"
                value={otherCharge}
                onChange={(e) => setOtherCharge(e.target.value)}
              />
            </div>
            <div className="summary-row">
              <span className="label">Discount</span>
              <input
                type="number"
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(e.target.value)}
              />
            </div>
            <div className="summary-row final">
              <span className="label">Final Amount</span>
              <span className="value">₹ {totals.finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {showBuyerSearch && (
        <div
          className="lite-modal-overlay"
          onClick={() => setShowBuyerSearch(false)}
        >
          <div
            className="lite-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Select Buyer</h3>
              <FiX
                className="close-icon"
                onClick={() => setShowBuyerSearch(false)}
              />
            </div>
            <div className="modal-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name..."
                value={buyerSearchTerm}
                onChange={(e) => setBuyerSearchTerm(e.target.value)}
              />
            </div>
            <div className="modal-list">
              {customers
                .filter((c) =>
                  c.customerName
                    ?.toLowerCase()
                    .includes(buyerSearchTerm.toLowerCase()),
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="modal-list-item"
                    onClick={() => {
                      setSelectedBuyer(c);
                      setShowBuyerSearch(false);
                    }}
                  >
                    <span>{c.customerName}</span>
                    <small>{c.businessName || c.email || "No details"}</small>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showProductSearch.show && (
        <div
          className="lite-modal-overlay"
          onClick={() => setShowProductSearch({ show: false, index: -1 })}
        >
          <div
            className="lite-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Select Product</h3>
              <FiX
                className="close-icon"
                onClick={() => setShowProductSearch({ show: false, index: -1 })}
              />
            </div>
            <div className="modal-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>
            <div className="modal-list">
              {products
                .filter((p) =>
                  p.name
                    ?.toLowerCase()
                    .includes(productSearchTerm.toLowerCase()),
                )
                .map((p) => (
                  <div
                    key={p.id}
                    className="modal-list-item"
                    onClick={() =>
                      handleProductSelect(showProductSearch.index, p)
                    }
                  >
                    <span>{p.name}</span>
                    <small>
                      Price: ₹{p.price} | HSN: {p.hsn || "N/A"}
                    </small>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSalesDebit;
