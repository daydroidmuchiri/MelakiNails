import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/SettingsForm";
import Link from "next/link";
import { Mail } from "lucide-react";

export const revalidate = 0; // Fresh reads

export default async function AdminSettingsPage() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Store Configuration Settings
        </h2>
        <p className="text-sm text-muted">
          Modify store emails, phone numbers, location addresses, social profiles, and operational hours.
        </p>
      </div>

      <Link
        href="/admin/settings/email"
        className="inline-flex items-center gap-2 bg-charcoal hover:bg-charcoal-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        <Mail className="w-4 h-4" />
        Email Settings
      </Link>

      <SettingsForm settings={settings} />
    </div>
  );
}
