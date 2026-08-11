import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  businessName?: string;
  type: string;
  status: string;
}

export default function CustomerList() {
  const [items, setItems] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/customers", { params: { search, status, page, pageSize: 10 } });
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Customers</h1>
        <Link to="/customers/new" className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700">
          + Add Customer
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          className="border rounded-md px-3 py-2 text-sm flex-1"
          placeholder="Search by name, mobile, or business..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Mobile</th>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-2">
                  <Link to={`/customers/${c.id}`} className="text-brand-600 hover:underline">{c.name}</Link>
                </td>
                <td className="px-4 py-2">{c.mobile}</td>
                <td className="px-4 py-2">{c.businessName || "—"}</td>
                <td className="px-4 py-2">{c.type}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    c.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                    c.status === "LEAD" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                  }`}>{c.status}</span>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No customers found</td></tr>
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
