import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

const empty = {
  name: "", mobile: "", email: "", businessName: "", gstNumber: "",
  type: "RETAIL", address: "", status: "LEAD", followUpDate: "", notes: "",
};

export default function CustomerForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState<any>(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      api.get(`/customers/${id}`).then((res) => {
        const c = res.data;
        setForm({
          ...c,
          email: c.email || "",
          businessName: c.businessName || "",
          gstNumber: c.gstNumber || "",
          address: c.address || "",
          notes: c.notes || "",
          followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : "",
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
        email: form.email || null,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : null,
      };
      if (isEdit) {
        await api.put(`/customers/${id}`, payload);
      } else {
        await api.post("/customers", payload);
      }
      navigate("/customers");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">{isEdit ? "Edit Customer" : "Add Customer"}</h1>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-4">
        <Field label="Name" value={form.name} onChange={(v: string) => update("name", v)} required />
        <Field label="Mobile" value={form.mobile} onChange={(v: string) => update("mobile", v)} required />
        <Field label="Email" value={form.email} onChange={(v: string) => update("email", v)} type="email" />
        <Field label="Business Name" value={form.businessName} onChange={(v: string) => update("businessName", v)} />
        <Field label="GST Number" value={form.gstNumber} onChange={(v: string) => update("gstNumber", v)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.type} onChange={(e) => update("type", e.target.value)}>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <Field label="Follow-up Date" value={form.followUpDate} onChange={(v: string) => update("followUpDate", v)} type="date" />
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={2} value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
        <div className="col-span-2 flex gap-3 mt-2">
          <button disabled={saving} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Customer"}
          </button>
          <button type="button" onClick={() => navigate("/customers")} className="text-sm px-4 py-2 border rounded-md">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        className="w-full border rounded-md px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
      />
    </div>
  );
}
