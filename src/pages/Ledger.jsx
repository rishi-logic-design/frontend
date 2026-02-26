import React, { useState, useEffect } from "react";
import "./ledger.scss";
import { toast } from "react-toastify";
import customerService from "../services/customerService";
import vendorVendorService from "../services/vendorVendorService";
import ledgerService from "../services/ledgerService";
import accountService from "../services/accountService";
import {
  FiSearch,
  FiDownload,
  FiMail,
  FiUserPlus,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
} from "react-icons/fi";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { RiEdit2Fill, RiBuilding4Fill } from "react-icons/ri";
import { IoChevronDown } from "react-icons/io5";
import AdjustBalanceModal from "../components/ledger/AdjustBalanceModal";
import AccountModal from "../components/ledger/AccountModal";
import AddExpenseIncomeModal from "../components/ledger/AddExpenseIncomeModal";
import ContraEntryModal from "../components/ledger/ContraEntryModal";
import DownloadLedgerModal from "../components/ledger/DownloadLedgerModal";
import LedgerDetail from "../components/ledger/LedgerDetail";
import { useNavigate } from "react-router-dom";

const TABS = [
  "DEBITORS (CUSTOMERS)",
  "CREDITORS (VENDORS)",
  "CASH AND BANKS",
  "OTHER ACCOUNTS",
];

