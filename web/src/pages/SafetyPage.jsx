import React from "react";

export default function SafetyPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Öryggi og traust</h1>
        <p className="muted">Rento leggur áherslu á öryggi og traust fyrir alla notendur.</p>

        <div className="detail-section">
          <h3>Staðfestir notendur</h3>
          <p>Allir notendur fara í gegnum staðfestingarferli. Við söfnum upplýsingum til að staðfesta auðkenni og tryggja að allir séu þeir sem þeir segjast vera.</p>
        </div>

        <div className="detail-section">
          <h3>Öruggr greiðslur</h3>
          <p>Greiðslur fara í gegnum örugga og dulkóðaða greiðslumáta. Engin greiðslukortaupplýsingar eru geymdar á okkar kerfum. Greiðslur fara ekki í gegnum eiganda þar til varan hefur verið afhent.</p>
        </div>

        <div className="detail-section">
          <h3>Tryggingar</h3>
          <p>Eigendur geta krafist tryggingagjalds til að tryggja varnir gegn skemmdum. Tryggingin er endurgreitt við skil ef varan er í sama ástandi.</p>
        </div>

        <div className="detail-section">
          <h3>Umsagnir og einkunnir</h3>
          <p>Eftir hverja leigu geta bæði eigandi og leigjandi skilið eftir umsögn. Kerfið hjálpar þér að taka upplýstar ákvarðanir.</p>
        </div>

        <div className="detail-section">
          <h3>Tilkynna vandamál</h3>
          <p>Ef þú lendir í vandræðum eða finnur grunsamlega hegðun, tilkynntu það strax á <a href="mailto:info@rento.is">info@rento.is</a>. Við свершим bráðlega.</p>
        </div>

        <div className="detail-section">
          <h3>Öryggisráð</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Hitttu eigandann/leigjandann á opnum og tryggum stað</li>
            <li>Athugaðu varanlega áður en þú tekur við henni</li>
            <li>Geymdu gögn um leigusamninginn</li>
            <li>Tilkynntu strax ef eitthvað er ekki eins og á að vera</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
