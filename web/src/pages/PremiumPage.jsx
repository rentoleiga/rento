import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";
import { useAuth } from "../store";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const SLOT_PRICE = 490;
const PACKAGES = [
  { id: "pkg3", slots: 3, amount: 1290, per: 430, popular: false },
  { id: "pkg5", slots: 5, amount: 1990, per: 398, popular: true },
  { id: "pkg10", slots: 10, amount: 3490, per: 349, popular: false },
];
const TIERS = [
  { key: "silver", amount: 1290, days: 7, features: ["adv.f.silverMarked", "adv.f.silverRank"] },
  { key: "gold", amount: 1990, days: 14, features: ["adv.f.goldAll", "adv.f.goldRank", "adv.f.goldHome"] },
  { key: "platinum", amount: 2990, days: 30, features: ["adv.f.platAll", "adv.f.platRank", "adv.f.platZone"] },
];

const isActive = (l) =>
  l.status === "published" && (!l.expiresAt || new Date(l.expiresAt).getTime() > Date.now());

const fmtDate = (d) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
};

const promotionLabel = (l) => {
  if (!l.promotionTier || !l.promotionUntil) return "";
  if (new Date(l.promotionUntil).getTime() <= Date.now()) return "";
  return `Kynnt til ${fmtDate(l.promotionUntil)}`;
};

