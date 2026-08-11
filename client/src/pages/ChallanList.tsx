import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function ChallanList() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { load(); }, [status, page]);

  async function load() {
    const res = await api.get("/challans", { params: { status, page, pageSize: 10 } });
    setItems(res.data.items);
    setTotalPages(res.data.totalPages);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Sales Challans</h1>
        <Link to="/challans/new" className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700">
          + New Challan
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-2">Challan #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Total Qty</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/challans/${c.id}`} className="text-brand-600 hover:underline">{c.challanNumber}</Link>
                </td>
                <td className="px-4 py-2">{c.customer?.businessName || c.customer?.name}</td>
                <td className="px-4 py-2">{c.totalQuantity}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    c.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    c.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                  }`}>{c.status}</span>
                </td>
                <td className="px-4 py-2 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No challans found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded-md disabled:opacity-40">Previous</button>
        <span>Page {page} of {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded-md disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
