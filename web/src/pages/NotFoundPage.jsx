import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container section">
      <div className="empty">
        <h1>404</h1>
        <h3>Síðan fannst ekki</h3>
        <p>Þessi slóð er ekki til eða hefur verið fjarlægð.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" to="/">Fara á forsíðu</Link>
          <Link className="btn btn-outline" to="/search">Skoða allar auglýsingar</Link>
        </div>
      </div>
    </div>
  );
}
