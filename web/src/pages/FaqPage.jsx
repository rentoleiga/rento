import React from "react";
import { Link } from "react-router-dom";

export default function FaqPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <h1>Algengar spurningar</h1>
        <p className="muted" style={{ fontSize: 16, marginTop: 8, lineHeight: 1.6 }}>
          Hér finnur þú svör við algengustu spurningunum um Rentó, bæði fyrir þá sem vilja leigja og þá sem vilja leigja út.
        </p>

        {/* Grunnatriði */}
        <h2 className="faq-group-title">Grunnatriði</h2>

        <details className="faq-item" open>
          <summary>Hvað er Rentó?</summary>
          <p>Rentó er leigumarkaðstorg þar sem einstaklingar og fyrirtæki geta leigt hluti sín á milli. Þú getur annaðhvort fundið eitthvað sem þig vantar eða sett eigin hluti í leigu og fengið greitt fyrir þá.</p>
          <p><Link to="/how-it-works">Sjá nánar: Hvernig virkar Rentó?</Link></p>
        </details>

        <details className="faq-item">
          <summary>Er Rentó eigandi hlutanna sem eru á síðunni?</summary>
          <p>Nei. Rentó er markaðstorg sem tengir saman leigjendur og leigusala. Hluturinn er í eigu þess aðila sem skráir hann til leigu nema annað sé sérstaklega tekið fram.</p>
        </details>

        <details className="faq-item">
          <summary>Hvernig get ég haft samband við Rentó?</summary>
          <p>Ef þú finnur ekki svarið hér getur þú haft samband við okkur í gegnum tengiliðasíðuna.</p>
          <p><Link to="/contact" className="btn btn-outline" style={{ marginTop: 8 }}>Hafðu samband</Link></p>
        </details>

        {/* Að leigja hlut */}
        <h2 className="faq-group-title">Að leigja hlut</h2>

        <details className="faq-item">
          <summary>Hvernig leigi ég hlut á Rentó?</summary>
          <p>Finndu hlut sem þú vilt leigja, veldu dagsetningar og sendu inn bókunarbeiðni. Þegar bókunin hefur verið samþykkt færðu upplýsingar um næstu skref og afhendingu.</p>
          <p><Link to="/how-it-works">Sjá skref fyrir skref: Hvernig virkar Rentó?</Link></p>
        </details>

        <details className="faq-item">
          <summary>Hvernig fer afhending fram?</summary>
          <p>Leigjandi og leigusali koma sér saman um afhendingu og skil á hlutnum. Við mælum með að báðir aðilar fari yfir ástand hlutarins við afhendingu og aftur við skil.</p>
        </details>

        <details className="faq-item">
          <summary>Get ég hætt við bókun?</summary>
          <p>Það fer eftir því hvenær bókun er afturkölluð og þeim afbókunarreglum sem eiga við um bókunina. Þú sérð gildandi skilmála áður en bókun er staðfest.</p>
          <p><Link to="/terms">Sjá nánar: Afbókunarreglur</Link></p>
        </details>

        <details className="faq-item">
          <summary>Hvað gerist ef leigusali hættir við?</summary>
          <p>Ef leigusali getur ekki staðið við bókunina skal hann afturkalla hana eins fljótt og hægt er. Endurgreiðsla og önnur réttindi leigjanda fara eftir gildandi afbókunarskilmálum.</p>
          <p><Link to="/terms">Sjá nánar: Afbókunarreglur</Link></p>
        </details>

        {/* Að leigja út */}
        <h2 className="faq-group-title">Að leigja út</h2>

        <details className="faq-item">
          <summary>Hvernig set ég hlut í leigu?</summary>
          <p>Þú stofnar aðgang, skráir hlutinn, setur inn myndir, lýsingu, verð og upplýsingar um hvenær hann er laus. Þegar einhver óskar eftir að leigja hlutinn færðu bókunarbeiðni sem þú getur tekið afstöðu til.</p>
          <p><Link to="/how-it-works">Sjá nánar: Hvernig virkar Rentó?</Link></p>
        </details>

        <details className="faq-item">
          <summary>Hver má leigja út á Rentó?</summary>
          <p>Bæði einstaklingar og fyrirtæki geta skráð hluti til leigu, að því gefnu að þeir hafi heimild til þess og hluturinn megi vera boðinn til leigu samkvæmt lögum og skilmálum Rentó.</p>
          <p><Link to="/terms">Sjá nánar: Notendaskilmálar</Link></p>
        </details>

        <details className="faq-item">
          <summary>Hvaða hluti má ég leigja út?</summary>
          <p>Flesta venjulega hluti sem heimilt er að eiga og leigja út má skrá á Rentó, til dæmis verkfæri, búnað, útivistarbúnað og ýmsa aðra hluti. Sumir hlutir eru þó bannaðir eða háðir sérstökum reglum.</p>
          <p><Link to="/banned">Sjá nánar: Bannaðir og takmarkaðir hlutir</Link></p>
        </details>

        <details className="faq-item">
          <summary>Get ég leigt út ökutæki?</summary>
          <p>Já, ef þú hefur heimild til útleigunnar og uppfyllir þær reglur sem gilda um viðkomandi ökutæki, tryggingar þess og notkun. Leigusali ber ábyrgð á að útleigan sé lögleg og að nauðsynlegar tryggingar og heimildir séu til staðar.</p>
          <p><Link to="/terms">Sjá nánar: Notendaskilmálar</Link></p>
        </details>

        <details className="faq-item">
          <summary>Get ég breytt eða eytt auglýsingunni minni?</summary>
          <p>Já. Þú getur farið inn á aðganginn þinn og breytt upplýsingum um hlutinn, verði, myndum og framboði. Ekki er þó alltaf hægt að breyta upplýsingum sem hafa áhrif á bókun sem þegar hefur verið staðfest.</p>
        </details>

        <details className="faq-item">
          <summary>Get ég hafnað bókunarbeiðni?</summary>
          <p>Já. Leigusali getur hafnað bókunarbeiðni áður en hún hefur verið staðfest. Við mælum þó með að halda dagatali og framboði uppfærðu til að draga úr óþarfa höfnunum.</p>
        </details>

        {/* Greiðslur og verð */}
        <h2 className="faq-group-title">Greiðslur og verð</h2>

        <details className="faq-item">
          <summary>Hvernig virka greiðslur?</summary>
          <p>Greiðsla vegna leigu fer fram í gegnum greiðslukerfi Rentó. Áður en þú staðfestir bókun sérðu hvað leigan kostar og hvaða gjöld eiga við.</p>
          <p><Link to="/terms">Sjá nánar: Verð og gjöld</Link></p>
        </details>

        <details className="faq-item">
          <summary>Hvað kostar að nota Rentó?</summary>
          <p>Það kostar ekkert að stofna aðgang eða skoða hluti á Rentó. Gjöld vegna bókunar eða útleigu koma skýrt fram áður en viðskipti eru staðfest.</p>
          <p><Link to="/terms">Sjá nánar: Verð og gjöld</Link></p>
        </details>

        <details className="faq-item">
          <summary>Hvenær fær leigusali greitt?</summary>
          <p>Greiðsla til leigusala fer fram samkvæmt greiðsluferli Rentó eftir að skilyrði viðskiptanna hafa verið uppfyllt.</p>
          <p><Link to="/terms">Sjá nánar: Verð og gjöld</Link></p>
        </details>

        <details className="faq-item">
          <summary>Þarf ég að greiða skatt af tekjum sem ég fæ í gegnum Rentó?</summary>
          <p>Leigusalar bera sjálfir ábyrgð á að standa skil á sköttum og öðrum opinberum gjöldum sem kunna að eiga við um tekjur þeirra. Reglur geta verið mismunandi eftir tegund útleigu, umfangi hennar og því hvort þú starfar sem einstaklingur eða fyrirtæki.</p>
        </details>

        {/* Ef eitthvað kemur upp */}
        <h2 className="faq-group-title">Ef eitthvað kemur upp</h2>

        <details className="faq-item">
          <summary>Hvað ef hluturinn skemmist?</summary>
          <p>Ef hlutur skemmist á meðan á leigu stendur ættu leigjandi og leigusali að skrá skemmdina eins fljótt og mögulegt er og hafa samband í gegnum Rentó ef þörf er á. Ábyrgð fer eftir aðstæðum hverju sinni og þeim skilmálum sem samþykktir voru við bókun.</p>
          <p><Link to="/terms">Sjá nánar: Notendaskilmálar</Link></p>
        </details>

        <details className="faq-item">
          <summary>Hvað ef hluturinn er ekki eins og lýsingin segir?</summary>
          <p>Ef hluturinn er verulega frábrugðinn lýsingu eða ekki nothæfur skaltu fyrst hafa samband við leigusalann og reyna að leysa málið áður en notkun hefst. Ef ekki tekst að leysa málið getur þú haft samband við Rentó.</p>
        </details>

        <details className="faq-item">
          <summary>Hvað ef leigjandi skilar hlutnum ekki?</summary>
          <p>Hafðu fyrst samband við leigjandann. Ef hluturinn hefur ekki verið skilaður samkvæmt samkomulagi skaltu hafa samband við Rentó og varðveita öll samskipti og upplýsingar um bókunina.</p>
        </details>

        {/* Traust og persónuvernd */}
        <h2 className="faq-group-title">Traust og persónuvernd</h2>

        <details className="faq-item">
          <summary>Staðfestir Rentó alla leigusala og hluti?</summary>
          <p>Rentó getur staðfest ákveðnar upplýsingar um notendur, en það þýðir ekki að Rentó hafi sérstaklega yfirfarið eða samþykkt hvern hlut, leyfi, tryggingar eða lögmæti hverrar útleigu. Leigusali ber ábyrgð á upplýsingum sem hann skráir og því að hann hafi heimild til útleigunnar.</p>
          <p><Link to="/terms">Sjá nánar: Notendaskilmálar</Link></p>
        </details>

        <details className="faq-item">
          <summary>Hvernig veit ég hvort ég geti treyst öðrum notanda?</summary>
          <p>Skoðaðu upplýsingar á notandasíðu, umsagnir og fyrri viðskipti þegar þær upplýsingar liggja fyrir. Við mælum einnig með skýrum samskiptum um afhendingu, skil og ástand hlutarins áður en leiga hefst.</p>
        </details>

        <details className="faq-item">
          <summary>Hvernig meðhöndlar Rentó persónuupplýsingarnar mínar?</summary>
          <p>Rentó vinnur með persónuupplýsingar í samræmi við persónuverndarstefnu sína.</p>
          <p><Link to="/privacy">Sjá nánar: Persónuverndarstefna</Link></p>
        </details>

        <div className="detail-section" style={{ textAlign: "center", marginTop: 32 }}>
          <h3>Finnurðu ekki svarið?</h3>
          <p className="muted">Hafðu samband og við hjálpum þér.</p>
          <Link to="/contact" className="btn btn-primary">Hafðu samband</Link>
        </div>
      </div>
    </section>
  );
}
