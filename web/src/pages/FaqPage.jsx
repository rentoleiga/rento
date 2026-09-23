import React, { useState } from "react";
import { Link } from "react-router-dom";

const GROUPS = [
  {
    title: "Grunnatriði",
    items: [
      { q: "Hvað er Rentó?", a: "Rentó er leigumarkaðstorg þar sem einstaklingar og fyrirtæki geta leigt hluti sín á milli. Þú getur annaðhvort fundið eitthvað sem þig vantar eða sett eigin hluti í leigu og fengið greitt fyrir þá.", link: { to: "/how-it-works", label: "Sjá nánar: Hvernig virkar Rentó?" } },
      { q: "Er Rentó eigandi hlutanna sem eru á síðunni?", a: "Nei. Rentó er markaðstorg sem tengir saman leigjendur og leigusala. Hluturinn er í eigu þess aðila sem skráir hann til leigu nema annað sé sérstaklega tekið fram." },
      { q: "Hvernig get ég haft samband við Rentó?", a: "Ef þú finnur ekki svarið hér getur þú haft samband við okkur í gegnum tengiliðasíðuna.", link: { to: "/contact", label: "Hafðu samband", btn: true } },
    ],
  },
  {
    title: "Að leigja hlut",
    items: [
      { q: "Hvernig leigi ég hlut á Rentó?", a: "Finndu hlut sem þú vilt leigja, veldu dagsetningar og sendu inn bókunarbeiðni. Þegar bókunin hefur verið samþykkt færðu upplýsingar um næstu skref og afhendingu.", link: { to: "/how-it-works", label: "Sjá skref fyrir skref: Hvernig virkar Rentó?" } },
      { q: "Hvernig fer afhending fram?", a: "Leigjandi og leigusali koma sér saman um afhendingu og skil á hlutnum. Við mælum með að báðir aðilar fari yfir ástand hlutarins við afhendingu og aftur við skil." },
      { q: "Get ég hætt við bókun?", a: "Það fer eftir því hvenær bókun er afturkölluð og þeim afbókunarreglum sem eiga við um bókunina. Þú sérð gildandi skilmála áður en bókun er staðfest.", link: { to: "/terms", label: "Sjá nánar: Afbókunarreglur" } },
      { q: "Hvað gerist ef leigusali hættir við?", a: "Ef leigusali getur ekki staðið við bókunina skal hann afturkalla hana eins fljótt og hægt er. Endurgreiðsla og önnur réttindi leigjanda fara eftir gildandi afbókunarskilmálum.", link: { to: "/terms", label: "Sjá nánar: Afbókunarreglur" } },
    ],
  },
  {
    title: "Að leigja út",
    items: [
      { q: "Hvernig set ég hlut í leigu?", a: "Þú stofnar aðgang, skráir hlutinn, setur inn myndir, lýsingu, verð og upplýsingar um hvenær hann er laus. Þegar einhver óskar eftir að leigja hlutinn færðu bókunarbeiðni sem þú getur tekið afstöðu til.", link: { to: "/how-it-works", label: "Sjá nánar: Hvernig virkar Rentó?" } },
      { q: "Hver má leigja út á Rentó?", a: "Bæði einstaklingar og fyrirtæki geta skráð hluti til leigu, að því gefnu að þeir hafi heimild til þess og hluturinn megi vera boðinn til leigu samkvæmt lögum og skilmálum Rentó.", link: { to: "/terms", label: "Sjá nánar: Notendaskilmálar" } },
      { q: "Hvaða hluti má ég leigja út?", a: "Flesta venjulega hluti sem heimilt er að eiga og leigja út má skrá á Rentó, til dæmis verkfæri, búnað, útivistarbúnað og ýmsa aðra hluti. Sumir hlutir eru þó bannaðir eða háðir sérstökum reglum.", link: { to: "/banned", label: "Sjá nánar: Bannaðir og takmarkaðir hlutir" } },
      { q: "Get ég leigt út ökutæki?", a: "Já, ef þú hefur heimild til útleigunnar og uppfyllir þær reglur sem gilda um viðkomandi ökutæki, tryggingar þess og notkun. Leigusali ber ábyrgð á að útleigan sé lögleg og að nauðsynlegar tryggingar og heimildir séu til staðar.", link: { to: "/terms", label: "Sjá nánar: Notendaskilmálar" } },
      { q: "Get ég breytt eða eytt auglýsingunni minni?", a: "Já. Þú getur farið inn á aðganginn þinn og breytt upplýsingum um hlutinn, verði, myndum og framboði. Ekki er þó alltaf hægt að breyta upplýsingum sem hafa áhrif á bókun sem þegar hefur verið staðfest." },
      { q: "Get ég hafnað bókunarbeiðni?", a: "Já. Leigusali getur hafnað bókunarbeiðni áður en hún hefur verið staðfest. Við mælum þó með að halda dagatali og framboði uppfærðu til að draga úr óþarfa höfnunum." },
    ],
  },
  {
    title: "Greiðslur og verð",
    items: [
      { q: "Hvernig virka greiðslur?", a: "Greiðsla vegna leigu fer fram í gegnum greiðslukerfi Rentó. Áður en þú staðfestir bókun sérðu hvað leigan kostar og hvaða gjöld eiga við.", link: { to: "/terms", label: "Sjá nánar: Verð og gjöld" } },
      { q: "Hvað kostar að nota Rentó?", a: "Það kostar ekkert að stofna aðgang eða skoða hluti á Rentó. Gjöld vegna bókunar eða útleigu koma skýrt fram áður en viðskipti eru staðfest.", link: { to: "/terms", label: "Sjá nánar: Verð og gjöld" } },
      { q: "Hvenær fær leigusali greitt?", a: "Greiðsla til leigusala fer fram samkvæmt greiðsluferli Rentó eftir að skilyrði viðskiptanna hafa verið uppfyllt.", link: { to: "/terms", label: "Sjá nánar: Verð og gjöld" } },
      { q: "Þarf ég að greiða skatt af tekjum sem ég fæ í gegnum Rentó?", a: "Leigusalar bera sjálfir ábyrgð á að standa skil á sköttum og öðrum opinberum gjöldum sem kunna að eiga við um tekjur þeirra. Reglur geta verið mismunandi eftir tegund útleigu, umfangi hennar og því hvort þú starfar sem einstaklingur eða fyrirtæki." },
    ],
  },
  {
    title: "Ef eitthvað kemur upp",
    items: [
      { q: "Hvað ef hluturinn skemmist?", a: "Ef hlutur skemmist á meðan á leigu stendur ættu leigjandi og leigusali að skrá skemmdina eins fljótt og mögulegt er og hafa samband í gegnum Rentó ef þörf er á. Ábyrgð fer eftir aðstæðum hverju sinni og þeim skilmálum sem samþykktir voru við bókun.", link: { to: "/terms", label: "Sjá nánar: Notendaskilmálar" } },
      { q: "Hvað ef hluturinn er ekki eins og lýsingin segir?", a: "Ef hluturinn er verulega frábrugðinn lýsingu eða ekki nothæfur skaltu fyrst hafa samband við leigusalann og reyna að leysa málið áður en notkun hefst. Ef ekki tekst að leysa málið getur þú haft samband við Rentó." },
      { q: "Hvað ef leigjandi skilar hlutnum ekki?", a: "Hafðu fyrst samband við leigjandann. Ef hluturinn hefur ekki verið skilaður samkvæmt samkomulagi skaltu hafa samband við Rentó og varðveita öll samskipti og upplýsingar um bókunina." },
    ],
  },
  {
    title: "Traust og persónuvernd",
    items: [
      { q: "Staðfestir Rentó alla leigusala og hluti?", a: "Rentó getur staðfest ákveðnar upplýsingar um notendur, en það þýðir ekki að Rentó hafi sérstaklega yfirfarið eða samþykkt hvern hlut, leyfi, tryggingar eða lögmæti hverrar útleigu. Leigusali ber ábyrgð á upplýsingum sem hann skráir og því að hann hafi heimild til útleigunnar.", link: { to: "/terms", label: "Sjá nánar: Notendaskilmálar" } },
      { q: "Hvernig veit ég hvort ég geti treyst öðrum notanda?", a: "Skoðaðu upplýsingar á notandasíðu, umsagnir og fyrri viðskipti þegar þær upplýsingar liggja fyrir. Við mælum einnig með skýrum samskiptum um afhendingu, skil og ástand hlutarins áður en leiga hefst." },
      { q: "Hvernig meðhöndlar Rentó persónuupplýsingarnar mínar?", a: "Rentó vinnur með persónuupplýsingar í samræmi við persónuverndarstefnu sína.", link: { to: "/privacy", label: "Sjá nánar: Persónuverndarstefna" } },
    ],
  },
];

