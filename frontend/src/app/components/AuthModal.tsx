import { useState, useEffect, useRef } from "react";
import { X, Loader2, Music } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";

type Tab = "join" | "signin";

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: Tab;
  onClose: () => void;
}

export function AuthModal({ isOpen, initialTab = "join", onClose }: AuthModalProps) {
  const { register, login } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join form
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  // Sign In form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError(null);
    }
  }, [isOpen, initialTab]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(displayName, handle, joinEmail, joinPassword);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(signInEmail, signInPassword);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative bg-[#1a1a1a] border border-[#2a2a2a] w-full max-w-md mx-4 z-10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#5b9dd9] to-[#4a8bc2] flex items-center justify-center" aria-hidden="true">
              <Music className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span id="auth-modal-title" className="text-white font-bold text-base">Crescendo</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#666666] hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2a2a]">
          {(["join", "signin"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-[#5b9dd9] text-white"
                  : "border-transparent text-[#666666] hover:text-[#999999]"
              }`}
            >
              {t === "join" ? "Create Account" : "Sign In"}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div className="p-6">
          {/* Error */}
          {error && (
            <div role="alert" className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-sm">
              {error}
            </div>
          )}

          {tab === "join" ? (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="join-display-name" className="text-xs text-[#999999] uppercase tracking-wide">
                    Display Name
                  </Label>
                  <Input
                    id="join-display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="bg-[#252525] border-[#333333] text-white placeholder:text-[#555555] h-9 rounded-sm focus-visible:border-[#5b9dd9] focus-visible:ring-[#5b9dd9]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="join-handle" className="text-xs text-[#999999] uppercase tracking-wide">
                    Username
                  </Label>
                  <Input
                    id="join-handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@handle"
                    required
                    className="bg-[#252525] border-[#333333] text-white placeholder:text-[#555555] h-9 rounded-sm focus-visible:border-[#5b9dd9] focus-visible:ring-[#5b9dd9]/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="join-email" className="text-xs text-[#999999] uppercase tracking-wide">
                  Email
                </Label>
                <Input
                  id="join-email"
                  type="email"
                  value={joinEmail}
                  onChange={(e) => setJoinEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-[#252525] border-[#333333] text-white placeholder:text-[#555555] h-9 rounded-sm focus-visible:border-[#5b9dd9] focus-visible:ring-[#5b9dd9]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="join-password" className="text-xs text-[#999999] uppercase tracking-wide">
                  Password
                </Label>
                <Input
                  id="join-password"
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="bg-[#252525] border-[#333333] text-white placeholder:text-[#555555] h-9 rounded-sm focus-visible:border-[#5b9dd9] focus-visible:ring-[#5b9dd9]/20"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-9 font-medium mt-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-center text-xs text-[#666666]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className="text-[#5b9dd9] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email" className="text-xs text-[#999999] uppercase tracking-wide">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-[#252525] border-[#333333] text-white placeholder:text-[#555555] h-9 rounded-sm focus-visible:border-[#5b9dd9] focus-visible:ring-[#5b9dd9]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signin-password" className="text-xs text-[#999999] uppercase tracking-wide">
                  Password
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="bg-[#252525] border-[#333333] text-white placeholder:text-[#555555] h-9 rounded-sm focus-visible:border-[#5b9dd9] focus-visible:ring-[#5b9dd9]/20"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#5b9dd9] hover:bg-[#4a8bc2] text-white rounded-sm h-9 font-medium mt-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
                ) : (
                  "Sign In"
                )}
              </Button>
              <p className="text-center text-xs text-[#666666]">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("join")}
                  className="text-[#5b9dd9] hover:underline"
                >
                  Create one
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
