import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const GROUPS = [
  {
    title: "Alltaf óheimilt",
    note: "Þessa hluti og þjónustu má aldrei auglýsa, óháð verði, lengd leigu eða tilgangi.",
    items: [
      {
        t: "Ólöglegir hlutir",
        sub: "Hlutir sem ólöglegt er að eiga, hafa undir höndum, afhenda, flytja eða leigja samkvæmt íslenskum lögum.",
        body: [
          "Þetta við óháð því hvort hluturinn er auglýstur til leigu, láns eða afnota.",
          "Ef hlutur er aðeins heimill með leyfi, t.d. opinberu leyfi eða réttindum, á hann ekki heima á Rentó nema annað komi skýrt fram í reglum okkar.",
        ],
      },
      {
        t: "Lyf og lyfseðilsskyldar vörur",
        sub: "Ekki má nota Rentó til að miðla lyfjum sem aðeins má afhenda með lögbundnum hætti.",
        body: [
          "Óheimilt er að miðla:",
          "lyfseðilsskyldum lyfjum",
          "ávana- og fíknilyfjum",
          "öðrum lyfjum sem aðeins má afhenda með lögbundnum hætti",
        ],
        list: true,
      },
      {
        t: "Stolnir hlutir",
        sub: "Notandi skal eiga hlutinn eða hafa skýra heimild eiganda til útleigu.",
        body: [
          "Bannað er að auglýsa:",
          "stolna hluti",
          "fundna hluti sem notandi hefur ekki heimild til að ráðstafa",
          "hluti í eigu annars aðila án heimildar eiganda",
        ],
        list: true,
      },
      {
        t: "Fölsuð vara og hugverkaréttindi",
        sub: "Falsanir, eftirlíkingar og ólögleg afrit eru ekki leyfð.",
        body: [
          "Ekki má auglýsa:",
          "falsaðar vörur",
          "ólöglegar eftirlíkingar",
          "ólögleg afrit",
          "hluti sem brjóta gegn vörumerkja-, höfundar-, hönnunar- eða öðrum hugverkaréttindum",
        ],
        list: true,
      },
      {
        t: "Ávana- og fíkniefni",
        sub: "Ólögleg ávana- og fíkniefni og vímuefni eru alfarið bönnuð.",
        body: [
          "Bannið nær til ólöglegra ávana- og fíkniefna, ólöglegra vímuefna og efna sem óheimilt er að afhenda eða hafa undir höndum samkvæmt lögum.",
        ],
      },
      {
        t: "Persónuskilríki og opinber gögn",
        sub: "Bannað er að leigja eða afhenda skilríki, greiðslukort og önnur persónubundin auðkenni.",
        body: [
          "Þetta á meðal annars við um:",
          "vegabréf",
          "ökuskírteini",
          "nafnskírteini",
          "greiðslukort",
          "rafræn skilríki",
          "opinber leyfi og vottorð",
          "önnur persónubundin auðkenni",
        ],
        list: true,
      },
      {
        t: "Reikningar og stafrænir aðgangar",
        sub: "Persónubundnir reikningar, lykilorð og aðgangar eru ekki til leigu.",
        body: [
          "Ekki má leigja:",
          "bankareikninga",
          "greiðslureikninga",
          "rafræn skilríki og lykilorð",
          "tölvupóstsreikninga",
          "samfélagsmiðlareikninga",
          "aðgang að tölvukerfum og aðra stafræna aðganga",
        ],
        list: true,
      },
    ],
  },
  {
    title: "Leyfilegt með skilyrðum",
    note: "Þessa hluti má auglýsa, en leigusali ber ábyrgð á að þeir séu í lagi og að skilyrðin séu uppfyllt áður en leiga hefst.",
    items: [
      {
        t: "Ökutæki og eftirvagnar",
        sub: "Ökutæki þarf að vera skráð, skoðað og tryggt. Reglubundin útleiga getur verið leyfisskyld.",
        body: [
          "Gild skráning og skoðun.",
          "Tryggingar sem ná yfir notkun leigutaka. Kannaðu stöðuna hjá þínu tryggingafélagi.",
          "Leigutaki hefur gild ökuréttindi fyrir viðkomandi flokk.",
          "Útleiga ökutækja í atvinnuskyni getur krafist leyfis frá Samgöngustofu.",
        ],
      },
      {
        t: "Barna- og öryggisbúnaður",
        sub: "Bilstólar, hjálmar og björgunarvesti mega hvorki vera skemmd né útrunnin.",
        body: [
          "Búnaðurinn er innan líftíma framleiðanda.",
          "Bilstólar og hjálmar sem hafa lent árekstri eða höggi eru ekki leigðir út.",
          "Leigusali greinir frá aldri og ástandi búnaðarins í auglýsingu.",
        ],
      },
      {
        t: "Drónar",
        sub: "Heimilt að leigja, en notkun er háð reglum um dróna og flugsvæði.",
        body: [
          "Leigutaki ber ábyrgð að fylgja reglum Samgöngustofu um dróna, þ.m.t. skráningu og hæfniskröfum þar sem þær eiga við.",
          "Flug er takmarkað á ákveðnum svæðum, t.d. nálægt flugvöllum.",
          "Leigusali upplýsir um þyngd og flokk drónans í auglýsingu.",
        ],
      },
      {
        t: "Vinnuvélar og áhættusöm verkfæri",
        sub: "T.d. keðjusagir, vinnupallar og lyftur. Sum tæki má aðeins nota með réttindum.",
        body: [
          "Leigusali tilgreinir hvort réttindi þurfi til að stjórna tækinu og kannar að leigutaki hafi þau.",
          "Leiðbeiningar og viðeigandi hlífðarbúnaður fylgja eða eru tilgreind.",
          "Tækið er yfirfarið og öryggisbúnaður virkur.",
        ],
      },
      {
        t: "Rafmagns-, gas- og hitunarbúnaður",
        sub: "Búnaðurinn skal vera óskemmdur, öruggur og ekki háður innköllun.",
        body: [
          "Engar skemmdir á snúrum, klöm eða einangrun.",
          "Gasbúnaður er þéttur, yfirfarinn og tengingar í lagi.",
          "Leiðbeiningar um örugga notkun fylgja með.",
          "Innkallaðar vörur má ekki leigja út.",
        ],
      },
      {
        t: "Útivistar- og sportbúnaður með áhættu",
        sub: "Klifur-, kofun- og snjóflóðabúnaður þarf að vera í fullkomnu lagi.",
        body: [
          "Leigusali greinir frá aldri búnaðar og hvenær hann var síðast yfirfarinn.",
          "Kofunarbúnaður er aðeins leigður þeim sem hafa tilskilin réttindi.",
        ],
      },
    ],
  },
];

