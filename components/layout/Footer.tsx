"use client";

import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

function Facebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
    </svg>
  );
}

function Instagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function Twitter(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Youtube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.516 3.545 12 3.545 12 3.545s-7.516 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.872.507 9.388.507 9.388.507s7.516 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link
              href="/products"
              className="font-display text-3xl font-bold text-white hover:text-amber transition-colors"
            >
              {SITE_CONFIG.name}
            </Link>
            <p className="mt-4 text-sm text-charcoal-100 leading-relaxed">
              {SITE_CONFIG.description}
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                {
                  href: SITE_CONFIG.social.facebook,
                  icon: Facebook,
                  label: "Facebook",
                },
                {
                  href: SITE_CONFIG.social.instagram,
                  icon: Instagram,
                  label: "Instagram",
                },
                {
                  href: SITE_CONFIG.social.twitter,
                  icon: Twitter,
                  label: "Twitter",
                },
                {
                  href: SITE_CONFIG.social.youtube,
                  icon: Youtube,
                  label: "YouTube",
                },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-charcoal-400 hover:bg-amber flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-charcoal-100 mb-4">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/products", label: "All Products" },
                {
                  href: "/products?category=salon-furniture",
                  label: "Salon Furniture",
                },
                {
                  href: "/products?category=nail-tools",
                  label: "Nail Tools",
                },
                {
                  href: "/products?category=manicure-pedicure",
                  label: "Manicure Equipment",
                },
                { href: "/products?badge=Sale", label: "Sale Items" },
                { href: "/products?badge=New", label: "New Arrivals" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-charcoal-100 hover:text-amber transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-charcoal-100 mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber mt-0.5 shrink-0" />
                <span className="text-sm text-charcoal-100">
                  {SITE_CONFIG.address}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber shrink-0" />
                <a
                  href={`tel:${SITE_CONFIG.phone}`}
                  className="text-sm text-charcoal-100 hover:text-amber transition-colors"
                >
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber shrink-0" />
                <a
                  href={`tel:${SITE_CONFIG.phone2}`}
                  className="text-sm text-charcoal-100 hover:text-amber transition-colors"
                >
                  {SITE_CONFIG.phone2}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber shrink-0" />
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="text-sm text-charcoal-100 hover:text-amber transition-colors"
                >
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber shrink-0" />
                <span className="text-sm text-charcoal-100">
                  {SITE_CONFIG.hours}
                </span>
              </li>
            </ul>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
          </div>

          {/* Map */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-charcoal-100 mb-4">
              Find Us
            </h3>
            <div className="rounded-xl overflow-hidden border border-charcoal-400">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.808!2d36.8127!3d-1.2637!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTUnNDkuMyJTIDM2wrA0OCc0NS43IkU!5e0!3m2!1sen!2ske!4v1680000000000"
                width="100%"
                height="160"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="MELAKI Store Location"
              />
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm text-charcoal-100 mb-2">Stay in the loop</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-charcoal-400 border border-charcoal-300 rounded-lg px-3 py-2 text-sm text-white placeholder-charcoal-100 focus:outline-none focus:ring-1 focus:ring-amber"
                  aria-label="Newsletter email"
                />
                <button
                  type="submit"
                  className="bg-amber hover:bg-amber-dark text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-charcoal-400 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-charcoal-100">
            © {new Date().getFullYear()} MELAKI. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="#"
              className="text-xs text-charcoal-100 hover:text-amber transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-charcoal-100 hover:text-amber transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-xs text-charcoal-100 hover:text-amber transition-colors"
            >
              Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
