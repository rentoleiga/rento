import React from "react";

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Persónuverndarstefna</h1>
        <p className="muted">Síðast uppfært: September 2026</p>

        <div className="detail-section">
          <h3>1. Safnaðar upplýsingar</h3>
          <p>Skráðu upplýsingar: nafn, netfang, símanúmer, staðsetning. Greiðsluupplýsingar: greiðslukortaupplýsingar eru ekki geymdar á okkar servers — þær fara í gegnum örugga þriðja aðila.</p>
        </div>

        <div className="detail-section">
          <h3>2. Notkun upplýsinga</h3>
          <p>Við notum upplýsingar til að: reikna og meðhöndla leigur, senda tilkynningar um bókanir, bæta þjónustuna og senda markaðsefni (ef þú samþykkir).</p>
        </div>

        <div className="detail-section">
          <h3>3. Deiling upplýsinga</h3>
          <p>Við deilum ekki persónuupplýsingum með þriðja aðila nema þegar lög skylda eða til að meðhöndla greiðslur í gegnum örugga greiðslumáta.</p>
        </div>

        <div className="detail-section">
          <h3>4. Öryggi</h3>
          <p>Við notum SSL dulkóðun og örugga gagnagrunna til að vernda upplýsingar þínar. Engin greiðslukortaupplýsingar eru geymdar á okkar kerfum.</p>
        </div>

        <div className="detail-section">
          <h3>5. Réttindi þín</h3>
          <p>Þú hefur rétt á að: skoða upplýsingar sem við höfum um þig, biðja um að leiðrétta eða eyða upplýsingum, hætta við markaðsefni hvenær sem er.</p>
        </div>

        <div className="detail-section">
          <h3>6. Cookies</h3>
          <p>Við notum vafrakökur til að bæta upplifun. Sjá nánar á <a href="/cookies">cookies síðunni</a>.</p>
        </div>

        <div className="detail-section">
          <h3>7. Hafa samband</h3>
          <p>Spurningar um persónuvernd? Sendu okkur línu á <a href="mailto:info@rento.is">info@rento.is</a></p>
        </div>
      </div>
    </section>
  );
}
