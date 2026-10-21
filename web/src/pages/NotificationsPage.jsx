import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, timeAgo } from "../api";
import { useAuth } from "../store";
import { NOTIF_LABELS, sortNotifications } from "../notifications";

const FILTERS = [
  { id: "all", label: "Allt" },
  { id: "unread", label: "Ólesið" },
  { id: "booking", label: "Bókanir" },
  { id: "message", label: "Skilaboð" },
];

function parsesData(n) {
  try {
    return typeof n.data === "string" ? JSON.parse(n.data) : (n.data || {});
  } catch {
    return {};
  }
}

function matchesFilter(n, filter) {
  if (filter === "all") return true;
  if (filter === "unread") return !n.read_at;
  if (filter === "booking") return n.type?.startsWith("booking") || n.type === "payment_success" || n.type === "return_reminder";
  if (filter === "message") return n.type === "new_message";
  return true;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get("/api/notifications")
      .then((d) => setItems(sortNotifications(d.notifications || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markAll = async () => {
    try {
      await api.put("/api/notifications/read-all");
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
      window.dispatchEvent(new Event("rento:badges"));
    } catch {}
  };

  const openItem = async (n) => {
    if (!n.read_at) {
      try {
        await api.put(`/api/notifications/${n.id}/read`);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
        window.dispatchEvent(new Event("rento:badges"));
      } catch {}
    }
    const data = parsesData(n);
    if (data.conversationId) {
      navigate(`/messages/${data.conversationId}`);
    } else if (data.bookingId || n.type?.startsWith("booking") || n.type === "payment_success" || n.type === "return_reminder") {
      navigate("/dashboard/bookings");
    } else if (n.type === "new_review" || n.type === "review_reply") {
      navigate(`/users/${user.id}`);
    } else if (n.type === "favorite_price_drop" && data.slug) {
      navigate(`/listing/${data.slug}`);
    } else if (n.type === "saved_search_match") {
      navigate("/dashboard/searches");
    } else if ((n.type === "listing_expiring" || n.type === "listing_expired") && data.slug) {
      navigate(`/listing/${data.slug}`);
    }
  };

  const visible = items.filter((n) => matchesFilter(n, filter));
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="container section notif-page">
      <div className="notif-page-head">
        <div>
          <h1 className="mt0">Tilkynningar</h1>
          <p className="muted" style={{ margin: 0 }}>Öll virkni og skilaboð á einum stað.</p>
        </div>
        {unread > 0 && <button className="btn btn-outline btn-sm" onClick={markAll}>Merkja allt lesið</button>}
      </div>

      <div className="notif-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`notif-filter ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === "unread" && unread > 0 ? ` (${unread})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">Hleður…</div>
      ) : visible.length === 0 ? (
        <div className="empty"><h3>Engar tilkynningar</h3><p>Hér birtast bókanir, skilaboð og aðrar tilkynningar.</p></div>
      ) : (
        <div className="notif-history">
          {visible.map((n) => (
            <button key={n.id} className={`notif-item notif-row ${n.read_at ? "" : "unread"}`} onClick={() => openItem(n)}>
              <span className="notif-item-title">{NOTIF_LABELS[n.type] || n.title}</span>
              {n.body && <span className="notif-item-body">{n.body}</span>}
              <span className="notif-item-time">{timeAgo(n.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
