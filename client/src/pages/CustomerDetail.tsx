import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [id]);

  async function load() {
    const res = await api.get(`/customers/${id}`);
    setCustomer(res.data);
  }

  async function addFollowUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!note.trim()) return;
    try {
      await api.post(`/customers/${id}/follow-ups`, { note });
      setNote("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add follow-up");
    }
  }

  if (!customer) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">{customer.name}</h1>
        <Link to={`/customers/${id}/edit`} className="text-sm bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700">Edit</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-3 text-sm mb-6">
        <p><span className="text-gray-500">Mobile:</span> {customer.mobile}</p>
        <p><span className="text-gray-500">Email:</span> {customer.email || "—"}</p>
        <p><span className="text-gray-500">Business:</span> {customer.businessName || "—"}</p>
        <p><span className="text-gray-500">GST:</span> {customer.gstNumber || "—"}</p>
        <p><span className="text-gray-500">Type:</span> {customer.type}</p>
        <p><span className="text-gray-500">Status:</span> {customer.status}</p>
        <p><span className="text-gray-500">Follow-up Date:</span> {customer.followUpDate ? customer.followUpDate.slice(0, 10) : "—"}</p>
        <p className="col-span-2"><span className="text-gray-500">Address:</span> {customer.address || "—"}</p>
        <p className="col-span-2"><span className="text-gray-500">Notes:</span> {customer.notes || "—"}</p>
      </div>

      <h2 className="text-lg font-medium text-gray-800 mb-2">Follow-up Timeline</h2>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-md p-2 mb-3">{error}</div>}
      <form onSubmit={addFollowUp} className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded-md px-3 py-2 text-sm"
          placeholder="Add a follow-up note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md hover:bg-brand-700">Add</button>
      </form>

      <div className="space-y-3">
        {customer.followUps?.length === 0 && <p className="text-gray-400 text-sm">No follow-ups yet.</p>}
        {customer.followUps?.map((f: any) => (
          <div key={f.id} className="bg-white rounded-md shadow p-3 text-sm">
            <p>{f.note}</p>
            <p className="text-xs text-gray-400 mt-1">{f.createdBy?.name} · {new Date(f.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
