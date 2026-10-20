import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function searchUrl(query) {
  const q = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  return `/search?${q.toString()}`;
}

export default function SavedSearchesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/api/saved-searches")
      .then((d) => setRows(d.searches || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id) => {
    try {
      await api.del(`/api/saved-searches/${id}`);
      setRows((r) => r.filter((s) => s.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h1 className="mt0">Vistaðar leitir</h1>
        <Link className="btn btn-outline btn-sm" to="/search">Ný leit</Link>
      </div>
      <p className="muted" style={{ marginTop: -6 }}>
        Við látum þig vita þegar ný auglýsing passar við vistaða leit.
      </p>
      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <div className="empty">Hleður…</div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>Engar vistaðar leitir</h3>
          <p>Leitaðu að einhverju og ýttu á „Vista leit“.</p>
        </div>
      ) : (
        <ul className="plain-list">
          {rows.map((s) => (
            <li key={s.id}>
              <div className="grow">
                <div className="title"><Link to={searchUrl(s.query)}>{s.name}</Link></div>
                <div className="sub">{Object.values(s.query || {}).filter(Boolean).join(" · ") || "Öll leit"}</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>Eyða</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
