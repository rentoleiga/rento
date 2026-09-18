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
      <h1 className="mt0">Bókanir</h1>
      <div className="dash-nav">
        <button className={`nav-link ${tab === "renter" ? "active" : ""}`} onClick={() => setTab("renter")}>Sem leigjandi</button>
        <button className={`nav-link ${tab === "owner" ? "active" : ""}`} onClick={() => setTab("owner")}>Sem eigandi</button>
      </div>

      {loading ? (
        <div className="empty">Hleður…</div>
      ) : rows.length === 0 ? (
        <div className="empty"><h3>Engar bókanir ennþá</h3><p>Bókanirnar þínar birtast hér.</p></div>
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
                  {tab === "renter" ? "Eigandi: " : "Leigjandi: "}
                  {tab === "renter" ? b.owner.name : b.renter.name}
                  {" · "}{b.start?.slice(0, 10)} → {b.end?.slice(0, 10)}
                </div>
                <div className="sub">Samtals {formatPrice(b.total, b.currency)} · Trygging {formatPrice(b.deposit, b.currency)}</div>
              </div>
              <div className="text-right">
                <span className={`status-pill status-${b.status}`}>{b.status}</span>
                {b.status === "pending" && tab === "owner" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "approve")}>Samþykkja</button>
                    <button className="btn btn-outline btn-sm" onClick={() => act(b, "reject")}>Hafna</button>
                  </div>
                )}
                {b.status === "approved" && tab === "renter" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "pay")}>Borga (prufa)</button>
                    <button className="btn btn-outline btn-sm" onClick={() => act(b, "cancel")}>Hætta við</button>
                  </div>
                )}
                {b.status === "active" && tab === "owner" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "pickup")}>Merkja sótt</button>
                  </div>
                )}
                {b.status === "active" && tab === "renter" && (
                  <button className="btn btn-primary btn-sm" onClick={() => act(b, "return")}>Merkja skilað</button>
                )}
                {b.status === "returned" && tab === "owner" && (
                  <button className="btn btn-primary btn-sm" onClick={() => act(b, "complete")}>Ljúka leigu</button>
                )}
                {b.status === "completed" && (
                  <div style={{ marginTop: 8 }}>
                    {reviewState[b.id]?.loading ? (
                      <span className="muted" style={{ fontSize: 13 }}>Athuga umsagnir…</span>
                    ) : reviewState[b.id]?.myReview ? (
                      <div style={{ textAlign: "right" }}>
                        <div><StarRating rating={reviewState[b.id].myReview.rating} /> <span className="muted" style={{ fontSize: 12 }}>Þú gafst umsögn</span></div>
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
                        <button className="btn btn-primary btn-sm" onClick={() => setOpenForm(b.id)}>Skilja eftir umsögn ⭐</button>
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