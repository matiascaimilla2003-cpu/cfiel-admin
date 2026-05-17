"use client";

import { useRouter } from "next/navigation";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  currentPath: string;
}

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard", href: "/dashboard" },
  { icon: "◎", label: "Clientes", href: "/clientes" },
  { icon: "↕", label: "Actividad", href: "/actividad" },
  { icon: "◆", label: "Beneficios", href: "/beneficios" },
  { icon: "⊕", label: "Misiones", href: "/misiones" },
  { icon: "⚡", label: "Promociones", href: "/promociones" },
  { icon: "◉", label: "Configuración", href: "/configuracion" },
];

function CfielLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      style={{
        padding: collapsed ? "24px 0 20px" : "24px 20px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "1.5px solid var(--acc)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: 16,
            letterSpacing: 1,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
      {!collapsed && (
        <div>
          <div
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: 20,
              letterSpacing: 4,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            CFIEL
          </div>
          <div
            style={{
              fontSize: 8,
              color: "var(--muted)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Admin
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, setCollapsed, currentPath }: SidebarProps) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("cfiel_auth");
    localStorage.removeItem("cfiel_user");
    localStorage.removeItem("cfiel_admin_tenant");
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
        flexShrink: 0,
        background: "var(--card)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}
    >
      <CfielLogo collapsed={collapsed} />

      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: "none",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 14,
          padding: "0 0 10px",
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-end",
          paddingRight: collapsed ? 0 : 20,
          transition: "color 0.2s",
        }}
        title={collapsed ? "Expandir menú" : "Contraer menú"}
      >
        {collapsed ? "→" : "←"}
      </button>

      <div style={{ height: 1, background: "var(--border)", margin: "0 14px 10px" }} />

      <nav
        style={{
          flex: 1,
          padding: "4px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = currentPath === item.href;
          return (
            <button
              key={item.label}
              onClick={() => item.href !== "#" && router.push(item.href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                border: active ? "1px solid var(--border2)" : "1px solid transparent",
                background: active ? "var(--acc-dim)" : "transparent",
                color: active ? "var(--hi)" : "var(--muted)",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                cursor: item.href !== "#" ? "pointer" : "default",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                overflow: "hidden",
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--mid)";
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.02)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  flexShrink: 0,
                  width: 20,
                  textAlign: "center",
                }}
              >
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: "12px 10px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: 12,
            cursor: "pointer",
            width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            fontFamily: "inherit",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "var(--mid)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "var(--muted)")
          }
          title="Cerrar sesión"
        >
          <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: "center" }}>
            ⎋
          </span>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
