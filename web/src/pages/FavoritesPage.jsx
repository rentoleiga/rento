import React, { useEffect, useState } from "react";
import { api } from "../api";
import ListingCard from "../components/ListingCard";

export default function FavoritesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/favorites").then((d) => setRows(d.favorites)).catch(() => []).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container section">
      <h1 className="mt0">Uppáhald</h1>
      {loading ? <div className="empty">Hleður…</div>
        : rows.length === 0 ? (
            <div className="empty"><h3>Ekkert uppáhald ennþá</h3><p>Ýttu á hjartað á skráningum sem þér líkar.</p></div>
          ) : (
            <div className="grid">{rows.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
          )}
    </div>
  );
}