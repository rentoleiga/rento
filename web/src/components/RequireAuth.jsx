import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store";

export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (ready && !user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    }
  }, [ready, user, navigate, location.pathname, location.search]);

  if (!ready || !user) {
    return (
      <div className="container section">
        <div className="empty">Hleður…</div>
      </div>
    );
  }
  return children;
}
