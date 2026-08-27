import { useState, useEffect } from "react";
import { ShieldCheck, Star, Package, Loader2, Bell, BellOff, Save } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TrustScore from "@/components/features/TrustScore";
import UserAvatar from "@/components/features/UserAvatar";
import ResourceCard from "@/components/features/ResourceCard";
import { useAuth } from "@/contexts/AuthContext";
import { resourceStore } from "@/lib/resourceStore";
import { Resource } from "@/types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const TABS = ["Overview", "My Listings", "Notification Settings"] as const;
type Tab = typeof TABS[number];

interface NotifPrefs {
  email_enabled: boolean;
  sms_enabled: boolean;
  inapp_enabled: boolean;
  borrow_request: boolean;
  request_accepted: boolean;
  handover_reminder: boolean;
  return_reminder: boolean;
  overdue_warning: boolean;
  settlement: boolean;
  dispute_updates: boolean;
  account_alerts: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  email_enabled: true, sms_enabled: false, inapp_enabled: true,
  borrow_request: true, request_accepted: true, handover_reminder: true,
  return_reminder: true, overdue_warning: true, settlement: true,
  dispute_updates: true, account_alerts: true,
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    return searchParams.get("tab") === "notifications" ? "Notification Settings" : "Overview";
  });
  const [myListings, setMyListings] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      resourceStore.getByOwner(user.id).then((data) => { setMyListings(data); setLoading(false); });
      // Load notification preferences
      supabase.from("user_profiles").select("notification_preferences").eq("id", user.id).single().then(({ data }) => {
        if (data?.notification_preferences) setPrefs({ ...DEFAULT_PREFS, ...data.notification_preferences });
      });
    }
  }, [user]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const savePrefs = async () => {
    if (!user) return;
    setSavingPrefs(true);
    const { error } = await supabase.from("user_profiles").update({ notification_preferences: prefs }).eq("id", user.id);
    if (error) toast.error("Failed to save preferences");
    else toast.success("Notification preferences saved!");
    setSavingPrefs(false);
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-6">My Profile</h1>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6">
            <UserAvatar src={user.avatar} name={user.name} size="xl" isVerified={user.isVerified} />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{user.name}</h2>
                  <p className="text-gray-500 text-sm mt-0.5">{user.department} · {user.year}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                  {(user as any).studentId && (
                    <p className="text-gray-500 text-sm font-mono">ID: {(user as any).studentId}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {user.isVerified && (
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100">
                        <ShieldCheck className="w-3.5 h-3.5" /> Campus Verified
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-full border border-yellow-100">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {user.rating} Rating
                    </div>
                    <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full border border-violet-100">
                      {user.role === "admin" ? "🛡️ Administrator" : "👤 Student"}
                    </div>
                  </div>
                </div>
                <TrustScore score={user.trustScore} size="lg" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "Successful Exchanges", value: user.successfulExchanges, icon: "🤝", color: "bg-lime-50 border-lime-100" },
              { label: "Late Returns", value: user.lateReturns, icon: "⏰", color: "bg-yellow-50 border-yellow-100" },
              { label: "Disputes", value: user.disputes, icon: "⚖️", color: "bg-red-50 border-red-100" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl border p-4 ${stat.color}`}>
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "Notification Settings" ? "🔔 " + t : t}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Trust Score Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: "Return punctuality", value: 95 },
                  { label: "Item condition on return", value: 100 },
                  { label: "Communication responsiveness", value: 90 },
                  { label: "Community reviews", value: Math.round(user.rating * 20) },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-semibold text-gray-800">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-lime-400 rounded-full transition-all duration-500" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Account Details</h3>
              <div className="space-y-3">
                {[
                  ["Email", user.email],
                  ["Student ID", (user as any).studentId ?? "—"],
                  ["Department", user.department],
                  ["Year", user.year],
                  ["Mobile", (user as any).mobile ?? "Not set"],
                  ["Account Type", user.role === "admin" ? "Administrator" : "Student"],
                  ["Account Status", user.status ?? "Active"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-800 capitalize">{value}</span>
                  </div>
                ))}
              </div>
              {user.role === "admin" && (
                <button onClick={() => navigate("/admin")}
                  className="mt-4 w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
                  Go to Admin Dashboard
                </button>
              )}
              <button onClick={handleLogout}
                className="mt-2 w-full border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        )}

        {tab === "My Listings" && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-12 h-12 animate-spin text-gray-400" /></div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No listings yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {myListings.map((r) => <ResourceCard key={r.id} resource={r} />)}
              </div>
            )}
          </div>
        )}

        {tab === "Notification Settings" && (
          <div className="max-w-2xl space-y-6">
            {/* Channel preferences */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Delivery Channels</h3>
              {[
                { key: "inapp_enabled" as keyof NotifPrefs, label: "In-App Notifications", desc: "Show notification bell in the sidebar", icon: "🔔", locked: false },
                { key: "email_enabled" as keyof NotifPrefs, label: "Email Notifications", desc: "Receive notifications at your college email", icon: "📧", locked: false },
                { key: "sms_enabled" as keyof NotifPrefs, label: "SMS Notifications", desc: "Receive SMS alerts on your registered mobile", icon: "📱", locked: false },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrefs({ ...prefs, [item.key]: !prefs[item.key] })}
                    className={`w-12 h-6 rounded-full transition-all duration-200 relative ${prefs[item.key] ? "bg-lime-500" : "bg-gray-300"}`}
                    aria-checked={prefs[item.key]}
                    role="switch"
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${prefs[item.key] ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Notification types */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Notification Types</h3>
              <p className="text-xs text-gray-500">Choose which events trigger notifications for you.</p>
              {[
                { key: "borrow_request" as keyof NotifPrefs, label: "Borrow Request", desc: "Someone wants to borrow your item", category: "As Owner" },
                { key: "request_accepted" as keyof NotifPrefs, label: "Request Accepted / Rejected", desc: "Owner responds to your borrow request", category: "As Borrower" },
                { key: "handover_reminder" as keyof NotifPrefs, label: "Handover Reminder", desc: "Reminder to hand over / collect item", category: "Both" },
                { key: "return_reminder" as keyof NotifPrefs, label: "Return Reminder", desc: "Reminder that return date is approaching", category: "As Borrower" },
                { key: "overdue_warning" as keyof NotifPrefs, label: "Overdue Warning", desc: "Item is past its return date", category: "Both" },
                { key: "settlement" as keyof NotifPrefs, label: "Settlement & Inspection", desc: "Settlement summary and deposit refund", category: "Both" },
                { key: "dispute_updates" as keyof NotifPrefs, label: "Dispute Updates", desc: "Admin resolution updates for disputes", category: "Both" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{item.category}</span>
                    </div>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setPrefs({ ...prefs, [item.key]: !prefs[item.key] })}
                    className={`w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0 ${prefs[item.key] ? "bg-lime-500" : "bg-gray-300"}`}
                    aria-checked={prefs[item.key]}
                    role="switch"
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${prefs[item.key] ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>
              ))}

              {/* Account alerts — always on */}
              <div className="flex items-center justify-between py-2 opacity-75">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">Account & Security Alerts</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Always On</span>
                  </div>
                  <p className="text-xs text-gray-500">Login alerts, setup reminders, account status changes</p>
                </div>
                <div className="w-12 h-6 rounded-full bg-lime-500 relative cursor-not-allowed">
                  <span className="absolute top-0.5 left-6 w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>
            </div>

            <button onClick={savePrefs} disabled={savingPrefs}
              className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Notification Preferences
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
