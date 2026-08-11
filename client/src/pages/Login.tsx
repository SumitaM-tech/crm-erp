import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("admin@erp.test");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-brand-700 mb-1">ERP + CRM Portal</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to continue</p>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-4">{error}</div>}

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          className="w-full border rounded-md px-3 py-2 mb-4 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          className="w-full border rounded-md px-3 py-2 mb-6 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        <button
          disabled={loading}
          className="w-full bg-brand-600 text-white rounded-md py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Seeded roles: admin@erp.test · sales@erp.test · warehouse@erp.test · accounts@erp.test (password: Password@123)
        </p>
      </form>
    </div>
  );
}
