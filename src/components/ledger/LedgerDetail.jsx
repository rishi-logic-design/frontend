import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ledgerDetail.scss";
import {
  FiSearch,
  FiArrowLeft,
  FiEye,
  FiDownload,
  FiChevronDown,
} from "react-icons/fi";
import { RiEdit2Fill, RiFilePdfFill, RiFileExcel2Fill } from "react-icons/ri";
import ledgerService from "../../services/ledgerService";
import accountService from "../../services/accountService";

const LedgerDetail = ({ party, partyType, onBack }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("2020-01-01");
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState({
    transactions: [],
    openingBalance: 0,
    closingBalance: 0,
    totalDebit: 0,
    totalCredit: 0,
  });

  useEffect(() => {
    fetchLedgerData();
  }, [party, fromDate, toDate]);

  const fetchLedgerData = async () => {
    if (!party) return;
    try {
      setLoading(true);
      const partyId = party.id || party._id;
      let data;

      if (partyType === "account") {
        data = await accountService.getAccountLedger(partyId, {
          fromDate,
          toDate,
        });
      } else {
        data = await ledgerService.getLedgerSummary(partyId, partyType, {
          fromDate,
          toDate,
        });
      }
      setLedgerData({
        transactions: data.entries || [],
        openingBalance: data.openingBalance || 0,
        closingBalance: data.closingBalance || 0,
        totalDebit: data.totalDebit || 0,
        totalCredit: data.totalCredit || 0,
      });
    } catch (error) {
      console.error("Error fetching ledger data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getParticulars = (tx) => {
    return tx.particulars || tx.type || "Transaction";
  };

  const getVoucherType = (tx) => {
    return tx.voucherType || "";
  };

  return (
    <div className="ledger-detail">
      <div className="detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            <FiArrowLeft />
          </button>
          <h1>Summary Of Transactions</h1>
        </div>
        <div className="header-right">
          <span className="party-name">
            {party?.customerName ||
              party?.vendorName ||
              party?.accountName ||
              "Party"}
          </span>
        </div>
      </div>

      <div className="detail-toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="date-filters">
          <div className="date-group">
            <label>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="date-group">
            <label>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-actions">
          <div className="create-dropdown">
            <button
              className="create-btn"
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            >
              Create <FiChevronDown />
            </button>
            {showCreateDropdown && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/vendor/new-bill")}
                >
                  Invoice
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/vendor/add-payment")}
                >
                  Payment Receipt
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/vendor/new-credit-note")}
                >
                  Credit Note
                </div>
              </div>
            )}
          </div>
          <button
            className="export-btn pdf"
            onClick={() =>
              ledgerService.exportLedger({
                partyId: party.id || party._id,
                format: "pdf",
                fromDate,
                toDate,
              })
            }
          >
            <RiFilePdfFill /> PDF
          </button>
          <button
            className="export-btn excel"
            onClick={() =>
              ledgerService.exportLedger({
                partyId: party.id || party._id,
                format: "csv",
                fromDate,
                toDate,
              })
            }
          >
            <RiFileExcel2Fill /> Excel
          </button>
        </div>
      </div>

      <div className="balance-row opening">
        <div className="balance-label">
          Opening Balance as on Date :{" "}
          {new Date(fromDate).toLocaleDateString("en-IN")}
        </div>
        <div className="balance-amount">
          ₹
          {Number(ledgerData.openingBalance || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Voucher Date</th>
              <th>Voucher No.</th>
              <th>Particulars</th>
              <th>Voucher Type</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px" }}>
                  Loading entries...
                </td>
              </tr>
            ) : ledgerData.transactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px" }}>
                  No entries found for this period
                </td>
              </tr>
            ) : (
              ledgerData.transactions
                .filter(
                  (tx) =>
                    getParticulars(tx)
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    (tx.voucherNo || "")
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                )
                .map((tx, idx) => (
                  <tr key={idx}>
                    <td>
                      {new Date(
                        tx.voucherDate || tx.date || tx.createdAt,
                      ).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      {tx.voucherNo ||
                        tx.invoiceNo ||
                        tx.billNo ||
                        tx.paymentId ||
                        "-"}
                    </td>
                    <td>{getParticulars(tx)}</td>
                    <td>{getVoucherType(tx)}</td>
                    <td className="amount-cell">
                      {tx.debit
                        ? `₹${Number(tx.debit).toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td className="amount-cell">
                      {tx.credit
                        ? `₹${Number(tx.credit).toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td>
                      <div className="actions">
                        {tx.debit > 0 && !tx.isPaid && (
                          <button
                            className="receive-btn"
                            onClick={() =>
                              navigate("/vendor/add-payment", {
                                state: { party, tx },
                              })
                            }
                          >
                            Receive Payment
                          </button>
                        )}
                        <button className="icon-btn view" title="View">
                          <FiEye />
                        </button>
                        <button className="icon-btn edit" title="Edit">
                          <RiEdit2Fill />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <div className="balance-row closing">
        <div className="balance-label">
          Closing Balance as on Date :{" "}
          {new Date(toDate).toLocaleDateString("en-IN")}
        </div>
        <div className="balance-amount">
          ₹
          {Number(ledgerData.closingBalance || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </div>
      </div>

      {/* Footer totals for current view */}
      <div
        className="balance-row totals"
        style={{
          borderTop: "1px solid #ddd",
          marginTop: "5px",
          paddingTop: "10px",
        }}
      >
        <div className="balance-label">TOTAL (This Page)</div>
        <div className="totals-group" style={{ display: "flex", gap: "50px" }}>
          <div className="debit-total">
            DR: ₹{Number(ledgerData.totalDebit || 0).toLocaleString("en-IN")}
          </div>
          <div className="credit-total" style={{ marginRight: "340px" }}>
            CR: ₹{Number(ledgerData.totalCredit || 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="table-footer">
        <div className="entries-info">
          Show
          <select>
            <option>10</option>
          </select>
          Show 1 to {ledgerData.transactions.length} of{" "}
          {ledgerData.transactions.length} entries
        </div>
        <div className="pagination">
          <button className="page-nav">‹</button>
          <button className="page-num active">1</button>
          <button className="page-nav">›</button>
        </div>
      </div>
    </div>
  );
};

export default LedgerDetail;
