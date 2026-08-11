import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CustomerList from "./pages/CustomerList";
import CustomerForm from "./pages/CustomerForm";
import CustomerDetail from "./pages/CustomerDetail";
import ProductList from "./pages/ProductList";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import ChallanList from "./pages/ChallanList";
import ChallanForm from "./pages/ChallanForm";
import ChallanDetail from "./pages/ChallanDetail";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />

            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SALES"]} />}>
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/new" element={<CustomerForm />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/customers/:id/edit" element={<CustomerForm />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "WAREHOUSE"]} />}>
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/products/:id/edit" element={<ProductForm />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SALES", "ACCOUNTS"]} />}>
              <Route path="/challans" element={<ChallanList />} />
              <Route path="/challans/new" element={<ChallanForm />} />
              <Route path="/challans/:id" element={<ChallanDetail />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
