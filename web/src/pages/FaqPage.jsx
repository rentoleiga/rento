import React, { useState } from "react";
import { Link } from "react-router-dom";
import CmsContent, { useCms } from "../components/CmsContent";

const GROUPS = [
  {
    title: "Almennt",
    items: [
      { q: "1. Hvað er Rentó?", a: "Rentó er íslenskur vettvangur þar sem einstaklingar og fyrirtæki geta leigt út hluti eða fundið hluti til leigu. Rentó tengir saman leigusala og leigutaka á einfaldan hátt." },
      { q: "2. Er ókeypis að nota Rentó?", a: "Já! Það er ókeypis að stofna aðgang, skoða auglýsingar og senda skilaboð. Þú getur einnig haft allt að þrjár virkar auglýsingar samtímis án greiðslu." },
      { q: "3. Hvernig leigi ég hlut?", a: "Finndu hlut sem þig vantar og sendu auglýsandanum skilaboð. Þið komið ykkur sjálf saman um verð, leigutíma, greiðslu, afhendingu og skil." },
    ],
  },
  {
    title: "Auglýsingar",
    items: [
      { q: "4. Hvernig set ég inn auglýsingu?", a: "Skráðu þig inn, veldu „Búa til auglýsingu“, bættu við myndum, lýsingu og verði og birtu auglýsinguna." },
      { q: "5. Hversu margar auglýsingar get ég birt ókeypis?", a: "Þú færð þrjú ókeypis auglýsingapláss sem þú getur notað aftur og aftur. Ef þú eyðir auglýsingu eða hún rennur út losnar pláss fyrir nýja." },
      { q: "6. Hversu lengi er auglýsing virk?", a: "Hver auglýsing er virk í 30 daga. Þú getur endurnýjað hana ókeypis svo lengi sem hún rúmast innan þriggja ókeypis auglýsingaplássanna. Auglýsingar endurnýjast ekki sjálfkrafa." },
      { q: "7. Get ég verið með fleiri en þrjár auglýsingar?", a: "Já! Þú getur keypt viðbótarbirtingar. Hver keypt birting gildir fyrir eina tiltekna auglýsingu í allt að 30 daga frá staðfestingu greiðslu." },
      { q: "8. Hvað er Boost?", a: "Boost er valkvæð þjónusta sem eykur sýnileika auglýsingarinnar þinnar. Þú getur valið milli Silfur, Gull og Premium pakka. Boost tryggir þó ekki að hluturinn verði leigður." },
      { q: "9. Hvað má ég leigja út?", a: "Þú mátt leigja út löglega og örugga hluti sem þú átt eða hefur heimild til að leigja út. Sumir hlutir eru bannaðir og sérstakar reglur geta gilt um til dæmis ökutæki." },
    ],
  },
  {
    title: "Greiðslur og öryggi",
    items: [
      { q: "10. Hvernig fara greiðslur fyrir leigu fram?", a: "Leigusali og leigutaki ákveða sjálfir greiðslumáta. Rentó tekur ekki við leigugreiðslum eða tryggingarfé og tekur enga þóknun af leiguviðskiptum milli notenda." },
      { q: "11. Þarf ég að greiða tryggingarfé?", a: "Það fer eftir samkomulagi við leigusalann. Við mælum með að þið ákveðið skilmála um tryggingarfé áður en leigan hefst." },
      { q: "12. Hver ber ábyrgð ef hlutur skemmist?", a: "Leigusali og leigutaki bera ábyrgð samkvæmt samkomulagi sínu og gildandi lögum. Rentó er ekki aðili að leigusamningnum og tryggir ekki auglýsta hluti." },
      { q: "13. Hvað ef eitthvað fer úrskeiðis við leiguna?", a: "Best er að reyna fyrst að leysa málið beint við hinn aðilann. Ef þig grunar svik eða brot gegn reglum Rentó geturðu tilkynnt það til okkar á info@rento.is." },
    ],
  },
  {
    title: "Aðgangur og aðstoð",
    items: [
      { q: "14. Hvernig stofna ég aðgang?", a: "Þú getur skráð þig með Google eða stofnað aðgang með netfangi og lykilorði. Þú þarft að vera 18 ára eða eldri." },
      { q: "15. Hvernig hef ég samband við Rentó?", a: "Þú getur sent okkur tölvupóst á info@rento.is og við reynum að svara eins fljótt og hægt er." },
    ],
  },
];

export default function FaqPage() {
  const [openId, setOpenId] = useState("0-0");
  const cms = useCms("faq_is");

  let gid = 0;
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <h1>Algengar spurningar</h1>
        <p className="muted" style={{ fontSize: 16, marginTop: 8, lineHeight: 1.6 }}>
          Hér finnur þú svör við algengustu spurningunum um Rentó.
        </p>

        {cms && <CmsContent text={cms} />}

        {!cms && GROUPS.map((g, gi) => (
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
