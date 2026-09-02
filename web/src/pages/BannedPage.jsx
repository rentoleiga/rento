import React from "react";

const BANNED = [
  { cat: "Ogilt og ólöglegt", items: ["Lyf og efni", "Skotvopn og sprengiefni", "Falsaðar vörur", "Þjófnaðar vörur"] },
  { cat: "Hættulegir hlutir", items: ["Sprengiefni og eldflaug", "Eiturefni", "Geislavirkir hlutir", "Sýklalyf"] },
  { cat: "Bannaðir til leigu", items: ["Persónuskilríki og leyfi", "Penningar og gjaldmiðlar", "Lyfseðlar", "Tryggingarskjöl"] },
  { cat: "Ekki leyfilegt", items: ["Húsdýr og lifandi dýr", "Mennskir hlutir (nöfn, ljósmyndir)", "Hugverkaréttindi (höfundarrétt)", "Tölvuglæpur og ruslpóstur"] },
];

export default function BannedPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Bannaðir hlutir</h1>
        <p className="muted">Ekki er leyfilegt að skrá eða leigja eftirfarandi hluti á Rento.</p>

        {BANNED.map((b) => (
          <div key={b.cat} className="detail-section">
            <h3>{b.cat}</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {b.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        ))}

        <div className="detail-section">
          <h3>Afbrot</h3>
          <p>Skráning bannaðra hluta getur leitt til tímabundrar eða varanlegrar bönnunar af vettvangnum. Alvarleg brot tilkynnt til lögreglu.</p>
        </div>

        <div className="detail-section">
          <h3>Spurningar?</h3>
          <p>Ekki viss um hvort eitthvað sé leyfilegt? Sendu okkur línu á <a href="mailto:info@rento.is">info@rento.is</a></p>
        </div>
      </div>
    </section>
  );
}
