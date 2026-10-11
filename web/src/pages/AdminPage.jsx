import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store";

const fmt = (n) => String(Number(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmtIsk = (n) => `${fmt(Math.round(Number(n || 0)))} kr.`;
const shortDate = (iso) => (iso ? new Date(iso).toLocaleString("is-IS", { dateStyle: "short", timeStyle: "short" }) : "");

const ACTION_LABEL = {
  "user.role_change": "Breytti hlutverki",
  "credit.purchase": "Keypti kredit",
  "credit.slot": "Keypti pláss",
  "credit.boost": "Boost",
};
const actionLabel = (a) => ACTION_LABEL[a] || a;

function Denied({ user }) {
  if (!user) {
    return (
      <div className="container section">
        <div className="empty">
          <h3>Innskráning nauðsynleg</h3>
          <p>Þú þarft að vera skráð(ur) inn sem stjórnandi til að sjá þessa síðu.</p>
          <Link className="btn btn-primary" to="/login">Innskrá</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="container section">
      <div className="empty">
        <h3>403 — Aðgangur hafnaður</h3>
        <p>Þessi síða er aðeins fyrir stjórnendur.</p>
        <Link className="btn btn-outline" to="/dashboard">Fara á mælaborð</Link>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [actions, setActions] = useState([]);
  const [actionsTotal, setActionsTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  const isAdmin = user?.role === "admin";

  const loadOverview = useCallback(() => {
    return api.get("/api/admin/overview").then(setOverview).catch((e) => setError(e.message));
  }, []);

  const loadUsers = useCallback((page, keyword, role) => {
    const p = new URLSearchParams({ page: String(page), perPage: "25" });
    if (keyword) p.set("q", keyword);
    if (role) p.set("role", role);
    return api.get(`/api/admin/users?${p}`).then((d) => {
      setUsers(d.users || []);
      setUsersTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  const loadActions = useCallback((filter) => {
    const p = new URLSearchParams({ perPage: "30" });
    if (filter) p.set("action", filter);
    return api.get(`/api/admin/actions?${p}`).then((d) => {
      setActions(d.actions || []);
      setActionsTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    Promise.all([loadOverview(), loadUsers(1, "", ""), loadActions("")]).finally(() => setLoading(false));
  }, [isAdmin, loadOverview, loadUsers, loadActions]);

  // debounce the user search
  useEffect(() => {
    if (!isAdmin) return;
    const h = setTimeout(() => {
      setUserPage(1);
      loadUsers(1, q, roleFilter);
    }, 350);
    return () => clearTimeout(h);
  }, [q, roleFilter, isAdmin, loadUsers]);

  const changeRole = async (u) => {
    const next = u.role === "admin" ? "user" : "admin";
    const ok = window.confirm(
      `Breyta hlutverki ${u.email} úr "${u.role}" yfir í "${next}"?`
    );
    if (!ok) return;
    setBusyId(u.id);
    try {
      await api.patch(`/api/admin/users/${u.id}/role`, { role: next });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: next } : x)));
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!user || !isAdmin) return <Denied user={user} />;

  const o = overview;
  const bookingsActive = (o?.bookings?.byStatus?.active || 0) + (o?.bookings?.byStatus?.approved || 0);
  const maxReg = Math.max(1, ...(o?.registrations || []).map((r) => r.n));

  return (
    <div className="container section" style={{ maxWidth: 1080 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h1 className="mt0">Stjórnborð</h1>
        <span className="muted">innskráð(ur) sem {user.email}</span>
      </div>

      <div className="dash-nav">
        {[
          { k: "overview", label: "Yfirlit" },
          { k: "users", label: "Notendur" },
          { k: "log", label: "Atvikaskrá" },
        ].map((x) => (
          <button key={x.k} className={tab === x.k ? "active" : ""} onClick={() => setTab(x.k)}>
            {x.label}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="empty">Hleður…</div>}

      {!loading && tab === "overview" && o && (
        <>
          <div className="dash-grid">
            <div className="stat-card">
              <div className="stat-num">{fmt(o.users.total)}</div>
              <div className="stat-label">Notendur</div>
              <div className="muted" style={{ fontSize: 12 }}>
                +{o.users.new1} í dag · +{o.users.new7} í viku · +{o.users.new30} í mánuði
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmt(o.users.admins)}</div>
              <div className="stat-label">Stjórnendur</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmt(o.listings.published)}</div>
              <div className="stat-label">Virkar auglýsingar</div>
              <div className="muted" style={{ fontSize: 12 }}>{fmt(o.listings.boosted)} með boost</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmt(o.bookings.total)}</div>
              <div className="stat-label">Bókanir</div>
              <div className="muted" style={{ fontSize: 12 }}>{fmt(bookingsActive)} virkar</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmtIsk(o.bookings.revenue)}</div>
              <div className="stat-label">Tekjur af bókunum</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmtIsk(o.payments.paidAmount)}</div>
              <div className="stat-label">Greiðslur (borgaðar)</div>
              <div className="muted" style={{ fontSize: 12 }}>þóknun {fmtIsk(o.payments.fees)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmt(o.credits.issued)}</div>
              <div className="stat-label">Kredit útgefið</div>
              <div className="muted" style={{ fontSize: 12 }}>{fmt(o.credits.spent)} varið</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmt(o.credits.outstanding)}</div>
              <div className="stat-label">Kredit í umferð</div>
              <div className="muted" style={{ fontSize: 12 }}>{fmt(o.credits.extraSlots)} pláss · {fmt(o.credits.entries)} færslur</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmt(o.messages)}</div>
              <div className="stat-label">Skilaboð</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmt(o.reviews)}</div>
              <div className="stat-label">Umsagnir</div>
            </div>
          </div>

          <div className="card" style={{ padding: 18, marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, marginTop: 0 }}>Skráningar síðustu 30 dagar</h2>
            <div className="admin-bars">
              {(o.registrations || []).map((r) => (
                <div key={r.day} className="admin-bar" title={`${r.day}: ${r.n}`}>
                  <div className="admin-bar-fill" style={{ height: `${Math.max(6, (r.n / maxReg) * 100)}%` }} />
                  <span>{r.n}</span>
                </div>
              ))}
              {(o.registrations || []).length === 0 && <p className="muted">Engar skráningar á þessu tímabili.</p>}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 17, marginTop: 0 }}>Staða kerfisins</h2>
            <div className="admin-chips">
              <span className="chip">Auglýsingar: {Object.entries(o.listings.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}</span>
              <span className="chip">Bókanir: {Object.entries(o.bookings.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}</span>
              <span className="chip">Greiðslur: {Object.entries(o.payments.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}</span>
            </div>
          </div>
        </>
      )}

      {!loading && tab === "users" && (
        <>
          <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              className="admin-search"
              placeholder="Leita í netföngum, nöfnum, bæjum…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Allir</option>
              <option value="user">Notendur</option>
              <option value="admin">Stjórnendur</option>
            </select>
            <span className="muted">{fmt(usersTotal)} niðurstöður</span>
          </div>

          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Notandi</th>
                  <th>Hlutverk</th>
                  <th>Kredit</th>
                  <th>Pláss</th>
                  <th>Auglýsingar</th>
                  <th>Bókanir</th>
                  <th>Skráður</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link to={`/users/${u.id}`} className="admin-user">
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                      </Link>
                      <div className="muted" style={{ fontSize: 12 }}>{u.email}{u.city ? ` · ${u.city}` : ""}</div>
                    </td>
                    <td>
                      <span className={`pill ${u.role === "admin" ? "pill-admin" : ""}`}>{u.role === "admin" ? "Stjórnandi" : "Notandi"}</span>
                    </td>
                    <td>{fmt(u.credit_balance)}</td>
                    <td>{fmt(u.extra_slots)}</td>
                    <td>{fmt(u.listings)}</td>
                    <td>{fmt(u.bookings)}</td>
                    <td className="muted">{shortDate(u.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline"
                        disabled={busyId === u.id || u.id === user.id}
                        onClick={() => changeRole(u)}
                      >
                        {busyId === u.id ? "…" : u.role === "admin" ? "Minnka" : "Gera stjórnanda"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={8} className="muted">Engir notendur fundust.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {usersTotal > 25 && (
            <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
              <button className="btn btn-outline btn-sm" disabled={userPage <= 1} onClick={() => { const p = userPage - 1; setUserPage(p); loadUsers(p, q, roleFilter); }}>← Fyrri</button>
              <span className="muted">Síða {userPage} / {Math.ceil(usersTotal / 25)}</span>
              <button className="btn btn-outline btn-sm" disabled={userPage >= Math.ceil(usersTotal / 25)} onClick={() => { const p = userPage + 1; setUserPage(p); loadUsers(p, q, roleFilter); }}>Næsta →</button>
            </div>
          )}
        </>
      )}

      {!loading && tab === "log" && (
        <>
          <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <select
              className="admin-select"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); loadActions(e.target.value); }}
            >
              <option value="">Allar tegundir</option>
              <option value="user.">Hlutverk</option>
              <option value="credit.">Kredit</option>
            </select>
            <span className="muted">{fmt(actionsTotal)} færslur</span>
          </div>

          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tími</th>
                  <th>Gerandinn</th>
                  <th>Aðgerð</th>
                  <th>Markmið</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id}>
                    <td className="muted">{shortDate(a.created_at)}</td>
                    <td>
                      {a.admin_id ? (a.admin_email || a.admin_id) : <span className="muted">kerfið</span>}
                      {a.admin_first || a.admin_last ? <div className="muted" style={{ fontSize: 12 }}>{`${a.admin_first || ""} ${a.admin_last || ""}`.trim()}</div> : null}
                    </td>
                    <td><strong>{actionLabel(a.action)}</strong><div className="muted" style={{ fontSize: 12 }}>{a.action}</div></td>
                    <td>
                      {a.target_type === "user" && a.target_id ? <Link to={`/users/${a.target_id}`}>notandi #{a.target_id}</Link> : (a.target_type ? `${a.target_type} #${a.target_id}` : "—")}
                      {a.data ? <div className="muted" style={{ fontSize: 12 }}>{JSON.stringify(a.data)}</div> : null}
                    </td>
                    <td className="muted">{a.ip || "—"}</td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr><td colSpan={5} className="muted">Engar færslur ennþá.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
