import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getToken } from "../api";
import { useAuth } from "../store";

const STEPS = ["Myndir", "Grunnupplýsingar", "Verð", "Staðsetning", "Yfirlit"];

const initial = {
  title: "", subtitle: "", description: "",
  categoryId: "", subcategoryId: "",
  currency: "ISK",
  priceHourly: "", priceDaily: "", priceWeekly: "", priceMonthly: "",
  minimumDuration: 1, minimumDurationUnit: "day",
  depositAmount: 0, cleaningFee: 0, deliveryFee: 0, pickupFee: 0, extraFee: 0,
  city: "Reykjavík", region: "", municipality: "", address: "", postcode: "",
  latitude: "", longitude: "",
  instantBooking: false, pickupAvailable: true, deliveryAvailable: false,
  smokingAllowed: false, petsAllowed: false, minAge: 0,
  cancellationPolicy: "moderate", condition: "good",
  usageRestrictions: "",
  phone: "", phoneVisibility: false,
  attributes: {},
  mainImage: "", gallery: [],
};

const NUMERIC_CONVERT = [
  "priceHourly", "priceDaily", "priceWeekly", "priceMonthly",
  "depositAmount", "cleaningFee", "deliveryFee", "pickupFee", "extraFee",
  "latitude", "longitude",
];

const STEP_OF = {
  title: 1, subtitle: 1, description: 1, categoryId: 1, subcategoryId: 1,
  priceHourly: 2, priceDaily: 2, priceWeekly: 2, priceMonthly: 2,
  minimumDuration: 2, minimumDurationUnit: 2,
  depositAmount: 2, cleaningFee: 2, deliveryFee: 2, pickupFee: 2,
  city: 3, region: 3, postcode: 3, address: 3,
  minAge: 1, cancellationPolicy: 1, condition: 1, usageRestrictions: 1,
};

const LABELS = {
  title: "Titill",
  description: "Lýsing",
  categoryId: "Flokkur",
  subcategoryId: "Undirflokkur",
  city: "Borg/bær",
  phone: "Símanúmer",
  priceHourly: "Verð á klst.",
  priceDaily: "Verð á dag",
  priceWeekly: "Verð á viku",
  priceMonthly: "Verð á mánuði",
  depositAmount: "Trygging",
  cleaningFee: "Þrifgjald",
  deliveryFee: "Afhendingargjald",
  pickupFee: "Sóknargjald",
  minimumDuration: "Lágmarkstími",
  minAge: "Lágmarksaldur",
};

function msg(field, text) {
  return `${LABELS[field] || field}: ${text}`;
}

const COORDS = { latitude: [-90, 90], longitude: [-180, 180] };

function hasContent(f, v) {
  if (f === "categoryId" || f === "subcategoryId") return Number(v) > 0;
  return v !== "" && v !== null && v !== undefined;
}

// Returns a friendly message string, or null if the field is valid.
function ruleFor(f, v) {
  if (f === "title") {
    if (typeof v !== "string" || v.trim().length < 3) return msg(f, "Sláðu inn að minnsta kosti 3 stafi.");
  }
  if (f === "description") {
    if (typeof v !== "string" || v.trim().length < 20) return msg(f, "Sláðu inn að minnsta kosti 20 stafi.");
  }
  if (f === "city") {
    if (typeof v !== "string" || !v.trim()) return msg(f, "Borg/bær er nauðsynleg.");
  }
  if (f === "categoryId" || f === "subcategoryId") {
    if (Number(v) <= 0) return msg(f, "Veldu valkost úr listanum.");
  }
  if (NUMERIC_CONVERT.includes(f)) {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    if (Number.isNaN(n)) return msg(f, "Sláðu inn gilt númer.");
    if (n < 0) return msg(f, "Verður að vera 0 eða meira.");
    if (COORDS[f] && (n < COORDS[f][0] || n > COORDS[f][1]))
      return msg(f, `Verður að vera á milli ${COORDS[f][0]} og ${COORDS[f][1]}.`);
    return null;
  }
  return null;
}

