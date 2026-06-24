import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Middleware already handles redirects, but this is a server-side safety net.
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-cream">
      <AdminSidebar
        userEmail={session.user.email}
        userName={session.user.name ?? undefined}
      >
        {children}
      </AdminSidebar>
    </div>
  );
}

