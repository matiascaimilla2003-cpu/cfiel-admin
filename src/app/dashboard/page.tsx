"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTenant, getDashboardStats, getRecentTransactions } from "@/lib/queries";
import type { Tenant, DashboardStats, Transaccion } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

// ─── Helpers ──────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function formatPoints(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Sub-components ───────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <div className="skeleton" style={{ height: 10, width: "50%", marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 40, width: "60%", marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 10, width: "70%" }} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a1a, #181818)",
        border: "1px solid var(--border2)",
        borderRadius: 14,
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -10,
          right: -10,
          width: 60,
          height: 60,
          background:
            "radial-gradient(circle, var(--acc-glow) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          fontSize: 9,
          color: "var(--muted)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-bebas)",
          fontSize: 40,
          color: "var(--hi)",
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{sub}</div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      {[40, 80, 50, 60, 90].map((w, i) => (
        <td key={i} style={{ padding: "14px 20px" }}>
          <div className="skeleton" style={{ height: 11, width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaccion[] | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const auth = localStorage.getItem("cfiel_auth");
    if (!auth) {
      router.replace("/login");
      return;
    }

    const slug = localStorage.getItem("cfiel_admin_tenant");
    if (!slug) {
      router.replace("/login");
      return;
    }

    try {
      const t = await getTenant(slug);
      setTenant(t);

      const [s, tx] = await Promise.all([
        getDashboardStats(t.id),
        getRecentTransactions(t.id, 20),
      ]);
      setStats(s);
      setTransactions(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loading = !tenant || !stats || !transactions;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentPath="/dashboard" />

      {/* ── Main ── */}
      <main
        style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}
      >
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
            {tenant ? (
              <>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--hi)",
                    lineHeight: 1,
                  }}
                >
                  Bienvenido,{" "}
                  <span style={{ color: "var(--acc)" }}>{tenant.nombre}</span>
                </h1>
                <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--muted)" }}>
                  {new Date().toLocaleDateString("es-CL", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </>
            ) : (
              <>
                <div className="skeleton" style={{ height: 15, width: 220, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: 160 }} />
              </>
            )}
          </div>

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
        </header>

        {/* Body */}
        <div style={{ padding: "28px 32px", flex: 1 }}>
          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  label="Total clientes"
                  value={stats.totalClientes.toLocaleString("es-CL")}
                  sub="registrados en tu programa"
                />
                <StatCard
                  label="Activos este mes"
                  value={stats.activosEsteMes.toLocaleString("es-CL")}
                  sub="con al menos 1 transacción"
                />
                <StatCard
                  label="Puntos emitidos"
                  value={formatPoints(stats.puntosEmitidos)}
                  sub="acumulados este mes"
                />
                <StatCard
                  label="Canjes realizados"
                  value={stats.canjesEsteMes.toLocaleString("es-CL")}
                  sub="canjes completados este mes"
                />
              </>
            )}
          </div>

          {/* Transactions */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--hi)" }}>
                  Actividad reciente
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  Últimas 20 transacciones
                </div>
              </div>
              {!loading && transactions.length > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    padding: "4px 10px",
                    border: "1px solid var(--border2)",
                    borderRadius: 6,
                  }}
                >
                  {transactions.length} registros
                </span>
              )}
            </div>

            {/* Empty / loading / data states */}
            {loading ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Tipo", "Puntos", "Descripción", "Usuario", "Fecha"].map((h) => (
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
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            ) : transactions.length === 0 ? (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  color: "var(--muted)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 32, opacity: 0.3 }}>○</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--mid)" }}>
                  Sin actividad aún
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  Las transacciones aparecerán aquí cuando tus clientes empiecen a acumular puntos.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Tipo", "Puntos", "Descripción", "Usuario", "Fecha"].map((h) => (
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
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          "rgba(255,255,255,0.015)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          "transparent")
                      }
                    >
                      {/* Tipo */}
                      <td style={{ padding: "12px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 9px",
                            borderRadius: 5,
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "capitalize",
                            background:
                              tx.tipo === "compra"
                                ? "rgba(160,160,160,0.1)"
                                : "rgba(100,100,100,0.12)",
                            color:
                              tx.tipo === "compra" ? "var(--acc)" : "var(--mid)",
                            border:
                              tx.tipo === "compra"
                                ? "1px solid rgba(208,208,208,0.15)"
                                : "1px solid var(--border2)",
                          }}
                        >
                          {tx.tipo === "compra" ? "+" : "−"} {tx.tipo}
                        </span>
                      </td>

                      {/* Puntos */}
                      <td style={{ padding: "12px 20px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-bebas)",
                            fontSize: 18,
                            letterSpacing: 1,
                            color: tx.tipo === "compra" ? "var(--hi)" : "var(--mid)",
                          }}
                        >
                          {tx.tipo === "compra" ? "+" : "−"}
                          {tx.puntos?.toLocaleString("es-CL") ?? "0"}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 12,
                          color: "var(--mid)",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.descripcion ?? "—"}
                      </td>

                      {/* Usuario ID (truncado) */}
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 11,
                          color: "var(--muted)",
                          fontFamily: "ui-monospace, monospace",
                          maxWidth: 140,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.usuario_id.slice(0, 8)}…
                      </td>

                      {/* Fecha */}
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 11,
                          color: "var(--muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
