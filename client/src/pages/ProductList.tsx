import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

interface Product {
  id: string; name: string; sku: string; category?: string;
  unitPrice: string; stock: number; minStock: number; location?: string;
}

export default function ProductList() {
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStock, page]);

  async function load() {
    const res = await api.get("/products", { params: { search, lowStock, page, pageSize: 10 } });
    setItems(res.data.items);
    setTotalPages(res.data.totalPages);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Products & Stock</h1>
        <Link to="/products/new" className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700">
          + Add Product
        </Link>
      </div>

      <div className="flex gap-3 mb-4 items-center">
        <input
          className="border rounded-md px-3 py-2 text-sm flex-1"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowStock} onChange={(e) => { setPage(1); setLowStock(e.target.checked); }} />
          Low stock only
        </label>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Location</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/products/${p.id}`} className="text-brand-600 hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-2">{p.sku}</td>
                <td className="px-4 py-2">{p.category || "—"}</td>
                <td className="px-4 py-2">₹{p.unitPrice}</td>
                <td className="px-4 py-2">
                  <span className={p.stock <= p.minStock ? "text-red-600 font-medium" : ""}>{p.stock}</span>
                  {p.stock <= p.minStock && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Low</span>}
                </td>
                <td className="px-4 py-2">{p.location || "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No products found</td></tr>
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
