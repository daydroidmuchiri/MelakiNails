"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function getSafeCallbackUrl(callbackUrl: string | null) {
  if (
    !callbackUrl ||
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//")
  ) {
    return "/admin";
  }

  let url: URL;

  try {
    url = new URL(callbackUrl, window.location.origin);
  } catch {
    return "/admin";
  }

  if (
    (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) ||
    url.pathname === "/admin/login"
  ) {
    return "/admin";
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="admin-email"
          className="block text-sm font-semibold text-charcoal"
        >
          Email address
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@melaki.co.ke"
          disabled={isPending}
          className={cn(
            "w-full px-4 py-3 rounded-xl border bg-cream/50 text-charcoal placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber",
            "transition-colors text-sm",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            error ? "border-red-300" : "border-border"
          )}
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="admin-password"
          className="block text-sm font-semibold text-charcoal"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isPending}
            className={cn(
              "w-full px-4 py-3 pr-12 rounded-xl border bg-cream/50 text-charcoal placeholder:text-muted",
              "focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber",
              "transition-colors text-sm",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              error ? "border-red-300" : "border-border"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isPending}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-charcoal transition-colors rounded-md"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        id="admin-login-submit"
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full flex items-center justify-center gap-2.5",
          "px-6 py-3 rounded-xl font-semibold text-sm text-white",
          "bg-amber hover:bg-amber/90 active:scale-[0.98]",
          "transition-all duration-150 shadow-md shadow-amber/20",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Sign in
          </>
        )}
      </button>
    </form>
  );
}
