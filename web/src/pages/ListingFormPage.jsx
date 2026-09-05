import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getToken } from "../api";
import { useAuth } from "../store";

const STEPS = ["Basics", "Pricing", "Location", "Photos", "Rules", "Details", "Publish"];

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
  phoneVisibility: false,
  attributes: {},
  mainImage: "", gallery: [],
};

const NUMERIC_CONVERT = [
  "priceHourly", "priceDaily", "priceWeekly", "priceMonthly",
  "depositAmount", "cleaningFee", "deliveryFee", "pickupFee", "extraFee",
  "latitude", "longitude",
];

const STEP_OF = {
  title: 0, subtitle: 0, description: 0, categoryId: 0, subcategoryId: 0,
  priceHourly: 1, priceDaily: 1, priceWeekly: 1, priceMonthly: 1,
  minimumDuration: 1, minimumDurationUnit: 1,
  depositAmount: 1, cleaningFee: 1, deliveryFee: 1, pickupFee: 1,
  city: 2, region: 2, postcode: 2, address: 2,
  minAge: 4, cancellationPolicy: 4, condition: 4, usageRestrictions: 4,
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
    if (typeof v !== "string" || v.trim().length < 10) return msg(f, "Enter at least 10 characters.");
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
    setUploading(true);
    setError("");
    const urls = [];
    for (const file of Array.from(files)) {
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

  const nextBtn = (
    <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
      <button className="btn btn-outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
      <button className="btn btn-primary" disabled={busy} onClick={() => setStep(step + 1)}>Continue</button>
    </div>
  );

  const message = (f) => fieldErrors[f] || (fieldOk[f] ? "✓" : "");

  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <h1 className="mt0">{id ? "Edit listing" : "Create a listing"}</h1>
      <div className="steps">
        {STEPS.map((s, i) => (
          <button key={s} className={`step-chip ${i === step ? "active" : ""}`} onClick={() => setStep(i)}>{s}</button>
        ))}
      </div>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {step === 0 && (
        <>
          <div className={`field ${fieldErrors.title ? "has-error " : ""}${fieldOk.title ? "is-valid" : ""}`}>
            <label>Title *</label>
            <input data-field="title" value={form.title} onChange={(e) => { set("title", e.target.value); touch("title", e.target.value); }}
              placeholder="e.g. Toyota Hiace campervan 2020" />
            {message("title") && <small className="field-msg">{message("title")}</small>}
          </div>
          <div className="field"><label>Short subtitle</label>
            <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. Sleeps 4, fully equipped" /></div>
          <div className={`field ${fieldErrors.description ? "has-error " : ""}${fieldOk.description ? "is-valid" : ""}`}>
            <label>Description * (min 10 chars)</label>
            <textarea data-field="description" value={form.description}
              onChange={(e) => { set("description", e.target.value); touch("description", e.target.value); }} />
            {message("description") && <small className="field-msg">{message("description")}</small>}
          </div>
          <div className="row">
            <div className={`field grow ${fieldErrors.categoryId ? "has-error " : ""}${fieldOk.categoryId ? "is-valid" : ""}`}>
              <label>Category *</label>
              <select data-field="categoryId" value={form.categoryId}
                onChange={(e) => { set("categoryId", Number(e.target.value)); set("subcategoryId", ""); touch("categoryId", e.target.value); touch("subcategoryId", ""); }}>
                <option value="">Select…</option>
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
          {nextBtn}
        </>
      )}

      {step === 1 && (
        <>
          <div className="row">
            <div className="field grow"><label>Currency</label>
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="ISK">ISK</option><option value="EUR">EUR</option>
              </select></div>
            <PricingField name="priceHourly" label="Price per hour" value={form.priceHourly}
              onChange={onChange("priceHourly", (e) => num("priceHourly", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="priceDaily" label="Price per day (recommended)" value={form.priceDaily}
              onChange={onChange("priceDaily", (e) => num("priceDaily", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="priceWeekly" label="Price per week" value={form.priceWeekly}
              onChange={onChange("priceWeekly", (e) => num("priceWeekly", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
          </div>
          <div className="row">
            <div className="field grow"><label>Minimum duration</label>
              <input type="number" min={0} value={form.minimumDuration} onChange={(e) => set("minimumDuration", e.target.value)} /></div>
            <div className="field grow"><label>Duration unit</label>
              <select value={form.minimumDurationUnit} onChange={(e) => set("minimumDurationUnit", e.target.value)}>
                <option value="hour">hour</option><option value="day">day</option><option value="week">week</option>
              </select></div>
          </div>
          <div className="row">
            <PricingField name="depositAmount" label="Deposit (ISK)" value={form.depositAmount}
              onChange={onChange("depositAmount", (e) => num("depositAmount", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="cleaningFee" label="Cleaning fee" value={form.cleaningFee}
              onChange={onChange("cleaningFee", (e) => num("cleaningFee", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="deliveryFee" label="Delivery fee" value={form.deliveryFee}
              onChange={onChange("deliveryFee", (e) => num("deliveryFee", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
            <PricingField name="pickupFee" label="Pickup fee" value={form.pickupFee}
              onChange={onChange("pickupFee", (e) => num("pickupFee", e.target.value))}
              errors={fieldErrors} ok={fieldOk} message={message} />
          </div>
          {nextBtn}
        </>
      )}

      {step === 2 && (
        <>
          <div className="row">
            <div className={`field grow ${fieldErrors.city ? "has-error " : ""}${fieldOk.city ? "is-valid" : ""}`}>
              <label>City *</label>
              <input data-field="city" value={form.city}
                onChange={(e) => { set("city", e.target.value); touch("city", e.target.value); }} />
              {message("city") && <small className="field-msg">{message("city")}</small>}
            </div>
            <div className="field grow"><label>Region</label>
              <input value={form.region} onChange={(e) => set("region", e.target.value)} /></div>
            <div className="field grow"><label>Postcode</label>
              <input value={form.postcode} onChange={(e) => set("postcode", e.target.value)} /></div>
          </div>
          <div className="field"><label>Address (shown publicly)</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <label className="row" style={{ cursor: "pointer", marginBottom: 8 }}>
            <input type="checkbox" checked={form.pickupAvailable} onChange={(e) => set("pickupAvailable", e.target.checked)} />
            Pickup available
          </label>
          <label className="row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} />
            Delivery available
          </label>
          <label className="row" style={{ cursor: "pointer", marginTop: 8 }}>
            <input type="checkbox" checked={form.phoneVisibility} onChange={(e) => set("phoneVisibility", e.target.checked)} />
            Show phone number on listing (visible to everyone)
          </label>
          {nextBtn}
        </>
      )}

      {step === 3 && (
        <>
          <div className="field">
            <label>Upload photos (JPG/PNG/WebP, up to 10 MB each)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => uploadFiles(e.target.files)} />
            {uploading && <p className="muted">Uploading…</p>}
          </div>
          {form.gallery.length > 0 && (
            <div className="gallery-thumbs" style={{ marginBottom: 16 }}>
              {form.gallery.map((url, i) => (
                <div key={url} style={{ position: "relative", display: "inline-block" }}>
                  <img src={url} alt="" style={{ width: 96, height: 66, objectFit: "cover", borderRadius: 8, border: i === 0 ? "2px solid var(--primary)" : "none" }} onClick={() => set("mainImage", url)} />
                  <button type="button" className="btn btn-danger btn-sm" style={{ position: "absolute", top: 4, right: 4, padding: "0 6px", fontSize: 11 }}
                    onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url) }))}>×</button>
                </div>
              ))}
            </div>
          )}
          {form.mainImage && <p className="muted" style={{ fontSize: 13 }}>First image is the cover &mdash; click any image to make it the cover.</p>}
          {nextBtn}
        </>
      )}

      {step === 4 && (
        <>
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
          {nextBtn}
        </>
      )}

      {step === 5 && (
        <>
          <h3 style={{ marginTop: 0 }}>Category-specific details</h3>
          <p className="muted" style={{ marginTop: 0 }}>Add details like make, model, size, power, age range, etc.</p>
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
          {nextBtn}
        </>
      )}

      {step === 6 && (
        <>
          <div className="detail-section" style={{ marginTop: 0 }}>
            <h3>{form.title || "Untitled listing"}</h3>
            <p className="mb0">{form.description?.slice(0, 160) || "No description"}</p>
          </div>
          <div className="detail-section"><h3>Pricing summary</h3>
            <p className="mb0">
              {form.priceDaily ? `Daily ${form.priceDaily} ${form.currency}` : ""}
              {form.priceHourly ? ` · Hourly ${form.priceHourly} ${form.currency}` : ""}
              {form.priceWeekly ? ` · Weekly ${form.priceWeekly} ${form.currency}` : ""}
              {!form.priceDaily && !form.priceHourly && !form.priceWeekly && "No price set yet"}
              {" · "}Deposit {form.depositAmount || 0} {form.currency} · min {form.minimumDuration} {form.minimumDurationUnit}
            </p></div>
          <div className="detail-section"><h3>Location</h3><p className="mb0">{form.city}{form.region ? `, ${form.region}` : ""}</p></div>
          {form.gallery.length > 0 && <div className="detail-section"><h3>Photos ({form.gallery.length})</h3></div>}
          <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
            <button className="btn btn-outline" disabled={busy} onClick={() => submit(false)}>{busy ? "Saving…" : "Save as draft"}</button>
            <button className="btn btn-primary" disabled={busy} onClick={() => submit(true)}>{busy ? "Publishing…" : "Publish listing"}</button>
          </div>
        </>
      )}
    </div>
  );
}

function PricingField({ name, label, value, onChange, errors, ok, message, step = 0 }) {
  return (
    <div className={`field grow ${errors[name] ? "has-error " : ""}${ok[name] ? "is-valid" : ""}`}>
      <label>{label}</label>
      <input data-field={name} type="number" step={step} min={0} value={value} onChange={onChange} />
      {message(name) && <small className="field-msg">{message(name)}</small>}
    </div>
  );
}