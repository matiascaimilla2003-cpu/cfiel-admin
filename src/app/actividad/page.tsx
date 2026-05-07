"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTenant, getActividad } from "@/lib/queries";
import type { Tenant, TransaccionActividad } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

type Filtro = "todos" | "compra" | "canje" | "bono";

const TIPO_ICON: Record<string, string> = {
  compra: "🛒",
  canje: "🎁",
  bono: "⭐",
};

const TIPO_POSITIVO = new Set(["compra", "bono"]);

function relativeTime(dateStr: string): string {
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

function RowSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 10, width: "60%" }} />
      </div>
      <div className="skeleton" style={{ height: 18, width: 60 }} />
      <div className="skeleton" style={{ height: 10, width: 70 }} />
    </div>
  );
}

export default function ActividadPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [transacciones, setTransacciones] = useState<TransaccionActividad[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
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
      const data = await getActividad(t.id, 50);
      setTransacciones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const loading = !transacciones;

  const filtered = (transacciones ?? []).filter(
    (tx) => filtro === "todos" || tx.tipo === filtro
  );

  void tenant;

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentPath="/actividad" />

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
              ACTIVIDAD
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Historial completo de transacciones
            </p>
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
                  background: "none", border: "none", color: "#ff8a80",
                  cursor: "pointer", fontSize: 11, textDecoration: "underline",
                  fontFamily: "inherit", padding: 0,
                }}
              >
                Reintentar
              </button>
            </div>
          )}
        </header>

        {/* Body */}
        <div style={{ padding: "28px 32px", flex: 1 }}>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(
              [
                { key: "todos", label: "Todos" },
                { key: "compra", label: "🛒 Compras" },
                { key: "canje", label: "🎁 Canjes" },
                { key: "bono", label: "⭐ Bonos" },
              ] as { key: Filtro; label: string }[]
            ).map(({ key, label }) => {
              const active = filtro === key;
              return (
                <button
                  key={key}
                  onClick={() => setFiltro(key)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    border: active ? "1px solid var(--border2)" : "1px solid var(--border)",
                    background: active ? "var(--acc-dim)" : "transparent",
                    color: active ? "var(--hi)" : "var(--muted)",
                  }}
                >
                  {label}
                </button>
              );
            })}
            {!loading && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "var(--muted)",
                  alignSelf: "center",
                }}
              >
                {filtered.length} registros
              </span>
            )}
          </div>

          {/* Lista */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
            ) : filtered.length === 0 ? (
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
                <span style={{ fontSize: 32, opacity: 0.25 }}>↕</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--mid)" }}>
                  {filtro === "todos"
                    ? "Sin transacciones aún"
                    : `Sin ${filtro === "compra" ? "compras" : filtro === "canje" ? "canjes" : "bonos"} registrados`}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  Las transacciones aparecerán aquí cuando tus clientes empiecen a operar.
                </p>
              </div>
            ) : (
              filtered.map((tx, idx) => {
                const positivo = TIPO_POSITIVO.has(tx.tipo);
                const icon = TIPO_ICON[tx.tipo] ?? "↕";
                const isLast = idx === filtered.length - 1;
                return (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 20px",
                      borderBottom: isLast ? "none" : "1px solid var(--border)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        "rgba(255,255,255,0.015)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                    }
                  >
                    {/* Ícono tipo */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: positivo
                          ? "rgba(46,204,113,0.1)"
                          : "rgba(212,168,71,0.1)",
                        border: positivo
                          ? "1px solid rgba(46,204,113,0.2)"
                          : "1px solid rgba(212,168,71,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 17,
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>

                    {/* Usuario + descripción */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--hi)",
                          marginBottom: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.usuarios?.nombre ?? `Usuario ${tx.usuario_id.slice(0, 8)}…`}
                      </div>
                      {tx.descripcion && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tx.descripcion}
                        </div>
                      )}
                    </div>

                    {/* Puntos */}
                    <span
                      style={{
                        fontFamily: "var(--font-bebas)",
                        fontSize: 18,
                        letterSpacing: 1,
                        color: positivo ? "#2ECC71" : "#E74C3C",
                        flexShrink: 0,
                      }}
                    >
                      {positivo ? "+" : "−"}
                      {(tx.puntos ?? 0).toLocaleString("es-CL")}
                    </span>

                    {/* Fecha */}
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        flexShrink: 0,
                        minWidth: 90,
                        textAlign: "right",
                      }}
                    >
                      {relativeTime(tx.created_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
