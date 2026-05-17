"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTenant } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

interface Promocion {
  id: string;
  tenant_id: string;
  titulo: string;
  descripcion: string | null;
  tipo: "puntos_extra" | "descuento" | "producto_gratis";
  valor: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  usos_por_cliente: number;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  titulo: string;
  descripcion: string;
  tipo: "puntos_extra" | "descuento" | "producto_gratis";
  valor: string;
  fecha_inicio: string;
  fecha_fin: string;
  usos_por_cliente: string;
}

type PromoStatus = "activa" | "inactiva" | "vencida";

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

const TIPO_CONFIG = {
  puntos_extra: { badge: "🔥 Puntos extra", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  descuento: { badge: "💸 Descuento", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  producto_gratis: { badge: "🎁 Producto gratis", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)" },
};

function formatValor(tipo: Promocion["tipo"], valor: string): string {
  if (tipo === "puntos_extra") return `${valor}x puntos`;
  if (tipo === "descuento") {
    const n = parseFloat(valor);
    return isNaN(n) ? valor : `$${n.toLocaleString("es-CL")} descuento`;
  }
  return valor;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatus(p: Promocion): PromoStatus {
  if (new Date(p.fecha_fin) <= new Date()) return "vencida";
  if (!p.activa) return "inactiva";
  return "activa";
}

function PromoSkeleton() {
  return (
    <div style={{ background: "linear-gradient(135deg, #1a1a1a, #181818)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div className="skeleton" style={{ height: 18, width: 80, borderRadius: 5 }} />
        <div className="skeleton" style={{ height: 22, width: 60, borderRadius: 5 }} />
      </div>
      <div className="skeleton" style={{ height: 14, width: "55%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: "75%", marginBottom: 14 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div className="skeleton" style={{ height: 26, width: 90, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 26, width: 70, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function PromocionesPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [promociones, setPromociones] = useState<Promocion[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState<FormData>({
    titulo: "",
    descripcion: "",
    tipo: "puntos_extra",
    valor: "",
    fecha_inicio: today,
    fecha_fin: "",
    usos_por_cliente: "1",
  });

  const modalRef = useRef<HTMLDivElement>(null);

  const loadPromociones = useCallback(async (tid: string) => {
    const res = await fetch(`/api/promociones?tenant_id=${tid}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Error al cargar promociones");
    }
    setPromociones(await res.json());
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
      await loadPromociones(t.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      setLoadFailed(true);
    }
  }, [router, loadPromociones]);

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

  function resetForm() {
    setForm({ titulo: "", descripcion: "", tipo: "puntos_extra", valor: "", fecha_inicio: today, fecha_fin: "", usos_por_cliente: "1" });
  }

  async function handleCreate() {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/promociones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          titulo: form.titulo,
          descripcion: form.descripcion || null,
          tipo: form.tipo,
          valor: form.valor,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          usos_por_cliente: parseInt(form.usos_por_cliente, 10) || 1,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al crear promoción");
      }
      setShowModal(false);
      resetForm();
      await loadPromociones(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear promoción");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(p: Promocion) {
    setError(null);
    setPromociones((prev) =>
      prev ? prev.map((x) => x.id === p.id ? { ...x, activa: !p.activa, is_active: !p.activa && new Date(p.fecha_fin) > new Date() } : x) : prev
    );
    try {
      const res = await fetch(`/api/promociones/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !p.activa }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al actualizar");
      }
    } catch (err) {
      setPromociones((prev) =>
        prev ? prev.map((x) => x.id === p.id ? { ...x, activa: p.activa, is_active: p.is_active } : x) : prev
      );
      setError(err instanceof Error ? err.message : "Error al actualizar promoción");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setConfirmDelete(null);
    setPromociones((prev) => prev ? prev.filter((x) => x.id !== id) : prev);
    try {
      const res = await fetch(`/api/promociones/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al eliminar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar promoción");
      if (tenantId) await loadPromociones(tenantId);
    }
  }

  const valorLabel = form.tipo === "puntos_extra"
    ? "Multiplicador *"
    : form.tipo === "descuento"
    ? "Monto en pesos *"
    : "Descripción del producto *";

  const valorPlaceholder = form.tipo === "puntos_extra"
    ? "2"
    : form.tipo === "descuento"
    ? "1000"
    : "Café con leche";

  const canCreate =
    !saving &&
    form.titulo.trim() !== "" &&
    form.valor.trim() !== "" &&
    form.fecha_inicio !== "" &&
    form.fecha_fin !== "";

  const loading = promociones === null && !loadFailed;

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentPath="/promociones" />

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
              PROMOCIONES
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Crea ofertas especiales para tus clientes
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
              onClick={() => { resetForm(); setShowModal(true); }}
              style={{ padding: "9px 18px", background: "#3B82F6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.4, transition: "opacity 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              ＋ Nueva promoción
            </button>
          </div>
        </header>

        {/* Body */}
        <div style={{ padding: "28px 32px", flex: 1 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => <PromoSkeleton key={i} />)}
            </div>
          ) : loadFailed ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 14, textAlign: "center" }}>
              <span style={{ fontSize: 36, opacity: 0.3 }}>⚠</span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--mid)" }}>No se pudieron cargar las promociones</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 340, lineHeight: 1.5 }}>
                Verifica tu conexión y vuelve a intentarlo.
              </p>
              <button
                onClick={loadData}
                style={{ marginTop: 6, padding: "9px 20px", background: "#3B82F6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Reintentar
              </button>
            </div>
          ) : promociones!.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 14, textAlign: "center" }}>
              <span style={{ fontSize: 48, opacity: 0.2 }}>⚡</span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--mid)" }}>Sin promociones configuradas</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 360, lineHeight: 1.5 }}>
                Crea ofertas especiales para motivar a tus clientes.
              </p>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                style={{ marginTop: 6, padding: "10px 22px", background: "#3B82F6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                ＋ Crear primera promoción
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {promociones!.map((p) => {
                const status = getStatus(p);
                const tc = TIPO_CONFIG[p.tipo] ?? TIPO_CONFIG.puntos_extra;
                const statusColors: Record<PromoStatus, { bg: string; color: string; border: string }> = {
                  activa: { bg: "rgba(46,204,113,0.12)", color: "#2ECC71", border: "rgba(46,204,113,0.25)" },
                  inactiva: { bg: "rgba(100,100,100,0.12)", color: "var(--muted)", border: "var(--border)" },
                  vencida: { bg: "rgba(100,100,100,0.08)", color: "var(--muted)", border: "var(--border)" },
                };
                const sc = statusColors[status];
                return (
                  <div
                    key={p.id}
                    style={{
                      background: "linear-gradient(135deg, #1a1a1a, #181818)",
                      border: `1px solid ${status === "activa" ? "var(--border2)" : "var(--border)"}`,
                      borderRadius: 12,
                      padding: "18px 20px",
                      opacity: status === "vencida" ? 0.55 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {/* Badge tipo + status */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                      <span style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {tc.badge}
                      </span>
                      <span style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {status === "activa" ? "Activa" : status === "vencida" ? "Vencida" : "Inactiva"}
                      </span>
                    </div>

                    {/* Título */}
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--hi)", marginBottom: 4, lineHeight: 1.3 }}>
                      {p.titulo}
                    </div>

                    {/* Descripción */}
                    {p.descripcion && (
                      <p style={{ margin: "0 0 10px", fontSize: 11, color: "var(--muted)", lineHeight: 1.4, overflow: "hidden", maxHeight: "2.8em" }}>
                        {p.descripcion}
                      </p>
                    )}

                    {/* Valor */}
                    <div style={{ fontFamily: "var(--font-bebas)", fontSize: 17, letterSpacing: 1, color: tc.color, marginBottom: 10 }}>
                      {formatValor(p.tipo, p.valor)}
                    </div>

                    {/* Fechas */}
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 14, letterSpacing: 0.3 }}>
                      {formatFecha(p.fecha_inicio)} → {formatFecha(p.fecha_fin)}
                    </div>

                    {/* Acciones */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {status !== "vencida" && (
                        <button
                          onClick={() => handleToggle(p)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 5,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            border: p.activa ? "1px solid rgba(150,150,150,0.3)" : "1px solid rgba(46,204,113,0.3)",
                            background: p.activa ? "rgba(150,150,150,0.08)" : "rgba(46,204,113,0.08)",
                            color: p.activa ? "var(--muted)" : "#2ECC71",
                            transition: "all 0.15s",
                          }}
                        >
                          {p.activa ? "Desactivar" : "Activar"}
                        </button>
                      )}
                      {confirmDelete === p.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(p.id)}
                            style={{ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid rgba(255,90,80,0.4)", background: "rgba(255,90,80,0.12)", color: "#ff8a80", transition: "all 0.15s" }}
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            style={{ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", transition: "all 0.15s" }}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          style={{ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#ff8a80"; e.currentTarget.style.borderColor = "rgba(255,90,80,0.3)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
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
            style={{ background: "#161616", border: "1px solid var(--border2)", borderRadius: 16, padding: "28px 28px 24px", width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-bebas)", fontSize: 24, letterSpacing: 2, color: "var(--hi)" }}>
                NUEVA PROMOCIÓN
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
                  placeholder="Ej: Doble puntos este fin de semana"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  style={INPUT_BASE}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={LABEL_STYLE}>Descripción</label>
                <textarea
                  placeholder="Describe la promoción para tus clientes"
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  style={{ ...INPUT_BASE, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Tipo */}
              <div>
                <label style={LABEL_STYLE}>Tipo de promoción *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as FormData["tipo"], valor: "" }))}
                  style={{ ...INPUT_BASE, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <option value="puntos_extra">🔥 Puntos extra (multiplica los puntos)</option>
                  <option value="descuento">💸 Descuento directo (pesos)</option>
                  <option value="producto_gratis">🎁 Producto gratis</option>
                </select>
              </div>

              {/* Valor */}
              <div>
                <label style={LABEL_STYLE}>{valorLabel}</label>
                {form.tipo === "producto_gratis" ? (
                  <input
                    type="text"
                    placeholder={valorPlaceholder}
                    value={form.valor}
                    onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                    style={INPUT_BASE}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                ) : (
                  <input
                    type="number"
                    placeholder={valorPlaceholder}
                    min={form.tipo === "puntos_extra" ? 2 : 1}
                    step={form.tipo === "descuento" ? 100 : 1}
                    value={form.valor}
                    onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                    style={INPUT_BASE}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                )}
                {form.tipo === "puntos_extra" && form.valor && (
                  <div style={{ marginTop: 4, fontSize: 10, color: "var(--muted)" }}>
                    {form.valor === "2" ? "Doble" : form.valor === "3" ? "Triple" : `${form.valor}x`} puntos por compra
                  </div>
                )}
              </div>

              {/* Fechas */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LABEL_STYLE}>Fecha inicio *</label>
                  <input
                    type="date"
                    min={today}
                    value={form.fecha_inicio}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                    style={{ ...INPUT_BASE, colorScheme: "dark" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Fecha fin *</label>
                  <input
                    type="date"
                    min={tomorrow}
                    value={form.fecha_fin}
                    onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value }))}
                    style={{ ...INPUT_BASE, colorScheme: "dark" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>

              {/* Usos por cliente */}
              <div>
                <label style={LABEL_STYLE}>Usos por cliente</label>
                <input
                  type="number"
                  min={1}
                  value={form.usos_por_cliente}
                  onChange={(e) => setForm((f) => ({ ...f, usos_por_cliente: e.target.value }))}
                  style={INPUT_BASE}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!canCreate}
                style={{
                  marginTop: 6,
                  padding: "11px 18px",
                  background: canCreate ? "#3B82F6" : "rgba(208,208,208,0.15)",
                  border: "none",
                  borderRadius: 8,
                  color: canCreate ? "#fff" : "var(--muted)",
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
                {saving ? "Creando…" : "Crear promoción"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
