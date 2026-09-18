import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getToken } from "../api";
import { useAuth } from "../store";

const STEPS = ["Photos", "Basics", "Price", "Location", "Review"];

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
  title: "Title",
  description: "Description",
  categoryId: "Category",
  subcategoryId: "Subcategory",
  city: "City",
  priceHourly: "Price per hour",
  priceDaily: "Price per day",
  priceWeekly: "Price per week",
  priceMonthly: "Price per month",
  depositAmount: "Deposit",
  cleaningFee: "Cleaning fee",
  deliveryFee: "Delivery fee",
  pickupFee: "Pickup fee",
  minimumDuration: "Minimum duration",
  minAge: "Minimum renter age",
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
    if (typeof v !== "string" || v.trim().length < 3) return msg(f, "Enter at least 3 characters.");
  }
  if (f === "description") {
    if (typeof v !== "string" || v.trim().length < 20) return msg(f, "Enter at least 20 characters.");
  }
  if (f === "city") {
    if (typeof v !== "string" || !v.trim()) return msg(f, "City is required.");
  }
  if (f === "categoryId" || f === "subcategoryId") {
    if (Number(v) <= 0) return msg(f, "Select an option from the list.");
  }
  if (NUMERIC_CONVERT.includes(f)) {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    if (Number.isNaN(n)) return msg(f, "Enter a valid number.");
    if (n < 0) return msg(f, "Must be 0 or more.");
    if (COORDS[f] && (n < COORDS[f][0] || n > COORDS[f][1]))
      return msg(f, `Must be between ${COORDS[f][0]} and ${COORDS[f][1]}.`);
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
        <h1>Owner access required</h1>
        <p className="sub">Enable "I want to list my items" on your profile to create listings.</p>
        <a className="btn btn-primary btn-block" href="/dashboard">Go to dashboard</a>
      </div>
    );
  }

  const topCats = cats.filter((c) => !c.parent_id);
  const subCats = cats.filter((c) => c.parent_id === form.categoryId);

  const uploadFiles = async (files) => {
    const room = 15 - form.gallery.length;
    if (room <= 0) { setError("Maximum 15 images."); return; }
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
        if (!r.ok) throw new Error(d.error || "Upload failed");
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
      if (prices.length === 0) errors.priceDaily = msg("priceDaily", "Enter at least one price.");
      for (const f of ["priceHourly", "priceDaily", "priceWeekly", "priceMonthly", "depositAmount"]) {
        const m = ruleFor(f, form[f]);
        if (m) errors[f] = m;
      }
    }
    if (s === 3) {
      const m = ruleFor("city", form.city);
      if (m) errors.city = m;
      if (form.phoneVisibility && !String(form.phone || "").trim()) errors.phone = msg("phone", "Enter a phone number or hide it.");
    }
    return errors;
  };

  const goNext = () => {
    const errs = stepErrors(step);
    if (Object.keys(errs).length > 0) {
      applyErrors(errs);
      return;
    }
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const submit = async (publish) => {
    setBusy(true);
    setError("");
    const local = validateAll();
    if (Object.keys(local).length > 0) {
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
      setNotice(`${publish ? "Listing published" : "Listing saved as draft"}!`);
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

  const stepDone = [
    form.gallery.length > 0,
    !ruleFor("title", form.title) && !ruleFor("description", form.description) && Number(form.categoryId) > 0 && Number(form.subcategoryId) > 0,
    [form.priceHourly, form.priceDaily, form.priceWeekly, form.priceMonthly].map(Number).some((n) => !Number.isNaN(n) && n > 0),
    !ruleFor("city", form.city),
  ];

  const navBtns = (isLast) => (
    <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
      <button className="btn btn-outline" disabled={step === 0 || busy} onClick={() => { setStep(step - 1); window.scrollTo(0, 0); }}>‹ Back</button>
      {!isLast && <button className="btn btn-primary" disabled={busy} onClick={goNext}>Next ›</button>}
    </div>
  );

  const message = (f) => fieldErrors[f] || (fieldOk[f] ? "✓" : "");

  return (
    <div className="container section" style={{ maxWidth: 980 }}>
      <h1 className="mt0">{id ? "Edit listing" : "Create a listing"}</h1>
      <p className="muted" style={{ marginTop: -8 }}>List your gear in a few steps — photos, basics, price, location, review.</p>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      <div className="wizard-layout">
        <aside className="wizard-steps">
          <div className="wizard-steps-label">STEPS</div>
          {STEPS.map((s, i) => (
            <button key={s} className={`wizard-step ${i === step ? "active" : ""} ${stepDone[i] ? "done" : ""}`} onClick={() => setStep(i)}>
              <span className="wizard-check">{stepDone[i] ? "✓" : i + 1}</span>
              <span>{s}</span>
            </button>
          ))}
        </aside>
        <div className="wizard-card">

      {step === 0 && (
        <>
          <h2 style={{ marginTop: 0 }}>Add photos</h2>
          <p className="muted" style={{ marginTop: -8 }}>Add up to 15 photos of your gear. The first photo will be the cover.</p>
          <label className="dropzone" onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files); }}>
            <span className="dropzone-ic">📷</span>
            <strong>Add gear photos</strong>
            <small>JPG, PNG, WebP up to 10 MB</small>
            <span className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Choose photos</span>
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }} />
          </label>
          <p className="muted small" style={{ textAlign: "center" }}>{form.gallery.length}/15 photos</p>
          {uploading && <p className="muted">Uploading…</p>}
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
          {form.mainImage && <p className="muted" style={{ fontSize: 13 }}>The first photo is the cover — click any photo to make it the cover.</p>}
          <div className="tip-box tip-info">
            <strong>⛨ Don't put your phone number on photos</strong>
            <p className="mb0">Renters see your number on the platform ("Show number" button) — enter it in the "Contact phone" field in the Location step.</p>
          </div>
          <div className="tip-box tip-warn">
            <strong>Tips for better photos:</strong>
            <ul>
              <li>Photograph your gear in good light</li>
              <li>Show the gear from several angles</li>
              <li>Include all accessories that come with it</li>
            </ul>
          </div>
          {navBtns(false)}
        </>
      )}

      {step === 1 && (
        <>
          <h2 style={{ marginTop: 0 }}>Basic info</h2>
          <p className="muted" style={{ marginTop: -8 }}>Describe your gear so people can find it easily.</p>
          <div className={`field ${fieldErrors.title ? "has-error " : ""}${fieldOk.title ? "is-valid" : ""}`}>
            <label>Listing title *</label>
            <input data-field="title" value={form.title} onChange={(e) => { set("title", e.target.value); touch("title", e.target.value); }}
              placeholder="e.g. Bosch drill GBH 2-26" />
            {message("title") && <small className="field-msg">{message("title")}</small>}
          </div>
          <div className={`field ${fieldErrors.description ? "has-error " : ""}${fieldOk.description ? "is-valid" : ""}`}>
            <label>Description *</label>
            <textarea data-field="description" rows={5} value={form.description}
              onChange={(e) => { set("description", e.target.value); touch("description", e.target.value); }}
              placeholder="Describe the condition, what's included, what it's used for…" />
            <small className="muted">{(form.description || "").trim().length}/20 characters minimum</small>
            {message("description") && <small className="field-msg">{message("description")}</small>}
          </div>
          <div className="field"><label>Short subtitle</label>
            <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. Sleeps 4, fully equipped" /></div>
          <div className="row">
            <div className={`field grow ${fieldErrors.categoryId ? "has-error " : ""}${fieldOk.categoryId ? "is-valid" : ""}`}>
              <label>Category *</label>
              <select data-field="categoryId" value={form.categoryId}
                onChange={(e) => { set("categoryId", Number(e.target.value)); set("subcategoryId", ""); touch("categoryId", e.target.value); touch("subcategoryId", ""); }}>
                <option value="">Choose a category</option>
                {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {message("categoryId") && <small className="field-msg">{message("categoryId")}</small>}
            </div>
            <div className={`field grow ${fieldErrors.subcategoryId ? "has-error " : ""}${fieldOk.subcategoryId ? "is-valid" : ""}`}>
              <label>Subcategory *</label>
              <select data-field="subcategoryId" value={form.subcategoryId}
                onChange={(e) => { set("subcategoryId", Number(e.target.value)); touch("subcategoryId", e.target.value); }}>
                <option value="">Select…</option>
                {subCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {message("subcategoryId") && <small className="field-msg">{message("subcategoryId")}</small>}
            </div>
          </div>
          <details className="opt-details">
            <summary>Booking rules (optional)</summary>
            <div className="row">
              <label className="field grow" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={form.instantBooking} onChange={(e) => set("instantBooking", e.target.checked)} />
                Instant booking (no approval needed)
              </label>
              <label className="field grow" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={form.smokingAllowed} onChange={(e) => set("smokingAllowed", e.target.checked)} />
                Smoking allowed
              </label>
              <label className="field grow" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={form.petsAllowed} onChange={(e) => set("petsAllowed", e.target.checked)} />
                Pets allowed
              </label>
            </div>
            <div className="row">
              <div className="field grow"><label>Minimum renter age</label>
                <input type="number" min={0} value={form.minAge} onChange={(e) => num("minAge", e.target.value)} /></div>
              <div className="field grow"><label>Cancellation policy</label>
                <select value={form.cancellationPolicy} onChange={(e) => set("cancellationPolicy", e.target.value)}>
                  <option value="flexible">Flexible</option><option value="moderate">Moderate</option>
                  <option value="strict">Strict</option><option value="custom">Custom</option>
                </select></div>
              <div className="field grow"><label>Item condition</label>
                <select value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                  <option value="new">New</option><option value="like_new">Like new</option>
                  <option value="good">Good</option><option value="fair">Fair</option>
                </select></div>
            </div>
            <div className="field"><label>Usage restrictions</label>
              <textarea value={form.usageRestrictions} onChange={(e) => set("usageRestrictions", e.target.value)} placeholder="e.g. Off-road driving prohibited, no smoking inside" /></div>
          </details>
          <details className="opt-details">
            <summary>Spec details (make, model… — optional)</summary>
            {attrRows.map((row, i) => (
              <div key={i} className="row" style={{ marginBottom: 8 }}>
                <div className="field grow" style={{ marginBottom: 0 }}>
                  <input placeholder="Name, e.g. make" value={row.k} onChange={(e) => setAttr(i, "k", e.target.value)} />
                </div>
                <div className="field grow" style={{ marginBottom: 0 }}>
                  <input placeholder="Value, e.g. Toyota" value={row.v} onChange={(e) => setAttr(i, "v", e.target.value)} />
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => delAttr(i)}>×</button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addAttr}>+ Add detail</button>
          </details>
          {navBtns(false)}
        </>
      )}

      {step === 2 && (
        <>
          <h2 style={{ marginTop: 0 }}>Price &amp; period</h2>
          <p className="muted" style={{ marginTop: -8 }}>Set prices for the periods you want to offer (ISK). You can enter one or more.</p>
          <div className="field"><label>Prices * (enter at least one)</label></div>
          <div className="price-grid">
            <PricingField name="priceHourly" label="Per hour" suffix="ISK/hr" value={form.priceHourly}
              onChange={onChange("priceHourly", (e) => num("priceHourly", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="priceDaily" label="Per day" suffix="ISK/day" value={form.priceDaily}
              onChange={onChange("priceDaily", (e) => num("priceDaily", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="priceWeekly" label="Per week" suffix="ISK/wk" value={form.priceWeekly}
              onChange={onChange("priceWeekly", (e) => num("priceWeekly", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="priceMonthly" label="Per month" suffix="ISK/mo" value={form.priceMonthly}
              onChange={onChange("priceMonthly", (e) => num("priceMonthly", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Deposit (optional) — ISK</label>
            <input data-field="depositAmount" type="number" min={0} value={form.depositAmount}
              onChange={(e) => num("depositAmount", e.target.value)} placeholder="0" />
            <small className="muted">Amount the renter leaves as a guarantee</small>
            {message("depositAmount") && <small className="field-msg">{message("depositAmount")}</small>}
          </div>
          <div className="field">
            <label>Minimum rental period (optional)</label>
            <div className="row">
              <input type="number" min={0} value={form.minimumDuration} onChange={(e) => set("minimumDuration", e.target.value)} placeholder="e.g. 3" style={{ maxWidth: 120 }} />
              <select value={form.minimumDurationUnit} onChange={(e) => set("minimumDurationUnit", e.target.value)} style={{ flex: 1 }}>
                <option value="hour">No limit</option>
                <option value="hour">hour</option><option value="day">day</option><option value="week">week</option>
              </select>
            </div>
            <small className="muted">e.g. "Min. 3 days" — gear can't be rented for shorter</small>
          </div>
          {navBtns(false)}
        </>
      )}

      {step === 3 && (
        <>
          <h2 style={{ marginTop: 0 }}>Location &amp; handover</h2>
          <p className="muted" style={{ marginTop: -8 }}>Where the gear is and how handover works.</p>
          <div className={`field ${fieldErrors.city ? "has-error " : ""}${fieldOk.city ? "is-valid" : ""}`}>
            <label>Gear location *</label>
            <div className="row">
              <input data-field="city" className="grow" value={form.city}
                onChange={(e) => { set("city", e.target.value); touch("city", e.target.value); }} placeholder="City, e.g. Reykjavík" />
              <input className="grow" value={form.postcode} onChange={(e) => set("postcode", e.target.value)} placeholder="Postcode" />
            </div>
            {message("city") && <small className="field-msg">{message("city")}</small>}
          </div>
          <div className="row">
            <div className="field grow"><label>Region</label>
              <input value={form.region} onChange={(e) => set("region", e.target.value)} /></div>
            <div className="field grow"><label>Address (shown publicly)</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          </div>
          <div className={`field ${fieldErrors.phone ? "has-error " : ""}`}>
            <label>Contact phone (optional)</label>
            <input data-field="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. +354 612 3456" />
            <small className="muted">If you enter it, renters can call you directly</small>
            {message("phone") && <small className="field-msg">{message("phone")}</small>}
          </div>
          <label className="row" style={{ cursor: "pointer", marginBottom: 12 }}>
            <input type="checkbox" checked={form.phoneVisibility} onChange={(e) => set("phoneVisibility", e.target.checked)} />
            Show phone number on listing (visible to everyone)
          </label>
          <div className="field"><label>How is the gear handed over?</label></div>
          <div className="pickup-cards">
            <button type="button" className={`pickup-card ${pickupMode === "pickup" ? "selected" : ""}`} onClick={() => setPickupMode("pickup")}>
              <span className="pickup-ic">📦</span>
              <span><strong>Pickup only</strong><small>Renter picks up the gear at my location</small></span>
              <span className="pickup-radio" />
            </button>
            <button type="button" className={`pickup-card ${pickupMode === "delivery" ? "selected" : ""}`} onClick={() => setPickupMode("delivery")}>
              <span className="pickup-ic">🚚</span>
              <span><strong>I deliver</strong><small>I deliver the gear to the renter's address</small></span>
              <span className="pickup-radio" />
            </button>
            <button type="button" className={`pickup-card ${pickupMode === "both" ? "selected" : ""}`} onClick={() => setPickupMode("both")}>
              <span className="pickup-ic">🔀</span>
              <span><strong>Both</strong><small>Renter chooses pickup or delivery</small></span>
              <span className="pickup-radio" />
            </button>
          </div>
          {navBtns(false)}
        </>
      )}

      {step === 4 && (
        <>
          <h2 style={{ marginTop: 0 }}>Review listing</h2>
          <p className="muted" style={{ marginTop: -8 }}>Check everything before publishing.</p>
          <div className="review-card">
            <div className="review-head"><span>📷 Photos ({form.gallery.length})</span><button className="link-btn" onClick={() => setStep(0)}>✎ Edit</button></div>
            {form.gallery.length === 0 ? <p className="muted mb0">No photos</p> : (
              <div className="gallery-thumbs" style={{ marginTop: 8 }}>
                {form.gallery.slice(0, 6).map((url) => <img key={url} src={url} alt="" style={{ width: 72, height: 50, objectFit: "cover", borderRadius: 8 }} />)}
              </div>
            )}
          </div>
          <div className="review-card">
            <div className="review-head"><span>📄 Basic info</span><button className="link-btn" onClick={() => setStep(1)}>✎ Edit</button></div>
            <small className="muted">Title</small>
            <p style={{ margin: "2px 0 8px", fontWeight: 700 }}>{form.title || "—"}</p>
            <small className="muted">Description</small>
            <p className="mb0" style={{ marginTop: 2 }}>{form.description || "—"}</p>
            <small className="muted">Category</small>
            <p className="mb0" style={{ marginTop: 2 }}>
              {cats.find((c) => c.id === Number(form.categoryId))?.name || "—"}
              {form.subcategoryId ? ` / ${cats.find((c) => c.id === Number(form.subcategoryId))?.name || ""}` : ""}
            </p>
          </div>
          <div className="review-card">
            <div className="review-head"><span>$ Price</span><button className="link-btn" onClick={() => setStep(2)}>✎ Edit</button></div>
            <p className="mb0">
              {form.priceDaily ? <span className="price-hl">{form.priceDaily} ISK/day</span> : ""}
              {[["hour", form.priceHourly, "/hr"], ["day", null, ""], ["week", form.priceWeekly, "/wk"], ["month", form.priceMonthly, "/mo"]]
                .filter(([, v]) => v && Number(v) > 0 && v !== form.priceDaily)
                .map(([u, v, sfx]) => <span key={u} className="muted" style={{ marginLeft: 8 }}>{v} ISK{sfx}</span>)}
              {!form.priceDaily && ![form.priceHourly, form.priceWeekly, form.priceMonthly].map(Number).some((n) => n > 0) && "No price set yet"}
            </p>
            <p className="muted mb0" style={{ marginTop: 4 }}>Deposit {form.depositAmount || 0} ISK · min {form.minimumDuration} {form.minimumDurationUnit}</p>
          </div>
          <div className="review-card">
            <div className="review-head"><span>📍 Location &amp; handover</span><button className="link-btn" onClick={() => setStep(3)}>✎ Edit</button></div>
            <p className="mb0">📍 {form.city}{form.postcode ? ` ${form.postcode}` : ""}{form.region ? `, ${form.region}` : ""}</p>
            <p className="muted mb0" style={{ marginTop: 4 }}>📦 {pickupMode === "pickup" ? "Pickup only" : pickupMode === "delivery" ? "I deliver" : "Both"}</p>
            {form.phone ? <p className="muted mb0" style={{ marginTop: 4 }}>📞 {form.phone}</p> : null}
          </div>
          <div className="tip-box tip-success">
            <strong>✓ Listing ready to publish</strong>
            <p className="mb0">Click "Publish listing" to make your gear visible to everyone.</p>
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
            <button className="btn btn-outline" disabled={busy} onClick={() => setStep(3)}>‹ Back</button>
            <span className="row" style={{ gap: 8 }}>
              <button className="btn btn-outline" disabled={busy} onClick={() => submit(false)}>{busy ? "Saving…" : "Save as draft"}</button>
              <button className="btn btn-primary" disabled={busy} onClick={() => submit(true)}>{busy ? "Publishing…" : "Publish listing ✓"}</button>
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