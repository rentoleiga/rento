import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice, timeAgo } from "../api";
import { useAuth } from "../store";
import ReviewForm from "../components/ReviewForm";
import { StarRating } from "../components/ListingCard";
import { fmtDate } from "../lib/dates";
import { useLang } from "../i18n";

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState("owner");
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
        window.dispatchEvent(new Event("rento:badges"));
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const act = async (booking, action) => {
    if (["reject", "cancel"].includes(action)) {
      const question = action === "reject" ? "Hafna þessari bókun?" : "Hætta við þessa bókun?";
      if (!window.confirm(question)) return;
    }
    try {
      await api.put(`/api/bookings/${booking.id}/status`, { action });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remindPayment = async (booking) => {
    try {
      await api.post(`/api/bookings/${booking.id}/remind-payment`);
      alert("Áminning um greiðslu var send.");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 880 }}>
      <h1 className="mt0">Bókanir</h1>
      <div className="dash-nav">
        <button className={`nav-link ${tab === "owner" ? "active" : ""}`} onClick={() => setTab("owner")}>Sem eigandi</button>
        <button className={`nav-link ${tab === "renter" ? "active" : ""}`} onClick={() => setTab("renter")}>Sem leigjandi</button>
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
                  {" · "}{fmtDate(b.start)} → {fmtDate(b.end)}
                </div>
                <div className="sub">Samtals {formatPrice(b.total, b.currency)} · Trygging {formatPrice(b.deposit, b.currency)}</div>
              </div>
              <div className="text-right">
                <span className={`status-pill status-${b.status}`}>{t(`status.${b.status}`)}</span>
                {b.status === "approved" && (
                  <div className="sub" style={{ marginTop: 6 }}>
                    {b.paymentStatus === "paid" ? "Greiðsla móttekin" : "Bíður greiðslu leigjanda"}
                  </div>
                )}
                {b.status === "pending" && tab === "owner" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "approve")}>Samþykkja</button>
                    <button className="btn btn-outline btn-sm" onClick={() => act(b, "reject")}>Hafna</button>
                  </div>
                )}
                {b.status === "pending" && tab === "renter" && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => act(b, "cancel")}>Hætta við</button>
                )}
                {b.status === "approved" && tab === "renter" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "pay")}>Borga (prufa)</button>
                    <button className="btn btn-outline btn-sm" onClick={() => act(b, "cancel")}>Hætta við</button>
                  </div>
                )}
                {b.status === "approved" && tab === "owner" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    {b.paymentStatus !== "paid" && (
                      <button className="btn btn-primary btn-sm" onClick={() => remindPayment(b)}>Áminna um greiðslu</button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => act(b, "cancel")}>Hætta við</button>
                  </div>
                )}
                {b.status === "active" && tab === "owner" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    {b.pickupStatus !== "picked_up" ? (
                      <button className="btn btn-primary btn-sm" onClick={() => act(b, "pickup")}>Merkja sótt</button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => act(b, "return")}>Merkja skilað</button>
                    )}
                    <Link className="btn btn-outline btn-sm" to={`/listing/${b.listing.slug}`}>Opna auglýsingu</Link>
                  </div>
                )}
                {b.status === "active" && tab === "renter" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "return")}>Merkja skilað</button>
                    <Link className="btn btn-outline btn-sm" to={`/listing/${b.listing.slug}`}>Opna auglýsingu</Link>
                  </div>
                )}
                {b.status === "returned" && tab === "owner" && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => act(b, "complete")}>Ljúka leigu</button>
                  </div>
                )}
                {b.status === "returned" && tab === "renter" && (
                  <div className="sub" style={{ marginTop: 6 }}>Bíður yfirferðar eiganda</div>
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