export default function ListingFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(initial);
  const [attrRows, setAttrRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldOk, setFieldOk] = useState({});
  const [doneSteps, setDoneSteps] = useState({});
  const [errorSteps, setErrorSteps] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k, v) => set(k, v === "" ? null : Number(v));

  const touch = (k, v) => {
    const msg = ruleFor(k, v);
    if (msg) {
      setFieldErrors((fe) => (fe[k] ? { ...fe, [k]: msg } : fe));
      setFieldOk((ok) => {
        if (!ok[k]) return ok;
        const { [k]: _, ...rest } = ok;
        return rest;
      });
    } else {
      setFieldErrors((fe) => {
        if (!fe[k]) return fe;
        const { [k]: _, ...rest } = fe;
        return rest;
      });
      if (hasContent(k, v)) setFieldOk((ok) => ({ ...ok, [k]: true }));
    }
  };

  const onChange = (k, handler) => (e) => {
    handler(e);
    touch(k, e.target.value);
  };

  useEffect(() => {
    api.get("/api/categories/all").then((d) => setCats(d.categories || [])).catch(() => {});
    if (id) {
      api.get(`/api/listings/${id}`)
        .then((d) => {
          const l = d.listing;
          const f = { ...initial };
          Object.keys(initial).forEach((k) => {
            if (l[k] === undefined || l[k] === null) return;
            let v = l[k];
            if (NUMERIC_CONVERT.includes(k) && typeof v === "string" && v !== "" && !Number.isNaN(Number(v)))
              v = Number(v);
            f[k] = v;
          });
          setForm(f);
          setAttrRows(Object.entries(l.attributes || {}).map(([k, v]) => ({ k, v: String(v) })));
        })
        .catch((e) => setError(e.message));
    }
  }, [id]);

  if (!user || !user.ownerEnabled) {
    return (
      <div className="form-card">
        <h1>Þarf aðgang eiganda</h1>
        <p className="sub">Virkjaðu „Ég vil skrá hluti mína“ á prófílnum þínum til að búa til skráningar.</p>
        <a className="btn btn-primary btn-block" href="/dashboard">Fara á Mín síða</a>
      </div>
    );
  }

  const topCats = cats.filter((c) => !c.parent_id);
  const subCats = cats.filter((c) => c.parent_id === form.categoryId);

  const uploadFiles = async (files) => {
    const room = 15 - form.gallery.length;
    if (room <= 0) { setError("Hámark 15 myndir."); return; }
    setUploading(true);
    setError("");
    const urls = [];
    for (const file of Array.from(files).slice(0, room)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch("/api/listings/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Upphleðsla mistókst");
        urls.push(d.url);
      } catch (e) {
        setError(e.message);
      }
    }
    setForm((f) => ({ ...f, gallery: [...f.gallery, ...urls], mainImage: f.mainImage || urls[0] || "" }));
    setUploading(false);
  };

  const addAttr = () => setAttrRows((r) => [...r, { k: "", v: "" }]);
  const setAttr = (i, k, v) => setAttrRows((r) => r.map((row, j) => (i === j ? { ...row, [k]: v } : row)));
  const delAttr = (i) => setAttrRows((r) => r.filter((_, j) => j !== i));

  const jumpToField = (firstField) => {
    const targetStep = STEP_OF[firstField];
    if (targetStep !== undefined && targetStep !== step) setStep(targetStep);
    setTimeout(() => {
      const el = document.querySelector(`[data-field="${firstField}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
      }
    }, 100);
  };

  const applyErrors = (errors) => {
    setFieldErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) jumpToField(first);
  };

  const validateAll = () => {
    const errors = {};
    for (const f of Object.keys(STEP_OF)) {
      if (f === "cancellationPolicy" || f === "condition" || f === "usageRestrictions") continue;
      const msg = ruleFor(f, form[f]);
      if (msg) errors[f] = msg;
    }
    return errors;
  };

  const pickupMode = form.pickupAvailable && form.deliveryAvailable ? "both" : form.deliveryAvailable ? "delivery" : "pickup";
  const setPickupMode = (m) => {
    if (m === "pickup") { set("pickupAvailable", true); set("deliveryAvailable", false); }
    else if (m === "delivery") { set("pickupAvailable", false); set("deliveryAvailable", true); }
    else { set("pickupAvailable", true); set("deliveryAvailable", true); }
  };

  const stepErrors = (s) => {
    const errors = {};
    if (s === 1) {
      for (const f of ["title", "description", "categoryId", "subcategoryId", "city"]) {
        const m = ruleFor(f, form[f]);
        if (m) errors[f] = m;
      }
      // city lives on location step but keep here for edit-compat? no - city checked on step 3
      delete errors.city;
    }
    if (s === 2) {
      const prices = [form.priceHourly, form.priceDaily, form.priceWeekly, form.priceMonthly]
        .map(Number).filter((n) => !Number.isNaN(n) && n > 0);
      if (prices.length === 0) errors.priceDaily = msg("priceDaily", "Sláðu inn að minnsta kosti eitt verð.");
      for (const f of ["priceHourly", "priceDaily", "priceWeekly", "priceMonthly", "depositAmount"]) {
        const m = ruleFor(f, form[f]);
        if (m) errors[f] = m;
      }
    }
    if (s === 3) {
      const m = ruleFor("city", form.city);
      if (m) errors.city = m;
      if (form.phoneVisibility && !String(form.phone || "").trim()) errors.phone = msg("phone", "Sláðu inn símanúmer eða feldu það.");
    }
    return errors;
  };

  const goNext = () => {
    const errs = stepErrors(step);
    if (Object.keys(errs).length > 0) {
      setErrorSteps((prev) => ({ ...prev, [step]: true }));
      setDoneSteps((prev) => {
        if (!prev[step]) return prev;
        const next = { ...prev };
        delete next[step];
        return next;
      });
      applyErrors(errs);
      return;
    }
    setErrorSteps((prev) => {
      if (!prev[step]) return prev;
      const next = { ...prev };
      delete next[step];
      return next;
    });
    setDoneSteps((prev) => ({ ...prev, [step]: true }));
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const submit = async (publish) => {
    setBusy(true);
    setError("");
    const local = validateAll();
    if (Object.keys(local).length > 0) {
      const bad = {};
      Object.keys(local).forEach((f) => {
        const s = STEP_OF[f];
        if (s !== undefined && s !== 4) bad[s] = true;
      });
      setErrorSteps((prev) => ({ ...prev, ...bad }));
      applyErrors(local);
      setBusy(false);
      return;
    }
    const attrs = {};
    attrRows.filter((r) => r.k.trim()).forEach((r) => (attrs[r.k.trim()] = r.v));
    const payload = {
      ...form,
      currency: "ISK",
      attributes: attrs,
      categoryId: Number(form.categoryId),
      subcategoryId: Number(form.subcategoryId) || 0,
      minimumDuration: Number(form.minimumDuration) || 1,
      publish,
    };
    NUMERIC_CONVERT.forEach((k) => {
      const v = payload[k];
      if (v === "" || v === null || v === undefined) payload[k] = null;
      else payload[k] = Number(v);
    });
    try {
      if (id) await api.put(`/api/listings/${id}`, payload);
      else await api.post("/api/listings", payload);
      setNotice(`${publish ? "Skráning birt" : "Skráning vistuð sem drög"}!`);
      setTimeout(() => navigate("/dashboard/listings"), 1200);
    } catch (e) {
      if (e.data?.details?.length) {
        const mapped = {};
        e.data.details.forEach((c) => {
          if (!c.field) return;
          const msg = ruleFor(c.field, form[c.field]);
          mapped[c.field] = msg || c.message;
        });
        if (Object.keys(mapped).length) {
          applyErrors(mapped);
        } else {
          setError(e.message);
        }
      } else {
        setError(e.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const navBtns = (isLast) => (
    <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
      <button className="btn btn-outline" disabled={step === 0 || busy} onClick={() => { setStep(step - 1); window.scrollTo(0, 0); }}>‹ Til baka</button>
      {!isLast && <button className="btn btn-primary" disabled={busy} onClick={goNext}>Áfram ›</button>}
    </div>
  );

  const message = (f) => fieldErrors[f] || (fieldOk[f] ? "✓" : "");

  return (
    <div className="container section" style={{ maxWidth: 980 }}>
      <h1 className="mt0">{id ? "Breyta skráningu" : "Stofna skráningu"}</h1>
      <p className="muted" style={{ marginTop: -8 }}>Skráðu búnaðinn þinn í nokkrum skrefum — myndir, grunnupplýsingar, verð, staðsetning, yfirlit.</p>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      <div className="wizard-layout">
        <aside className="wizard-steps">
          <div className="wizard-steps-label">SKREF</div>
          {STEPS.map((s, i) => {
            const st = errorSteps[i] ? "err" : doneSteps[i] ? "done" : "";
            return (
              <button key={s} className={`wizard-step ${i === step ? "active" : ""} ${st}`} onClick={() => setStep(i)}>
                <span className="wizard-check">{errorSteps[i] ? "!" : doneSteps[i] ? "✓" : i + 1}</span>
                <span>{s}</span>
              </button>
            );
          })}
        </aside>
        <div className="wizard-card">

      {step === 0 && (
        <>
          <h2 style={{ marginTop: 0 }}>Bæta við myndum</h2>
          <p className="muted" style={{ marginTop: -8 }}>Bættu við allt að 15 myndum af búnaðinum þínum. Fyrsta myndin verður forsíðumynd.</p>
          <label className="dropzone" onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files); }}>
            <span className="dropzone-ic">📷</span>
            <strong>Bæta við myndum af búnaði</strong>
            <small>JPG, PNG, WebP allt að 10 MB</small>
            <span className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Velja myndir</span>
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }} />
          </label>
          <p className="muted small" style={{ textAlign: "center" }}>{form.gallery.length}/15 myndir</p>
          {uploading && <p className="muted">Hleð upp…</p>}
          {form.gallery.length > 0 && (
            <div className="gallery-thumbs" style={{ marginBottom: 16 }}>
              {form.gallery.map((url) => (
                <div key={url} style={{ position: "relative", display: "inline-block" }}>
                  <img src={url} alt="" style={{ width: 96, height: 66, objectFit: "cover", borderRadius: 8, border: url === form.mainImage ? "2px solid var(--primary)" : "none" }} onClick={() => set("mainImage", url)} />
                  <button type="button" className="btn btn-danger btn-sm" style={{ position: "absolute", top: 4, right: 4, padding: "0 6px", fontSize: 11 }}
                    onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url), mainImage: f.mainImage === url ? "" : f.mainImage }))}>×</button>
                </div>
              ))}
            </div>
          )}
          {form.mainImage && <p className="muted" style={{ fontSize: 13 }}>Fyrsta myndin er forsíðumynd — smelltu á hvaða mynd sem er til að gera hana að forsíðumynd.</p>}
          <div className="tip-box tip-info">
            <strong>⛨ Settu ekki símanúmerið þitt á myndir</strong>
            <p className="mb0">Leigjendur sjá númerið þitt á vettvanginum („Sýna númer“ hnappur) — sláðu það inn í reitinn „Símanúmer“ í Staðsetning skrefinu.</p>
          </div>
          <div className="tip-box tip-warn">
            <strong>Ráð fyrir betri myndir:</strong>
            <ul>
              <li>Myndaðu búnaðinn í góðu ljósi</li>
              <li>Sýndu búnaðinn frá nokkrum hliðum</li>
              <li>Hafðu með allan aukabúnað sem fylgir</li>
            </ul>
          </div>
          {navBtns(false)}
        </>
      )}

      {step === 1 && (
        <>
          <h2 style={{ marginTop: 0 }}>Grunnupplýsingar</h2>
          <p className="muted" style={{ marginTop: -8 }}>Lýstu búnaðinum þínum svo fólk finni hann auðveldlega.</p>
          <div className={`field ${fieldErrors.title ? "has-error " : ""}${fieldOk.title ? "is-valid" : ""}`}>
            <label>Titill skráningar *</label>
            <input data-field="title" value={form.title} onChange={(e) => { set("title", e.target.value); touch("title", e.target.value); }}
              placeholder="t.d. Bosch borsvél GBH 2-26" />
            {message("title") && <small className="field-msg">{message("title")}</small>}
          </div>
          <div className={`field ${fieldErrors.description ? "has-error " : ""}${fieldOk.description ? "is-valid" : ""}`}>
            <label>Lýsing *</label>
            <textarea data-field="description" rows={5} value={form.description}
              onChange={(e) => { set("description", e.target.value); touch("description", e.target.value); }}
              placeholder="Lýstu ástandi, hvað fylgir, til hvers það er notað…" />
            <small className="muted">{(form.description || "").trim().length}/20 stafir að lágmarki</small>
            {message("description") && <small className="field-msg">{message("description")}</small>}
          </div>
          <div className="field"><label>Stuttur undirtitill</label>
            <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="t.d. Svefnpláss fyrir 4, fullbúið" /></div>
          <div className="row">
            <div className={`field grow ${fieldErrors.categoryId ? "has-error " : ""}${fieldOk.categoryId ? "is-valid" : ""}`}>
              <label>Flokkur *</label>
              <select data-field="categoryId" value={form.categoryId}
                onChange={(e) => { set("categoryId", Number(e.target.value)); set("subcategoryId", ""); touch("categoryId", e.target.value); touch("subcategoryId", ""); }}>
                <option value="">Veldu flokk</option>
                {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {message("categoryId") && <small className="field-msg">{message("categoryId")}</small>}
            </div>
            <div className={`field grow ${fieldErrors.subcategoryId ? "has-error " : ""}${fieldOk.subcategoryId ? "is-valid" : ""}`}>
              <label>Undirflokkur *</label>
              <select data-field="subcategoryId" value={form.subcategoryId}
                onChange={(e) => { set("subcategoryId", Number(e.target.value)); touch("subcategoryId", e.target.value); }}>
                <option value="">Velja…</option>
                {subCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {message("subcategoryId") && <small className="field-msg">{message("subcategoryId")}</small>}
            </div>
          </div>
          <details className="opt-details">
            <summary>Bókunarreglur (valfrjálst)</summary>
            <div className="row">
              <label className="field grow" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={form.instantBooking} onChange={(e) => set("instantBooking", e.target.checked)} />
                Skyndibókun (þarf ekki samþykki)
              </label>
              <label className="field grow" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={form.smokingAllowed} onChange={(e) => set("smokingAllowed", e.target.checked)} />
                Reykingar leyfðar
              </label>
              <label className="field grow" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={form.petsAllowed} onChange={(e) => set("petsAllowed", e.target.checked)} />
                Dýr leyfð
              </label>
            </div>
            <div className="row">
              <div className="field grow"><label>Lágmarksaldur leigjanda</label>
                <input type="number" min={0} value={form.minAge} onChange={(e) => num("minAge", e.target.value)} /></div>
              <div className="field grow"><label>Afbókunarregla</label>
                <select value={form.cancellationPolicy} onChange={(e) => set("cancellationPolicy", e.target.value)}>
                  <option value="flexible">Sveigjanleg</option><option value="moderate">Miðlungs</option>
                  <option value="strict">Ströng</option><option value="custom">Sérsniðin</option>
                </select></div>
              <div className="field grow"><label>Ástand hlutar</label>
                <select value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                  <option value="new">Nýtt</option><option value="like_new">Eins og nýtt</option>
                  <option value="good">Gott</option><option value="fair">Viðunandi</option>
                </select></div>
            </div>
            <div className="field"><label>Notkunartakmarkanir</label>
              <textarea value={form.usageRestrictions} onChange={(e) => set("usageRestrictions", e.target.value)} placeholder="t.d. Utanvegaakstur bannaður, reykingar bannaðar inni" /></div>
          </details>
          <details className="opt-details">
            <summary>Tæknilupplýsingar (framleiðandi, gerð… — valfrjálst)</summary>
            {attrRows.map((row, i) => (
              <div key={i} className="row" style={{ marginBottom: 8 }}>
                <div className="field grow" style={{ marginBottom: 0 }}>
                  <input placeholder="Nafn, t.d. framleiðandi" value={row.k} onChange={(e) => setAttr(i, "k", e.target.value)} />
                </div>
                <div className="field grow" style={{ marginBottom: 0 }}>
                  <input placeholder="Gildi, t.d. Toyota" value={row.v} onChange={(e) => setAttr(i, "v", e.target.value)} />
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => delAttr(i)}>×</button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addAttr}>+ Bæta við upplýsingu</button>
          </details>
          {navBtns(false)}
        </>
      )}

      {step === 2 && (
        <>
          <h2 style={{ marginTop: 0 }}>Verð og tímabil</h2>
          <p className="muted" style={{ marginTop: -8 }}>Stilltu verð fyrir þau tímabil sem þú vilt bjóða (ISK). Þú getur slegið inn eitt eða fleiri.</p>
          <div className="field"><label>Verð * (sláðu inn að minnsta kosti eitt)</label></div>
          <div className="price-grid">
            <PricingField name="priceHourly" label="Á klst." suffix="ISK/klst" value={form.priceHourly}
              onChange={onChange("priceHourly", (e) => num("priceHourly", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="priceDaily" label="Á dag" suffix="ISK/dag" value={form.priceDaily}
              onChange={onChange("priceDaily", (e) => num("priceDaily", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="priceWeekly" label="Á viku" suffix="ISK/viku" value={form.priceWeekly}
              onChange={onChange("priceWeekly", (e) => num("priceWeekly", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="priceMonthly" label="Á mánuði" suffix="ISK/mán" value={form.priceMonthly}
              onChange={onChange("priceMonthly", (e) => num("priceMonthly", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Trygging (valfrjálst) — ISK</label>
            <input data-field="depositAmount" type="number" min={0} value={form.depositAmount}
              onChange={(e) => num("depositAmount", e.target.value)} placeholder="0" />
            <small className="muted">Upphæð sem leigjandinn skilur eftir sem tryggingu</small>
            {message("depositAmount") && <small className="field-msg">{message("depositAmount")}</small>}
          </div>
          <div className="field">
            <label>Lágmarksleigutími (valfrjálst)</label>
            <div className="row">
              <input type="number" min={0} value={form.minimumDuration} onChange={(e) => set("minimumDuration", e.target.value)} placeholder="t.d. 3" style={{ maxWidth: 120 }} />
              <select value={form.minimumDurationUnit} onChange={(e) => set("minimumDurationUnit", e.target.value)} style={{ flex: 1 }}>
                <option value="hour">Ekkert lágmark</option>
                <option value="hour">klst.</option><option value="day">dagur</option><option value="week">vika</option>
              </select>
            </div>
            <small className="muted">t.d. „Lágm. 3 dagar“ — ekki hægt að leigja skemur</small>
          </div>
          {navBtns(false)}
        </>
      )}

      {step === 3 && (
        <>
          <h2 style={{ marginTop: 0 }}>Staðsetning og afhending</h2>
          <p className="muted" style={{ marginTop: -8 }}>Hvar búnaðurinn er og hvernig afhending fer fram.</p>
          <div className={`field ${fieldErrors.city ? "has-error " : ""}${fieldOk.city ? "is-valid" : ""}`}>
            <label>Staðsetning búnaðar *</label>
            <div className="row">
              <input data-field="city" className="grow" value={form.city}
                onChange={(e) => { set("city", e.target.value); touch("city", e.target.value); }} placeholder="Borg/bær, t.d. Reykjavík" />
              <input className="grow" value={form.postcode} onChange={(e) => set("postcode", e.target.value)} placeholder="Póstnúmer" />
            </div>
            {message("city") && <small className="field-msg">{message("city")}</small>}
          </div>
          <div className="row">
            <div className="field grow"><label>Landshluti</label>
              <input value={form.region} onChange={(e) => set("region", e.target.value)} /></div>
            <div className="field grow"><label>Heimilisfang (sýnilegt öllum)</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          </div>
          <div className={`field ${fieldErrors.phone ? "has-error " : ""}`}>
            <label>Símanúmer (valfrjálst)</label>
            <input data-field="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="t.d. +354 612 3456" />
            <small className="muted">Ef þú slærð það inn geta leigjendur hringt beint í þig</small>
            {message("phone") && <small className="field-msg">{message("phone")}</small>}
          </div>
          <label className="row" style={{ cursor: "pointer", marginBottom: 12 }}>
            <input type="checkbox" checked={form.phoneVisibility} onChange={(e) => set("phoneVisibility", e.target.checked)} />
            Sýna símanúmer á skráningu (sýnilegt öllum)
          </label>
          <div className="field"><label>Hvernig er búnaðurinn afhentur?</label></div>
          <div className="pickup-cards">
            <button type="button" className={`pickup-card ${pickupMode === "pickup" ? "selected" : ""}`} onClick={() => setPickupMode("pickup")}>
              <span className="pickup-ic">📦</span>
              <span><strong>Aðeins sótt</strong><small>Leigjandi sækir búnaðinn á staðinn minn</small></span>
              <span className="pickup-radio" />
            </button>
            <button type="button" className={`pickup-card ${pickupMode === "delivery" ? "selected" : ""}`} onClick={() => setPickupMode("delivery")}>
              <span className="pickup-ic">🚚</span>
              <span><strong>Ég afhendi</strong><small>Ég afhendi búnaðinn á heimilisfang leigjandans</small></span>
              <span className="pickup-radio" />
            </button>
            <button type="button" className={`pickup-card ${pickupMode === "both" ? "selected" : ""}`} onClick={() => setPickupMode("both")}>
              <span className="pickup-ic">🔀</span>
              <span><strong>Bæði</strong><small>Leigjandi velur sókn eða afhendingu</small></span>
              <span className="pickup-radio" />
            </button>
          </div>
          {navBtns(false)}
        </>
      )}

      {step === 4 && (
        <>
          <h2 style={{ marginTop: 0 }}>Yfirlit skráningar</h2>
          <p className="muted" style={{ marginTop: -8 }}>Farðu yfir allt áður en þú birtir.</p>
          <div className="review-card">
            <div className="review-head"><span>📷 Myndir ({form.gallery.length})</span><button className="link-btn" onClick={() => setStep(0)}>✎ Breyta</button></div>
            {form.gallery.length === 0 ? <p className="muted mb0">Engar myndir</p> : (
              <div className="gallery-thumbs" style={{ marginTop: 8 }}>
                {form.gallery.slice(0, 6).map((url) => <img key={url} src={url} alt="" style={{ width: 72, height: 50, objectFit: "cover", borderRadius: 8 }} />)}
              </div>
            )}
          </div>
          <div className="review-card">
            <div className="review-head"><span>📄 Grunnupplýsingar</span><button className="link-btn" onClick={() => setStep(1)}>✎ Breyta</button></div>
            <small className="muted">Titill</small>
            <p style={{ margin: "2px 0 8px", fontWeight: 700 }}>{form.title || "—"}</p>
            <small className="muted">Lýsing</small>
            <p className="mb0" style={{ marginTop: 2 }}>{form.description || "—"}</p>
            <small className="muted">Flokkur</small>
            <p className="mb0" style={{ marginTop: 2 }}>
              {cats.find((c) => c.id === Number(form.categoryId))?.name || "—"}
              {form.subcategoryId ? ` / ${cats.find((c) => c.id === Number(form.subcategoryId))?.name || ""}` : ""}
            </p>
          </div>
          <div className="review-card">
            <div className="review-head"><span>$ Verð</span><button className="link-btn" onClick={() => setStep(2)}>✎ Breyta</button></div>
            <p className="mb0">
              {form.priceDaily ? <span className="price-hl">{form.priceDaily} ISK/dag</span> : ""}
              {[["hour", form.priceHourly, "/klst"], ["day", null, ""], ["week", form.priceWeekly, "/viku"], ["month", form.priceMonthly, "/mán"]]
                .filter(([, v]) => v && Number(v) > 0 && v !== form.priceDaily)
                .map(([u, v, sfx]) => <span key={u} className="muted" style={{ marginLeft: 8 }}>{v} ISK{sfx}</span>)}
              {!form.priceDaily && ![form.priceHourly, form.priceWeekly, form.priceMonthly].map(Number).some((n) => n > 0) && "Ekkert verð sett ennþá"}
            </p>
            <p className="muted mb0" style={{ marginTop: 4 }}>Trygging {form.depositAmount || 0} ISK · lágm. {form.minimumDuration} {{hour: "klst.", day: "daga", week: "vikur"}[form.minimumDurationUnit] || form.minimumDurationUnit}</p>
          </div>
          <div className="review-card">
            <div className="review-head"><span>📍 Staðsetning og afhending</span><button className="link-btn" onClick={() => setStep(3)}>✎ Breyta</button></div>
            <p className="mb0">📍 {form.city}{form.postcode ? ` ${form.postcode}` : ""}{form.region ? `, ${form.region}` : ""}</p>
            <p className="muted mb0" style={{ marginTop: 4 }}>📦 {pickupMode === "pickup" ? "Aðeins sótt" : pickupMode === "delivery" ? "Ég afhendi" : "Bæði"}</p>
            {form.phone ? <p className="muted mb0" style={{ marginTop: 4 }}>📞 {form.phone}</p> : null}
          </div>
          <div className="tip-box tip-success">
            <strong>✓ Skráning tilbúin til birtingar</strong>
            <p className="mb0">Smelltu á „Birta skráningu“ til að gera búnaðinn þinn sýnilegan öllum.</p>
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
            <button className="btn btn-outline" disabled={busy} onClick={() => setStep(3)}>‹ Til baka</button>
            <span className="row" style={{ gap: 8 }}>
              <button className="btn btn-outline" disabled={busy} onClick={() => submit(false)}>{busy ? "Vista…" : "Vista sem drög"}</button>
              <button className="btn btn-primary" disabled={busy} onClick={() => submit(true)}>{busy ? "Birti…" : "Birta skráningu ✓"}</button>
            </span>
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
}

function PricingField({ name, label, value, onChange, errors, ok, message, step = 0, suffix }) {
  return (
    <div className={`field grow ${errors[name] ? "has-error " : ""}${ok[name] ? "is-valid" : ""}`}>
      <label>{label}</label>
      <div className="price-input">
        <input data-field={name} type="number" step={step} min={0} value={value} onChange={onChange} placeholder="0" />
        {suffix && <span className="price-suffix">{suffix}</span>}
      </div>
      {message(name) && <small className="field-msg">{message(name)}</small>}
    </div>
  );
}