const Ledger = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showContraModal, setShowContraModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'detail'
  const [selectedParty, setSelectedParty] = useState(null);

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === TABS[0]) {
        const res = await ledgerService.getLedgerCustomers();
        const customers =
          res?.data?.rows ||
          res?.rows ||
          res?.data ||
          (Array.isArray(res) ? res : []);
        setData(customers);
      } else if (activeTab === TABS[1]) {
        const res = await ledgerService.getLedgerVendors();
        const vendors =
          res?.data?.rows ||
          res?.rows ||
          res?.data ||
          (Array.isArray(res) ? res : []);
        setData(vendors);
      } else if (activeTab === TABS[2]) {
        // Fetch Cash and Bank accounts
        const [cashRes, bankRes] = await Promise.all([
          accountService.getAccounts({ accountType: "CASH" }),
          accountService.getAccounts({ accountType: "BANK" }),
        ]);
        const cashAccounts =
          cashRes?.data || (Array.isArray(cashRes) ? cashRes : []);
        const bankAccounts =
          bankRes?.data || (Array.isArray(bankRes) ? bankRes : []);
        setData([...cashAccounts, ...bankAccounts]);
      } else if (activeTab === TABS[3]) {
        // Other accounts
        const res = await accountService.getAccounts({ accountType: "OTHER" });
        const accounts = res?.data || (Array.isArray(res) ? res : []);
        setData(accounts);
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab} data:`, error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (downloadParams) => {
    try {
      setLoading(true);
      await ledgerService.exportLedger({
        ...downloadParams,
        type: activeTab === TABS[0] ? "customer" : "vendor",
      });
      toast.success("Ledger downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(
        "Failed to download ledger: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const filteredData = data.filter((item) => {
    const name =
      item.customerName ||
      item.vendorName ||
      item.partyName ||
      item.accountName ||
      "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  if (viewMode === "detail") {
    return (
      <div className="ledger-page">
        <header className="ledger-header">
          <div className="header-top">
            <h1>Ledger</h1>
            <div className="company-info">
              <span className="business-name">RISHI LOGIC DESIGN</span>
              <span className="version">V2</span>
            </div>
          </div>
        </header>
        <main className="ledger-content">
          <LedgerDetail
            party={selectedParty}
            partyType={
              activeTab === TABS[0]
                ? "customer"
                : activeTab === TABS[1]
                  ? "vendor"
                  : "account"
            }
            onBack={() => {
              setViewMode("list");
              setSelectedParty(null);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="ledger-page">
      <header className="ledger-header">
        <div className="header-left">
          <h1>Ledger</h1>
          <span className="version-badge">v2</span>
        </div>
        <div className="header-right">
          <div className="company-selector">
            <div className="company-icon">
              <RiBuilding4Fill />
            </div>
          </div>
        </div>
      </header>

      <div className="ledger-tabs">
        {TABS.map((tab) => (
          <div
            key={tab}
            className={`tab-item ${activeTab === tab ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      <main className="ledger-content">
        <div className="ledger-section">
          <h2>
            {activeTab === TABS[2] || activeTab === TABS[3]
              ? "List Of Accounts"
              : "Summary Of Transactions"}
          </h2>

          <div className="ledger-toolbar">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="toolbar-actions">
              {activeTab === TABS[0] && (
                <>
                  <button
                    className="action-btn"
                    onClick={() => navigate("/vendor/customers")}
                  >
                    <FiUserPlus /> Add Customer
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setShowDownloadModal(true)}
                  >
                    <FiDownload /> Download
                  </button>
                  <button className="action-btn outline">
                    <FiMail /> Send On Mail
                  </button>
                </>
              )}
              {activeTab === TABS[1] && (
                <>
                  <button
                    className="action-btn"
                    onClick={() => navigate("/vendor/vendors")}
                  >
                    <FiUserPlus /> Add Vendor
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setShowDownloadModal(true)}
                  >
                    <FiDownload /> Download
                  </button>
                  <button className="action-btn outline">
                    <FiMail /> Send On Mail
                  </button>
                </>
              )}
              {activeTab === TABS[2] && (
                <>
                  <button
                    className="action-btn outline"
                    onClick={() => setShowAdjustModal(true)}
                  >
                    Adjust Balance
                  </button>
                  <button
                    className="action-btn outline"
                    onClick={() => setShowContraModal(true)}
                  >
                    Contra Entry (Bank/Cash Transfer)
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setShowAccountModal(true)}
                  >
                    Add Bank/Cash
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setShowDownloadModal(true)}
                  >
                    <FiDownload /> Download
                  </button>
                </>
              )}
              {activeTab === TABS[3] && (
                <>
                  <button
                    className="action-btn"
                    onClick={() => setShowAddExpenseModal(true)}
                  >
                    Add Expense/Income
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setShowDownloadModal(true)}
                  >
                    <FiDownload /> Download
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                {activeTab === TABS[0] || activeTab === TABS[1] ? (
                  <tr>
                    <th>Company Name</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>GST Type</th>
                    <th>GSTIN</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Account Name</th>
                    <th>Account type</th>
                    <th>Description</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        activeTab === TABS[0] || activeTab === TABS[1]
                          ? "7"
                          : "5"
                      }
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        activeTab === TABS[0] || activeTab === TABS[1]
                          ? "7"
                          : "5"
                      }
                      style={{ textAlign: "center", padding: "40px" }}
                    >
                      No entries found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const home = item.homeAddress
                      ? typeof item.homeAddress === "string"
                        ? JSON.parse(item.homeAddress)
                        : item.homeAddress
                      : {};
                    const city = home.areaCity || item.city || "N/A";
                    const name =
                      item.customerName ||
                      item.vendorName ||
                      item.businessName ||
                      item.accountName ||
                      "N/A";
                    const gstType = item.gstType || "N/A";
                    const phone = item.mobileNumber || "";
                    const type =
                      item.accountType ||
                      (activeTab === TABS[0] ? "Receivable" : "Payable");
                    const balance =
                      item.balance !== undefined
                        ? item.balance.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })
                        : "0.00";

                    return (
                      <tr
                        key={item.id || item._id || index}
                        onClick={() => {
                          setSelectedParty(item);
                          setViewMode("detail");
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{name}</td>
                        {activeTab === TABS[0] || activeTab === TABS[1] ? (
                          <>
                            <td>{phone}</td>
                            <td>{city}</td>
                            <td>{gstType}</td>
                            <td>{item.gstNumber || ""}</td>
                          </>
                        ) : (
                          <>
                            <td>{type}</td>
                            <td>{item.description || ""}</td>
                          </>
                        )}
                        <td>
                          <div className="balance-info">
                            {(activeTab === TABS[0] ||
                              activeTab === TABS[1]) && (
                              <div className="type">
                                {activeTab === TABS[0]
                                  ? "Receivable"
                                  : "Payable"}
                              </div>
                            )}
                            <div className="amount">{balance}</div>
                          </div>
                        </td>
                        <td>
                          <div className="actions">
                            <div className="row-btn" title="View">
                              <FiEye />
                            </div>
                            <div className="row-btn" title="Edit">
                              <RiEdit2Fill />
                            </div>
                            <div className="row-btn" title="More">
                              <HiOutlineDotsVertical />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="footer-left">
              <div className="entries-select">
                <span>Show</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <span>
                Show{" "}
                {filteredData.length > 0
                  ? (currentPage - 1) * rowsPerPage + 1
                  : 0}{" "}
                to {Math.min(currentPage * rowsPerPage, filteredData.length)} of{" "}
                {filteredData.length} entries
              </span>
            </div>

            <div className="pagination">
              <div
                className={`page-btn ${currentPage === 1 ? "disabled" : ""}`}
                onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
              >
                <FiChevronLeft />
              </div>
              <div className="page-btn active">{currentPage}</div>
              <div
                className={`page-btn ${currentPage * rowsPerPage >= filteredData.length ? "disabled" : ""}`}
                onClick={() =>
                  currentPage * rowsPerPage < filteredData.length &&
                  setCurrentPage((p) => p + 1)
                }
              >
                <FiChevronRight />
              </div>
            </div>
          </div>
        </div>
      </main>

      <AdjustBalanceModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        onConfirm={async (formData) => {
          try {
            await accountService.adjustBalance(formData);
            toast.success("Balance adjusted successfully!");
            fetchTabData();
          } catch (error) {
            console.error("Failed to adjust balance:", error);
            toast.error(
              "Failed to adjust balance: " + (error.message || "Unknown error"),
            );
          }
        }}
      />

      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onConfirm={async (formData) => {
          try {
            await accountService.createAccount({
              ...formData,
              accountType: formData.type || "BANK",
            });
            toast.success("Account created successfully!");
            fetchTabData();
          } catch (error) {
            console.error("Failed to create account:", error);
            toast.error(
              "Failed to create account: " + (error.message || "Unknown error"),
            );
          }
        }}
      />

      <ContraEntryModal
        isOpen={showContraModal}
        onClose={() => setShowContraModal(false)}
        onConfirm={async (formData) => {
          try {
            await accountService.contraEntry(formData);
            toast.success("Contra entry processed successfully!");
            fetchTabData();
          } catch (error) {
            console.error("Failed to process contra entry:", error);
            toast.error(
              "Failed to process contra entry: " +
                (error.message || "Unknown error"),
            );
          }
        }}
      />

      <DownloadLedgerModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
      />

      <AddExpenseIncomeModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onConfirm={async (formData) => {
          try {
            await accountService.createAccount({
              ...formData,
              accountType: "OTHER",
            });
            toast.success("Income/Expense account added successfully!");
            fetchTabData();
          } catch (error) {
            console.error("Failed to add income/expense account:", error);
            toast.error(
              "Failed to add account: " + (error.message || "Unknown error"),
            );
          }
        }}
      />
    </div>
  );
};

export default Ledger;
