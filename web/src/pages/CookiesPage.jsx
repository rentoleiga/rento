import React from "react";

export default function CookiesPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Vafraðkaka</h1>
        <p className="muted">Síðast uppfært: September 2026</p>

        <div className="detail-section">
          <h3>Hvað eru vafrakökur?</h3>
          <p>Vafrakökur eru litlar textaskrár sem geymdar eru í vafranum þínum þegar þú heimsækir vefsíðu. Þær hjálpa okkur að skilja hvernig þú notar síðuna og bæta upplifun.</p>
        </div>

        <div className="detail-section">
          <h3>Hvaða kökur notum við?</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li><strong>Nauðsynlegar kökur:</strong> Til að halda skráningu og stillingum. Þessar kökur eru nauðsynlegar fyrir virkni síðunnar.</li>
            <li><strong>Örgunnarkökur:</strong> Til að skilja hvernig síðan er notuð og bæta hana. Við notum Google Analytics í þessum tilgangi.</li>
            <li><strong>Markaðskökur:</strong> Til að sýna persónulega auglýsingar. Við notum ekki þessar kökur án samþykkis.</li>
          </ul>
        </div>

        <div className="detail-section">
          <h3>Hvernig stýrir þú kökum?</h3>
          <p>Þú getur stillt vafrann þinn til að hafna kökum eða tilkynna þegar kökur eru sendar. Athugaðu að ef þú hafnar kökum gæti virkni síðunnar minnkað.</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Chrome: Stillingar → Persónuvernd → Kökur</li>
            <li>Firefox: Stillingar → Persónuvernd → Kökur</li>
            <li>Safari: Stillingar → Persónuvernd → Kökur</li>
          </ul>
        </div>

        <div className="detail-section">
          <h3>Upplýsingar</h3>
          <p>Spurningar? Sendu okkur línu á <a href="mailto:info@rento.is">info@rento.is</a></p>
        </div>
      </div>
    </section>
  );
}