function Item({ id, item, isOpen, onToggle }) {
  return (
    <div className={`faq-item ${isOpen ? "open" : ""}`}>
      <button className="faq-q" onClick={() => onToggle(id)} aria-expanded={isOpen}>
        <span>
          <strong className="banned-item-title">{item.t}</strong>
          {!isOpen && <span className="faq-sub">{item.sub}</span>}
        </span>
        <span className={`faq-state ${isOpen ? "open" : ""}`}>
          {isOpen ? "Loka −" : "Opna +"}
        </span>
      </button>
      {isOpen && (
        <div className="faq-a">
          {item.sub && <p className="banned-sub">{item.sub}</p>}
          {item.list ? (
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {item.body.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : (
            item.body.map((b, i) => <p key={i}>{b}</p>)
          )}
        </div>
      )}
    </div>
  );
}

export default function BannedPage() {
  const allIds = useMemo(() => {
    const ids = [];
    GROUPS.forEach((g, gi) => g.items.forEach((_, ii) => ids.push(`${gi}-${ii}`)));
    return ids;
  }, []);
  const [open, setOpen] = useState(() => new Set());

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOpen = open.size === allIds.length;
  const toggleAll = () => setOpen(allOpen ? new Set([]) : new Set(allIds));

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <h1>Bannað á Rentó</h1>
        <p className="muted" style={{ fontSize: 16, marginTop: 8, lineHeight: 1.6 }}>
          Hér má sjá hvaða hluti og þjónustu er ekki heimilt að auglýsa á Rentó, auk þess sem er
          leyfilegt með skilyrðum. Ef vara eða þjónusta fellur undir bann má hún ekki birtast á
          Rentó, óháð verði, lengd leigu eða tilgangi.
        </p>

        <div style={{ textAlign: "right", marginTop: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={toggleAll}>
            {allOpen ? "Loka öllum skýringum" : "Opna allar skýringar"}
          </button>
        </div>

        {GROUPS.map((g, gi) => (
          <div key={g.title}>
            <h2 className="faq-group-title">{g.title}</h2>
            {g.note && <p className="muted" style={{ marginTop: -4 }}>{g.note}</p>}
            {g.items.map((it, ii) => {
              const id = `${gi}-${ii}`;
              return <Item key={id} id={id} item={it} isOpen={open.has(id)} onToggle={toggle} />;
            })}
          </div>
        ))}

        <div className="detail-section" style={{ textAlign: "center", marginTop: 32 }}>
          <h3>Sérðu auglýsingu sem brýtur reglur?</h3>
          <p className="muted">
            Láttu okkur vita. Tilkynningar hjálpa okkur að halda Rentó öruggu fyrir alla og við
            förum yfir hverja þeirra.
          </p>
          <Link to="/contact" className="btn btn-primary">Tilkynna auglýsingu</Link>
          <p className="muted" style={{ marginTop: 16 }}>
            Eða sendu okkur línu á <a href="mailto:info@rento.is">info@rento.is</a>
          </p>
        </div>
      </div>
    </section>
  );
}
