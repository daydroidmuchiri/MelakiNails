"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Catches errors thrown by the root layout itself (app/error.tsx cannot,
// since it renders inside that layout). Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#F7F3EE", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1A1A2E", marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b6b6b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              We hit an unexpected error. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "#E8B84B",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