export default function FaqPage() {
  const [openId, setOpenId] = useState("0-0");

  let gid = 0;
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <h1>Algengar spurningar</h1>
        <p className="muted" style={{ fontSize: 16, marginTop: 8, lineHeight: 1.6 }}>
          Hér finnur þú svör við algengustu spurningunum um Rentó, bæði fyrir þá sem vilja leigja og þá sem vilja leigja út.
        </p>

        {GROUPS.map((g, gi) => (
          <div key={g.title}>
            <h2 className="faq-group-title">{g.title}</h2>
            {g.items.map((it, ii) => {
              const id = `${gi}-${ii}`;
              const isOpen = openId === id;
              return (
                <div key={id} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button className="faq-q" onClick={() => setOpenId(isOpen ? null : id)} aria-expanded={isOpen}>
                    <span>{it.q}</span>
                    <span className="faq-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="faq-a">
                      <p>{it.a}</p>
                      {it.link && (
                        <p>
                          {it.link.btn ? (
                            <Link to={it.link.to} className="btn btn-outline" style={{ marginTop: 8 }}>{it.link.label}</Link>
                          ) : (
                            <Link to={it.link.to}>{it.link.label}</Link>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div className="detail-section" style={{ textAlign: "center", marginTop: 32 }}>
          <h3>Finnurðu ekki svarið?</h3>
          <p className="muted">Hafðu samband og við hjálpum þér.</p>
          <Link to="/contact" className="btn btn-primary">Hafðu samband</Link>
        </div>
      </div>
    </section>
  );
}
