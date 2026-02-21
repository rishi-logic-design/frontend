import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaPlus,
  FaFilter,
  FaSort,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./paymentsMade.scss";

const PaymentsMade = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [payments, setPayments] = useState([]); // Mocking empty for now as per screenshot
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock data for demonstration if needed
  // useEffect(() => {
  //   setPayments([]);
  // }, []);

  const totalPages = Math.ceil(payments.length / rowsPerPage);

  return (
    <div className="payments-made-page">
      <div className="main-content-card">
        <div className="toolbar-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button
              className="btn btn-dark"
              onClick={() => navigate("/vendor/add-payment-made")}
            >
              Make Payment
            </button>
          </div>
        </div>

        <div className="table-container">
          <div className="table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Payment Date</th>
                  <th>Seller Name</th>
                  <th>Payment Mode</th>
                  <th>Total Amount (₹)</th>
                  <th>Advance Amount (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.receiptNo}</td>
                      <td>{p.date}</td>
                      <td>{p.sellerName}</td>
                      <td>{p.paymentMode}</td>
                      <td>{p.totalAmount}</td>
                      <td>{p.advanceAmount}</td>
                      <td className="action-cell">
                        <div className="action-btns">
                          {/* Add actions if needed */}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-footer">
          <div className="rows-selector">
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
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="page-nav-btn"
            >
              <FaChevronLeft />
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="page-nav-btn"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsMade;
