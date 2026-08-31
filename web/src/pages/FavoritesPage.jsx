import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store";
import ListingCard from "../components/ListingCard";

export default function FavoritesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login?next=/favorites");
      return;
    }
    api.get("/api/favorites").then((d) => setRows(d.favorites)).catch(() => []).finally(() => setLoading(false));
  }, [user, navigate]);

  return (
    <div className="container section">
      <h1 className="mt0">Favorites</h1>
      {loading ? <div className="empty">Loading…</div>
        : rows.length === 0 ? (
            <div className="empty"><h3>No favorites yet</h3><p>Hit the save heart on listings you like.</p></div>
          ) : (
            <div className="grid">{rows.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
          )}
    </div>
  );
}