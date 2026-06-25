import { prisma } from "@/lib/prisma";
import { EmailSettingsForm } from "@/components/admin/EmailSettingsForm";

export const revalidate = 0;

export default async function AdminEmailSettingsPage() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Email Notification Settings
        </h2>
        <p className="text-sm text-muted">
          Configure order email sender details, admin alerts, and notification toggles.
        </p>
      </div>

      <EmailSettingsForm settings={settings} />
    </div>
  );
}
