import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiBase, formatPrice } from "../api";
import { useAuth } from "../store";
import DateField from "../components/DateField";
import { fmtDate } from "../lib/dates";

export default function CalendarPage() {
  const { listingId } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [avail, setAvail] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ start: "", end: "", status: "blocked" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [icsText, setIcsText] = useState("");
  const [icsUrl, setIcsUrl] = useState("");
  const [icsMsg, setIcsMsg] = useState("");

  const load = () => {
    Promise.all([
      api.get(`/api/listings/${listingId}`).catch(() => null),
      api.get(`/api/availability/listing/${listingId}`),
      api.get(`/api/dashboard/owner/listings/${listingId}/calendar`),
    ])
      .then(([l, a, cal]) => {
        if (l) setListing(l.listing);
        setAvail(a.availability || []);
        setBookings(cal.bookings || []);
      })
      .catch((e) => setError(e.message));
  };
  useEffect(load, [listingId]);

  const addBlock = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/availability/listing/${listingId}`, {
        start: new Date(`${form.start}T00:00:00`).toISOString(),
        end: new Date(`${form.end}T23:59:59`).toISOString(),
        status: form.status,
      });
      setForm({ start: "", end: "", status: "blocked" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const importIcs = async () => {
    setIcsMsg("");
    try {
      const r = await api.post(`/api/availability/import/${listingId}`, {
        text: icsText.trim(),
        url: icsText.trim() ? "" : icsUrl.trim(),
      });
      setIcsMsg(`Flutti inn ${r.imported} tímabil.`);
      setIcsText("");
      setIcsUrl("");
      load();
    } catch (err) {
      setIcsMsg(err.message);
    }
  };

  const delBlock = async (id) => {    try {
      await api.del(`/api/availability/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 880 }}>
      <h1 className="mt0">Dagatal</h1>
      {listing && <p className="muted" style={{ marginTop: 0 }}><Link to={`/listing/${listing.slug}`}>{listing.title}</Link></p>}
      {error && !busy && <div className="form-error">{error}</div>}

      <div className="detail-section" style={{ marginTop: 0 }}>
        <h3>Loka ólæsum dögum</h3>
        <form onSubmit={addBlock} className="row" style={{ alignItems: "flex-end" }}>
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label>Frá</label>
            <DateField required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label>Til</label>
            <DateField required min={form.start} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label>Ástæða</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="blocked">Ólæst</option>
              <option value="maintenance">Viðhald</option>
              <option value="available">Þvinga laust</option>
            </select>
          </div>
          <button className="btn btn-primary" disabled={busy || !form.start || !form.end}>{busy ? "Bæti við…" : "Bæta við"}</button>
        </form>
      </div>

      <h2 style={{ fontSize: 19 }}>Væntanlegar bókanir</h2>
      {bookings.length === 0 ? <div className="empty">Engar væntanlegar bókanir.</div> : (
        <ul className="plain-list">
          {bookings.map((b) => (
            <li key={b.id}>
              <div className="grow">
                <div className="title">{fmtDate(b.start)} → {fmtDate(b.end)}</div>
                <div className="sub">{b.renterName} · {formatPrice(b.total, b.currency)}</div>
              </div>
              <span className={`status-pill status-${b.status}`}>{b.status}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 19 }}>Flytja inn / út dagatal</h2>
      <div className="detail-section" style={{ marginTop: 8 }}>
        <p className="muted" style={{ marginTop: 0 }}>
          Flytja má lokaða daga úr öðru dagatali (iCal) inn hér, eða sækja dagatalið til notkunar annars staðar.
        </p>
        <div className="row" style={{ marginBottom: 10 }}>
          <a className="btn btn-outline btn-sm" href={`${apiBase()}/api/listings/${listingId}/calendar.ics`}>
            Sækja .ics
          </a>
        </div>
        <div className="field">
          <label>iCal hlekkur</label>
          <input value={icsUrl} onChange={(e) => setIcsUrl(e.target.value)} placeholder="https://…/calendar.ics" />
        </div>
        <div className="field">
          <label>eða líma iCal texta</label>
          <textarea rows={3} value={icsText} onChange={(e) => setIcsText(e.target.value)} style={{ width: "100%", resize: "vertical" }} />
        </div>
        {icsMsg && <div className={icsMsg.startsWith("Flutti") ? "form-success" : "form-error"}>{icsMsg}</div>}
        <button className="btn btn-primary" disabled={!icsText.trim() && !icsUrl.trim()} onClick={importIcs}>
          Flytja inn
        </button>
      </div>

      <h2 style={{ fontSize: 19 }}>Lokaðir dagar</h2>
      {avail.length === 0 ? <div className="empty">Engir lokaðir dagar.</div> : (
        <ul className="plain-list">
          {avail.map((a) => (
            <li key={a.id}>
              <div className="grow">
                <div className="title">{fmtDate(a.start)} → {fmtDate(a.end)}</div>
                <div className="sub">{a.status}{a.bookingId ? ` · bókun ${a.bookingId}` : ""}</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => delBlock(a.id)}>Fjarlægja</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}