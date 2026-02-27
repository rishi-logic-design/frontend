import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiUpload,
  FiFileText,
  FiDownload,
  FiClock,
} from "react-icons/fi";
import { toast } from "react-toastify";
import reportService from "../../services/reportService";
import "./bulkImport.scss";

const IMPORT_TYPES = ["CUSTOMERS", "PRODUCTS", "VENDORS", "INVENTORY"];

const BulkImport = () => {
  const navigate = useNavigate();
  const vendorData = JSON.parse(localStorage.getItem("vendorData") || "{}");

  const [importType, setImportType] = useState("PRODUCTS");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([
    {
      id: 1,
      type: "PRODUCTS",
      filename: "my_products.csv",
      date: "02/27/2026 10:45 AM",
      status: "Completed",
      count: 45,
    },
    {
      id: 2,
      type: "CUSTOMERS",
      filename: "customer_list.csv",
      date: "02/25/2026 03:12 PM",
      status: "Completed",
      count: 120,
    },
  ]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) return toast.error("Please select a file first");

    setLoading(true);
    // Simulate import
    setTimeout(() => {
      const newEntry = {
        id: Date.now(),
        type: importType,
        filename: file.name,
        date: new Date().toLocaleString(),
        status: "Completed",
        count: Math.floor(Math.random() * 100) + 1,
      };
      setHistory([newEntry, ...history]);
      setFile(null);
      toast.success(`${importType} imported successfully!`);
      setLoading(false);
    }, 1500);
  };

  const handleDownloadTemplate = () => {
    toast.info(`Downloading template for ${importType}...`);
  };

  return (
    <div className="bi-page">
      <header className="bi-header">
        <div className="bi-header__left">
          <button
            className="back-btn"
            onClick={() => navigate("/vendor/reports")}
          >
            <FiChevronLeft />
          </button>
          <h1>Bulk Import All Data</h1>
        </div>
        <div className="bi-header__right">
          <div className="profile-pill">
            <div className="avatar">
              {vendorData?.businessName?.charAt(0) || "M"}
            </div>
            <span>{vendorData?.businessName || "My Company"}</span>
            <FiChevronDown />
          </div>
        </div>
      </header>

      <main className="bi-main">
        <div className="bi-card">
          <div className="bi-generator">
            <h2 className="section-title">New Bulk Import</h2>
            <div className="generator-inputs">
              <div className="input-group">
                <label>Import Type</label>
                <div className="select-wrap">
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value)}
                  >
                    {IMPORT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>

              <div className="input-group">
                <label>Step 1: Get Template</label>
                <button
                  className="btn-template"
                  onClick={handleDownloadTemplate}
                >
                  <FiDownload /> Download {importType} Template
                </button>
              </div>

              <div className="input-group file-group">
                <label>Step 2: Upload Files</label>
                <div className="file-input-wrap">
                  <input
                    type="file"
                    id="bulk-file"
                    accept=".csv, .xlsx"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="bulk-file">
                    {file ? file.name : "Choose CSV or Excel file"}
                  </label>
                </div>
              </div>

              <button
                className="btn-import"
                disabled={loading || !file}
                onClick={handleImport}
              >
                <FiUpload /> {loading ? "Importing..." : "Process Import"}
              </button>
            </div>
          </div>

          <div className="bi-history">
            <h3 className="history-title">Import History</h3>
            <div className="bi-table-wrap">
              <table className="bi-table">
                <thead>
                  <tr>
                    <th>Import Type</th>
                    <th>Filename</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Records</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id}>
                      <td>{row.type}</td>
                      <td>{row.filename}</td>
                      <td>{row.date}</td>
                      <td className="status-cell">
                        <span className={`status-badge completed`}>
                          {row.status}
                        </span>
                      </td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BulkImport;
