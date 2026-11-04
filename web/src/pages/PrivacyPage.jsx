import React from "react";
import LegalDocument from "../components/LegalDocument";

const sections = [
  {
    title: "1. Hver ber ábyrgð á persónuupplýsingunum?",
    paragraphs: [
      `Ábyrgðaraðili: Tihomir Drobnjak, rekstraraðili Rentó.`,
      `Rekstrarheimilisfang: Bæjarlind 7, 201 Kópavogi.`,
      `Netfang: info@rento.is`,
      `Vefsíða: https://www.rento.is/`,
      `Ábyrgðaraðili ákveður hvers vegna og hvernig persónuupplýsingar eru unnar í tengslum við rekstur Rentó. Hægt er að senda allar fyrirspurnir og beiðnir um persónuvernd á netfangið hér að ofan. Nánari upplýsingar um rekstraraðila eru í notendaskilmálum Rentó.`,
      `Rentó er vettvangur fyrir auglýsingar og samskipti um leigu hluta. Rentó er ekki sjálft aðili að leigusamningum milli notenda og tekur ekki við leigugreiðslum eða tryggingarfé fyrir þeirra hönd. Notendur sem nýta persónuupplýsingar annarra utan vettvangsins bera sjálfir ábyrgð á þeirri meðferð eftir því sem lög eiga við.`,
    ],
  },
  {
    title: "2. Hvaða persónuupplýsingar vinnum við með?",
    paragraphs: [
      `Við vinnum með upplýsingar sem þú veitir okkur, upplýsingar sem verða til við notkun þjónustunnar og takmarkaðar upplýsingar frá þjónustuveitendum.`,
      `Nýskráning og innskráning með netfangi og lykilorði: Þegar þú stofnar reikning beint á Rentó biðjum við þig um fornafn, eftirnafn, netfang, lykilorð (að lágmarki átta stafi samkvæmt skráningarforminu) og borg eða bæ. Þessar upplýsingar eru notaðar til að stofna og halda utan um reikninginn, tengja hann við valda borg eða bæ og gera þér kleift að skrá þig inn. Við vinnum einnig með auðkenni notandaaðgangs og nauðsynlegar upplýsingar til að sannreyna innskráningu og tryggja öryggi hans. Lykilorðið er notað við auðkenningu; eftir tæknilegri útfærslu geta verið varðveitt örugg lykilorðahösh, auðkenningartákn og innskráningarskrár. Lykilorð eiga aldrei að vera varðveitt á læsilegu formi.`,
      `Google-innskráning: Þú getur einnig skráð þig inn með Google. Þá geta borist þær grunnupplýsingar sem Google heimilar vegna auðkenningar, svo sem nafn, netfang, auðkenni Google-aðgangs og mögulega prófílmynd, eftir því hvernig innskráningin er stillt. Rentó fær ekki Google-lykilorðið þitt.`,
      `Auglýsingar: Myndir, lýsingar, verð, almenn staðsetning og annað efni sem þú ákveður að setja inn.`,
      `Samskipti: Skilaboð milli notenda, fyrirspurnir til Rentó, þjónustubeiðnir, kvartanir og tilkynningar um brot.`,
      `Kaup á þjónustu Rentó: Upplýsingar um keypt auglýsingapláss, Boost og aðra eigin þjónustu Rentó, svo sem fjárhæð, dagsetningu, greiðslustöðu, pöntunar- og færsluauðkenni. Greiðslur fyrir eigin þjónustu Rentó fara í gegnum Straum Hosted Checkout. Rentó geymir ekki sjálft fullt greiðslukortanúmer eða öryggiskóða korts.`,
      `Tæknilegar upplýsingar: IP-tala, upplýsingar um vafra og tæki, tímasetningar, aðgerðaskrár, villu- og öryggisupplýsingar og upplýsingar um vafrakökur eftir því sem við á.`,
      `Upplýsingar um aðra: Í tilkynningum og kvörtunum geta komið fram upplýsingar um aðra notendur eða einstaklinga sem tengjast viðkomandi máli.`,
      `Rentó óskar almennt ekki eftir viðkvæmum persónuupplýsingum, svo sem upplýsingum um heilsufar, trúarbrögð eða stjórnmálaskoðanir. Við biðjum þig um að birta ekki slíkar upplýsingar, kennitölur, lykilorð eða greiðslukortaupplýsingar í auglýsingum eða skilaboðum nema sérstök lögmæt þörf sé fyrir hendi.`,
    ],
  },
  {
    title: "3. Tilgangur vinnslu og lagaheimildir",
    paragraphs: [
      `Persónuupplýsingar eru aðeins unnar í skýrum og lögmætum tilgangi. Helstu tilvik eru þessi:`,
      `Stofnun og rekstur aðgangs, sannprófun innskráningar, auglýsingar og samskipti notenda: Til að veita þá þjónustu sem notandi óskar eftir, meðal annars með því að vinna úr nafni, netfangi, borg/bæ og auðkenningarupplýsingum við nýskráningu og auðkenna notanda með netfangi og lykilorði eða Google. Lagaheimild: framkvæmd samnings (b-liður 1. mgr. 6. gr. GDPR).`,
      `Afgreiðsla kaupa á viðbótarbirtingum og Boost: Til að staðfesta kaup, virkja þjónustu og svara fyrirspurnum vegna hennar. Lagaheimild: framkvæmd samnings. Nauðsynleg færsla og varðveisla bókhaldsgagna byggist á lagaskyldu (c-liður 1. mgr. 6. gr.).`,
      `Öryggi, svikavarnir, meðferð tilkynninga og varnir gegn misnotkun: Til að vernda þjónustuna, notendur og réttmæta hagsmuni þeirra. Lagaheimild: lögmætir hagsmunir (f-liður 1. mgr. 6. gr.), að teknu tilliti til réttinda og hagsmuna notenda. Þar sem lög mæla sérstaklega fyrir um vinnslu er byggt á lagaskyldu.`,
      `Aðstoð, rekstur og villugreining: Til að svara erindum, laga bilanir og viðhalda þjónustunni. Lagaheimild: framkvæmd samnings eða lögmætir hagsmunir, eftir eðli erindisins.`,
      `Réttarkröfur og úrlausn ágreinings: Til að stofna, hafa uppi eða verja réttarkröfur. Lagaheimild: lögmætir hagsmunir eða lagaskylda, eftir atvikum.`,
      `Valfrjálsar vafrakökur og önnur valfrjáls vinnsla: Þegar samþykkis er krafist er vinnslan aðeins framkvæmd að fengnu samþykki (a-liður 1. mgr. 6. gr. GDPR). Samþykki má afturkalla hvenær sem er, án þess að það hafi áhrif á lögmæti fyrri vinnslu.`,
      `Rentó notar ekki persónuupplýsingar til annarra ósamrýmanlegra tilgangs án þess að uppfylla viðeigandi lagaskilyrði og upplýsa notendur þegar þess er krafist.`,
    ],
  },
  {
    title: "4. Hvaða upplýsingar verða sýnilegar öðrum?",
    paragraphs: [
      `Þegar þú birtir auglýsingu geta aðrir notendur og gestir séð þær upplýsingar sem þú velur að birta, svo sem birtingarnafn, myndir, lýsingu, verð, almenna staðsetningu og annað efni auglýsingarinnar. Hafðu í huga að upplýsingar sem birtast opinberlega geta verið skoðaðar eða afritaðar af öðrum.`,
      `Skilaboð milli notenda eru ekki opinber. Takmarkaður aðgangur að þeim kann þó að vera nauðsynlegur fyrir Rentó vegna þjónustubeiðna, öryggisatvika, kvartana, rannsókna á misnotkun eða réttarkrafna. Slíkur aðgangur skal takmarkast við það sem er nauðsynlegt í viðkomandi máli.`,
    ],
  },
  {
    title: "5. Hverjir fá upplýsingar og hvaða þjónustuveitendur notum við?",
    paragraphs: [
      `Rentó notar utanaðkomandi þjónustuveitendur til að reka vefinn og veita þjónustu. Þeir geta meðal annars verið:`,
      `Railway: Hýsing, gagnageymsla og tæknilegur rekstur.`,
      `Google: Innskráning og auðkenning þegar notandi velur Google-innskráningu.`,
      `Straumur: Greiðslumiðlun vegna kaupa á eigin þjónustu Rentó í Hosted Checkout.`,
      `Aðrir nauðsynlegir tæknilegir þjónustuveitendur: Til dæmis vegna tölvupóstsendinga, öryggis eða villugreiningar, eftir því hvaða lausnir eru notaðar hverju sinni.`,
      `Þessir aðilar fá aðeins þær upplýsingar sem nauðsynlegar eru fyrir viðkomandi þjónustu. Þegar þjónustuveitandi vinnur persónuupplýsingar fyrir hönd Rentó þarf viðeigandi vinnslusamningur eða annar gildur samningsgrundvöllur að vera fyrir hendi. Sumir þjónustuveitendur geta jafnframt verið sjálfstæðir ábyrgðaraðilar vegna eigin lögbundinna skyldna.`,
      `Rentó selur ekki persónuupplýsingar notenda. Við kunnum að afhenda upplýsingar til lögbærra stjórnvalda eða annarra aðila þegar lagaskylda er fyrir hendi eða þegar önnur viðeigandi lagaheimild gerir miðlun nauðsynlega, svo sem vegna svikavarna eða réttarkrafna.`,
    ],
  },
  {
    title: "6. Flutningur upplýsinga utan Evrópska efnahagssvæðisins",
    paragraphs: [
      `Við notkun alþjóðlegra þjónustuveitenda geta persónuupplýsingar verið unnar eða aðgengilegar utan Evrópska efnahagssvæðisins (EES), meðal annars í Bandaríkjunum. Railway lýsir því til dæmis yfir í skilmálum sínum að meginvinnsla þess fari fram í Bandaríkjunum, þótt boðið sé upp á hýsingarsvæði innan Evrópu.`,
      `Við slíkan flutning þarf að uppfylla kröfur GDPR, meðal annars um ákvörðun um fullnægjandi vernd eða viðeigandi verndarráðstafanir, svo sem staðlaða samningsskilmála framkvæmdastjórnar Evrópusambandsins (SCC), þegar það á við. Nánari upplýsingar um þá flutninga og verndarráðstafanir sem eiga við um gögn þín má óska eftir á info@rento.is.`,
    ],
  },
  {
    title: "7. Hversu lengi geymum við upplýsingarnar?",
    paragraphs: [
      `Við varðveitum persónuupplýsingar ekki lengur en nauðsynlegt er fyrir tilgang vinnslunnar, lögbundna varðveislu, öryggi eða réttarkröfur. Helstu viðmið eru eftirfarandi:`,
      `Notandaaðgangur: Upplýsingar um aðgang eru almennt varðveittar á meðan hann er virkur. Eftir beiðni um eyðingu er upplýsingum eytt eða þær aftengdar notanda þegar ekki er lengur heimild eða þörf fyrir varðveislu.`,
      `Auglýsingar: Samkvæmt þjónustuskilmálum eru auglýsingar almennt birtar í 30 daga í senn og má endurnýja þær samkvæmt gildandi reglum. Lok birtingartíma jafngilda ekki sjálfkrafa eyðingu allra gagna. Upplýsingar kunna að varðveitast áfram að takmörkuðu leyti vegna reksturs, öryggis, kvörtunar eða ágreinings, ef lögmæt ástæða er fyrir hendi.`,
      `Skilaboð, þjónustubeiðnir og kvartanir: Upplýsingar eru varðveittar meðan þörf er á þeim til samskipta eða meðferðar máls og eftir það aðeins þegar lögmætur tilgangur réttlætir áframhaldandi geymslu, svo sem öryggi, svikavarnir eða réttarkröfur.`,
      `Greiðslu- og bókhaldsgögn: Bókhaldsgögn og fylgiskjöl sem falla undir bókhaldslög eru almennt varðveitt í sjö ár frá lokum viðkomandi reikningsárs, eða lengur ef sérstök lagaskylda á við.`,
      `Tæknilegar skrár: Öryggis-, innskráningar- og villuskrár eru varðveittar eins lengi og eðli skrárinnar, rannsókn á atviki, rekstraröryggi eða önnur lögmæt þörf krefst, en ekki ótakmarkað.`,
      `Öryggisafrit: Upplýsingar geta haldist tímabundið í öryggisafritum þar til þeim er eytt eða skrifað yfir samkvæmt afritunarferli. Aðgangur að slíkum afritum er bundinn við nauðsynlegar rekstrar- og öryggisþarfir.`,
      `Þegar varðveisluheimild fellur niður er upplýsingum eytt eða þær gerðar ópersónugreinanlegar. Lengd varðveislu fer þannig eftir eðli gagna, tilgangi þeirra, lögum og því hvort ólokið mál eða réttarkrafa sé fyrir hendi.`,
    ],
  },
  {
    title: "8. Eyðing reiknings og auglýsinga",
    paragraphs: [
      `Þú getur óskað eftir eyðingu notandaaðgangs í aðgangsstillingum Rentó, þar sem sú leið er virk, eða með því að senda tölvupóst á info@rento.is. Þegar aðgangi er eytt falla virkar auglýsingar hans almennt úr opinberri birtingu. Eyðing aðgangs fellir þó ekki niður eldri samningsskuldbindingar milli notenda.`,
      `Eyðing reiknings leiðir ekki alltaf til tafarlausrar eyðingar allra gagna. Rentó kann að þurfa að varðveita takmarkaðar upplýsingar til að uppfylla bókhaldsskyldur, vinna úr kvörtun, rannsaka svik eða verja réttarkröfur. Þegar slík ástæða er ekki lengur til staðar verður þeim eytt eða þær gerðar ópersónugreinanlegar.`,
    ],
  },
  {
    title: "9. Hvernig tryggjum við öryggi upplýsinganna?",
    paragraphs: [
      `Rentó skal beita viðeigandi tæknilegum og skipulagslegum öryggisráðstöfunum miðað við eðli upplýsinganna og áhættu vinnslunnar. Til slíkra ráðstafana geta meðal annars talist dulkóðaðar nettengingar, takmörkuð aðgangsréttindi, örugg auðkenning, uppfærslur, öryggisafrit og eftirlit með óheimilli notkun. Lykilorð fyrir innskráningu með netfangi skulu ekki geymd á læsilegu formi; ef kerfið varðveitir sannprófunargildi fyrir lykilorð skal nota örugga, einátta lykilorðahöshun.`,
      `Aðgangur að upplýsingum skal takmarkast við þá sem þurfa hann vegna reksturs, öryggis eða lögmætrar afgreiðslu máls. Engin netþjónusta getur þó tryggt fullkomið öryggi.`,
      `Ef öryggisbrestur verður mun Rentó meta áhættuna fyrir réttindi og frelsi einstaklinga, skrá viðeigandi atvik og tilkynna Persónuvernd og/eða þeim einstaklingum sem málið varðar þegar lagaskilyrði um tilkynningu eru uppfyllt. Þegar tilkynningarskylda til Persónuverndar á við er almenni fresturinn 72 klukkustundir frá því að ábyrgðaraðili verður var við brotið, ef unnt er.`,
    ],
  },
  {
    title: "10. Réttindi þín",
    paragraphs: [
      `Þú hefur eftir því sem við á rétt til að:`,
      `Fá upplýsingar um vinnslu persónuupplýsinga þinna og aðgang að þeim.`,
      `Fá rangar eða ófullkomnar upplýsingar leiðréttar.`,
      `Óska eftir eyðingu persónuupplýsinga þegar skilyrði þess eru uppfyllt.`,
      `Óska eftir takmörkun á vinnslu.`,
      `Andmæla vinnslu sem byggist á lögmætum hagsmunum.`,
      `Fá upplýsingar afhentar á algengu og tölvulesanlegu sniði og fluttar til annars aðila þegar réttur til gagnaflutnings á við.`,
      `Afturkalla samþykki fyrir vinnslu sem byggist á því, án þess að það hafi áhrif á fyrri lögmæta vinnslu.`,
      `Leggja fram kvörtun hjá Persónuvernd.`,
      `Þessi réttindi eru ekki fortakslaus; í ákveðnum tilvikum kunna lög eða réttindi annarra að takmarka þau. Beiðnir má senda á info@rento.is. Við kunnum að óska eftir nauðsynlegri staðfestingu á auðkenni áður en upplýsingar eru afhentar eða þeim breytt.`,
      `Beiðni er almennt svarað innan eins mánaðar frá móttöku. Ef beiðni er sérstaklega flókin eða margar beiðnir berast má framlengja frest um allt að tvo mánuði til viðbótar samkvæmt lögum. Við upplýsum þig um slíka framlengingu innan upphaflega mánaðarfrestsins.`,
    ],
  },
  {
    title: "11. Börn og aldurstakmark",
    paragraphs: [
      `Rentó er ætlað einstaklingum 18 ára og eldri. Einstaklingum undir 18 ára aldri er ekki heimilt að stofna notandaaðgang eða nota þjónustuna á eigin vegum samkvæmt notendaskilmálum. Ef í ljós kemur að aðgangur hefur verið stofnaður í bága við þessa reglu getur Rentó lokað honum og tekið viðeigandi afstöðu til eyðingar eða takmörkunar vinnslu upplýsinga.`,
    ],
  },
  {
    title: "12. Vafrakökur",
    paragraphs: [
      `Rentó notar vafrakökur og sambærilega tækni þegar þess þarf vegna virkni, innskráningar og öryggis vefsins. Valfrjálsar vafrakökur, svo sem vegna tölfræði eða markaðssetningar, eru aðeins notaðar að fengnu gildu samþykki þegar lög krefjast þess.`,
      `Þú getur breytt eða afturkallað samþykki fyrir valfrjálsum vafrakökum með þeim leiðum sem boðið er upp á á vefnum. Nánari upplýsingar um tegundir, tilgang og varðveislutíma vafrakaka eru í vafrakökustefnu Rentó: https://www.rento.is/cookies.`,
    ],
  },
  {
    title: "13. Röðun auglýsinga og sjálfvirk vinnsla",
    paragraphs: [
      `Auglýsingar á Rentó geta verið flokkaðar eða raðað eftir leitarorðum, flokki, birtingartíma og öðrum viðeigandi þáttum. Keypt kynningarþjónusta, svo sem Boost, getur aukið sýnileika auglýsingar. Upplýsingar um slíka þjónustu og meginreglur röðunar koma einnig fram í notendaskilmálum og kaupferli.`,
      `Samkvæmt þeirri þjónustu sem hér er lýst tekur Rentó ekki ákvarðanir um einstaklinga sem byggjast eingöngu á sjálfvirkri vinnslu og hafa lagaleg eða sambærilega veruleg áhrif á þá í skilningi 22. gr. GDPR. Verði slík vinnsla tekin upp verður viðeigandi fræðsla veitt og lögbundin réttindi tryggð.`,
    ],
  },
  {
    title: "14. Hvaðan fáum við upplýsingarnar og hvað er nauðsynlegt að veita?",
    paragraphs: [
      `Flestar upplýsingar fáum við beint frá þér þegar þú stofnar aðgang, setur inn auglýsingu, sendir skilaboð, kaupir viðbótarþjónustu eða hefur samband við okkur. Grunnupplýsingar kunna að berast frá Google við innskráningu og upplýsingar um niðurstöðu greiðslu frá Straumi. Tæknilegar upplýsingar geta myndast sjálfkrafa við notkun vefsins. Í kvörtunum geta einnig borist upplýsingar frá öðrum notendum.`,
      `Þegar þú stofnar reikning með skráningarformi Rentó þarf að gefa upp fornafn, eftirnafn, netfang, borg eða bæ og velja lykilorð sem uppfyllir kröfur formsins. Þegar þú hefur fyllt út þessi svæði og stofnað reikning færðu aðgang að þjónustunni samkvæmt núverandi skráningarferli. Ef þú notar Google-innskráningu þarf að heimila nauðsynlega miðlun auðkenningarupplýsinga frá Google. Án nauðsynlegra upplýsinga er ekki hægt að ljúka viðkomandi skráningarleið eða veita þá þjónustu sem aðgangurinn er ætlaður fyrir. Upplýsingar í auglýsingum eru að öðru leyti val notanda, innan þeirra marka sem þarf til að birta auglýsingu og uppfylla notendaskilmála. Við kaup á viðbótarþjónustu þarf að veita upplýsingar sem nauðsynlegar eru til að ganga frá greiðslu.`,
    ],
  },
  {
    title: "15. Fyrirspurnir, kvartanir og breytingar",
    paragraphs: [
      `Ef þú hefur spurningar um persónuvernd eða vilt nýta réttindi þín skaltu hafa samband við info@rento.is.`,
      `Þú getur jafnframt lagt fram kvörtun hjá Persónuvernd, eftirlitsstofnun á Íslandi: https://www.personuvernd.is/.`,
      `Rentó kann að uppfæra stefnuna þegar breytingar verða á þjónustu, vinnslu upplýsinga, þjónustuveitendum eða lögum. Nýjasta útgáfa verður birt á rento.is með dagsetningu síðustu uppfærslu. Ef breytingar hafa veruleg áhrif á vinnslu persónuupplýsinga verða notendur upplýstir með viðeigandi hætti þegar lög krefjast þess.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Persónuverndarstefna Rentó"
      subtitle="Gildir frá 29. október 2026 | Síðast uppfært 29. október 2026"
      intro="Hjá Rentó leggjum við áherslu á að vernda persónuupplýsingar og útskýra á skýran hátt hvernig við notum þær. Þessi stefna gildir um vefinn rento.is og þá þjónustu sem Rentó veitir. Hún byggist á lögum nr. 90/2018 um persónuvernd og vinnslu persónuupplýsinga og almennu persónuverndarreglugerðinni (GDPR)."
      sections={sections}
    />
  );
}
