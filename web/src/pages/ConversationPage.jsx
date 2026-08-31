import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, timeAgo } from "../api";
import { useAuth } from "../store";

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/login?next=/messages/" + conversationId);
      return;
    }
    api.get(`/api/conversations/${conversationId}/messages`)
      .then((d) => { setConv(d.conversation); setMsgs(d.messages || []); })
      .catch((e) => alert(e.message));
  }, [conversationId, user, navigate]);

  useEffect(() => {
    if (bottom.current) bottom.current.scrollIntoView({ behavior: "auto" });
  }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const d = await api.post(`/api/conversations/${conversationId}/messages`, { message: text });
      setMsgs((m) => [...m, d.message]);
      setText("");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!conv) return <div className="container section"><div className="empty">Loading…</div></div>;

  const otherName = user.id === conv.renter_id
    ? `${conv.owner_first} ${conv.owner_last}`
    : `${conv.renter_first} ${conv.renter_last}`;

  return (
    <div className="container section" style={{ maxWidth: 780 }}>
      <div className="chat">
        <div className="chat-head">
          <div className="grow">
            <strong>{otherName}</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              about <Link to={`/listing/${conv.listing_slug}`}>{conv.listing_title}</Link>
            </div>
          </div>
        </div>
        <div className="chat-messages">
          {msgs.map((m) => (
            <div key={m.id} className={`msg ${m.sender_id === user.id ? "me" : "them"}`}>
              {m.message}
              <span className="msg-time">{timeAgo(m.created_at)}</span>
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <form className="chat-input" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" />
          <button className="btn btn-primary" disabled={busy || !text.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}