import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";

type Step = "loading" | "set_password" | "success" | "error";

const PW_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
  { label: "At least one special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function AccountSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState<Step>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [profile, setProfile] = useState<{ studentId: string; email: string; fullName: string } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setErrorMsg("Invalid setup link — no token provided."); setStep("error"); return; }
    async function verify() {
      const { data, error } = await supabase.functions.invoke("provision-user", {
        body: { action: "verify_setup_token", token },
      });
      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { const t = await error.context.text(); msg = t || msg; } catch {}
        }
        // Try to parse JSON error
        try { const j = JSON.parse(msg); msg = j.error ?? msg; } catch {}
        setErrorMsg(msg);
        setStep("error");
        return;
      }
      setProfile({ studentId: data.studentId, email: data.email, fullName: data.fullName });
      setStep("set_password");
    }
    verify();
  }, [token]);

  const pwChecks = PW_REQUIREMENTS.map((r) => ({ ...r, ok: r.test(password) }));
  const allPwOk = pwChecks.every((c) => c.ok);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPwOk) { toast.error("Password does not meet all requirements."); return; }
    if (password !== confirmPass) { toast.error("Passwords do not match."); return; }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("provision-user", {
      body: { action: "complete_setup", token, newPassword: password },
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

    // Set the session returned by the edge function
    if (data?.session) {
      await supabase.auth.setSession(data.session);
    }

    setStep("success");
    toast.success("Account setup complete! Welcome to Campus Circular.");

    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
            <span className="text-white text-xl font-black">C</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-tight">Campus</p>
            <p className="font-bold text-lime-500 text-lg leading-tight -mt-1">Circular</p>
          </div>
        </div>

        {/* Loading */}
        {step === "loading" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Verifying your setup link...</p>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Setup Link Invalid</h2>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <button onClick={() => navigate("/login")}
              className="w-full bg-gray-900 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-gray-700 transition-colors">
              Go to Login
            </button>
          </div>
        )}

        {/* Set Password */}
        {step === "set_password" && profile && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7 text-lime-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome to Campus Circular</h2>
              <p className="text-gray-500 text-sm">Set up your secure password to get started.</p>
            </div>

            {/* Profile info */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Student ID</span>
                <span className="font-bold text-gray-900 font-mono">{profile.studentId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">College Email</span>
                <span className="font-semibold text-gray-700">{profile.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-700">{profile.fullName}</span>
              </div>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Create New Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    {pwChecks.map((c) => (
                      <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-lime-600" : "text-gray-400"}`}>
                        <CheckCircle className={`w-3.5 h-3.5 ${c.ok ? "text-lime-500" : "text-gray-300"}`} />
                        {c.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPass && password !== confirmPass && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                  </p>
                )}
              </div>

              <button type="submit" disabled={submitting || !allPwOk || password !== confirmPass}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete Setup & Sign In
              </button>
            </form>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-lime-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Your Account is Ready!</h2>
            <p className="text-gray-500 text-sm mb-1">You're being redirected to your dashboard...</p>
            <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto mt-4" />
          </div>
        )}
      </div>
    </div>
  );
}
