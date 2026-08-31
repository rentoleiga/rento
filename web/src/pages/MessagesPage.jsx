import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, timeAgo } from "../api";
import { useAuth } from "../store";

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login?next=/messages");
      return;
    }
    let alive = true;
    api.get("/api/conversations").then((d) => alive && setConvs(d.conversations || [])).catch(() => {}).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user, navigate]);

  const other = (c) => (user && user.id === c.renter_id ? c : c);

  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1 className="mt0">Messages</h1>
      {loading ? <div className="empty">Loading…</div>
        : convs.length === 0 ? (
            <div className="empty"><h3>No conversations yet</h3><p>Message a listing owner to get started.</p></div>
          ) : (
            <ul className="plain-list">
              {convs.map((c) => {
                const o = other(c);
                const me = user.id === c.renter_id ? o.owner_first + " " + o.owner_last : o.renter_first + " " + o.renter_last;
                return (
                  <li key={c.id}>
                    {o.renter_id && (c.main_image ? <img src={c.main_image} alt="" /> : null)}
                    <div className="grow">
                      <div className="title">
                        <Link to={`/messages/${c.id}`}>{c.listing_title}</Link>
                        {c.unread > 0 && <span className="status-pill status-active" style={{ marginLeft: 8 }}>{c.unread} new</span>}
                      </div>
                      <div className="sub">
                        {user.id === c.renter_id
                          ? `< ${(c.owner_first + " " + c.owner_last).trim()}`
                          : `${(c.renter_first + " " + c.renter_last).trim()} > `}
                        {c.last_message_at && ` · ${timeAgo(c.last_message_at)}`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
    </div>
  );
}