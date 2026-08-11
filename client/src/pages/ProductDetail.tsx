import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const res = await api.get(`/products/${id}`);
    setProduct(res.data);
  }

  async function handleMovement(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/products/${id}/stock-movements`, {
        quantity: parseInt(qty, 10),
        type,
        reason,
      });
      setQty("");
      setReason("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to record stock movement");
    } finally {
      setSaving(false);
    }
  }

  if (!product) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">{product.name}</h1>
        <Link to={`/products/${id}/edit`} className="text-sm bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700">Edit</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-3 text-sm mb-6">
        <p><span className="text-gray-500">SKU:</span> {product.sku}</p>
        <p><span className="text-gray-500">Category:</span> {product.category || "—"}</p>
        <p><span className="text-gray-500">Unit Price:</span> ₹{product.unitPrice}</p>
        <p><span className="text-gray-500">Location:</span> {product.location || "—"}</p>
        <p><span className="text-gray-500">Current Stock:</span> <span className={product.stock <= product.minStock ? "text-red-600 font-semibold" : "font-semibold"}>{product.stock}</span></p>
        <p><span className="text-gray-500">Min Stock Alert:</span> {product.minStock}</p>
      </div>

      <h2 className="text-lg font-medium text-gray-800 mb-2">Record Stock Movement</h2>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-3">{error}</div>}
      <form onSubmit={handleMovement} className="bg-white rounded-lg shadow p-4 flex gap-3 items-end mb-6 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select className="border rounded-md px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value as "IN" | "OUT")}>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
          <input className="border rounded-md px-3 py-2 text-sm w-28" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} required />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
          <input className="border rounded-md px-3 py-2 text-sm w-full" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g. Purchase order received, damaged stock write-off..." />
        </div>
        <button disabled={saving} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50">
          {saving ? "Saving..." : "Record"}
        </button>
      </form>

      <h2 className="text-lg font-medium text-gray-800 mb-2">Movement History</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">By</th>
              <th className="px-4 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {product.stockMovements?.map((m: any) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${m.type === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{m.type}</span>
                </td>
                <td className="px-4 py-2">{m.quantity}</td>
                <td className="px-4 py-2">{m.reason}</td>
                <td className="px-4 py-2">{m.createdBy?.name}</td>
                <td className="px-4 py-2 text-gray-500">{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {product.stockMovements?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No movements recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
