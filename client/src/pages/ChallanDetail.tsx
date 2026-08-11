import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

export default function ChallanDetail() {
  const { id } = useParams();
  const [challan, setChallan] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const res = await api.get(`/challans/${id}`);
    setChallan(res.data);
  }

  async function confirm() {
    setError(""); setBusy(true);
    try {
      await api.post(`/challans/${id}/confirm`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to confirm challan");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setError(""); setBusy(true);
    try {
      await api.post(`/challans/${id}/cancel`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to cancel challan");
    } finally {
      setBusy(false);
    }
  }

  if (!challan) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">{challan.challanNumber}</h1>
        <span className={`px-3 py-1 rounded-full text-xs ${
          challan.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
          challan.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
        }`}>{challan.status}</span>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6 mb-4 text-sm">
        <p><span className="text-gray-500">Customer:</span> {challan.customer?.businessName || challan.customer?.name}</p>
        <p><span className="text-gray-500">Created by:</span> {challan.createdBy?.name}</p>
        <p><span className="text-gray-500">Created:</span> {new Date(challan.createdAt).toLocaleString()}</p>
        <p><span className="text-gray-500">Total Quantity:</span> {challan.totalQuantity}</p>
      </div>

      <h2 className="text-lg font-medium text-gray-800 mb-2">Line Items</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-2">Product (snapshot)</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Unit Price</th>
              <th className="px-4 py-2">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {challan.items?.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">{item.productNameSnapshot}</td>
                <td className="px-4 py-2">{item.skuSnapshot}</td>
                <td className="px-4 py-2">₹{item.unitPriceSnapshot}</td>
                <td className="px-4 py-2">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {challan.status === "DRAFT" && (
        <div className="flex gap-3">
          <button disabled={busy} onClick={confirm} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50">
            Confirm Challan
          </button>
          <button disabled={busy} onClick={cancel} className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
            Cancel Challan
          </button>
        </div>
      )}
      {challan.status === "CONFIRMED" && (
        <button disabled={busy} onClick={cancel} className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
          Cancel Challan (reverses stock)
        </button>
      )}
    </div>
  );
}
