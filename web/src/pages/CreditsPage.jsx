import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store";
import { useLang } from "../i18n";

const PKG_ORDER = ["litill", "vinsaell", "stor", "fyrirtaeki"];
const BOOST_ORDER = ["silver", "gold", "platinum"];

export default function CreditsPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) refresh();
  }, [user, refresh]);
  useEffect(() => {
    if (!user) navigate("/login?next=/dashboard/credits");
  }, [user, navigate]);
  if (!user) return null;
  return <Credits />;
}

function Credits() {
  const { t } = useLang();
  const { refresh } = useAuth();
  const [data, setData] = useState(null);
  const [listings, setListings] = useState([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [slotCount, setSlotCount] = useState(1);
  const [selectedListing, setSelectedListing] = useState("");
  const [tier, setTier] = useState("silver");

  const load = () => api.get("/api/credits").then(setData).catch(() => {});
  useEffect(() => {
    load();
    api.get("/api/dashboard/owner/listings").then((d) => setListings(d.listings || [])).catch(() => {});
  }, []);

  const run = async (key, fn) => {
    setBusy(key); setMsg(""); setError("");
    try {
      await fn();
      await load();
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const purchase = (packageId) =>
    run(`pkg-${packageId}`, async () => {
      await api.post("/api/credits/purchase", { packageId });
      setMsg(t("credit.dash.bought"));
    });

  const buySlots = () =>
    run("slots", async () => {
      await api.post("/api/credits/slots", { count: Number(slotCount) });
      setMsg(t("credit.dash.bought"));
    });

  const boost = () =>
    run("boost", async () => {
      if (!selectedListing) throw new Error("Veldu auglýsingu");
      await api.post("/api/credits/boost", { listingId: Number(selectedListing), tier });
      setMsg(t("credit.dash.boosted"));
    });

  const balance = data?.balance ?? 0;
  const extraSlots = data?.extraSlots ?? 0;

  return (
    <section className="section">
      <div className="container">
        <h1>{t("credit.dash.title")}</h1>

        <div className="dash-grid" style={{ marginTop: 8 }}>
          <div className="stat-card">
            <div className="stat-num">{balance}</div>
            <div className="stat-label">{t("credit.dash.myBalance")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{3 + extraSlots}</div>
            <div className="stat-label">Auglýsingapláss</div>
          </div>
        </div>

        {msg && <div className="alert alert-success" style={{ margin: "14px 0" }}>{msg}</div>}
        {error && <div className="alert alert-error" style={{ margin: "14px 0" }}>{error}</div>}

        <h2 style={{ fontSize: 19 }}>{t("credit.dash.buy")}</h2>
        <div className="plans-grid">
          {PKG_ORDER.map((id) => {
            const p = data?.packages?.[id];
            if (!p) return null;
            const popular = id === "vinsaell";
            return (
              <div key={id} className={`plan-card plan-${popular ? "gold" : "free"}`}>
                {popular && <div className="plan-ribbon">{t("credit.pk.popular")}</div>}
                <h3 className="plan-name">{p.label}</h3>
                <div className="plan-price">
                  <strong>{p.credits}</strong>
                  <span className="plan-unit">{t("credit.pk.kredit")}</span>
                </div>
                <div className="credit-price">{p.price} {t("credit.pk.currency")}</div>
                <div className="credit-per">
                  {Math.round(p.price / p.credits)} {t("credit.pk.perKredit")}
                </div>
                <button
                  className={`btn ${popular ? "btn-primary" : "btn-outline"} btn-block`}
                  disabled={busy === `pkg-${id}`}
                  onClick={() => purchase(id)}
                >
                  {busy === `pkg-${id}` ? "..." : t("credit.pk.buy")}
                </button>
              </div>
            );
          })}
        </div>

        <h2 style={{ fontSize: 19, marginTop: 40 }}>Varanleg aukapláss</h2>
        <div className="credit-step">
          <p className="muted" style={{ marginTop: 0 }}>{t("credit.credit.text")}</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              min="1"
              max="50"
              value={slotCount}
              onChange={(e) => setSlotCount(e.target.value)}
              style={{ width: 90 }}
            />
            <button className="btn btn-primary" disabled={busy === "slots"} onClick={buySlots}>
              {busy === "slots" ? "..." : `${t("credit.dash.buy")} (${slotCount} kredit)`}
            </button>
          </div>
        </div>

        <h2 style={{ fontSize: 19, marginTop: 40 }}>{t("credit.dash.boostListing")}</h2>
        <div className="credit-step">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <select value={selectedListing} onChange={(e) => setSelectedListing(e.target.value)} style={{ minWidth: 240 }}>
              <option value="">— Veldu auglýsingu —</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            <select value={tier} onChange={(e) => setTier(e.target.value)}>
              {BOOST_ORDER.map((k) => {
                const b = data?.boosts?.[k];
                return <option key={k} value={k}>{b ? `${b.label} — ${b.credits} kredit / ${b.days} dagar` : k}</option>;
              })}
            </select>
            <button className="btn btn-primary" disabled={busy === "boost"} onClick={boost}>
              {busy === "boost" ? "..." : t("credit.dash.boostListing")}
            </button>
          </div>
          <p className="muted" style={{ margin: 0 }}>{t("credit.boostPage.sub")}</p>
        </div>

        <h2 style={{ fontSize: 19, marginTop: 40 }}>{t("credit.dash.history")}</h2>
        {(!data?.transactions || data.transactions.length === 0) ? (
          <p className="muted">{t("credit.dash.noHistory")}</p>
        ) : (
          <ul className="plain-list">
            {data.transactions.map((tx) => (
              <li key={tx.id}>
                <div className="grow">
                  <div className="title">{tx.description}</div>
                  <div className="sub">{String(tx.createdAt).slice(0, 10)}</div>
                </div>
                <span className={`status-pill status-${tx.amount > 0 ? "active" : "completed"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount} {t("credit.dash.credits")}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p style={{ marginTop: 26 }}>
          <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
        </p>
      </div>
    </section>
  );
}
