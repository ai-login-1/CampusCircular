import { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink, Routes, Route } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ArrowLeftRight, Clock, AlertTriangle,
  CreditCard, Settings, LogOut, ShieldCheck, TrendingUp, Loader2,
  CheckCircle, XCircle, Flag, Eye, ChevronRight, BarChart2, Ban,
  UserPlus, Upload, Mail, MessageSquare, Copy, RefreshCw, Download,
  Send, Pencil, RotateCcw, X, AlertCircle, Phone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/features/UserAvatar";
import TrustScore from "@/components/features/TrustScore";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";

// ─── Layout ─────────────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/resources", icon: Package, label: "Resources" },
  { to: "/admin/exchanges", icon: ArrowLeftRight, label: "Exchanges" },
  { to: "/admin/overdue", icon: Clock, label: "Overdue Returns" },
  { to: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
  { to: "/admin/transactions", icon: CreditCard, label: "Transactions" },
  { to: "/admin/settings", icon: Settings, label: "Platform Settings" },
];

function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 flex flex-col z-20">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-lime-400 flex items-center justify-center">
            <span className="text-gray-900 text-lg font-bold leading-none">C</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">Campus</p>
            <p className="font-bold text-lime-400 text-base leading-tight -mt-0.5">Circular Admin</p>
          </div>
        </div>
      </div>
      {user && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3">
            <UserAvatar src={user.avatar} name={user.name} size="md" isVerified />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name.split(" ")[0]}</p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-lime-400" />
                <p className="text-[11px] text-gray-400">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {ADMIN_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${isActive ? "bg-lime-400 text-gray-900" : "text-gray-400 hover:bg-white/5 hover:text-white"}`
            }>
            {({ isActive }) => (
              <><Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-gray-900" : "text-gray-500"}`} />{label}</>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-6">
        <NavLink to="/dashboard"
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all mb-1">
          <Eye className="w-4 h-4" /> Student View
        </NavLink>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────
