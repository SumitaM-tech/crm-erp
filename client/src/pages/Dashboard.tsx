import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome, {user?.name}</h1>
      <p className="text-gray-500 mb-6">Role: {user?.role}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-medium text-gray-700">Customers</h2>
          <p className="text-sm text-gray-500 mt-1">Manage leads, active accounts, and follow-ups.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-medium text-gray-700">Products & Stock</h2>
          <p className="text-sm text-gray-500 mt-1">Track inventory levels and stock movement history.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-medium text-gray-700">Sales Challans</h2>
          <p className="text-sm text-gray-500 mt-1">Create and confirm challans against customer orders.</p>
        </div>
      </div>
    </div>
  );
}