export default function PremiumPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [pickId, setPickId] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const loadListings = () =>
    api
      .get("/api/dashboard/owner/listings")
      .then((d) => {
        const active = (d.listings || []).filter(isActive);
        setListings(active);
        setPickId((prev) => (active.some((l) => String(l.id) === prev) ? prev : String(active[0]?.id || "")));
      })
      .catch(() => {});

  useEffect(() => {
    if (!user) return;
    loadListings();
  }, [user]);

  const needLogin = () => navigate("/login?next=/promote");

  const buySlot = async () => {
    setNotice("");
    setError("");
    if (!user) return needLogin();
    if (!window.confirm(`Kaupa 1 auglýsingapláss fyrir ${fmt(SLOT_PRICE)} kr.? Plássið gildir í 30 daga frá notkun.`)) return;
    setBusy("slots");
    try {
      const r = await api.post("/api/slots/purchase", { count: 1, code: code.trim() });
      setNotice(`${r.slots} pláss keypt · ${fmt(r.amount)} kr.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const buyPackage = async (pkg) => {
    setNotice("");
    setError("");
    if (!user) return needLogin();
    if (!window.confirm(`Kaupa ${pkg.slots} auglýsingapláss fyrir ${fmt(pkg.amount)} kr.?`)) return;
    setBusy(pkg.id);
    try {
      const r = await api.post("/api/slots/purchase", { packageId: pkg.id, code: code.trim() });
      setNotice(`${r.slots} pláss keypt · ${fmt(r.amount)} kr.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const promote = async (tier) => {
    setNotice("");
    setError("");
    if (!user) return needLogin();
    if (!pickId) {
      setError("Veldu auglýsingu fyrst.");
      return;
    }
    const chosen = listings.find((l) => String(l.id) === String(pickId));
    const extend = chosen && promotionLabel(chosen);
    const tierName = t(`credit.boost.${tier.key}`);
    const msg = extend
      ? `Framlengja ${tierName.toLowerCase()} kynningu um ${tier.days} daga fyrir ${fmt(tier.amount)} kr.? Núverandi kynning gildir til ${fmtDate(chosen.promotionUntil)}.`
      : `Kaupa ${tierName.toLowerCase()} kynningu í ${tier.days} daga fyrir ${fmt(tier.amount)} kr.?`;
    if (!window.confirm(msg)) return;
    setBusy(tier.key);
    try {
      const r = await api.post(`/api/listings/${pickId}/promote`, { tier: tier.key, code: code.trim() });
      setNotice(`${tierName} kynning virkjuð · ${fmt(r.paid != null ? r.paid : tier.amount)} kr.`);
      loadListings();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <section className="hero hero-premium">
        <div className="container">
          <span className="adv-badge">{t("adv.badge")}</span>
          <h1>{t("adv.hero.title")}</h1>
          <p>{t("adv.hero.sub")}</p>
          <div className="credit-stats">
            <div className="credit-stat"><strong>0%</strong><span>{t("adv.stat.commission")}</span></div>
            <div className="credit-stat"><strong>3</strong><span>{t("adv.stat.free")}</span></div>
            <div className="credit-stat"><strong>30</strong><span>{t("adv.stat.days")}</span></div>
          </div>
          <a href="#plass" className="btn btn-primary">{t("adv.hero.cta")}</a>
        </div>
      </section>

      {(notice || error) && (
        <div className="container" style={{ marginTop: 18 }}>
          {notice && <div className="form-success">{notice}</div>}
          {error && <div className="form-error">{error}</div>}
        </div>
      )}

      <section className="section" id="plass">
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <h2>{t("adv.slots.title")}</h2>
            <p className="muted" style={{ margin: "8px 0 0", maxWidth: 760 }}>{t("adv.slots.sub")}</p>
          </div>

          <div className="row" style={{ justifyContent: "center", marginTop: 20, gap: 8 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Promókóði (valfrjálst)"
              style={{ maxWidth: 220 }}
            />
          </div>

          <div className="adv-grid" style={{ marginTop: 28 }}>
            <div className="plan-card plan-free">
              <h3 className="plan-name">{t("adv.single.title")}</h3>
              <div className="credit-per">{t("adv.single.sub")}</div>
              <div className="plan-price">
                <strong>{fmt(SLOT_PRICE)}</strong>
                <span className="plan-unit">kr.</span>
              </div>
              <div className="credit-price">{t("adv.single.unit")}</div>
              <ul className="plan-features">
                <li><span className="plan-check">✓</span><span>{t("adv.f.days")}</span></li>
                <li><span className="plan-check">✓</span><span>{t("adv.f.keep")}</span></li>
                <li><span className="plan-check">✓</span><span>{t("adv.f.noSub")}</span></li>
              </ul>
              <button className="btn btn-outline btn-block" disabled={!!busy} onClick={buySlot}>
                {busy === "slots" ? "…" : t("adv.buy.slot")}
              </button>
            </div>

            {PACKAGES.map((p) => (
              <div key={p.id} className={`plan-card plan-${p.popular ? "gold" : "free"}`}>
                {p.popular && <div className="plan-ribbon">{t("adv.popular")}</div>}
                <h3 className="plan-name">{t(`adv.pkg.${p.id}`)}</h3>
                <div className="credit-per">{t(`adv.pkg.slots`).replace("{n}", p.slots)}</div>
                <div className="plan-price">
                  <strong>{fmt(p.amount)}</strong>
                  <span className="plan-unit">kr.</span>
                </div>
                <div className="credit-price">{fmt(p.per)} kr. á pláss</div>
                <ul className="plan-features">
                  <li><span className="plan-check">✓</span><span>{t("adv.f.days")}</span></li>
                  <li><span className="plan-check">✓</span><span>{t("adv.f.keep")}</span></li>
                  <li><span className="plan-check">✓</span><span>{t("adv.f.noSub")}</span></li>
                </ul>
                <button
                  className={`btn ${p.popular ? "btn-primary" : "btn-outline"} btn-block`}
                  disabled={!!busy}
                  onClick={() => buyPackage(p)}
                >
                  {busy === p.id ? "…" : t("adv.buy.pkg")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-flush" style={{ background: "#f6f8f7" }}>
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <h2>{t("adv.how.title")}</h2>
          </div>
          <div className="credit-steps">
            <div className="credit-step">
              <span className="credit-step-n">1</span>
              <h3>{t("adv.how.1t")}</h3>
              <p className="muted">{t("adv.how.1")}</p>
              <span className="adv-tag">{t("adv.how.1tag")}</span>
            </div>
            <div className="credit-step">
              <span className="credit-step-n">2</span>
              <h3>{t("adv.how.2t")}</h3>
              <p className="muted">{t("adv.how.2")}</p>
              <span className="adv-tag">{t("adv.how.2tag")}</span>
            </div>
            <div className="credit-step">
              <span className="credit-step-n">3</span>
              <h3>{t("adv.how.3t")}</h3>
              <p className="muted">{t("adv.how.3")}</p>
              <span className="adv-tag">{t("adv.how.3tag")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-flush" style={{ background: "#0f2b24", color: "#e6f6f0" }}>
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <span className="adv-badge adv-badge-light">{t("adv.boost.badge")}</span>
            <h2 style={{ color: "#fff" }}>{t("adv.boost.title")}</h2>
            <p style={{ margin: "8px 0 0", maxWidth: 700, color: "#bfe3d8" }}>{t("adv.boost.sub")}</p>
          </div>

          {user && listings.length > 0 ? (
            <div className="adv-pick">
              <label style={{ color: "#bfe3d8" }}>{t("adv.boost.pick")}</label>
              <select value={pickId} onChange={(e) => setPickId(e.target.value)}>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}{promotionLabel(l) ? ` — ${promotionLabel(l)}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="muted" style={{ textAlign: "center", marginTop: 14, color: "#bfe3d8" }}>
              {t("adv.boost.none")}{" "}
              <Link to="/dashboard/listings/new" style={{ color: "#fff", textDecoration: "underline" }}>
                {t("adv.cta.btn")}
              </Link>
            </p>
          )}

          <div className="plans-grid" style={{ marginTop: 28 }}>
            {TIERS.map((tier) => (
              <div key={tier.key} className={`plan-card plan-${tier.key}`}>
                <h3 className="plan-name">{t(`credit.boost.${tier.key}`)}</h3>
                <div className="plan-price">
                  <strong>{fmt(tier.amount)}</strong>
                  <span className="plan-unit">kr.</span>
                </div>
                <div className="credit-price">{t(`adv.days.${tier.days}`)}</div>
                <ul className="plan-features">
                  {tier.features.map((k) => (
                    <li key={k}><span className="plan-check">✓</span><span>{t(k)}</span></li>
                  ))}
                </ul>
                <button
                  className="btn btn-primary btn-block"
                  disabled={!!busy || (!!user && !listings.length)}
                  onClick={() => promote(tier)}
                >
                  {busy === tier.key ? "…" : `${t("adv.buyTier")} ${t(`credit.boost.${tier.key}`)}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="detail-section" style={{ textAlign: "center" }}>
            <h2>{t("adv.cta.title")}</h2>
            <p className="muted">{t("adv.cta.sub")}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
              <Link to="/dashboard/listings/new" className="btn btn-primary">{t("adv.cta.btn")}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