function AdminOverview() {
  const [stats, setStats] = useState({ totalUsers: 0, totalResources: 0, totalExchanges: 0, activeExchanges: 0, overdueReturns: 0, openDisputes: 0, totalRevenue: 0, successfulExchanges: 0, onTimeReturnPct: 0 });
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [recentExchanges, setRecentExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ count: userCount }, { count: resCount }, { data: allExchanges }, { count: disputeCount }] = await Promise.all([
        supabase.from("user_profiles").select("*", { count: "exact", head: true }),
        supabase.from("resources").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("exchanges").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "under_review"),
      ]);
      const exchanges = allExchanges ?? [];
      const activeStatuses = ["accepted", "handover", "borrowed", "returned", "inspection"];
      const activeExchanges = exchanges.filter((e) => activeStatuses.includes(e.status)).length;
      const overdueReturns = exchanges.filter((e) => e.status === "overdue").length;
      const completedExchanges = exchanges.filter((e) => e.status === "rated");
      const totalRevenue = exchanges.reduce((sum, e) => sum + Number(e.total_charged ?? 0), 0);
      const onTimeReturns = completedExchanges.filter((e) => e.late_fee === 0).length;
      const onTimePct = completedExchanges.length > 0 ? Math.round((onTimeReturns / completedExchanges.length) * 100) : 100;
      const cats: Record<string, number> = {};
      exchanges.forEach((e) => { cats[e.resource_category] = (cats[e.resource_category] ?? 0) + 1; });
      setStats({ totalUsers: userCount ?? 0, totalResources: resCount ?? 0, totalExchanges: exchanges.length, activeExchanges, overdueReturns, openDisputes: disputeCount ?? 0, totalRevenue, successfulExchanges: completedExchanges.length, onTimeReturnPct: onTimePct });
      setCategoryCounts(cats);
      setRecentExchanges(exchanges.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  const METRIC_CARDS = [
    { label: "Active Members", value: stats.totalUsers, icon: "👥", color: "bg-blue-50 border-blue-100", textColor: "text-blue-700" },
    { label: "Resources Shared", value: stats.totalResources, icon: "📦", color: "bg-violet-50 border-violet-100", textColor: "text-violet-700" },
    { label: "Successful Exchanges", value: stats.successfulExchanges, icon: "🤝", color: "bg-lime-50 border-lime-100", textColor: "text-lime-700" },
    { label: "Active Borrowings", value: stats.activeExchanges, icon: "🔄", color: "bg-teal-50 border-teal-100", textColor: "text-teal-700" },
    { label: "Overdue Returns", value: stats.overdueReturns, icon: "⏰", color: "bg-orange-50 border-orange-100", textColor: "text-orange-700" },
    { label: "Open Disputes", value: stats.openDisputes, icon: "⚠️", color: "bg-amber-50 border-amber-100", textColor: "text-amber-700" },
    { label: "Money Saved Est.", value: `₹${(stats.totalRevenue / 10).toFixed(0)}`, icon: "💰", color: "bg-green-50 border-green-100", textColor: "text-green-700" },
    { label: "On-Time Returns", value: `${stats.onTimeReturnPct}%`, icon: "✅", color: "bg-lime-50 border-lime-100", textColor: "text-lime-700" },
  ];

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-black text-gray-900">Admin Overview</h1><p className="text-gray-500 text-sm mt-1">Platform health at a glance</p></div>
      <div className="grid grid-cols-4 gap-4">
        {METRIC_CARDS.map((card) => (
          <div key={card.label} className={`rounded-2xl border p-5 ${card.color}`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className={`text-3xl font-black ${card.textColor}`}>{card.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-violet-500" /> Popular Categories</h3>
          <div className="space-y-3">
            {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
              const max = Math.max(...Object.values(categoryCounts));
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-700 font-medium">{cat}</span><span className="text-gray-500">{count}</span></div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-400 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Recent Exchanges</h3>
          <div className="space-y-3">
            {recentExchanges.map((ex) => (
              <div key={ex.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <img src={ex.resource_image} alt={ex.resource_title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ex.resource_title}</p>
                  <p className="text-xs text-gray-500">{ex.borrower_name} → {ex.owner_name}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                  ${{ borrowed: "bg-lime-100 text-lime-700", requested: "bg-yellow-100 text-yellow-700", rated: "bg-violet-100 text-violet-700", disputed: "bg-amber-100 text-amber-700" }[ex.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {ex.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Preview Modal ───────────────────────────────────────────────────
interface DeliveryPreviewProps {
  studentName: string;
  studentId: string;
  email: string;
  mobile?: string;
  setupLink: string;
  emailContent: string;
  smsContent: string;
  onClose: () => void;
}

function DeliveryPreviewModal({ studentName, studentId, email, mobile, setupLink, emailContent, smsContent, onClose }: DeliveryPreviewProps) {
  const [tab, setTab] = useState<"email" | "sms">("email");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [smsStatus, setSmsStatus] = useState<"idle" | "sending" | "sent">("idle");

  const simulateSend = async (type: "email" | "sms") => {
    if (type === "email") {
      setEmailStatus("sending");
      await new Promise((r) => setTimeout(r, 1400));
      setEmailStatus("sent");
      toast.success("Email simulated successfully");
    } else {
      setSmsStatus("sending");
      await new Promise((r) => setTimeout(r, 900));
      setSmsStatus("sent");
      toast.success("SMS simulated successfully");
    }
  };

  const copyLink = () => { navigator.clipboard.writeText(setupLink); toast.success("Setup link copied!"); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Account Created</h2>
            <p className="text-sm text-gray-500">Send invitation to {studentName}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Student info summary */}
          <div className="bg-lime-50 border border-lime-100 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {[["Student ID", studentId], ["Name", studentName], ["Email", email], ["Mobile", mobile || "Not provided"]].map(([l, v]) => (
              <div key={l}><p className="text-xs text-gray-500">{l}</p><p className="text-sm font-semibold text-gray-900">{v}</p></div>
            ))}
          </div>

          {/* Setup link */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Account Setup Link</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-600 truncate">
                {setupLink}
              </div>
              <button onClick={copyLink} className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-700 transition-colors">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">⏱ Valid for 7 days</p>
          </div>

          {/* Delivery tabs */}
          <div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
              {(["email", "sms"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                  {t === "email" ? "📧 Email" : "📱 SMS"}
                </button>
              ))}
            </div>

            {tab === "email" && (
              <div className="space-y-3">
                <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
                  <div className="bg-gray-900 px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center"><span className="text-gray-900 font-black text-sm">C</span></div>
                    <div><p className="text-white text-sm font-bold">Campus Circular</p><p className="text-gray-400 text-xs">no-reply@campuscircular.edu</p></div>
                  </div>
                  <div className="p-5">
                    <p className="text-base font-bold text-gray-900 mb-3">Welcome to Campus Circular — Complete Your Account Setup</p>
                    <p className="text-sm text-gray-600 mb-3">Dear {studentName},</p>
                    <p className="text-sm text-gray-600 mb-4">Your college account has been created on Campus Circular, your campus resource sharing platform.</p>
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-sm font-semibold text-gray-700">Student ID: <span className="font-mono text-gray-900">{studentId}</span></p>
                      <p className="text-sm text-gray-600 mt-1">College Email: {email}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Complete your account setup using the link below:</p>
                    <a href={setupLink} className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold no-underline">Set Up My Account →</a>
                    <p className="text-xs text-gray-400 mt-4">This setup link is valid for 7 days. If you did not expect this email, contact support@campuscircular.edu.</p>
                    <p className="text-xs text-gray-400 mt-2">Best regards, Campus Circular Team</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {emailStatus === "sent" ? (
                      <span className="flex items-center gap-1.5 text-xs text-lime-600 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Simulated — Email queued</span>
                    ) : (
                      <span className="text-xs text-gray-400">Status: Demo Mode</span>
                    )}
                  </div>
                  <button onClick={() => simulateSend("email")} disabled={emailStatus !== "idle"}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                    {emailStatus === "sending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    {emailStatus === "idle" ? "Send Test Email" : emailStatus === "sending" ? "Sending..." : "Email Sent ✓"}
                  </button>
                </div>
              </div>
            )}

            {tab === "sms" && (
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-2xl p-5">
                  <div className="flex items-end gap-3">
                    <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0 mb-1">
                      <span className="text-gray-900 text-xs font-black">C</span>
                    </div>
                    <div className="bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 max-w-xs">
                      <p className="text-white text-sm leading-relaxed">{smsContent}</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-[11px] text-center mt-3">📱 Preview · To: {mobile || "No mobile number"}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {smsStatus === "sent" ? (
                      <span className="flex items-center gap-1.5 text-xs text-lime-600 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Simulated — SMS queued</span>
                    ) : (
                      <span className="text-xs text-gray-400">{mobile ? "Status: Demo Mode" : "⚠️ No mobile number provided"}</span>
                    )}
                  </div>
                  <button onClick={() => simulateSend("sms")} disabled={smsStatus !== "idle" || !mobile}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                    {smsStatus === "sending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                    {smsStatus === "idle" ? "Send Test SMS" : smsStatus === "sending" ? "Sending..." : "SMS Sent ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-5 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="w-full bg-lime-400 text-gray-900 py-3 rounded-2xl font-bold text-sm hover:bg-lime-300 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Student Modal ─────────────────────────────────────────────────────
function CreateStudentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ studentId: "", fullName: "", email: "", mobile: "", department: "Computer Science", year: "1st Year", role: "student" });
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const DEPTS = ["Computer Science", "Electronics Engineering", "Media Studies", "Mechanical Engineering", "Civil Engineering", "Information Technology", "Administration"];
  const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Faculty", "Staff"];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.fullName || !form.email) { toast.error("Student ID, name, and email are required."); return; }
    setSubmitting(true);

    const { data: session } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("provision-user", {
      body: { action: "create_student", ...form },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { const t = await error.context.text(); msg = t || msg; } catch {}
      }
      try { const j = JSON.parse(msg); msg = j.error ?? msg; } catch {}
      toast.error(msg);
      setSubmitting(false);
      return;
    }

    setPreview(data);
    onCreated();
    setSubmitting(false);
  };

  if (preview) {
    return (
      <DeliveryPreviewModal
        studentName={form.fullName}
        studentId={preview.studentId}
        email={preview.email}
        mobile={form.mobile || undefined}
        setupLink={preview.setupLink}
        emailContent={preview.emailContent}
        smsContent={preview.smsContent}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Add Student</h2>
            <p className="text-sm text-gray-500">Create a new college account</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Student ID *</label>
              <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value.toUpperCase() })}
                placeholder="TSEC2024XXX" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="e.g. Rahul Kumar" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">College Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="student@university.edu" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number (optional)</label>
            <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="+91 98765 43210" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                {DEPTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">What happens next?</p>
            <ul className="space-y-0.5 text-xs text-blue-600">
              <li>• Account is created and marked "Pending Setup"</li>
              <li>• A secure one-time setup link is generated</li>
              <li>• You can send it via email or SMS (demo mode)</li>
              <li>• Student sets their own password on first login</li>
            </ul>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────
function BulkImportModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [csv, setCsv] = useState("");
  const [parsed, setParsed] = useState<any[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "result">("input");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const SAMPLE_CSV = `StudentID,FullName,Email,Mobile,Department,Year
TSEC2025001,Aditya Sharma,aditya.sharma@university.edu,+91 99887 76655,Computer Science,1st Year
TSEC2025002,Meera Iyer,meera.iyer@university.edu,+91 88776 65544,Electronics Engineering,2nd Year
TSEC2025003,Prabhav Gupta,prabhav.gupta@university.edu,,Media Studies,3rd Year`;

  const parseCSV = () => {
    const lines = csv.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row."); return; }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return {
        studentId: obj["studentid"] || obj["student_id"] || obj["studentid"],
        fullName: obj["fullname"] || obj["full_name"] || obj["name"],
        email: obj["email"],
        mobile: obj["mobile"] || obj["phone"] || "",
        department: obj["department"] || "General",
        year: obj["year"] || "1st Year",
      };
    }).filter((r) => r.studentId && r.fullName && r.email);
    if (rows.length === 0) { toast.error("No valid rows found. Check CSV format."); return; }
    setParsed(rows);
    setStep("preview");
  };

  const bulkCreate = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("provision-user", {
      body: { action: "bulk_create", students: parsed },
    });
    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { const t = await error.context.text(); msg = t || msg; } catch {}
      }
      try { const j = JSON.parse(msg); msg = j.error ?? msg; } catch {}
      toast.error(msg);
      setSubmitting(false);
      return;
    }
    setResult(data);
    setStep("result");
    onCreated();
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Bulk Student Import</h2>
            <p className="text-sm text-gray-500">Upload CSV to create multiple accounts at once</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {step === "input" && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Expected CSV format:</p>
                <pre className="text-[11px] text-gray-600 font-mono whitespace-pre-wrap">{`StudentID,FullName,Email,Mobile,Department,Year`}</pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Paste CSV Data</label>
                  <button onClick={() => setCsv(SAMPLE_CSV)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Load sample</button>
                </div>
                <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10}
                  placeholder="Paste your CSV data here..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <button onClick={parseCSV} disabled={!csv.trim()}
                className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> Preview Import
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <div className="bg-lime-50 border border-lime-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-lime-700">{parsed.length}</p>
                <p className="text-sm text-lime-600 font-medium">students ready to create</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>{["Student ID", "Name", "Email", "Department", "Year"].map((h) => (
                      <th key={h} className="text-left text-gray-500 font-semibold px-3 py-2">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parsed.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-700">{row.studentId}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{row.fullName}</td>
                        <td className="px-3 py-2 text-gray-600">{row.email}</td>
                        <td className="px-3 py-2 text-gray-500">{row.department}</td>
                        <td className="px-3 py-2 text-gray-500">{row.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("input")} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                  Edit CSV
                </button>
                <button onClick={bulkCreate} disabled={submitting}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {submitting ? `Creating ${parsed.length} accounts...` : `Create ${parsed.length} Accounts`}
                </button>
              </div>
            </>
          )}

          {step === "result" && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Accounts created", value: result.created, color: "bg-lime-50 border-lime-100", textColor: "text-lime-700" },
                  { label: "Setup links generated", value: result.created, color: "bg-blue-50 border-blue-100", textColor: "text-blue-700" },
                  { label: "Email notifications queued", value: result.created, color: "bg-violet-50 border-violet-100", textColor: "text-violet-700" },
                  { label: "SMS notifications queued", value: result.created, color: "bg-teal-50 border-teal-100", textColor: "text-teal-700" },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
                    <p className={`text-2xl font-black ${stat.textColor}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-700 mb-2">⚠️ {result.errors.length} errors:</p>
                  {result.errors.slice(0, 5).map((e: any, i: number) => (
                    <p key={i} className="text-xs text-red-600">{e.studentId}: {e.error}</p>
                  ))}
                </div>
              )}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700">📧 Demo mode: Notifications are simulated. In production, connect Resend and Twilio credentials in Platform Settings.</p>
              </div>
              <button onClick={onClose} className="w-full bg-lime-400 text-gray-900 py-3 rounded-2xl font-bold text-sm hover:bg-lime-300 transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateUserStatus = async (id: string, status: string) => {
    await supabase.from("user_profiles").update({ status }).eq("id", id);
    toast.success(`User status updated to ${status}`);
    load();
  };

  const regenerateToken = async (userId: string, userName: string) => {
    setRegenerating(userId);
    const { data, error } = await supabase.functions.invoke("provision-user", {
      body: { action: "regenerate_token", userId },
    });
    if (error) { toast.error("Failed to regenerate token"); setRegenerating(null); return; }
    const user = users.find((u) => u.id === userId);
    setPreviewData({
      studentName: user?.full_name ?? "User",
      studentId: user?.student_id ?? "-",
      email: data.email,
      mobile: user?.mobile,
      setupLink: data.setupLink,
      emailContent: `Setup link regenerated for ${user?.full_name}`,
      smsContent: `Campus Circular: New setup link generated. Setup: ${data.setupLink}`,
    });
    setRegenerating(null);
    toast.success("Setup link regenerated");
    load();
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.student_id?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "pending" ? !u.first_login_completed : u.status === statusFilter);
    return matchSearch && matchRole && matchStatus;
  });

  const pendingCount = users.filter((u) => !u.first_login_completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} registered members · {pendingCount} pending setup</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
            <Upload className="w-4 h-4" /> Bulk Import
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or Student ID..."
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-64" />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {["all", "student", "admin"].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${roleFilter === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {["all", "active", "pending", "suspended"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {s === "pending" ? `Pending (${pendingCount})` : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Student ID", "Department", "Trust", "Exchanges", "Account Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => {
                const accountStatus = !u.first_login_completed ? "pending_setup" : u.status ?? "active";
                const statusBg: Record<string, string> = { active: "bg-lime-100 text-lime-700", suspended: "bg-red-100 text-red-700", flagged: "bg-amber-100 text-amber-700", pending_setup: "bg-yellow-100 text-yellow-700" };
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={u.avatar_url ?? ""} name={u.full_name ?? u.email} size="sm" isVerified={u.is_verified} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.full_name ?? u.username}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                          {u.mobile && <p className="text-xs text-gray-400">{u.mobile}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{u.student_id ?? "—"}</span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600"><div>{u.department ?? "-"}</div><div className="text-gray-400">{u.year}</div></td>
                    <td className="px-4 py-4"><TrustScore score={u.trust_score ?? 75} size="sm" showLabel={false} /></td>
                    <td className="px-4 py-4 text-xs font-semibold text-gray-800 text-center">{u.successful_exchanges ?? 0}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBg[accountStatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {accountStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!u.first_login_completed && (
                          <button onClick={() => regenerateToken(u.id, u.full_name)}
                            disabled={regenerating === u.id}
                            className="flex items-center gap-1 text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors font-semibold">
                            {regenerating === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Resend Link
                          </button>
                        )}
                        {u.status !== "suspended" ? (
                          <button onClick={() => updateUserStatus(u.id, "suspended")}
                            className="flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors">
                            <Ban className="w-3 h-3" /> Suspend
                          </button>
                        ) : (
                          <button onClick={() => updateUserStatus(u.id, "active")}
                            className="flex items-center gap-1 text-xs bg-lime-50 text-lime-600 hover:bg-lime-100 px-2 py-1 rounded-lg transition-colors">
                            <CheckCircle className="w-3 h-3" /> Restore
                          </button>
                        )}
                        {u.status !== "flagged" && u.status !== "suspended" && (
                          <button onClick={() => updateUserStatus(u.id, "flagged")}
                            className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors">
                            <Flag className="w-3 h-3" /> Flag
                          </button>
                        )}
                        {u.is_verified === false && u.status === "active" && (
                          <button onClick={async () => { await supabase.from("user_profiles").update({ is_verified: true }).eq("id", u.id); toast.success("User verified"); load(); }}
                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors">
                            <ShieldCheck className="w-3 h-3" /> Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">No users match your filters.</div>
          )}
        </div>
      )}

      {showCreate && <CreateStudentModal onClose={() => { setShowCreate(false); load(); }} onCreated={load} />}
      {showBulk && <BulkImportModal onClose={() => { setShowBulk(false); load(); }} onCreated={load} />}
      {previewData && (
        <DeliveryPreviewModal
          {...previewData}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}

// ─── Resources ───────────────────────────────────────────────────────────────
function AdminResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const { data } = await supabase.from("resources").select("*, user_profiles!resources_owner_id_fkey(full_name, avatar_url)").order("created_at", { ascending: false });
    setResources(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string, reason?: string) => {
    await supabase.from("resources").update({ status, flag_reason: reason ?? null, updated_at: new Date().toISOString() }).eq("id", id);
    toast.success(`Resource ${status.replace(/_/g, " ")}`);
    load();
  };

  const filtered = filter === "all" ? resources : resources.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-black text-gray-900">Resources</h1><p className="text-gray-500 text-sm mt-1">{resources.length} listed resources</p></div>
        <div className="flex gap-2">
          {["all", "pending_approval", "approved", "rejected", "flagged", "suspended"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-center">
              <img src={r.images?.[0]} alt={r.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{r.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize
                    ${{ approved: "bg-lime-100 text-lime-700", pending_approval: "bg-yellow-100 text-yellow-700", rejected: "bg-red-100 text-red-700", flagged: "bg-amber-100 text-amber-700", suspended: "bg-gray-100 text-gray-500" }[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {r.status?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{r.category} · ₹{r.daily_rate}/day · {r.condition}</p>
                <p className="text-xs text-gray-400">Owner: {r.user_profiles?.full_name ?? r.owner_id}</p>
                {r.flag_reason && <p className="text-xs text-amber-600 mt-1">⚠️ {r.flag_reason}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {r.status === "pending_approval" && (
                  <><button onClick={() => updateStatus(r.id, "approved")} className="flex items-center gap-1 text-xs bg-lime-50 text-lime-700 hover:bg-lime-100 px-3 py-1.5 rounded-lg transition-colors font-semibold"><CheckCircle className="w-3 h-3" /> Approve</button>
                    <button onClick={() => updateStatus(r.id, "rejected")} className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-semibold"><XCircle className="w-3 h-3" /> Reject</button></>
                )}
                {r.status === "approved" && (
                  <><button onClick={() => updateStatus(r.id, "flagged", "Flagged for review")} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"><Flag className="w-3 h-3" /> Flag</button>
                    <button onClick={() => updateStatus(r.id, "suspended")} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"><Ban className="w-3 h-3" /> Suspend</button></>
                )}
                {(r.status === "flagged" || r.status === "suspended") && (
                  <button onClick={() => updateStatus(r.id, "approved")} className="flex items-center gap-1 text-xs bg-lime-50 text-lime-700 hover:bg-lime-100 px-3 py-1.5 rounded-lg transition-colors"><CheckCircle className="w-3 h-3" /> Restore</button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No resources in this category.</div>}
        </div>
      )}
    </div>
  );
}

// ─── Exchanges ───────────────────────────────────────────────────────────────
function AdminExchanges() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("exchanges").select("*").order("created_at", { ascending: false }).then(({ data }) => { setExchanges(data ?? []); setLoading(false); });
  }, []);

  const STATUS_COLORS: Record<string, string> = { requested: "bg-yellow-100 text-yellow-700", accepted: "bg-blue-100 text-blue-700", borrowed: "bg-lime-100 text-lime-700", overdue: "bg-red-100 text-red-700", rated: "bg-violet-100 text-violet-700", disputed: "bg-amber-100 text-amber-700", settlement: "bg-teal-100 text-teal-700", returned: "bg-gray-100 text-gray-600" };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black text-gray-900">All Exchanges</h1><p className="text-gray-500 text-sm mt-1">{exchanges.length} total exchanges</p></div>
      {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Resource", "Borrower", "Owner", "Dates", "Amount", "Status"].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {exchanges.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><img src={ex.resource_image} alt={ex.resource_title} className="w-8 h-8 rounded-lg object-cover" /><p className="text-xs font-medium text-gray-800 max-w-[140px] truncate">{ex.resource_title}</p></div></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{ex.borrower_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{ex.owner_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(ex.requested_from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} → {new Date(ex.requested_to).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">₹{Number(ex.total_charged).toFixed(0)}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[ex.status] ?? "bg-gray-100 text-gray-600"}`}>{ex.status.replace(/_/g, " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Overdue ──────────────────────────────────────────────────────────────────
function AdminOverdue() {
  const [overdueExchanges, setOverdueExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("exchanges").select("*").eq("status", "overdue").then(({ data }) => { setOverdueExchanges(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black text-gray-900">Overdue Returns</h1><p className="text-gray-500 text-sm mt-1">{overdueExchanges.length} overdue items</p></div>
      {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        : overdueExchanges.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"><p className="text-4xl mb-3">🎉</p><p className="font-semibold text-gray-700">No overdue returns!</p><p className="text-sm text-gray-400 mt-1">All borrowers are on time.</p></div>
        ) : (
          <div className="space-y-3">
            {overdueExchanges.map((ex) => {
              const overdueDays = Math.floor((Date.now() - new Date(ex.requested_to).getTime()) / 86400000);
              return (
                <div key={ex.id} className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 flex gap-4 items-center">
                  <img src={ex.resource_image} alt={ex.resource_title} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1"><p className="font-semibold text-gray-900">{ex.resource_title}</p><p className="text-xs text-gray-500">Borrowed by {ex.borrower_name} · Due {new Date(ex.requested_to).toLocaleDateString("en-IN")}</p></div>
                  <div className="text-right"><span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">{overdueDays > 0 ? `${overdueDays}d overdue` : "Due today"}</span><p className="text-xs text-gray-500 mt-1">Est. late fee: ₹{overdueDays * Number(ex.daily_rate ?? 0)}</p></div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ─── Disputes ────────────────────────────────────────────────────────────────
function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  const load = async () => {
    const { data } = await supabase.from("disputes").select("*, exchanges(resource_title, resource_image, borrower_name, owner_name, security_deposit)").order("created_at", { ascending: false });
    setDisputes(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolveDispute = async (id: string, exchangeId: string, damageFee: number) => {
    if (!resolution.trim()) { toast.error("Enter a resolution note."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("disputes").update({ status: "resolved", resolution, damage_fee_applied: damageFee, resolved_by_id: user?.id, updated_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("exchanges").update({ status: "resolved", damage_fee: damageFee, updated_at: new Date().toISOString() }).eq("id", exchangeId);
    toast.success("Dispute resolved");
    setResolving(null);
    setResolution("");
    load();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black text-gray-900">Disputes</h1><p className="text-gray-500 text-sm mt-1">{disputes.length} total disputes</p></div>
      {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        : disputes.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"><p className="text-4xl mb-3">⚖️</p><p className="font-semibold text-gray-700">No disputes raised</p></div>
        : (
          <div className="space-y-4">
            {disputes.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
                <div className="flex gap-4 mb-4">
                  {d.exchanges?.resource_image && <img src={d.exchanges.resource_image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{d.exchanges?.resource_title ?? "Unknown"}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${{ open: "bg-amber-100 text-amber-700", under_review: "bg-orange-100 text-orange-700", resolved: "bg-lime-100 text-lime-700" }[d.status]}`}>{d.status.replace(/_/g, " ")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                      <div><span className="font-semibold text-gray-700">Raised by:</span> {d.raised_by_name}</div>
                      <div><span className="font-semibold text-gray-700">Borrower:</span> {d.exchanges?.borrower_name}</div>
                      <div><span className="font-semibold text-gray-700">Owner:</span> {d.exchanges?.owner_name}</div>
                    </div>
                    <div className="mt-2 p-3 bg-amber-50 rounded-xl"><p className="text-xs font-semibold text-amber-700">Reason: {d.reason}</p><p className="text-xs text-amber-600 mt-1">{d.description}</p></div>
                    {d.resolution && <div className="mt-2 p-3 bg-lime-50 rounded-xl"><p className="text-xs font-semibold text-lime-700">Resolution: <span className="font-normal text-lime-600">{d.resolution}</span></p>{d.damage_fee_applied > 0 && <p className="text-xs text-lime-600">Damage fee: ₹{d.damage_fee_applied}</p>}</div>}
                  </div>
                </div>
                {d.status !== "resolved" && (resolving === d.id ? (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={2} placeholder="Write resolution note..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    <div className="flex gap-2">
                      <button onClick={() => resolveDispute(d.id, d.exchange_id, 0)} className="flex-1 bg-lime-400 text-gray-900 py-2.5 rounded-xl text-sm font-bold hover:bg-lime-300 transition-colors">Resolve — No Fee</button>
                      <button onClick={() => resolveDispute(d.id, d.exchange_id, Math.min(500, Number(d.exchanges?.security_deposit ?? 0)))} className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors">Resolve — Apply ₹500 Fee</button>
                      <button onClick={() => setResolving(null)} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setResolving(d.id)} className="mt-2 w-full bg-amber-50 border border-amber-200 text-amber-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">Resolve This Dispute</button>
                ))}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
function AdminTransactions() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("exchanges").select("*").not("status", "in", '("requested","cancelled","rejected")').order("created_at", { ascending: false }).then(({ data }) => { setExchanges(data ?? []); setLoading(false); });
  }, []);

  const totalRevenue = exchanges.reduce((sum, e) => sum + Number(e.total_charged ?? 0), 0);
  const platformRevenue = exchanges.reduce((sum, e) => sum + Number(e.platform_fee ?? 0), 0);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black text-gray-900">Transactions</h1><p className="text-gray-500 text-sm mt-1">All financial activity</p></div>
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Exchange Value", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "bg-violet-50 border-violet-100", textColor: "text-violet-700" }, { label: "Platform Revenue", value: `₹${platformRevenue.toLocaleString("en-IN")}`, color: "bg-lime-50 border-lime-100", textColor: "text-lime-700" }, { label: "Completed Exchanges", value: exchanges.filter((e) => e.status === "rated").length, color: "bg-blue-50 border-blue-100", textColor: "text-blue-700" }].map((c) => (
          <div key={c.label} className={`rounded-2xl border p-5 ${c.color}`}><p className={`text-2xl font-black ${c.textColor}`}>{c.value}</p><p className="text-xs text-gray-500 font-medium mt-0.5">{c.label}</p></div>
        ))}
      </div>
      {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Resource", "Borrower", "Owner", "Borrowing", "Platform", "Late/Damage", "Deposit", "Total", "Status"].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {exchanges.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3"><p className="text-xs font-medium text-gray-800 max-w-[100px] truncate">{ex.resource_title}</p></td>
                  <td className="px-3 py-3 text-xs text-gray-600">{ex.borrower_name}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{ex.owner_name}</td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-800">₹{Number(ex.borrowing_fee).toFixed(0)}</td>
                  <td className="px-3 py-3 text-xs font-medium text-violet-600">₹{Number(ex.platform_fee).toFixed(0)}</td>
                  <td className="px-3 py-3 text-xs font-medium text-red-600">{(Number(ex.late_fee) + Number(ex.damage_fee)) > 0 ? `₹${(Number(ex.late_fee) + Number(ex.damage_fee)).toFixed(0)}` : "—"}</td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-500">₹{Number(ex.security_deposit).toFixed(0)}</td>
                  <td className="px-3 py-3 text-xs font-black text-gray-900">₹{Number(ex.total_charged).toFixed(0)}</td>
                  <td className="px-3 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize bg-gray-100 text-gray-600">{ex.status.replace(/_/g, " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("*").then(({ data }) => {
      const s: Record<string, string> = {};
      (data ?? []).forEach((row) => { s[row.key] = row.value; });
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("platform_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    }
    toast.success("Settings saved!");
    setSaving(false);
  };

  const SETTING_LABELS: Record<string, { label: string; description: string; type: string }> = {
    platform_fee_rate: { label: "Platform Fee Rate", description: "Fraction of borrowing fee (e.g. 0.05 = 5%)", type: "number" },
    late_fee_per_day_multiplier: { label: "Late Fee Multiplier", description: "Multiplier of daily rate for late returns", type: "number" },
    max_borrow_days: { label: "Maximum Borrow Days", description: "Maximum days a single item can be borrowed", type: "number" },
    min_trust_score_to_borrow: { label: "Min Trust Score to Borrow", description: "Minimum trust score required (0–100)", type: "number" },
    platform_name: { label: "Platform Name", description: "Display name of the platform", type: "text" },
    support_email: { label: "Support Email", description: "Email shown for support inquiries", type: "email" },
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-3xl font-black text-gray-900">Platform Settings</h1><p className="text-gray-500 text-sm mt-1">Configure global platform behaviour</p></div>
      {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div> : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-gray-900">Core Settings</h3>
            {Object.entries(SETTING_LABELS).map(([key, meta]) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-800 mb-1">{meta.label}</label>
                <p className="text-xs text-gray-400 mb-2">{meta.description}</p>
                <input type={meta.type} value={settings[key] ?? ""} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
            ))}
          </div>

          {/* Notification Integrations */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Notification Integrations</h3>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
              <p className="font-semibold mb-1">🔧 Demo Mode Active</p>
              <p className="text-xs">Connect real providers to enable live notifications. All current notifications are simulated.</p>
            </div>
            {[
              { label: "Email Provider (Resend)", desc: "RESEND_API_KEY — configure in Edge Function secrets", icon: "📧", status: "Demo" },
              { label: "SMS Provider (Twilio)", desc: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER", icon: "📱", status: "Demo" },
              { label: "In-App Notifications", desc: "Database-backed, always active", icon: "🔔", status: "Active" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.status === "Active" ? "bg-lime-100 text-lime-700" : "bg-gray-100 text-gray-500"}`}>{item.status}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ Important</p>
            <p className="text-xs text-amber-600">Changes to platform fee rate apply to new exchanges only. Existing exchanges retain their original fee rates.</p>
          </div>
          <button onClick={save} disabled={saving}
            className="w-full bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Admin Dashboard Root ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <AdminSidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="exchanges" element={<AdminExchanges />} />
          <Route path="overdue" element={<AdminOverdue />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
}
