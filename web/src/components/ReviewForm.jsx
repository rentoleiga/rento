import React, { useState } from "react";
import { api } from "../api";

function StarInput({ value, onChange }) {
  return (
    <div className="row" style={{ gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} stars`}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 24,
            color: n <= value ? "var(--star)" : "var(--line-strong)",
            padding: 2,
          }}
        >★</button>
      ))}
      <span className="muted" style={{ marginLeft: 6, fontSize: 13 }}>{value ? `${value}/5` : "Select"}</span>
    </div>
  );
}

export default function ReviewForm({ bookingId, onDone, onCancel }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1) { setError("Please select a rating"); return; }
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/api/reviews/bookings/${bookingId}/review`, { rating, comment });
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 10, padding: 14, border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface-2)" }}>
      <strong style={{ display: "block", marginBottom: 6 }}>Leave a review</strong>
      <div className="field" style={{ marginBottom: 8 }}>
        <label>Rating *</label>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div className="field">
        <label>Comment (visible to everyone)</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="How was the experience? Item condition, communication..."
          maxLength={2000}
          rows={3}
        />
        <span className="muted" style={{ fontSize: 12 }}>{comment.length}/2000</span>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Submit review"}</button>
        <button className="btn btn-outline btn-sm" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
