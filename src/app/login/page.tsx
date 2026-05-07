"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const CREDENTIALS: Record<string, { tenant: string; nombre: string }> = {
      "tiopolo@cfiel.app:tiopolo2025": { tenant: "tio-polo", nombre: "Tío Polo" },
    };

    const match = CREDENTIALS[`${email}:${password}`];
    if (!match) {
      setError("Credenciales incorrectas.");
      setLoading(false);
      return;
    }

    localStorage.setItem("cfiel_auth", "true");
    localStorage.setItem("cfiel_admin_tenant", match.tenant);
    localStorage.setItem("cfiel_admin_nombre", match.nombre);
    router.push("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(208,208,208,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
          background: "var(--card-dark)",
          border: "1px solid var(--border2)",
          borderRadius: 16,
          padding: "44px 40px",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Top accent line */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, var(--acc), transparent)",
            borderRadius: "16px 16px 0 0",
          }}
        />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: "1.5px solid var(--acc)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-bebas)",
                  fontSize: 22,
                  letterSpacing: 2,
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                C
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: 28,
                letterSpacing: 6,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              CFIEL
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--muted)",
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              Panel de administración
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--mid)",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              className="cfiel-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cfiel.cl"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--mid)",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Contraseña
            </label>
            <input
              id="password"
              className="cfiel-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <p
              style={{
                fontSize: 13,
                color: "#ff8a80",
                margin: 0,
                padding: "8px 12px",
                background: "rgba(255,90,80,0.08)",
                borderRadius: 6,
                border: "1px solid rgba(255,90,80,0.2)",
              }}
            >
              {error}
            </p>
          )}

          <button
            className="btn-white"
            type="submit"
            style={{ width: "100%", padding: 13, fontSize: 14, marginTop: 4 }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid #000",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    display: "inline-block",
                  }}
                />
                Ingresando…
              </span>
            ) : (
              "Ingresar"
            )}
          </button>

          <div style={{ textAlign: "center", marginTop: 4 }}>
            <span
              style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer" }}
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
