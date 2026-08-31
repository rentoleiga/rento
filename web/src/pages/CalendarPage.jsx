import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatPrice } from "../api";
import { useAuth } from "../store";

export default function CalendarPage() {
  const { listingId } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [avail, setAvail] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ start: "", end: "", status: "blocked" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

  const delBlock = async (id) => {
    try {
      await api.del(`/api/availability/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 880 }}>
      <h1 className="mt0">Calendar</h1>
      {listing && <p className="muted" style={{ marginTop: 0 }}><Link to={`/listing/${listing.slug}`}>{listing.title}</Link></p>}
      {error && !busy && <div className="form-error">{error}</div>}

      <div className="detail-section" style={{ marginTop: 0 }}>
        <h3>Block unavailable dates</h3>
        <form onSubmit={addBlock} className="row" style={{ alignItems: "flex-end" }}>
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label>From</label>
            <input type="date" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label>To</label>
            <input type="date" required min={form.start} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label>Reason</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="blocked">Unavailable</option>
              <option value="maintenance">Maintenance</option>
              <option value="available">Force available</option>
            </select>
          </div>
          <button className="btn btn-primary" disabled={busy || !form.start || !form.end}>{busy ? "Adding…" : "Add"}</button>
        </form>
      </div>

      <h2 style={{ fontSize: 19 }}>Upcoming bookings</h2>
      {bookings.length === 0 ? <div className="empty">No upcoming bookings.</div> : (
        <ul className="plain-list">
          {bookings.map((b) => (
            <li key={b.id}>
              <div className="grow">
                <div className="title">{b.start.slice(0, 10)} → {b.end.slice(0, 10)}</div>
                <div className="sub">{b.renterName} · {formatPrice(b.total, b.currency)}</div>
              </div>
              <span className={`status-pill status-${b.status}`}>{b.status}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 19 }}>Availability blocks</h2>
      {avail.length === 0 ? <div className="empty">No blocks set.</div> : (
        <ul className="plain-list">
          {avail.map((a) => (
            <li key={a.id}>
              <div className="grow">
                <div className="title">{a.start.slice(0, 10)} → {a.end.slice(0, 10)}</div>
                <div className="sub">{a.status}{a.bookingId ? ` · booking ${a.bookingId}` : ""}</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => delBlock(a.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}