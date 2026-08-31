import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice, timeAgo } from "../api";
import { useAuth } from "../store";
import ReviewForm from "../components/ReviewForm";
import { StarRating } from "../components/ListingCard";

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("renter");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewState, setReviewState] = useState({}); // bookingId -> { loading, canReview, myReview, reviews }
  const [openForm, setOpenForm] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(tab === "renter" ? "/api/dashboard/renter/bookings" : "/api/dashboard/owner/bookings")
      .then((d) => {
        const bookings = d.bookings || [];
        setRows(bookings);
        // fetch review state for completed bookings (both roles)
        bookings.filter(b => b.status === "completed").forEach(b => {
          setReviewState(prev => ({ ...prev, [b.id]: { loading: true } }));
          api.get(`/api/reviews/bookings/${b.id}`)
            .then(r => setReviewState(prev => ({ ...prev, [b.id]: { loading: false, ...r } })))
            .catch(() => setReviewState(prev => ({ ...prev, [b.id]: { loading: false, canReview: true } })));
        });
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const act = async (booking, action) => {
    try {
      await api.put(`/api/bookings/${booking.id}/status`, { action });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 880 }}>
      <h1 className="mt0">Bookings</h1>
      <div className="dash-nav">
        <button className={`nav-link ${tab === "renter" ? "active" : ""}`} onClick={() => setTab("renter")}>As renter</button>
        <button className={`nav-link ${tab === "owner" ? "active" : ""}`} onClick={() => setTab("owner")}>As owner</button>
      </div>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="empty"><h3>No bookings yet</h3><p>Your bookings will appear here.</p></div>
      ) : (
        <ul className="plain-list">
          {rows.map((b) => (
            <li key={b.id}>
              {b.listing.image && <img src={b.listing.image} alt="" />}
              <div className="grow">
                <div className="title">
                  <Link to={`/listing/${b.listing.slug}`}>{b.listing.title}</Link>
                </div>
                <div className="sub">
                  {tab === "renter" ? "Owner: " : "Renter: "}
                  {tab === "renter" ? b.owner.name : b.renter.name}
                  {" · "}{b.start?.slice(0, 10)} → {b.end?.slice(0, 10)}
                </div>
                <div className="sub">Total {formatPrice(b.total, b.currency)} · Deposit {formatPrice(b.deposit, b.currency)}</div>
              </div>
              <div className="text-right">
                <span className={`status-pill status-${b.status}`}>{b.status}</span>
                {b.status === "pending" && tab === "owner" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "approve")}>Approve</button>
                    <button className="btn btn-outline btn-sm" onClick={() => act(b, "reject")}>Reject</button>
                  </div>
                )}
                {b.status === "approved" && tab === "renter" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "pay")}>Pay (demo)</button>
                    <button className="btn btn-outline btn-sm" onClick={() => act(b, "cancel")}>Cancel</button>
                  </div>
                )}
                {b.status === "active" && tab === "owner" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "pickup")}>Mark picked up</button>
                  </div>
                )}
                {b.status === "active" && tab === "renter" && (
                  <button className="btn btn-primary btn-sm" onClick={() => act(b, "return")}>Mark returned</button>
                )}
                {b.status === "returned" && tab === "owner" && (
                  <button className="btn btn-primary btn-sm" onClick={() => act(b, "complete")}>Complete rental</button>
                )}
                {b.status === "completed" && (
                  <div style={{ marginTop: 8 }}>
                    {reviewState[b.id]?.loading ? (
                      <span className="muted" style={{ fontSize: 13 }}>Checking reviews…</span>
                    ) : reviewState[b.id]?.myReview ? (
                      <div style={{ textAlign: "right" }}>
                        <div><StarRating rating={reviewState[b.id].myReview.rating} /> <span className="muted" style={{ fontSize: 12 }}>You reviewed</span></div>
                        {reviewState[b.id].myReview.comment && <div className="muted" style={{ fontSize: 12, fontStyle: "italic" }}>&ldquo;{reviewState[b.id].myReview.comment}&rdquo;</div>}
                      </div>
                    ) : (
                      openForm === b.id ? (
                        <ReviewForm
                          bookingId={b.id}
                          onDone={() => { setOpenForm(null); api.get(`/api/reviews/bookings/${b.id}`).then(r => setReviewState(prev => ({ ...prev, [b.id]: { loading: false, ...r } }))); }}
                          onCancel={() => setOpenForm(null)}
                        />
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => setOpenForm(b.id)}>Leave review ⭐</button>
                      )
                    )}
                    {reviewState[b.id]?.reviews?.length > 0 && (
                      <div style={{ marginTop: 8, textAlign: "left", borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                        {reviewState[b.id].reviews.map(r => (
                          <div key={r.id} style={{ fontSize: 13, marginBottom: 4 }}>
                            <StarRating rating={r.rating} /> <strong>{r.reviewer.name}</strong> <span className="muted">{timeAgo(r.createdAt)}</span>
                            {r.comment && <div style={{ marginTop: 2 }}>&ldquo;{r.comment}&rdquo;</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}