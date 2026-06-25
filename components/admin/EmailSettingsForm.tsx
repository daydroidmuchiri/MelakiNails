"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Mail, ShieldCheck } from "lucide-react";
import { saveEmailSettings } from "@/app/admin/actions";

interface EmailSettings {
  emailSender: string;
  emailNotification: string;
  emailCustomerEnabled: boolean;
  emailAdminEnabled: boolean;
}

interface EmailSettingsFormProps {
  settings: EmailSettings | null;
}

export function EmailSettingsForm({ settings }: EmailSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [emailSender, setEmailSender] = useState(
    settings?.emailSender ?? "orders@melaki.co.ke"
  );
  const [emailNotification, setEmailNotification] = useState(
    settings?.emailNotification ?? "admin@melaki.co.ke"
  );
  const [emailCustomerEnabled, setEmailCustomerEnabled] = useState(
    settings?.emailCustomerEnabled ?? true
  );
  const [emailAdminEnabled, setEmailAdminEnabled] = useState(
    settings?.emailAdminEnabled ?? true
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("emailSender", emailSender);
    formData.append("emailNotification", emailNotification);
    formData.append("emailCustomerEnabled", String(emailCustomerEnabled));
    formData.append("emailAdminEnabled", String(emailAdminEnabled));

    startTransition(async () => {
      await saveEmailSettings(formData);
      alert("Email settings saved successfully!");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl shadow-card p-6 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2 flex items-center gap-2">
          <Mail className="w-4 h-4 text-amber" />
          Email Delivery
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">
              Sender Address
            </label>
            <input
              type="email"
              value={emailSender}
              onChange={(event) => setEmailSender(event.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">
              Admin Notification Address
            </label>
            <input
              type="email"
              value={emailNotification}
              onChange={(event) => setEmailNotification(event.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber" />
          Notification Controls
        </h3>

        <label className="flex items-start justify-between gap-4 border border-border rounded-lg p-4">
          <span>
            <span className="block text-sm font-semibold text-charcoal">
              Customer emails
            </span>
            <span className="block text-xs text-muted mt-1">
              Send order, payment, and status notifications to customers with an email address.
            </span>
          </span>
          <input
            type="checkbox"
            checked={emailCustomerEnabled}
            onChange={(event) => setEmailCustomerEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 accent-amber"
          />
        </label>

        <label className="flex items-start justify-between gap-4 border border-border rounded-lg p-4">
          <span>
            <span className="block text-sm font-semibold text-charcoal">
              Admin notifications
            </span>
            <span className="block text-xs text-muted mt-1">
              Send new order and payment alerts to the admin notification address.
            </span>
          </span>
          <input
            type="checkbox"
            checked={emailAdminEnabled}
            onChange={(event) => setEmailAdminEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 accent-amber"
          />
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-amber hover:bg-amber-dark text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save Email Settings
        </button>
      </div>
    </form>
  );
}
