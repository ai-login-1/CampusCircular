import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Mode = "login" | "forgot";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // email or student ID
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [forgotSent, setForgotSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Resolve email from student ID or email input
  const resolveEmail = async (input: string): Promise<string | null> => {
    if (input.includes("@")) return input;
    // Look up by student_id
    const { data } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("student_id", input.toUpperCase())
      .single();
    return data?.email ?? null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) { toast.error("Please fill in all fields"); return; }
    setIsLoading(true);

    const email = await resolveEmail(identifier);
    if (!email) {
      toast.error("Student ID or email not found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Invalid credentials. Please check your Student ID/email and password.");
      setIsLoading(false);
      return;
    }

    if (data.user) {
      // Update last login
      await supabase.from("user_profiles").update({ last_login: new Date().toISOString() }).eq("id", data.user.id);

      const { data: profile } = await supabase.from("user_profiles").select("role, first_login_completed").eq("id", data.user.id).single();

      if (!profile?.first_login_completed) {
        toast.error("Your account setup is not complete. Please use your setup link.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back to Campus Circular!");
      if (profile?.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
    // Don't reset loading — navigation will unmount
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) { toast.error("Enter your college email or Student ID"); return; }
    setIsLoading(true);

    const email = await resolveEmail(identifier);
    if (!email) {
      toast.error("No account found for that email or Student ID.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }
    setForgotSent(true);
    setIsLoading(false);
  };

  const handleDemo = async (type: "student" | "owner" | "admin") => {
    setIsLoading(true);
    const creds = {
      student: { email: "arjun.mehta@university.edu", password: "demo1234" },
      owner: { email: "priya.sharma@university.edu", password: "demo1234" },
      admin: { email: "admin@university.edu", password: "admin1234" },
    }[type];

    const { data, error } = await supabase.auth.signInWithPassword(creds);
    if (error) { toast.error("Demo login failed. Please try again."); setIsLoading(false); return; }
    if (data.user) {
      await supabase.from("user_profiles").update({ last_login: new Date().toISOString() }).eq("id", data.user.id);
      toast.success(`Logged in as ${type === "admin" ? "Admin" : type === "owner" ? "Resource Owner" : "Student"}!`);
      const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", data.user.id).single();
      if (profile?.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-lime-400 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-violet-500 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center">
              <span className="text-gray-900 text-xl font-black">C</span>
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-tight">Campus</p>
              <p className="font-bold text-lime-400 text-lg leading-tight -mt-1">Circular</p>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-6">
            Share more.<br />Spend less.<br /><span className="text-lime-400">Build community.</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            A verified peer-to-peer resource sharing platform for your campus. Borrow cameras, laptops, books, and more from fellow students you can trust.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            <p className="text-sm text-gray-300 font-medium">College-controlled accounts only</p>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          {[
            { emoji: "📷", title: "Camera for event coverage", meta: "Borrowed 847 times this semester" },
            { emoji: "💻", title: "MacBook for hackathon", meta: "Available 0.1km away" },
            { emoji: "🎵", title: "Piano for cultural fest", meta: "5.0 ★ · Fully verified owner" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 bg-white/5 backdrop-blur rounded-2xl px-4 py-3 border border-white/10">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <p className="text-white text-sm font-medium">{item.title}</p>
                <p className="text-gray-500 text-xs">{item.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
              <span className="text-white text-sm font-black">C</span>
            </div>
            <span className="font-bold text-gray-900 text-base">Campus <span className="text-lime-500">Circular</span></span>
          </div>

          {mode === "login" && (
            <>
              <h2 className="text-3xl font-black text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm mb-6">Sign in to your campus account.</p>

              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
                <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 font-medium">College accounts only · Provisioned by administrator</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID or College Email</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="TSEC2024001 or yourname@university.edu"
                    autoComplete="username"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button type="button" onClick={() => setMode("forgot")}
                      className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-violet-500 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                    Remember me
                  </label>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign In
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-[#F7F7F5] px-3 text-xs text-gray-400">or try a demo account</span></div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => handleDemo("student")} disabled={isLoading}
                  className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all disabled:opacity-50">
                  <span className="text-lg">👤</span>
                  <span className="font-semibold text-gray-700 text-[11px]">Student</span>
                  <span className="text-[10px] text-gray-400">Arjun · CS 3rd Yr</span>
                </button>
                <button onClick={() => handleDemo("owner")} disabled={isLoading}
                  className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50">
                  <span className="text-lg">📦</span>
                  <span className="font-semibold text-gray-700 text-[11px]">Owner</span>
                  <span className="text-[10px] text-gray-400">Priya · Media 2nd Yr</span>
                </button>
                <button onClick={() => handleDemo("admin")} disabled={isLoading}
                  className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl border border-gray-200 hover:border-lime-300 hover:bg-lime-50 transition-all disabled:opacity-50">
                  <span className="text-lg">🛡️</span>
                  <span className="font-semibold text-gray-700 text-[11px]">Admin</span>
                  <span className="text-[10px] text-gray-400">Dr. Kavita · Faculty</span>
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4">
                Don't have an account?{" "}
                <span className="text-gray-600 font-medium">Contact your college administrator.</span>
              </p>
            </>
          )}

          {mode === "forgot" && !forgotSent && (
            <>
              <button onClick={() => setMode("login")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-7 h-7 text-violet-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Forgot Password?</h2>
                <p className="text-gray-500 text-sm">Enter your college email or Student ID and we'll send you a reset link.</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">College Email or Student ID</label>
                  <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="TSEC2024001 or yourname@university.edu"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Reset Link
                </button>
              </form>
            </>
          )}

          {mode === "forgot" && forgotSent && (
            <div className="text-center">
              <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-lime-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-500 text-sm mb-1">
                We've sent a password reset link to your registered contact.
              </p>
              <p className="text-xs text-gray-400 mb-6">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              <button onClick={() => { setMode("login"); setForgotSent(false); }}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors">
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
