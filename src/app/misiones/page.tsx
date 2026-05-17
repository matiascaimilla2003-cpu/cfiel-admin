"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTenant } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

interface Mision {
  id: string;
  titulo: string;
  descripcion: string | null;
  puntos_premio: number;
  meta_tipo: string;
  meta_valor: number;
  fecha_fin: string;
  activa: boolean;
  tenant_id: string;
  created_at: string;
}

interface FormData {
  titulo: string;
  descripcion: string;
  puntos_premio: string;
  meta_tipo: "compras" | "monto" | "visitas";
  meta_valor: string;
  fecha_fin: string;
}

type MisionStatus = "activa" | "inactiva" | "vencida";

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

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: "var(--muted)",
  letterSpacing: 1,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 5,
};

const META_TIPO_LABELS: Record<string, string> = {
  compras: "Cantidad de compras",
  monto: "Monto total ($)",
  visitas: "Visitas al local",
};

function getStatus(m: Mision): MisionStatus {
  if (new Date(m.fecha_fin) <= new Date()) return "vencida";
  if (!m.activa) return "inactiva";
  return "activa";
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function MisionSkeleton() {
  return (
    <div style={{ background: "linear-gradient(135deg, #1a1a1a, #181818)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div className="skeleton" style={{ height: 14, width: "45%" }} />
        <div className="skeleton" style={{ height: 22, width: 60, borderRadius: 5 }} />
      </div>
      <div className="skeleton" style={{ height: 10, width: "75%", marginBottom: 14 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div className="skeleton" style={{ height: 26, width: 90, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 26, width: 80, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function MisionesPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [misiones, setMisiones] = useState<Mision[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormData>({
    titulo: "",
    descripcion: "",
    puntos_premio: "",
    meta_tipo: "compras",
    meta_valor: "",
    fecha_fin: "",
  });
  const modalRef = useRef<HTMLDivElement>(null);

  const loadMisiones = useCallback(async (tid: string) => {
    const res = await fetch(`/api/misiones?tenant_id=${tid}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Error al cargar misiones");
    }
    setMisiones(await res.json());
  }, []);

  const loadData = useCallback(async () => {
    setLoadFailed(false);
    const auth = localStorage.getItem("cfiel_auth");
    if (!auth) { router.replace("/login"); return; }
    const slug = localStorage.getItem("cfiel_admin_tenant");
    if (!slug) { router.replace("/login"); return; }
    try {
      const t = await getTenant(slug);
      setTenantId(t.id);
      await loadMisiones(t.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      setLoadFailed(true);
    }
  }, [router, loadMisiones]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!showModal) return;
    function onOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showModal]);

  async function handleCreate() {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/misiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          titulo: form.titulo,
          descripcion: form.descripcion || null,
          puntos_premio: parseInt(form.puntos_premio, 10),
          meta_tipo: form.meta_tipo,
          meta_valor: parseInt(form.meta_valor, 10),
          fecha_fin: form.fecha_fin,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al crear misión");
      }
      setShowModal(false);
      setForm({ titulo: "", descripcion: "", puntos_premio: "", meta_tipo: "compras", meta_valor: "", fecha_fin: "" });
      await loadMisiones(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear misión");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(m: Mision) {
    setError(null);
    setMisiones((prev) =>
      prev ? prev.map((x) => (x.id === m.id ? { ...x, activa: !m.activa } : x)) : prev
    );
    try {
      const res = await fetch(`/api/misiones/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !m.activa }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al actualizar");
      }
    } catch (err) {
      setMisiones((prev) =>
        prev ? prev.map((x) => (x.id === m.id ? { ...x, activa: m.activa } : x)) : prev
      );
      setError(err instanceof Error ? err.message : "Error al actualizar misión");
    }
  }

  const canCreate =
    !saving &&
    form.titulo.trim() !== "" &&
    form.puntos_premio !== "" &&
    form.meta_valor !== "" &&
    form.fecha_fin !== "";

  const loading = misiones === null && !loadFailed;

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentPath="/misiones" />

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
              MISIONES
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Desafíos semanales para tus clientes
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {error && (
              <div style={{ fontSize: 12, color: "#ff8a80", background: "rgba(255,90,80,0.08)", border: "1px solid rgba(255,90,80,0.2)", padding: "6px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚠</span> {error}
                <button
                  onClick={() => setError(null)}
                  style={{ background: "none", border: "none", color: "#ff8a80", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}
                >
                  ✕
                </button>
              </div>
            )}
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: "9px 18px", background: "var(--acc)", border: "none", borderRadius: 8, color: "#0a0a0a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.4, transition: "opacity 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              ＋ Nueva misión
            </button>
          </div>
        </header>

        {/* Body */}
        <div style={{ padding: "28px 32px", flex: 1 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => <MisionSkeleton key={i} />)}
            </div>
          ) : loadFailed ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 14, textAlign: "center" }}>
              <span style={{ fontSize: 36, opacity: 0.3 }}>⚠</span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--mid)" }}>No se pudieron cargar las misiones</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 340, lineHeight: 1.5 }}>
                Verifica tu conexión y vuelve a intentarlo.
              </p>
              <button
                onClick={loadData}
                style={{ marginTop: 6, padding: "9px 20px", background: "var(--acc)", border: "none", borderRadius: 8, color: "#0a0a0a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Reintentar
              </button>
            </div>
          ) : misiones!.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 14, textAlign: "center" }}>
              <span style={{ fontSize: 48, opacity: 0.2 }}>⊕</span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--mid)" }}>Sin misiones configuradas</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 360, lineHeight: 1.5 }}>
                Crea desafíos para motivar a tus clientes a volver más seguido.
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{ marginTop: 6, padding: "10px 22px", background: "var(--acc)", border: "none", borderRadius: 8, color: "#0a0a0a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                ＋ Crear primera misión
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {misiones!.map((m) => {
                const status = getStatus(m);
                const statusColors: Record<MisionStatus, { bg: string; color: string; border: string }> = {
                  activa: { bg: "rgba(46,204,113,0.12)", color: "#2ECC71", border: "rgba(46,204,113,0.25)" },
                  inactiva: { bg: "rgba(100,100,100,0.12)", color: "var(--muted)", border: "var(--border)" },
                  vencida: { bg: "rgba(100,100,100,0.08)", color: "var(--muted)", border: "var(--border)" },
                };
                const sc = statusColors[status];
                return (
                  <div
                    key={m.id}
                    style={{
                      background: "linear-gradient(135deg, #1a1a1a, #181818)",
                      border: `1px solid ${status === "activa" ? "var(--border2)" : "var(--border)"}`,
                      borderRadius: 12,
                      padding: "18px 20px",
                      opacity: status === "vencida" ? 0.55 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {/* Título + badge */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--hi)", lineHeight: 1.3, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.titulo}
                      </div>
                      <span style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, flexShrink: 0, textTransform: "capitalize", background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {status === "activa" ? "Activa" : status === "vencida" ? "Vencida" : "Inactiva"}
                      </span>
                    </div>

                    {/* Descripción */}
                    {m.descripcion && (
                      <p style={{ margin: "0 0 12px", fontSize: 11, color: "var(--muted)", lineHeight: 1.4, overflow: "hidden", maxHeight: "2.8em" }}>
                        {m.descripcion}
                      </p>
                    )}

                    {/* Meta + puntos */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "var(--muted)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 5 }}>
                        {META_TIPO_LABELS[m.meta_tipo] ?? m.meta_tipo}: {m.meta_valor}
                      </span>
                      <span style={{ fontFamily: "var(--font-bebas)", fontSize: 15, letterSpacing: 1, color: "var(--acc)" }}>
                        +{m.puntos_premio.toLocaleString("es-CL")} pts
                      </span>
                    </div>

                    {/* Fecha fin */}
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 12, letterSpacing: 0.3 }}>
                      Vence el {formatFecha(m.fecha_fin)}
                    </div>

                    {/* Acciones */}
                    {status !== "vencida" && (
                      <button
                        onClick={() => handleToggle(m)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 5,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          border: m.activa ? "1px solid rgba(150,150,150,0.3)" : "1px solid rgba(46,204,113,0.3)",
                          background: m.activa ? "rgba(150,150,150,0.08)" : "rgba(46,204,113,0.08)",
                          color: m.activa ? "var(--muted)" : "#2ECC71",
                          transition: "all 0.15s",
                        }}
                      >
                        {m.activa ? "Desactivar" : "Activar"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div
            ref={modalRef}
            style={{ background: "#161616", border: "1px solid var(--border2)", borderRadius: 16, padding: "28px 28px 24px", width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-bebas)", fontSize: 24, letterSpacing: 2, color: "var(--hi)" }}>
                NUEVA MISIÓN
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 2, fontFamily: "inherit" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Título */}
              <div>
                <label style={LABEL_STYLE}>Título *</label>
                <input
                  type="text"
                  placeholder="Ej: Fiel de la semana"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  style={INPUT_BASE}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={LABEL_STYLE}>Descripción</label>
                <textarea
                  placeholder="Describe el desafío para tus clientes"
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  style={{ ...INPUT_BASE, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Puntos + Fecha */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LABEL_STYLE}>Puntos premio *</label>
                  <input
                    type="number"
                    placeholder="500"
                    min={1}
                    value={form.puntos_premio}
                    onChange={(e) => setForm((f) => ({ ...f, puntos_premio: e.target.value }))}
                    style={INPUT_BASE}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Fecha fin *</label>
                  <input
                    type="date"
                    min={today}
                    value={form.fecha_fin}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value }))}
                    style={{ ...INPUT_BASE, colorScheme: "dark" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>

              {/* Meta tipo + Meta valor */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LABEL_STYLE}>Meta tipo *</label>
                  <select
                    value={form.meta_tipo}
                    onChange={(e) => setForm((f) => ({ ...f, meta_tipo: e.target.value as FormData["meta_tipo"] }))}
                    style={{ ...INPUT_BASE, appearance: "none", cursor: "pointer" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <option value="compras">Compras</option>
                    <option value="monto">Monto ($)</option>
                    <option value="visitas">Visitas</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Meta valor *</label>
                  <input
                    type="number"
                    placeholder={form.meta_tipo === "monto" ? "10000" : "5"}
                    min={1}
                    value={form.meta_valor}
                    onChange={(e) => setForm((f) => ({ ...f, meta_valor: e.target.value }))}
                    style={INPUT_BASE}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!canCreate}
                style={{
                  marginTop: 6,
                  padding: "11px 18px",
                  background: canCreate ? "var(--acc)" : "rgba(208,208,208,0.15)",
                  border: "none",
                  borderRadius: 8,
                  color: canCreate ? "#0a0a0a" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: canCreate ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                  letterSpacing: 0.4,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { if (canCreate) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {saving ? "Creando…" : "Crear misión"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
