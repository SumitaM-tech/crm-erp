import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

interface Line { productId: string; quantity: string; }

export default function ChallanForm() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "1" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/customers", { params: { pageSize: 100 } }).then((res) => setCustomers(res.data.items));
    api.get("/products", { params: { pageSize: 100 } }).then((res) => setProducts(res.data.items));
  }, []);

  function updateLine(idx: number, field: keyof Line, value: string) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((ls) => [...ls, { productId: "", quantity: "1" }]);
  }

  function removeLine(idx: number) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  async function submit(status: "DRAFT" | "CONFIRMED") {
    setError("");
    if (!customerId) return setError("Select a customer");
    const items = lines
      .filter((l) => l.productId && Number(l.quantity) > 0)
      .map((l) => ({ productId: l.productId, quantity: parseInt(l.quantity, 10) }));
    if (items.length === 0) return setError("Add at least one product line");

    setSaving(true);
    try {
      const res = await api.post("/challans", { customerId, items, status });
      navigate(`/challans/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create challan");
    } finally {
      setSaving(false);
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">New Sales Challan</h1>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <select className="w-full border rounded-md px-3 py-2 text-sm mb-6" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.businessName || c.name} ({c.mobile})</option>
          ))}
        </select>

        <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
        <div className="space-y-3 mb-3">
          {lines.map((line, idx) => {
            const product = productMap.get(line.productId);
            return (
              <div key={idx} className="flex gap-3 items-center">
                <select
                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                  value={line.productId}
                  onChange={(e) => updateLine(idx, "productId", e.target.value)}
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (SKU {p.sku}) — stock: {p.stock}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="w-28 border rounded-md px-3 py-2 text-sm"
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                />
                {product && Number(line.quantity) > product.stock && (
                  <span className="text-xs text-red-600">exceeds stock ({product.stock})</span>
                )}
                <button type="button" onClick={() => removeLine(idx)} className="text-gray-400 hover:text-red-600 text-sm px-2">✕</button>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={addLine} className="text-sm text-brand-600 hover:underline mb-6">+ Add another product</button>

        <div className="flex gap-3">
          <button disabled={saving} onClick={() => submit("DRAFT")} className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
            Save as Draft
          </button>
          <button disabled={saving} onClick={() => submit("CONFIRMED")} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50">
            {saving ? "Saving..." : "Confirm Challan"}
          </button>
        </div>
      </div>
    </div>
  );
}
