"use client";

import { useState, useTransition } from "react";
import { saveStoreSettings } from "@/app/admin/actions";
import { Check, Loader2, Info } from "lucide-react";

interface Settings {
  storeName: string;
  phone: string;
  phone2: string | null;
  email: string;
  address: string;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  whatsapp: string | null;
  hours: string;
}

interface SettingsFormProps {
  settings: Settings | null;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const [storeName, setStoreName] = useState(settings?.storeName ?? "MELAKI");
  const [phone, setPhone] = useState(settings?.phone ?? "+254 700 000 000");
  const [phone2, setPhone2] = useState(settings?.phone2 ?? "");
  const [email, setEmail] = useState(settings?.email ?? "info@melaki.co.ke");
  const [address, setAddress] = useState(settings?.address ?? "Nairobi, Kenya");
  const [hours, setHours] = useState(settings?.hours ?? "Mon - Sat: 8:00 AM - 6:00 PM");
  const [whatsapp, setWhatsapp] = useState(settings?.whatsapp ?? "");
  const [facebook, setFacebook] = useState(settings?.facebook ?? "");
  const [instagram, setInstagram] = useState(settings?.instagram ?? "");
  const [twitter, setTwitter] = useState(settings?.twitter ?? "");
  const [youtube, setYoutube] = useState(settings?.youtube ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("storeName", storeName);
    formData.append("phone", phone);
    formData.append("phone2", phone2);
    formData.append("email", email);
    formData.append("address", address);
    formData.append("hours", hours);
    formData.append("whatsapp", whatsapp);
    formData.append("facebook", facebook);
    formData.append("instagram", instagram);
    formData.append("twitter", twitter);
    formData.append("youtube", youtube);

    startTransition(async () => {
      await saveStoreSettings(formData);
      alert("Settings saved successfully!");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl shadow-card p-6 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2">
          Store Information & Contact Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">Primary Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">Secondary Phone</label>
            <input
              type="text"
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="+254 711 111 111"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">Business Hours</label>
            <input
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">WhatsApp Number (e.g. 254700000000)</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="254700000000"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-charcoal block">Store Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
            required
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2">
          Social Links & Online Presence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">Facebook Profile URL</label>
            <input
              type="url"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="https://facebook.com/..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">Instagram Handle URL</label>
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">Twitter/X Profile URL</label>
            <input
              type="url"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="https://twitter.com/..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">YouTube Channel URL</label>
            <input
              type="url"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>
      </div>

      <div className="bg-cream-100 p-4 rounded-xl flex items-start gap-3 text-charcoal-400 border border-border">
        <Info className="w-5 h-5 text-amber shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          Saving store settings will automatically update the storefront header navigation,
          contact links, active WhatsApp buttons, footer address fields, and social media icons.
        </p>
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
          Save Configuration
        </button>
      </div>
    </form>
  );
}
