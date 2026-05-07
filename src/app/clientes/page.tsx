"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTenant, getClientes } from "@/lib/queries";
import type { Tenant, Usuario } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

const NIVEL_COLORS: Record<string, string> = {
  bronce: "#CD7F32",
  plata: "#C0C0C0",
  oro: "#D4A847",
  platino: "#E5E4E2",
};

function getInitial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase();
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return "hace 1 día";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
}

function ClientRowSkeleton() {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="skeleton"
            style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }}
          />
          <div className="skeleton" style={{ height: 12, width: 110 }} />
        </div>
      </td>
      {[65, 55, 50, 60].map((w, i) => (
        <td key={i} style={{ padding: "14px 20px" }}>
          <div className="skeleton" style={{ height: 11, width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function ClientesPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [clientes, setClientes] = useState<Usuario[] | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const auth = localStorage.getItem("cfiel_auth");
    if (!auth) { router.replace("/login"); return; }
    const slug = localStorage.getItem("cfiel_admin_tenant");
    if (!slug) { router.replace("/login"); return; }

    try {
      const t = await getTenant(slug);
      setTenant(t);
      const c = await getClientes(t.id);
      setClientes(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const loading = !clientes;

  const filtered = (clientes ?? []).filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono ?? "").includes(q)
    );
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentPath="/clientes" />

      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header
          style={{
            padding: "20px 32px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-bebas)",
                fontSize: 32,
                letterSpacing: 3,
                color: "var(--hi)",
                lineHeight: 1,
              }}
            >
              CLIENTES
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Todos tus clientes registrados
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: "#ff8a80",
                  background: "rgba(255,90,80,0.08)",
                  border: "1px solid rgba(255,90,80,0.2)",
                  padding: "6px 12px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>⚠</span> {error}
                <button
                  onClick={loadData}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ff8a80",
                    cursor: "pointer",
                    fontSize: 11,
                    textDecoration: "underline",
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}
            {!loading && (
              <span
                style={{
                  fontFamily: "var(--font-bebas)",
                  fontSize: 22,
                  letterSpacing: 2,
                  color: "var(--acc)",
                  background: "rgba(212,168,71,0.1)",
                  border: "1px solid rgba(212,168,71,0.25)",
                  padding: "4px 12px 2px",
                  borderRadius: 8,
                  lineHeight: 1.2,
                }}
              >
                {clientes.length}
              </span>
            )}
          </div>
        </header>

        {/* Body */}
        <div style={{ padding: "28px 32px", flex: 1 }}>
          {/* Search */}
          <div style={{ marginBottom: 20, maxWidth: 420 }}>
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--hi)",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Table */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Cliente", "Teléfono", "Nivel", "Puntos", "Última visita"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 20px",
                        textAlign: "left",
                        fontSize: 9,
                        fontWeight: 600,
                        color: "var(--muted)",
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                        borderBottom: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.01)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => <ClientRowSkeleton key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div
                        style={{
                          padding: "60px 20px",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 32, opacity: 0.25 }}>◎</span>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--mid)" }}>
                          {search
                            ? "Sin resultados para tu búsqueda"
                            : "Aún no tienes clientes registrados"}
                        </p>
                        {!search && (
                          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                            Los clientes aparecerán aquí cuando se registren en tu programa.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const nivel = (c.nivel ?? "bronce").toLowerCase();
                    const nivelColor = NIVEL_COLORS[nivel] ?? "#CD7F32";
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background =
                            "rgba(255,255,255,0.015)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background =
                            "transparent")
                        }
                      >
                        {/* Avatar + Nombre */}
                        <td style={{ padding: "12px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: `${nivelColor}22`,
                                border: `1.5px solid ${nivelColor}55`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontFamily: "var(--font-bebas)",
                                fontSize: 16,
                                color: nivelColor,
                              }}
                            >
                              {getInitial(c.nombre)}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--hi)" }}>
                              {c.nombre}
                            </span>
                          </div>
                        </td>

                        {/* Teléfono */}
                        <td
                          style={{
                            padding: "12px 20px",
                            fontSize: 12,
                            color: "var(--mid)",
                          }}
                        >
                          {c.telefono ?? "—"}
                        </td>

                        {/* Nivel badge */}
                        <td style={{ padding: "12px 20px" }}>
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: 5,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: "capitalize",
                              background: `${nivelColor}18`,
                              color: nivelColor,
                              border: `1px solid ${nivelColor}35`,
                              letterSpacing: 0.5,
                            }}
                          >
                            {nivel}
                          </span>
                        </td>

                        {/* Puntos */}
                        <td style={{ padding: "12px 20px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-bebas)",
                              fontSize: 18,
                              letterSpacing: 1,
                              color: "var(--acc)",
                            }}
                          >
                            {(c.puntos_total ?? 0).toLocaleString("es-CL")}
                          </span>
                        </td>

                        {/* Última visita */}
                        <td
                          style={{
                            padding: "12px 20px",
                            fontSize: 11,
                            color: "var(--muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {relativeTime(c.ultimo_acceso ?? c.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
