"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTenant } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

interface Beneficio {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  costo_puntos: number;
  disponible: boolean;
  tipo: "producto" | "descuento" | "especial";
  tenant_id: string;
  created_at: string;
}

interface FormData {
  nombre: string;
  descripcion: string;
  icono: string;
  costo_puntos: string;
  tipo: "producto" | "descuento" | "especial";
}

const TIPO_LABELS: Record<string, string> = {
  producto: "Producto",
  descuento: "Descuento",
  especial: "Especial",
};

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

function BeneficioSkeleton() {
  return (
    <div style={{ background: "linear-gradient(135deg, #1a1a1a, #181818)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 13, width: "55%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: "80%", marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div className="skeleton" style={{ height: 26, width: 90, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 26, width: 72, borderRadius: 6 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 22, width: 56, borderRadius: 5 }} />
      </div>
    </div>
  );
}

export default function BeneficiosPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [beneficios, setBeneficios] = useState<Beneficio[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    nombre: "",
    descripcion: "",
    icono: "🎁",
    costo_puntos: "",
    tipo: "producto",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const loadBeneficios = useCallback(async (tid: string) => {
    const res = await fetch(`/api/beneficios?tenant_id=${tid}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Error al cargar beneficios");
    }
    setBeneficios(await res.json());
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
      await loadBeneficios(t.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      setLoadFailed(true);
    }
  }, [router, loadBeneficios]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!showModal) return;
    function onClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showModal]);

  async function handleCreate() {
    if (!tenantId || !form.nombre || !form.costo_puntos) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/beneficios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          icono: form.icono || "🎁",
          costo_puntos: parseInt(form.costo_puntos, 10),
          tipo: form.tipo,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al crear beneficio");
      }
      setShowModal(false);
      setForm({ nombre: "", descripcion: "", icono: "🎁", costo_puntos: "", tipo: "producto" });
      await loadBeneficios(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear beneficio");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(b: Beneficio) {
    setError(null);
    setBeneficios((prev) =>
      prev ? prev.map((x) => (x.id === b.id ? { ...x, disponible: !b.disponible } : x)) : prev
    );
    try {
      const res = await fetch(`/api/beneficios/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponible: !b.disponible }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al actualizar");
      }
    } catch (err) {
      setBeneficios((prev) =>
        prev ? prev.map((x) => (x.id === b.id ? { ...x, disponible: b.disponible } : x)) : prev
      );
      setError(err instanceof Error ? err.message : "Error al actualizar beneficio");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/beneficios/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error al eliminar");
      }
      setBeneficios((prev) => (prev ? prev.filter((x) => x.id !== id) : prev));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar beneficio");
    }
  }

  const loading = beneficios === null && !loadFailed;
  const canCreate = !saving && form.nombre.trim() !== "" && form.costo_puntos !== "";

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentPath="/beneficios" />

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
              BENEFICIOS
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Configura qué pueden canjear tus clientes
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {error && (
              <div style={{ fontSize: 12, color: "#ff8a80", background: "rgba(255,90,80,0.08)", border: "1px solid rgba(255,90,80,0.2)", padding: "6px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚠</span> {error}
                <button
                  onClick={() => setError(null)}
                  style={{ background: "none", border: "none", color: "#ff8a80", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0, lineHeight: 1 }}
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
              ＋ Nuevo beneficio
            </button>
          </div>
        </header>

        {/* Body */}
        <div style={{ padding: "28px 32px", flex: 1 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => <BeneficioSkeleton key={i} />)}
            </div>
          ) : loadFailed ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 14, textAlign: "center" }}>
              <span style={{ fontSize: 36, opacity: 0.3 }}>⚠</span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--mid)" }}>No se pudieron cargar los beneficios</p>
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
          ) : beneficios!.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 14, textAlign: "center" }}>
              <span style={{ fontSize: 48, opacity: 0.2 }}>◆</span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--mid)" }}>Sin beneficios configurados</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", maxWidth: 360, lineHeight: 1.5 }}>
                Crea tu primer beneficio para que tus clientes puedan canjear sus puntos.
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{ marginTop: 6, padding: "10px 22px", background: "var(--acc)", border: "none", borderRadius: 8, color: "#0a0a0a", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                ＋ Crear primer beneficio
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {beneficios!.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: "linear-gradient(135deg, #1a1a1a, #181818)",
                    border: `1px solid ${b.disponible ? "var(--border2)" : "var(--border)"}`,
                    borderRadius: 12,
                    padding: "16px 18px",
                    opacity: b.disponible ? 1 : 0.6,
                    transition: "opacity 0.2s, border-color 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    {/* Icono */}
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {b.icono ?? "🎁"}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--hi)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.nombre}
                      </div>

                      {b.descripcion && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, lineHeight: 1.4, overflow: "hidden", maxHeight: "2.8em" }}>
                          {b.descripcion}
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: b.descripcion ? 0 : 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-bebas)", fontSize: 16, letterSpacing: 1, color: "var(--acc)" }}>
                          {b.costo_puntos.toLocaleString("es-CL")} pts
                        </span>

                        {b.tipo && (
                          <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--mid)" }}>
                            {TIPO_LABELS[b.tipo] ?? b.tipo}
                          </span>
                        )}

                        <button
                          onClick={() => handleToggle(b)}
                          style={{
                            padding: "3px 9px",
                            borderRadius: 5,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            border: b.disponible ? "1px solid rgba(150,150,150,0.3)" : "1px solid rgba(46,204,113,0.3)",
                            background: b.disponible ? "rgba(150,150,150,0.08)" : "rgba(46,204,113,0.08)",
                            color: b.disponible ? "var(--muted)" : "#2ECC71",
                            transition: "all 0.15s",
                          }}
                        >
                          {b.disponible ? "Desactivar" : "Activar"}
                        </button>

                        {deleteConfirm === b.id ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() => handleDelete(b.id)}
                              style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "rgba(255,90,80,0.15)", border: "1px solid rgba(255,90,80,0.3)", color: "#ff5a50" }}
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, cursor: "pointer", fontFamily: "inherit", background: "transparent", border: "1px solid var(--border)", color: "var(--muted)" }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(b.id)}
                            style={{ padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: "rgba(255,90,80,0.08)", border: "1px solid rgba(255,90,80,0.2)", color: "#ff6b6b", transition: "all 0.15s" }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Estado badge */}
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 600,
                      flexShrink: 0,
                      background: b.disponible ? "rgba(46,204,113,0.12)" : "rgba(100,100,100,0.12)",
                      color: b.disponible ? "#2ECC71" : "var(--muted)",
                      border: b.disponible ? "1px solid rgba(46,204,113,0.25)" : "1px solid var(--border)",
                    }}>
                      {b.disponible ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div
            ref={modalRef}
            style={{ background: "#161616", border: "1px solid var(--border2)", borderRadius: 16, padding: "28px 28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-bebas)", fontSize: 24, letterSpacing: 2, color: "var(--hi)" }}>
                NUEVO BENEFICIO
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 2, fontFamily: "inherit" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Nombre */}
              <div>
                <label style={LABEL_STYLE}>Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Cerveza gratis"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  style={INPUT_BASE}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={LABEL_STYLE}>Descripción</label>
                <textarea
                  placeholder="Descripción opcional del beneficio"
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={2}
                  style={{ ...INPUT_BASE, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Ícono + Costo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LABEL_STYLE}>Ícono emoji</label>
                  <input
                    type="text"
                    placeholder="🍺"
                    value={form.icono}
                    onChange={(e) => setForm((f) => ({ ...f, icono: e.target.value }))}
                    style={{ ...INPUT_BASE, textAlign: "center", fontSize: 20 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Costo en puntos *</label>
                  <input
                    type="number"
                    placeholder="500"
                    min={1}
                    value={form.costo_puntos}
                    onChange={(e) => setForm((f) => ({ ...f, costo_puntos: e.target.value }))}
                    style={INPUT_BASE}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label style={LABEL_STYLE}>Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as FormData["tipo"] }))}
                  style={{ ...INPUT_BASE, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <option value="producto">Producto</option>
                  <option value="descuento">Descuento</option>
                  <option value="especial">Especial</option>
                </select>
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
                {saving ? "Creando…" : "Crear beneficio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
