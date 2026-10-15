import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../api";
import { useAuth } from "../store";

const TIERS = [
  { key: "silver", label: "Silfur", credits: 150, days: 7 },
  { key: "gold", label: "Gull", credits: 590, days: 14 },
  { key: "platinum", label: "Platína", credits: 1250, days: 30 },
];
const TIER_LABEL = { silver: "Silfur", featured: "Silfur", gold: "Gull", platinum: "Platína" };

const ADDON_ROWS = [
  { key: "highlight", label: "Áberandi auglýsing" },
  { key: "link", label: "Tengill á skráningu" },
  { key: "video", label: "Myndband" },
];

const activePromo = (l) => !!l.promotionUntil && new Date(l.promotionUntil).getTime() > Date.now();
const activeGolden = (l) => !!l.goldenUntil && new Date(l.goldenUntil).getTime() > Date.now();

export default function MyListingsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPromo, setOpenPromo] = useState(null);
  const [pickTier, setPickTier] = useState("platinum");
  const [busyPromo, setBusyPromo] = useState("");
  const [credits, setCredits] = useState(null);
  const [addonDraft, setAddonDraft] = useState({
    highlight: false, link: false, video: false, linkUrl: "", videoUrl: "",
  });

  const load = () => {
    api.get("/api/dashboard/owner/listings").then((d) => setRows(d.listings)).catch(() => []).finally(() => setLoading(false));
  };
  const loadCredits = () => {
    api.get("/api/credits").then(setCredits).catch(() => {});
  };
  useEffect(() => { load(); loadCredits(); }, []);

  const del = async (l) => {
    if (!window.confirm(`Eyða "${l.title}"?`)) return;
    try {
      await api.del(`/api/listings/${l.id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const promote = async (l) => {
    setBusyPromo("boost");
    try {
      const res = await api.post("/api/credits/boost", { listingId: l.id, tier: pickTier });
      if (res.golden) alert("Gyllt uppgradering! Auglýsingin þín verður gyllt ofan á valinn pakka.");
      setOpenPromo(null);
      load();
      loadCredits();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyPromo("");
    }
  };

  const removePromo = async (l) => {
    if (!window.confirm("Fjarlægja kynningu af þessari skráningu?")) return;
    try {
      await api.del(`/api/listings/${l.id}/promote`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const renew = async (l) => {
    setBusyPromo("renew");
    try {
      await api.post("/api/credits/renew", { listingId: l.id });
      setOpenPromo(null);
      load();
      loadCredits();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyPromo("");
    }
  };

  const buyAddons = async (l) => {
    const body = { listingId: l.id };
    if (addonDraft.highlight) body.highlight = true;
    if (addonDraft.link) {
      body.link = true;
      body.linkUrl = addonDraft.linkUrl.trim();
    }
    if (addonDraft.video) {
      body.video = true;
      body.videoUrl = addonDraft.videoUrl.trim();
    }
    if (!body.highlight && !body.link && !body.video) {
      alert("Veldu a.m.k. eina viðbót.");
      return;
    }
    if ((body.link && !body.linkUrl) || (body.video && !body.videoUrl)) {
      alert("Sláðu inn slóð fyrir valda viðbót.");
      return;
    }
    setBusyPromo("addons");
    try {
      await api.post("/api/credits/addons", body);
      setOpenPromo(null);
      setAddonDraft({ highlight: false, link: false, video: false, linkUrl: "", videoUrl: "" });
      load();
      loadCredits();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyPromo("");
    }
  };

  const togglePromo = (l) => {
    if (openPromo !== l.id) setAddonDraft({ highlight: false, link: false, video: false, linkUrl: "", videoUrl: "" });
    setOpenPromo(openPromo === l.id ? null : l.id);
  };

  const renewCost = (l) => credits?.renewCosts?.[l.promotionTier];
  const addonPrice = (k) => credits?.addons?.[k]?.credits ?? 0;
  const goldenProgress = credits
    ? `${credits.recentBoosts || 0}/${credits.goldenRequired || 10}`
    : "";

  return (
    <div className="container section" style={{ maxWidth: 880 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <h1 className="mt0">Skráningar mínar</h1>
        <Link className="btn btn-primary" to="/dashboard/listings/new">+ Ný skráning</Link>
      </div>

      {loading ? <div className="empty">Hleður…</div>
        : rows.length === 0 ? (
            <div className="empty">
              <h3>Engar skráningar ennþá</h3>
              <p>Skráðu hlutina þína og byrjaðu að græða.</p>
            </div>
          ) : (
            <ul className="plain-list">
              {rows.map((l) => (
                <React.Fragment key={l.id}>
                  <li>
                    {l.mainImage ? <img src={l.mainImage} alt="" /> : <div className="img-placeholder" style={{ width: 56, height: 42 }}>I</div>}
                    <div className="grow">
                      <div className="title">
                        <Link to={`/listing/${l.slug}`}>{l.title}</Link>
                        {activeGolden(l) && <span className="badge badge-golden">Gyllt</span>}
                        {l.promotionTier &&
                          l.promotionTier !== "none" && (
                            <span className={`badge badge-tier badge-${l.promotionTier === "featured" ? "silver" : l.promotionTier}`}>
                              {TIER_LABEL[l.promotionTier]}
                            </span>
                          )}
                        {l.addonHighlight && activePromo(l) && !activeGolden(l) && (
                          <span className="badge badge-hl">Áberandi</span>
                        )}
                      </div>
                      <div className="sub">
                        {l.categoryName} · {formatPrice(l.priceDaily || l.priceHourly, l.currency)}/{l.priceDaily ? "dag" : "klst"}
                        {l.depositAmount > 0 && ` · trygging ${formatPrice(l.depositAmount, l.currency)}`}
                      </div>
                      <div className="sub">{l.viewCount} skoðanir · {l.favoriteCount} vistuð</div>
                    </div>
                    <span className={`status-pill status-${l.status}`}>{l.status}</span>
                    <div className="row">
                      <Link className="btn btn-outline btn-sm" to={`/dashboard/calendar/${l.id}`}>Dagatal</Link>
                      <Link className="btn btn-outline btn-sm" to={`/dashboard/listings/${l.id}`}>Breyta</Link>
                      <button
                        className={`btn btn-sm ${l.promotionTier && l.promotionTier !== "none" ? "btn-gold" : "btn-outline"}`}
                        onClick={() => togglePromo(l)}
                      >
                        {l.promotionTier && l.promotionTier !== "none" ? `★ ${TIER_LABEL[l.promotionTier]}` : "Premium ↑"}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(l)}>Eyða</button>
                    </div>
                  </li>
                  {openPromo === l.id && (
                    <li className="promo-panel">
                      <div className="promo-head">
                        <strong>{activePromo(l) ? `Stjórna kynningu “${l.title}”` : `Efla “${l.title}”`}</strong>
                        <button className="btn btn-sm" onClick={() => setOpenPromo(null)}>✕</button>
                      </div>

                      <div className="promo-tiers">
                        {TIERS.map((t) => (
                          <button
                            key={t.key}
                            className={`promo-opt promo-opt-${t.key} ${pickTier === t.key ? "active" : ""}`}
                            onClick={() => setPickTier(t.key)}
                          >
                            <strong>{t.label}</strong>
                            <span className="muted">{t.credits} kredit · {t.days} dagar</span>
                          </button>
                        ))}
                      </div>
                      <div className="promo-actions">
                        <button className="btn btn-primary" disabled={!!busyPromo} onClick={() => promote(l)}>
                          {busyPromo === "boost" ? "Virkja…" : `Virkja ${TIERS.find((t) => t.key === pickTier)?.label}`}
                        </button>
                        {activePromo(l) && (
                          <button className="btn btn-gold" disabled={!!busyPromo} onClick={() => renew(l)}>
                            {busyPromo === "renew" ? "Endurnýja…" : `Obnova · ${renewCost(l) ?? "—"} kredit`}
                          </button>
                        )}
                        {activePromo(l) && (
                          <button className="btn btn-outline" disabled={!!busyPromo} onClick={() => removePromo(l)}>Fjarlægja kynningu</button>
                        )}
                      </div>
                      {activePromo(l) && (
                        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                          Kynning gildir til {new Date(l.promotionUntil).toLocaleDateString("is-IS")}. Obnova endurstillir tímabilið að fullu og heldur skoðunum.
                          {activeGolden(l) && " Gyllt auglýsing er virk ofan á kynningu."}
                        </p>
                      )}
                      {!activePromo(l) && (
                        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                          Viðbætur og Obnova eru aðeins í boði með virkri kynningu.
                        </p>
                      )}

                      <div className="promo-subhead">Viðbætur (einskiptis, virka meðan kynning stendur)</div>
                      <div className="promo-addons">
                        {ADDON_ROWS.map((a) => {
                          const already =
                            (a.key === "highlight" && l.addonHighlight) ||
                            (a.key === "link" && !!l.addonLink) ||
                            (a.key === "video" && !!l.addonVideo);
                          const disabled = !activePromo(l) || already;
                          return (
                            <div key={a.key} className="vis-addon">
                              <label className="row" style={{ cursor: disabled ? "default" : "pointer", gap: 8, margin: 0, opacity: disabled ? 0.6 : 1 }}>
                                <input
                                  type="checkbox"
                                  disabled={disabled}
                                  checked={already || !!addonDraft[a.key]}
                                  onChange={(e) => setAddonDraft((s) => ({ ...s, [a.key]: e.target.checked }))}
                                />
                                <span>
                                  <strong>{a.label}</strong>{" "}
                                  <span className="muted">· {addonPrice(a.key)} kredit{already ? " · virkt" : ""}</span>
                                </span>
                              </label>
                              {a.key === "link" && addonDraft.link && (
                                <input
                                  type="url"
                                  style={{ marginTop: 6, marginLeft: 26, width: "calc(100% - 26px)" }}
                                  placeholder="https://…"
                                  value={addonDraft.linkUrl}
                                  onChange={(e) => setAddonDraft((s) => ({ ...s, linkUrl: e.target.value }))}
                                />
                              )}
                              {a.key === "video" && addonDraft.video && (
                                <input
                                  type="url"
                                  style={{ marginTop: 6, marginLeft: 26, width: "calc(100% - 26px)" }}
                                  placeholder="https://www.youtube.com/watch?v=…"
                                  value={addonDraft.videoUrl}
                                  onChange={(e) => setAddonDraft((s) => ({ ...s, videoUrl: e.target.value }))}
                                />
                              )}
                            </div>
                          );
                        })}
                        <div className="promo-actions">
                          <button
                            className="btn btn-outline"
                            disabled={!activePromo(l) || !!busyPromo}
                            onClick={() => buyAddons(l)}
                          >
                            {busyPromo === "addons" ? "Kaupi…" : "Kaupa viðbætur"}
                          </button>
                        </div>
                      </div>

                      <div className="promo-subhead">Gyllt uppgradering</div>
                      <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                        {activeGolden(l)
                          ? `Gyllt til ${new Date(l.goldenUntil).toLocaleDateString("is-IS")} — efst í öllum leitum.`
                          : `Eftir ${goldenProgress} keypta boost á síðustu 30 dögum fæst næsta boost ókeypis sem gyllt auglýsing.`}
                      </p>
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ul>
          )}
    </div>
  );
}
