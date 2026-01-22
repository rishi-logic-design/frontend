import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import Customer from "./pages/Customer";
import NewBill from "./components/homepage/NewBill";
import NewChallan from "./components/homepage/NewChallan";
import AddPayment from "./components/homepage/AddPayment";
import ChallanDetails from "./components/homepage/ChallanDetails";
import BillDetails from "./components/homepage/BillDetails";
import AddProduct from "./components/productPage/AddProduct";
import AddCustomer from "./components/customerPage/AddCustomer";
import CustomerDetails from "./components/customerPage/CostomerDetails";
import ExportLedger from "./components/customerPage/ExportLedger";
import ProductPage from "./pages/ProductPage";
import EditProfile from "./components/accountPage/EditProfile";
import AccountPage from "./pages/AccountPage";
import Payment from "./components/accountPage/Payment";
import GSTSlabs from "./components/accountPage/GstSlabs";
import GSTNumber from "./components/accountPage/GstNumber";
import FirmAddress from "./components/accountPage/FilmAddress";

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

          {/* Account Routes */}
          <Route path="account" element={<AccountPage />} />
          <Route path="account/edit-profile" element={<EditProfile />} />
          <Route path="account/payment" element={<Payment />} />
          <Route path="account/gst-slabs" element={<GSTSlabs />} />
          <Route path="account/gst-number" element={<GSTNumber />} />
          <Route path="account/firm-address" element={<FirmAddress />} />

          <Route
            path="new-challan"
            element={
              <ProtectedRoute>
                <NewChallan />
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
            path="export-ledger"
            element={
              <ProtectedRoute>
                <ExportLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="add-customer"
            element={
              <ProtectedRoute>
                <AddCustomer />
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
            path="subscriptions"
            element={
              <div style={{ padding: "32px" }}>
                <h1>Subscription Page</h1>
                <p>Coming Soon...</p>
              </div>
            }
          />

          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Redirects */}
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
