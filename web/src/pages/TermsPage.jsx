import React from "react";
import LegalDocument from "../components/LegalDocument";

const sections = [
  {
    title: "1. Rekstraraðili og gildissvið",
    paragraphs: [
      `Vefurinn rento.is og þjónusta undir heitinu Rentó eru rekin af Tihomir Drobnjak, kt. 090191-4389, með heimilisfang að Bæjarlind 7, 201 Kópavogi, og netfangið info@rento.is. Engin almenn móttaka viðskiptavina er á rekstrarheimilisfanginu.`,
      `Þessir skilmálar gilda um stofnun og notkun aðgangs, birtingu auglýsinga, samskipti notenda og kaup á eigin þjónustu Rentó. Með skýru samþykki við skráningu eða kaup samþykkir notandi skilmálana. Notandi skal vera 18 ára eða eldri. Ófrávíkjanleg réttindi samkvæmt lögum haldast óskert.`,
    ],
  },
  {
    title: "2. Skilgreiningar",
    paragraphs: [
      `Notandi er einstaklingur eða lögaðili sem notar Rentó. Auglýsandi er notandi sem birtir hlut til leigu. Leigusali og leigutaki eru þeir aðilar sem gera leigusamning sín á milli. Neytandi er einstaklingur sem kaupir þjónustu Rentó í tilgangi utan atvinnustarfsemi sinnar. Atvinnurekandi er sá sem kemur fram í atvinnuskyni. Greidd þjónusta er viðbótarbirting, boost eða önnur valkvæð þjónusta gegn greiðslu. Auglýsingapláss er heimild til að hafa tiltekinn fjölda virkra auglýsinga samkvæmt lýsingu þjónustunnar. Boost merkir keypta aukningu á sýnileika auglýsingar.`,
    ],
  },
  {
    title: "3. Hlutverk Rentó",
    paragraphs: [
      `Rentó er stafrænn auglýsinga- og samskiptavettvangur vegna leigu á hlutum. Rentó er hvorki leigusali né leigutaki, á ekki auglýsta hluti, hefur þá ekki í vörslu, staðfestir almennt ekki eignarhald eða ástand þeirra, afhendir þá ekki og sér ekki um skil.`,
      `Rentó er ekki aðili að leigusamningum milli notenda, innheimtir ekki leigugjöld eða tryggingarfé fyrir þeirra hönd og selur þeim ekki tryggingar. Samkvæmt núverandi þjónustuframboði tekur Rentó enga þóknun af leigugreiðslum milli notenda. Þetta skerðir ekki skyldur Rentó vegna eigin þjónustu og háttsemi.`,
    ],
  },
  {
    title: "4. Notendaaðgangar og staða notenda",
    paragraphs: [
      `Aðgang má stofna með þeim leiðum sem vefurinn býður, svo sem Google-innskráningu eða netfangi og lykilorði. Notandi ábyrgist að veita réttar upplýsingar, halda þeim uppfærðum og gæta öryggis aðgangs síns. Óheimilt er að stofna falskan aðgang, nota auðkenni annars manns án heimildar, svíkja eða komast hjá lokun með nýjum reikningi.`,
      `Einstaklingar og fyrirtæki geta notað sömu almennu þjónustu Rentó og gilda sömu almennu reglur um aðgang þeirra nema annað sé sérstaklega tekið fram. Auglýsandi skal veita réttar upplýsingar um hvort hann komi fram í atvinnuskyni. Óheimilt er að gefa sig út fyrir að vera almennur einstaklingur til að komast hjá lögbundnum skyldum. Rentó getur óskað eftir staðfestingu upplýsinga þegar lög, öryggi eða málefnalegar rekstrarástæður krefjast þess.`,
    ],
  },
  {
    title: "5. Ókeypis auglýsingapláss",
    paragraphs: [
      `Samkvæmt gildandi þjónustuframboði fær hver skráður notandi þrjú endurnýtanleg ókeypis auglýsingapláss og getur haft allt að þrjár virkar auglýsingar samtímis án greiðslu. Hver auglýsing er birt í 30 daga frá virkjun. Að þeim tíma liðnum má endurnýja hana ókeypis í aðra 30 daga ef hún rúmast innan ókeypis plássanna, eða láta hana renna út.`,
      `Eyðing auglýsingar eða lok birtingartíma losar ókeypis pláss og má birta aðra auglýsingu í þess stað. Auglýsingar endurnýjast ekki sjálfkrafa. Breytingar á framtíðarfyrirkomulagi ókeypis plássa gilda aðeins fram í tímann og skerða ekki þegar keypta þjónustu eða virk réttindi nema lög heimili annað.`,
    ],
  },
  {
    title: "6. Greiddar viðbótarbirtingar",
    paragraphs: [
      `Þegar notandi vill hafa fleiri en þrjár auglýsingar virkar samtímis getur hann keypt viðbótarbirtingu. Með kaupunum fær notandi heimild til að birta eina tiltekna viðbótarauglýsingu í allt að 30 daga frá staðfestingu greiðslu. Gildistíminn hefst við staðfestingu greiðslu, hvort sem auglýsingin er virkjuð strax eða síðar.`,
      `Birtingarheimildin telst notuð þegar auglýsingin er fyrst virkjuð og verður ekki nýtt fyrir aðra auglýsingu þótt þeirri fyrri sé eytt. Ónotaður tími er ekki framlengdur sjálfkrafa. Endurnýjun krefst nýrra kaupa ef fjöldi virkra auglýsinga er áfram yfir ókeypis hámarki. Greidd þjónusta er ekki framseljanleg. Þessar upplýsingar skulu einnig birtast skýrt í kaupferlinu áður en greiðsla er staðfest. Um afturköllun og endurgreiðslur fer samkvæmt 9. kafla.`,
    ],
  },
  {
    title: "7. Boost-pakkar og röðun",
    paragraphs: [
      `Rentó býður valkvæða aukningu á sýnileika auglýsinga með pökkunum Silfur, Gull og Premium. Verð, gildistími og sú birting eða staðsetning sem hver pakki felur í sér eru sýnd í verðskrá og við kaup. Auglýsingar raðast að meginstefnu með nýjustu fyrst, en keypt boost getur haft áhrif á röðun. Fleiri en ein boostuð auglýsing getur verið virk samtímis og röðun þeirra fer eftir lýsingu viðkomandi pakka og gildandi röðunarreglum Rentó.`,
      `Greiddur sýnileiki er auðkenndur með skýrum hætti, til dæmis með merkingunni „Boostuð auglýsing“ eða „Kynnt“. Boost tryggir hvorki fyrirspurnir, leiguviðskipti né tekjur. Eyði notandi auglýsingu fellur boost-birting hennar niður, með fyrirvara um lögbundinn rétt. Ef boost getur varað lengur en auglýsingin er kaupandi upplýstur fyrir kaup um nauðsyn endurnýjunar auglýsingarinnar.`,
    ],
  },
  {
    title: "8. Verð, greiðslur og kaupstaðfesting",
    paragraphs: [
      `Greiðslur til Rentó varða aðeins eigin auglýsinga- og kynningarþjónustu Rentó. Verð eru birt í íslenskum krónum og með virðisaukaskatti og öðrum lögbundnum gjöldum eftir því sem við á. Greiðslur fara í gegnum þann greiðsluþjónustuveitanda sem tilgreindur er í kaupferlinu, nú Straumur Hosted Checkout. Rentó geymir ekki fullar greiðslukortaupplýsingar.`,
      `Áður en pöntun er gerð birtast upplýsingar um þjónustuna, heildarverð, upphaf og gildistíma, helstu skref samningsgerðar og möguleika á leiðréttingu villna. Greidd þjónusta virkjast þegar greiðsla hefur verið staðfest. Kaupandi fær kvittun eða kaupstaðfestingu á skráð netfang. Sé greiðsla misheppnuð, felld niður eða bakfærð getur Rentó stöðvað eða afturkallað virkjun nema notandi sýni fram á gilda greiðslu.`,
    ],
  },
  {
    title: "9. Afturköllunarréttur og endurgreiðslur",
    paragraphs: [
      `Neytandi hefur almennt 14 daga afturköllunarrétt frá því að samningur um kaup á þjónustu Rentó er gerður, nema lögmæt undantekning eigi við samkvæmt lögum nr. 16/2016 um neytendasamninga. Til að þjónusta hefjist innan frestsins þarf kaupferlið að afla skýrrar, sérstakrar og óforvalinnar beiðni neytanda um tafarlausa byrjun.`,
      `Falli neytandi frá kaupum eftir að þjónusta hófst að beiðni hans getur Rentó, að uppfylltum lögbundnum skilyrðum, krafist hlutfallslegrar greiðslu fyrir þann hluta þjónustunnar sem þegar hefur verið veittur. Virkjun viðbótarbirtingar eða boosts fellir ekki sjálfkrafa allan afturköllunarrétt niður.`,
      `Afturköllun skal tilkynna með ótvíræðri yfirlýsingu á info@rento.is. Staðlað afturköllunareyðublað er einnig aðgengilegt á rento.is. Rentó staðfestir móttöku og endurgreiðir innan lögbundins frests með sama greiðslumáta og notaður var, nema löglega sé samið um annað. Ónotkun þjónustu veitir ekki sjálfkrafa sérstakan endurgreiðslurétt umfram lögbundinn rétt. Ákvæðið takmarkar ekki rétt vegna vanefnda, galla, rangrar framkvæmdar eða tvígreiðslu.`,
    ],
  },
  {
    title: "10. Ábyrgð auglýsanda",
    paragraphs: [
      `Auglýsandi ber ábyrgð á því að hann eigi hlutinn eða hafi heimild til útleigu, að lýsing, verð og myndir séu réttar, að þekktir gallar komi fram og að hluturinn sé löglegur, öruggur og hæfur til fyrirhugaðrar notkunar. Hann ber einnig ábyrgð á nauðsynlegum leyfum, skráningum, öryggisskoðunum og tryggingum þegar þeirra er krafist. Sérreglur kunna að gilda um ökutæki, vélbúnað og aðra áhættusama hluti. Rentó sannreynir almennt ekki ástand eða eignarhald auglýstra hluta.`,
    ],
  },
  {
    title: "11. Samningar, tryggingar og skil",
    paragraphs: [
      `Leigusali og leigutaki semja sín á milli um leiguverð, greiðslur, leigutíma, afhendingu, skil, afbókun, tryggingarfé, skemmdir, tap, þjófnað og tryggingar. Rentó á ekki aðild að samningnum, tekur ekki við leigugreiðslum eða tryggingarfé og veitir ekki tryggingu á hlutum.`,
      `Rentó ábyrgist ekki að hlutur sé afhentur eða honum skilað á réttum tíma, eða að samningsaðili hafi greiðslugetu, rétt til útleigu eða efni loforð sín. Ágreiningur og bótaábyrgð ræðst af samningi milli notenda og gildandi lögum. Lögbundinni ábyrgð Rentó vegna eigin háttsemi er þó ekki vísað frá.`,
    ],
  },
  {
    title: "12. Bannaðir hlutir og óheimil notkun",
    paragraphs: [
      `Óheimilt er að auglýsa stolna, ólöglega, óörugga eða aðra hluti sem falla undir bannlista Rentó. Bannlistinn er aðgengilegur á rento.is og telst hluti þessara skilmála. Verulegar breytingar á bannlistanum skulu kynntar eftir því sem áhrif þeirra á virk réttindi og lög krefjast.`,
      `Óheimilt er að svíkja aðra, ógna eða áreita, senda ruslpóst, birta efni án réttinda, dreifa spillikóða, safna persónuupplýsingum ólöglega, misnota notendareikninga eða nota þjónustuna á annan hátt sem brýtur gegn lögum, réttindum annarra eða öryggi vettvangsins.`,
    ],
  },
  {
    title: "13. Skilaboð og persónuupplýsingar",
    paragraphs: [
      `Skilaboð milli notenda eru vistuð í kerfi Rentó til að auðvelda samskipti og rekstur þjónustunnar. Notendur skulu ekki senda lykilorð, greiðslukortaupplýsingar eða önnur viðkvæm auðkenningargögn í skilaboðum.`,
      `Meðferð persónuupplýsinga, aðgangur, varðveislutími, öryggi, eyðing og réttindi skráðra einstaklinga fara samkvæmt sérstakri persónuverndarstefnu Rentó. Um vafrakökur fer samkvæmt vafrakökustefnu. Rentó notar tæknilega þjónustuveitendur meðal annars vegna hýsingar og innskráningar og greiðsluþjónustuveitanda vegna eigin gjaldtöku.`,
    ],
  },
  {
    title: "14. Tilkynningar um brot",
    paragraphs: [
      `Notandi getur tilkynnt mögulegt ólöglegt efni eða brot gegn skilmálum í tilkynningaleið á vefnum eða á info@rento.is. Tilkynning skal, eftir því sem unnt er, innihalda slóð eða auðkenni auglýsingar, lýsingu á ætluðu broti, rök fyrir því að efnið sé ólögmætt eða brjóti gegn skilmálum og samskiptaupplýsingar tilkynnanda. Rentó getur óskað eftir frekari upplýsingum.`,
      `Við mat er tekið mið af eðli og alvarleika máls, öryggi notenda, réttindum aðila og gildandi lögum. Fjarlæging eða varðveisla auglýsingar jafngildir ekki staðfestingu Rentó á réttmæti allra upplýsinga eða krafna í málinu.`,
    ],
  },
  {
    title: "15. Fjarlæging auglýsinga og lokun reikninga",
    paragraphs: [
      `Rentó getur fjarlægt efni, takmarkað virkni eða lokað aðgangi ef notandi brýtur lög eða skilmála, veitir rangar eða villandi upplýsingar, reynir að svíkja eða skaða aðra, stofnar öryggi í hættu, misnotar ókeypis þjónustu eða greiðslukerfi, sniðgengur fyrri lokun eða neitar án málefnalegrar ástæðu réttmætri beiðni um staðfestingu upplýsinga.`,
      `Eftir því sem aðstæður leyfa beitir Rentó meðalhófi og veitir viðvörun áður en reikningi er lokað. Ekki þarf að vara við þegar brot er alvarlegt, hætta er yfirvofandi, lög krefjast tafarlausra aðgerða eða viðvörun gæti torveldað svikavarnir eða rannsókn máls. Þegar við á fær notandi upplýsingar um meginástæðu ákvörðunar og getur óskað endurskoðunar á info@rento.is.`,
      `Ef aðgangi er lokað vegna verulegs brots notanda á hann almennt ekki rétt á endurgreiðslu fyrir þann hluta greiddrar þjónustu sem fellur niður vegna brotsins, að því marki sem lög heimila. Sé aðgangi lokað án brots notanda skal Rentó eftir atvikum framlengja þjónustuna eða endurgreiða óveittan hluta hennar.`,
    ],
  },
  {
    title: "16. Eyðing reiknings og varðveisla gagna",
    paragraphs: [
      `Notandi getur óskað eyðingar reiknings í stillingum Rentó. Virkar auglýsingar hans falla þá úr birtingu, en eyðing reiknings fellir ekki niður eldri samningsskuldbindingar milli notenda.`,
      `Eyðing leiðir ekki nauðsynlega til tafarlausrar eyðingar allra gagna. Rentó kann að þurfa að varðveita takmarkaðar upplýsingar vegna bókhalds, greiðslna, svikavarna, ágreinings, réttarkrafna eða annarra lagaskyldna. Nánar fer um geymslutíma og eyðingu persónuupplýsinga samkvæmt persónuverndarstefnu. Lögbundinn endurgreiðsluréttur vegna eigin þjónustu Rentó fellur ekki niður við eyðingu reiknings.`,
    ],
  },
  {
    title: "17. Höfundaréttur og notendaefni",
    paragraphs: [
      `Notandi heldur réttindum að efni sem hann hleður upp en veitir Rentó takmarkað, óeinkaréttarlegt, endurgjaldslaust og tímabundið leyfi til að vista, afrita, aðlaga að tæknilegu sniði og birta efnið að því marki sem nauðsynlegt er til að starfrækja og birta viðkomandi auglýsingu innan þjónustunnar. Rentó er heimilt að fela tæknilegum þjónustuveitendum slíka vinnslu fyrir sína hönd.`,
      `Notandi ábyrgist að hann hafi rétt til að birta efnið og að það brjóti ekki gegn höfundarétti, vörumerkjarétti, friðhelgi einkalífs, persónuvernd eða öðrum réttindum. Almennt markaðsleyfi til notkunar efnis utan viðkomandi auglýsingar er ekki veitt með þessu ákvæði.`,
    ],
  },
  {
    title: "18. Rekstur og ábyrgð Rentó",
    paragraphs: [
      `Rentó leitast við að halda þjónustunni aðgengilegri og öruggri en ábyrgist ekki órofinn eða villulausan rekstur. Rentó getur tímabundið takmarkað aðgang vegna viðhalds, uppfærslna, öryggisatvika eða annarra tæknilegra eða rekstrarlegra ástæðna. Ef greidd þjónusta verður verulega óaðgengileg vegna atvika sem Rentó ber ábyrgð á skal Rentó veita viðeigandi úrbætur, svo sem framlengingu eða endurgreiðslu, eftir því sem lög og atvik máls krefjast.`,
      `Rentó ábyrgist hvorki að upplýsingar notenda séu réttar né að notendur hafi greiðslugetu, rétt til útleigu eða muni efna leigusamninga. Að því marki sem lög heimila ber Rentó ekki ábyrgð á ástandi, öryggi, lögmæti, afhendingu eða skilum auglýstra hluta, eða greiðslum og tryggingarfé milli notenda.`,
      `Rentó getur framkvæmt athuganir, fjarlægt efni eða gripið til annarra aðgerða án þess að það stofni almenna skyldu til að fylgjast með öllum auglýsingum eða samskiptum. Rentó ber ábyrgð á eigin brotum og vanrækslu samkvæmt lögum. Ekkert í skilmálunum útilokar ábyrgð sem ekki má takmarka, þar með talið lögbundna neytenda- og persónuvernd.`,
    ],
  },
  {
    title: "19. Kvartanir og úrlausn ágreinings",
    paragraphs: [
      `Kvörtun vegna eigin þjónustu Rentó, svo sem viðbótarbirtinga, boosts, greiðslna eða aðgangs, má senda á info@rento.is ásamt lýsingu máls og pöntunarnúmeri ef við á. Rentó leitast við að svara innan hæfilegs tíma og leysa málið með samkomulagi.`,
      `Náist ekki samkomulag getur neytandi leitað til lögbærra úrskurðaraðila, þar á meðal kærunefndar vöru- og þjónustukaupa þegar skilyrði þess eru uppfyllt. Ágreiningur um leigusamning milli notenda er þeirra á milli, nema lögbundin ábyrgð Rentó vegna eigin háttsemi sé til staðar.`,
    ],
  },
  {
    title: "20. Breytingar á skilmálum",
    paragraphs: [
      `Rentó getur breytt skilmálunum vegna breytinga á þjónustu, verðlagningu, tækni, rekstri, öryggi eða lögum. Verulegar breytingar eru almennt tilkynntar með minnst 14 daga fyrirvara nema þær séu notanda einungis til hagsbóta, stafi af lagaskyldu eða krefjist tafarlausra viðbragða vegna öryggis eða misnotkunar.`,
      `Breytingar hafa ekki afturvirk áhrif á þegar keypta þjónustu eða áunnin réttindi nema lög heimili það eða notandi samþykki sérstaklega. Þegar nýtt samþykki er nauðsynlegt skal Rentó afla þess.`,
    ],
  },
  {
    title: "21. Íslensk lög og samskipti",
    paragraphs: [
      `Um skilmála þessa og þjónustu Rentó gilda íslensk lög. Ágreining skal fyrst leitast við að leysa með samkomulagi. Að öðrum kosti má bera hann undir þar til bæra íslenska dómstóla samkvæmt almennum reglum, án þess að takmarka ófrávíkjanleg réttindi neytenda til að leita til annarra lögbærra úrlausnaraðila.`,
      `Samskipti vegna skilmálanna og þjónustu Rentó skulu send á info@rento.is. Rekstraraðili og heimilisfang eru tilgreind í 1. kafla.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Notendaskilmálar Rentó"
      subtitle="Gildistaka: 29. október 2026 | Síðast uppfært: 29. október 2026"
      sections={sections}
    />
  );
}
