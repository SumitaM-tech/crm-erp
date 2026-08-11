import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
  { to: "/customers", label: "Customers", roles: ["ADMIN", "SALES"] },
  { to: "/products", label: "Products & Stock", roles: ["ADMIN", "WAREHOUSE"] },
  { to: "/challans", label: "Sales Challans", roles: ["ADMIN", "SALES", "ACCOUNTS"] },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-brand-700 text-white flex flex-col">
        <div className="p-5 border-b border-brand-600">
          <h1 className="text-lg font-semibold">ERP + CRM Portal</h1>
          <p className="text-xs text-brand-100 mt-1">{user?.name} · {user?.role}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter((item) => !user || item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm ${
                    isActive ? "bg-brand-500 font-medium" : "hover:bg-brand-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="p-3 border-t border-brand-600">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-brand-600"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
