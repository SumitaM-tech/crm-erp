import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

const empty = { name: "", sku: "", category: "", unitPrice: "", minStock: "0", location: "" };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState<any>(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then((res) => {
        const p = res.data;
        setForm({
          name: p.name,
          sku: p.sku,
          category: p.category || "",
          unitPrice: String(p.unitPrice),
          minStock: String(p.minStock),
          location: p.location || "",
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function update(field: string, value: string) {
    setForm((f: any) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        unitPrice: parseFloat(form.unitPrice),
        minStock: parseInt(form.minStock, 10),
      };
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      navigate("/products");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">{isEdit ? "Edit Product" : "Add Product"}</h1>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-4">
        <Field label="Product Name" value={form.name} onChange={(v: string) => update("name", v)} required />
        <Field label="SKU / Code" value={form.sku} onChange={(v: string) => update("sku", v)} required disabled={isEdit} />
        <Field label="Category" value={form.category} onChange={(v: string) => update("category", v)} />
        <Field label="Unit Price (₹)" value={form.unitPrice} onChange={(v: string) => update("unitPrice", v)} type="number" required />
        <Field label="Min Stock Alert Qty" value={form.minStock} onChange={(v: string) => update("minStock", v)} type="number" required />
        <Field label="Location / Warehouse" value={form.location} onChange={(v: string) => update("location", v)} />

        <div className="col-span-2 flex gap-3 mt-2">
          <button disabled={saving} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Product"}
          </button>
          <button type="button" onClick={() => navigate("/products")} className="text-sm px-4 py-2 border rounded-md">
            Cancel
          </button>
        </div>
      </form>
      {isEdit && <p className="text-xs text-gray-400 mt-3">Stock quantity is changed only via Stock Movements on the product detail page — not by editing here.</p>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, disabled = false }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        className="w-full border rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
