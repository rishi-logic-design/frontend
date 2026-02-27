import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import Customer from "./pages/Customer";
import NewBill from "./components/sales/NewBill";
import NewChallan from "./components/sales/NewChallan";
import AddPayment from "./components/sales/AddPayment";
import ChallanDetails from "./components/sales/challanDetails";
import BillDetails from "./components/sales/BillDetails";
import BillsList from "./components/sales/BillsList";
import ChallansList from "./components/sales/ChallansList";
import AddProduct from "./components/productPage/AddProduct";
import CustomerDetails from "./components/customerPage/CostomerDetails";
import ExportLedger from "./components/customerPage/ExportLedger";
import ProductPage from "./pages/ProductPage";
import EditProfile from "./components/accountPage/EditProfile";
import AccountPage from "./pages/AccountPage";
import Payment from "./components/accountPage/Payment";
import GSTSlabs from "./components/accountPage/GstSlabs";
import GSTNumber from "./components/accountPage/GstNumber";
import FirmAddress from "./components/accountPage/FilmAddress";
import BillingSettings from "./components/accountPage/BillingSettings";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PaymentReceipts from "./components/sales/PaymentReceipts";
import AddVendorPage from "./components/master/AddVendorPage";
import EWayBill from "./pages/EWayBill";
import EInvoice from "./components/sales/EInvoice";
import PurchaseList from "./components/purchases/PurchaseList";
import NewPurchase from "./components/purchases/NewPurchase";
import PaymentsMade from "./components/purchases/PaymentsMade";
import AddPaymentMade from "./components/purchases/AddPaymentMade";
import UploadPurchase from "./components/purchases/UploadPurchase";
import Inventory from "./pages/Inventory";
import CreditNote from "./components/sales/CreditNote";
import SalesDebit from "./components/sales/SalesDebit";
import NewCreditNote from "./components/sales/NewCreditNote";
import NewSalesDebit from "./components/sales/NewSalesDebit";
import Report from "./pages/Report";
import SalesDebitNoteDetails from "./components/sales/SalesDebitNoteDetails";
import CreditNoteDetails from "./components/sales/CreditNoteDetails";
import Ledger from "./pages/Ledger";
import ProductWiseSalesReport from "./components/reports/ProductWiseSalesReport";
import ProductWisePurchaseReport from "./components/reports/ProductWisePurchaseReport";
import PartyWiseSalesReport from "./components/reports/PartyWiseSalesReport";
import PartyWisePurchaseReport from "./components/reports/PartyWisePurchaseReport";
import GSTSalesReport from "./components/reports/GSTSalesReport";
import GSTPurchaseReport from "./components/reports/GSTPurchaseReport";
import InvoiceDetailsReport from "./components/reports/InvoiceDetailsReport";
import PurchaseDetailsReport from "./components/reports/PurchaseDetailsReport";
import CurrentStockReport from "./components/reports/CurrentStockReport";
import DeliveryChallanReport from "./components/reports/DeliveryChallanReport";
import ChallanDetailsReport from "./components/reports/ChallanDetailsReport";
import AuditTrail from "./components/reports/AuditTrail";
import BulkExport from "./components/reports/BulkExport";
import BulkImport from "./components/reports/BulkImport";
import AboutPage from "./pages/AboutPage";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("vendorToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("vendorToken");

  if (token) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/vendor"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<HomePage />} />
          <Route path="customer" element={<Customer />} />
          <Route path="product" element={<ProductPage />} />
          <Route path="vendor" element={<AddVendorPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="account/edit-profile" element={<EditProfile />} />
          <Route path="account/payment" element={<Payment />} />
          <Route path="account/gst-slabs" element={<GSTSlabs />} />
          <Route path="account/gst-number" element={<GSTNumber />} />
          <Route path="account/firm-address" element={<FirmAddress />} />
          <Route
            path="account/billing-settings"
            element={<BillingSettings />}
          />
          <Route path="account/about" element={<AboutPage />} />

          <Route
            path="new-challan"
            element={
              <ProtectedRoute>
                <NewChallan />
              </ProtectedRoute>
            }
          />
          <Route
            path="challans"
            element={
              <ProtectedRoute>
                <ChallansList />
              </ProtectedRoute>
            }
          />
          <Route
            path="new-bill"
            element={
              <ProtectedRoute>
                <NewBill />
              </ProtectedRoute>
            }
          />
          <Route
            path="payment-receipts"
            element={
              <ProtectedRoute>
                <PaymentReceipts />
              </ProtectedRoute>
            }
          />
          <Route
            path="bills"
            element={
              <ProtectedRoute>
                <BillsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="add-payment"
            element={
              <ProtectedRoute>
                <AddPayment />
              </ProtectedRoute>
            }
          />

          <Route
            path="challan-details/:id"
            element={
              <ProtectedRoute>
                <ChallanDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="bill-details/:id"
            element={
              <ProtectedRoute>
                <BillDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="customer-details/:id"
            element={
              <ProtectedRoute>
                <CustomerDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="export-ledger/:id"
            element={
              <ProtectedRoute>
                <ExportLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="add-product"
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="ewaybill"
            element={
              <ProtectedRoute>
                <EWayBill />
              </ProtectedRoute>
            }
          />
          <Route
            path="e-invoice"
            element={
              <ProtectedRoute>
                <EInvoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="credit-notes"
            element={
              <ProtectedRoute>
                <CreditNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="new-credit-note"
            element={
              <ProtectedRoute>
                <NewCreditNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit-credit-note/:id"
            element={
              <ProtectedRoute>
                <NewCreditNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="view-credit-note/:id"
            element={
              <ProtectedRoute>
                <CreditNoteDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="new-sales-debit"
            element={
              <ProtectedRoute>
                <NewSalesDebit />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit-sales-debit/:id"
            element={
              <ProtectedRoute>
                <NewSalesDebit />
              </ProtectedRoute>
            }
          />
          <Route
            path="view-sales-debit/:id"
            element={
              <ProtectedRoute>
                <SalesDebitNoteDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="sales-debit-notes"
            element={
              <ProtectedRoute>
                <SalesDebit />
              </ProtectedRoute>
            }
          />

          <Route
            path="reports"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/product-wise-sales"
            element={
              <ProtectedRoute>
                <ProductWiseSalesReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/product-wise-purchase"
            element={
              <ProtectedRoute>
                <ProductWisePurchaseReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/party-wise-sales"
            element={
              <ProtectedRoute>
                <PartyWiseSalesReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/party-wise-purchase"
            element={
              <ProtectedRoute>
                <PartyWisePurchaseReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/gst-sales"
            element={
              <ProtectedRoute>
                <GSTSalesReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/gst-purchase"
            element={
              <ProtectedRoute>
                <GSTPurchaseReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/invoice-details"
            element={
              <ProtectedRoute>
                <InvoiceDetailsReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/purchase-details"
            element={
              <ProtectedRoute>
                <PurchaseDetailsReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/current-stock"
            element={
              <ProtectedRoute>
                <CurrentStockReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/delivery-challan"
            element={
              <ProtectedRoute>
                <DeliveryChallanReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/challan-details"
            element={
              <ProtectedRoute>
                <ChallanDetailsReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/audit-trail"
            element={
              <ProtectedRoute>
                <AuditTrail />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/bulk-export"
            element={
              <ProtectedRoute>
                <BulkExport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/bulk-import"
            element={
              <ProtectedRoute>
                <BulkImport />
              </ProtectedRoute>
            }
          />
          <Route
            path="ledger"
            element={
              <ProtectedRoute>
                <Ledger />
              </ProtectedRoute>
            }
          />

          <Route
            path="purchases"
            element={
              <ProtectedRoute>
                <PurchaseList />
              </ProtectedRoute>
            }
          />
          <Route
            path="new-purchase"
            element={
              <ProtectedRoute>
                <NewPurchase />
              </ProtectedRoute>
            }
          />
          <Route
            path="payments-made"
            element={
              <ProtectedRoute>
                <PaymentsMade />
              </ProtectedRoute>
            }
          />
          <Route
            path="add-payment-made"
            element={
              <ProtectedRoute>
                <AddPaymentMade />
              </ProtectedRoute>
            }
          />
          <Route
            path="upload-purchase"
            element={
              <ProtectedRoute>
                <UploadPurchase />
              </ProtectedRoute>
            }
          />

          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        <Route
          path="/dashboard"
          element={<Navigate to="/vendor/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
