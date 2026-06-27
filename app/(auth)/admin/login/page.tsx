import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "./LoginForm";
import { Store } from "lucide-react";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export const metadata = {
  title: "Admin Login — MELAKI",
  description: "Sign in to the MELAKI administration panel.",
};

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);

  // Already authenticated → go straight to admin dashboard
  if (session?.user?.role && ADMIN_ROLES.has(session.user.role)) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #d4af37 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-charcoal px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber/10 border border-amber/30 mb-4">
              <Store className="w-7 h-7 text-amber" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              MELAKI <span className="text-amber">Admin</span>
            </h1>
            <p className="text-charcoal-100 text-sm mt-1">
              Sign in to your management panel
            </p>
          </div>

          {/* Form area */}
          <div className="px-8 py-8">
            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-charcoal-100/60 text-xs mt-6">
          © {new Date().getFullYear()} MELAKI Nails Supply. All rights reserved.
        </p>
      </div>
    </div>
  );
}
