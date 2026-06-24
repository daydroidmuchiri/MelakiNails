import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/SettingsForm";

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

      <SettingsForm settings={settings} />
    </div>
  );
}
