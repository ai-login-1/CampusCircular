import { NavLink, useNavigate } from "react-router-dom";
import { Home, Compass, BookOpen, Inbox, Package, User, LogOut, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/features/UserAvatar";
import NotificationBell from "@/components/features/NotificationBell";

const STUDENT_NAV = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/exchanges", icon: ArrowLeftRight, label: "Exchanges" },
  { to: "/loans", icon: BookOpen, label: "My Loans" },
  { to: "/requests", icon: Inbox, label: "My Requests" },
  { to: "/my-items", icon: Package, label: "My Items" },
  { to: "/profile", icon: User, label: "Profile" },
];

const ADMIN_NAV = [
  { to: "/admin", icon: Home, label: "Admin Dashboard" },
  { to: "/dashboard", icon: Compass, label: "Student View" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-20 shadow-sm">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
            <span className="text-white text-lg font-bold leading-none">C</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base leading-tight">Campus</p>
            <p className="font-bold text-lime-500 text-base leading-tight -mt-0.5">Circular</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
            <UserAvatar src={user.avatar} name={user.name} size="md" isVerified={user.isVerified} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name.split(" ")[0]}</p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                <p className="text-[11px] text-gray-500 truncate">
                  {user.role === "admin" ? "Administrator" : (user as any).studentId ?? user.department}
                </p>
              </div>
            </div>
            {/* Notification bell in sidebar header */}
            <NotificationBell />
          </div>
          {isAdmin && (
            <div className="mt-2 flex justify-center">
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide">Admin</span>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
            }>
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-6 space-y-2">
        {!isAdmin && (
          <div className="bg-lime-50 border border-lime-100 rounded-2xl p-3 text-center">
            <p className="text-xs font-semibold text-lime-700">Trust Score</p>
            <p className="text-2xl font-black text-lime-600">{user?.trustScore ?? 0}</p>
            <p className="text-[10px] text-lime-500">/ 100 · Campus Verified</p>
          </div>
        )}
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
