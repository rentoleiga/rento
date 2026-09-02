import React from "react";

export default function TermsPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Skilmálar</h1>
        <p className="muted">Síðast uppfært: September 2026</p>

        <div className="detail-section">
          <h3>1. Almennir skilmálar</h3>
          <p>Með því nota vettvanginn Rento (rento.is) samþykkir þú þessa skilmála. Rento er markaðstorg sem tengir eigendur og leigjenda. Rento er ekki aðili leigusamninga.</p>
        </div>

        <div className="detail-section">
          <h3>2. Skráning og reikningur</h3>
          <p>Þú verður að vera 18 ára eða eldri til að stofna reikning. Þú ert ábyrg/ur fyrir öryggi reikningsins þíns og upplýsingum sem þú gefur upp. Ein manneskja má einungis hafa einn reikning.</p>
        </div>

        <div className="detail-section">
          <h3>3. Leigusamningar</h3>
          <p>Leigusamningar eru milli eiganda og leigjanda. Rento er ekki aðili samninga og ber ekki ábyrgð á skemmdum, missi eða ágreiningi. Greiðslur fara í gegnum Rento en skuldir og réttindi eru á milli aðila.</p>
        </div>

        <div className="detail-section">
          <h3>4. Greiðslur</h3>
          <p>Allar greiðslur fara í gegnum örugga greiðslumáta. Rento tekur 10% þjónustugjald af hverri leigu. Gjaldið er dregið af greiðslu sem berst eigandanum.</p>
        </div>

        <div className="detail-section">
          <h3>5. Afpöntun</h3>
          <p>Afpöntunarreglur eru skilgreindar í hverri skráningu. Ef eigandi hefur ekki skilgreint afpöntunarreglu gilda staðlaðar reglur Rento.</p>
        </div>

        <div className="detail-section">
          <h3>6. Ábyrgð og trygging</h3>
          <p>Eigendur geta krafist tryggingagjalds. Tryggingin er endurgreitt við skil ef varan er í sama ástandi og við afhendingu. Rento ber ekki ábyrgð á tryggingum.</p>
        </div>

        <div className="detail-section">
          <h3>7. Breytingar á skilmálum</h3>
          <p>Rento áskilur sér rétt til að breyta þessum skilmálum hvenær sem er. Breytingar taka gildi við birtingu á vettvangnum. Frekari notkun eftir breytingar þýðir samþykki.</p>
        </div>

        <div className="detail-section">
          <h3>8. Hafa samband</h3>
          <p>Spurningar? Sendu okkur línu á <a href="mailto:info@rento.is">info@rento.is</a></p>
        </div>
      </div>
    </section>
  );
}
