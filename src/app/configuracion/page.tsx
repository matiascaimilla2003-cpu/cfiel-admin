"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTenant } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

const CLIENT_URL = "https://cfiel-app.vercel.app";
const CAJERO_URL = "https://fiel-client.vercel.app/cajero";
const CAJERO_PASSWORD = "tiopolo2025";
const WHATSAPP_URL = "https://wa.me/56900000000";

const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  color: "var(--hi)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const LABEL: React.CSSProperties = {
  fontSize: 10,
  color: "var(--muted)",
  letterSpacing: 1,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 5,
};

const SECTION: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1a1a, #181818)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "20px 22px",
  marginBottom: 18,
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-bebas)", fontSize: 20, letterSpacing: 2, color: "var(--hi)" }}>
      {children}
    </h2>
  );
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [nombreEdit, setNombreEdit] = useState("");
  const [email, setEmail] = useState("");
  const [savingNombre, setSavingNombre] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");

  const loadData = useCallback(async () => {
    const auth = localStorage.getItem("cfiel_auth");
    if (!auth) { router.replace("/login"); return; }
    const slug = localStorage.getItem("cfiel_admin_tenant");
    if (!slug) { router.replace("/login"); return; }

    try {
      const userData = localStorage.getItem("cfiel_user");
      if (userData) {
        const parsed = JSON.parse(userData);
        setEmail(parsed.email ?? parsed.correo ?? "");
      }
    } catch (_) {}

    try {
      const t = await getTenant(slug);
      setTenantId(t.id);
      setNombre(t.nombre);
      setNombreEdit(t.nombre);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setPageLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSaveNombre() {
    if (!tenantId || nombreEdit.trim() === "" || nombreEdit.trim() === nombre) return;
    setSavingNombre(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, nombre: nombreEdit.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al guardar");
      }
      setNombre(nombreEdit.trim());
      setSuccessMsg("Nombre actualizado");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSavingNombre(false);
    }
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (_) {}
  }

  function handleLogout() {
    localStorage.removeItem("cfiel_auth");
    localStorage.removeItem("cfiel_user");
    localStorage.removeItem("cfiel_admin_tenant");
    window.location.href = "https://cfiel.vercel.app";
  }

  if (pageLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentPath="/configuracion" />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Cargando…</div>
        </main>
      </div>
    );
  }

  const pilotItems = [
    { label: "App cliente", value: CLIENT_URL, key: "client" },
    { label: "URL cajero", value: CAJERO_URL, key: "cajero" },
    { label: "Contraseña cajero", value: CAJERO_PASSWORD, key: "pw" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentPath="/configuracion" />

      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{
          padding: "20px 32px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-bebas)", fontSize: 32, letterSpacing: 3, color: "var(--hi)", lineHeight: 1 }}>
              CONFIGURACIÓN
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Ajustes de tu cuenta y botillería
            </p>
          </div>

          {(errorMsg || successMsg) && (
            <div style={{
              fontSize: 12,
              color: errorMsg ? "#ff8a80" : "#2ECC71",
              background: errorMsg ? "rgba(255,90,80,0.08)" : "rgba(46,204,113,0.08)",
              border: `1px solid ${errorMsg ? "rgba(255,90,80,0.2)" : "rgba(46,204,113,0.25)"}`,
              padding: "6px 14px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              {errorMsg ? <span>⚠</span> : <span>✓</span>}
              {errorMsg ?? successMsg}
              {errorMsg && (
                <button
                  onClick={() => setErrorMsg(null)}
                  style={{ background: "none", border: "none", color: "#ff8a80", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0, lineHeight: 1 }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </header>

        {/* Content */}
        <div style={{ padding: "28px 32px", flex: 1, maxWidth: 680 }}>

          {/* Mi botillería */}
          <div style={SECTION}>
            <SectionTitle>MI BOTILLERÍA</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={LABEL}>Nombre de la botillería</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={nombreEdit}
                    onChange={(e) => setNombreEdit(e.target.value)}
                    style={{ ...INPUT_BASE, flex: 1 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                  {nombreEdit.trim() !== nombre && nombreEdit.trim() !== "" && (
                    <button
                      onClick={handleSaveNombre}
                      disabled={savingNombre}
                      style={{
                        padding: "9px 16px",
                        background: "var(--acc)",
                        border: "none",
                        borderRadius: 7,
                        color: "#0a0a0a",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: savingNombre ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                        opacity: savingNombre ? 0.6 : 1,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                        transition: "opacity 0.15s",
                      }}
                    >
                      {savingNombre ? "Guardando…" : "Guardar"}
                    </button>
                  )}
                </div>
              </div>

              {email && (
                <div>
                  <label style={LABEL}>Email de acceso</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    style={{ ...INPUT_BASE, opacity: 0.5, cursor: "default" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cambiar contraseña */}
          <div style={SECTION}>
            <SectionTitle>CAMBIAR CONTRASEÑA</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={LABEL}>Contraseña actual</label>
                <input
                  type="password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  placeholder="••••••••"
                  style={INPUT_BASE}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LABEL}>Nueva contraseña</label>
                  <input
                    type="password"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    placeholder="••••••••"
                    style={INPUT_BASE}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <div>
                  <label style={LABEL}>Confirmar contraseña</label>
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    placeholder="••••••••"
                    style={INPUT_BASE}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  disabled
                  style={{
                    padding: "9px 18px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    color: "var(--muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "not-allowed",
                    fontFamily: "inherit",
                  }}
                >
                  Cambiar contraseña
                </button>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Próximamente</span>
              </div>
            </div>
          </div>

          {/* Datos del piloto */}
          <div style={SECTION}>
            <SectionTitle>DATOS DEL PILOTO</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pilotItems.map(({ label, value, key }) => (
                <div key={key}>
                  <label style={LABEL}>{label}</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{
                      flex: 1,
                      padding: "9px 12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: 7,
                      color: "var(--mid)",
                      fontSize: 12,
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {value}
                    </div>
                    <button
                      onClick={() => copyToClipboard(value, key)}
                      style={{
                        padding: "9px 14px",
                        background: copiedKey === key ? "rgba(46,204,113,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${copiedKey === key ? "rgba(46,204,113,0.3)" : "var(--border)"}`,
                        borderRadius: 7,
                        color: copiedKey === key ? "#2ECC71" : "var(--muted)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        flexShrink: 0,
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {copiedKey === key ? "Copiado ✓" : "Copiar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Soporte */}
          <div style={SECTION}>
            <SectionTitle>SOPORTE</SectionTitle>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--mid)", lineHeight: 1.6 }}>
              ¿Necesitas ayuda? Escríbenos y te respondemos a la brevedad.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                background: "rgba(37,211,102,0.08)",
                border: "1px solid rgba(37,211,102,0.2)",
                borderRadius: 8,
                color: "#25D366",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "inherit",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.75")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
            >
              <span style={{ fontSize: 16 }}>💬</span>
              Contactar soporte por WhatsApp
            </a>
          </div>

          {/* Cerrar sesión */}
          <div style={{ paddingBottom: 40 }}>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 20px",
                background: "rgba(255,90,80,0.08)",
                border: "1px solid rgba(255,90,80,0.2)",
                borderRadius: 8,
                color: "#ff6b6b",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,90,80,0.14)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,90,80,0.08)"; }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
