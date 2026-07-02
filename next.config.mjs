import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.resend.com https://sandbox.safaricom.co.ke https://api.safaricom.co.ke; frame-src https://www.google.com https://www.google.com/maps https://maps.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

// Source map upload only runs (and only needs to run) when SENTRY_AUTH_TOKEN
// is present — without it the Sentry webpack plugin has no way to authenticate
// with Sentry's API. Skipping upload entirely when unset avoids noisy
// "no auth token" warnings on builds that don't have it configured (e.g. PR
// preview builds without secrets), without breaking local dev or CI builds
// that do have it set. See docs/DEPLOYMENT.md "Sentry Setup" for which env
// vars are required for which level of functionality.
const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(
  nextConfig,
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    sourcemaps: {
      disable: !hasSentryAuthToken,
      deleteSourcemapsAfterUpload: true,
    },
    widenClientFileUpload: true,
    webpack: {
      treeshake: {
        removeDebugLogging: true,
      },
    },
  }
);
