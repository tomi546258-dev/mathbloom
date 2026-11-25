# MathBloom v7

Matematikából, szeretettel. Személyre szabható virágcsokrok, amelyek elforgatott ellipszisekből és irányított véletlenből születnek.

Ez a GitHub Pagesre előkészített változat. A virággenerátor, a fajtaválasztó, a színvilágok, a változatosság csúszka, a címzett és üzenet, az ajándék link és a PNG-képeslap böngészőben működik, magyarul és angolul. Nincs szükség MATLAB-ra vagy buildre.

## Újdonság a v7-ben: akár 18 virág

- A csúszkával 1–18 virág választható (eddig 9).
- 1–9 virágig a kézzel beállított elrendezés maradt: a régi linkek ugyanazt a csokrot nyitják meg, mint eddig.
- 10–18 virágnál a helyeket aranyszög-spirál (Vogel-spirál) adja egy kupola alakú csokorban. A virágok kisebbek, hogy elférjenek, középen kicsit nagyobbak, és a csokor mérete 9-ről 10-re sem ugrik.
- Csúszkahúzás közben képkockánként legfeljebb egyszer rajzol újra, így 18 virágnál is folyamatos marad.

## Javítás a v6-ban

- Széles képernyőn (1500 px fölött) a fejléc és a lábléc pontosan a tartalom szélével egy vonalban van. Eddig kilógtak: 1920 px-en kb. 20, 2560 px-en kb. 50 pixellel, és a nyelvváltó gomb túllógott a csokor dobozának jobb szélén. 1280 és 3440 px között minden szélességen ellenőrizve.

## Újdonság a v5-ben: angol nyelv

- **Nyelvváltó a fejlécben** (HU / EN). A bordó gomb rugózva átcsúszik, a kis MathBloom-virág megpördül, váltáskor szirmok pattannak szét. Aki még nem választott nyelvet, annak az oldal betöltése után egyszer megpulzál, hogy feltűnjön.
- **Automatikus nyelv:** aki magyar nyelvű böngészővel jön, magyarul látja az oldalt, mindenki más angolul. A választást a böngésző megjegyzi.
- **Közvetlen angol link,** például YouTube-leírásba: https://tomi546258-dev.github.io/mathbloom/?lang=en (magyarul: `?lang=hu`).
- **Az ajándéklink a küldő nyelvén nyílik meg** (`lang=en` vagy `lang=hu` a linkben); a címzett átválthatja. A saját üzenet szövege nem fordítódik.
- Angolul jelenik meg minden felirat, a kiírások, az üzenetek, a megosztás, a képeslap szövege és a látogatásszámláló is.
- **A fordítások helye:** a magyar szöveg az `index.html`-ben van, az angol az `i18n.js`-ben. Ha a magyar szövegen változtatsz, az angolt is írd át.
- **Nincs több mappa:** a `favicon.svg` és az eredeti MATLAB-kód (`mathbloom-original.m`) a legfelső szintre került, így a feltöltésnél nem tud kimaradni semmi.
- **A látogatásszámlálóhoz most sem nyúltunk:** a `visits.js` és a `counter-config.js` bájtra azonos. Az angol kiírást az `app.js` fordítja a `visits.js` által írt szövegből.

## Javítás a v4-ben

- A szirmok rétegeinek állítása már nem változtatja a virágok színét és szárát. Eddig (az első változatban is) minden virág ugyanabból a közös véletlenszám-sorból húzott, és a rétegszám elcsúsztatta ezt a sort.
- Új generátor-változat (`gen=2`): minden virágnak és szerepnek (szár, szín, szirmok, virágközép) saját véletlenfolyama van, így egy beállítás csak a saját hatását változtatja:
  - a rétegszám csak a szirmokat;
  - a virágszám nem színezi át és nem cseréli ki a megmaradó virágokat;
  - egy fajta ki- vagy bekapcsolása nem változtat a többi virág színén és szárán.
- A régi linkek (`gen` nélkül) a régi módon rajzolódnak, vagyis ugyanazt a csokrot nyitják meg, mint eddig.
- Az alkotóműhely kezdő csokra új seedet kapott (`MB–00001GT`).

## Javítás a v3-ban

- A változatosság csúszka már nem változtatja a virágok fajtáját. Azt, hogy melyik helyen milyen virág nyílik, csak a seed és a kiválasztott fajták döntik el; a csúszka a szirmok formáját, a virágok kis elmozdulását és a színeket állítja. A v2-vel 50% vagy nagyobb változatossággal készült linkek ugyanazt a csokrot nyitják meg.

## Újdonságok a v2-ben

- **Hét virágfajta:** dália, margaréta, rózsa, pipacs, tulipán, napraforgó, levendula. Többet is választhatsz, ilyenkor vegyes csokor nyílik. Mindegyik ugyanabból az ellipszisből épül, csak más szabály szerint rakja le: körben, aranyszög-spirálon, egy közös tő körül vagy mértani sorozat szerint csökkenő méretben.
- **Három új színvilág:** Rózsakert, Tenger, Ősz.
- **A régi linkek ugyanazt a csokrot nyitják meg,** mint eddig (klasszikus dália). Egy eltérés van: az alacsonyan ülő virágok szára már nem lóg le a kötés alá.
- **Az ajándéklink a `#` utáni részben** viszi a címzettet és az üzenetet, így ezek nem jutnak el a honlap szerveréhez. A régi, `?`-es linkek továbbra is működnek.
- **A szirom-képlet** most a tényleges szerkesztést írja le (eltolás és forgatás). Egy új kártya a virágközép aranyszög-spirálját mutatja.
- Csúszkahúzás közben nem villog a nyílás-animáció. Asztali nézetben a csokor görgetés közben is látszik.
- **A látogatásszámlálóhoz nem nyúltunk:** a `visits.js` és a `counter-config.js` bájtra azonos az előző változattal.

## Feltöltés

1. Csomagold ki a ZIP-et.
2. A `tomi546258-dev/mathbloom` kódtárban válaszd az **Add file → Upload files** lehetőséget.
3. A kicsomagolt `mathbloom` mappa **összes fájlját** húzd a feltöltőmezőbe (almappa nincs). Az `index.html` a kódtár legfelső szintjére kerüljön. A ZIP-fájlt magát ne töltsd fel.
4. Válaszd a **Commit changes** lehetőséget, a `main` ágra.
5. Ellenőrizd, hogy a kódtárban ott van az új `i18n.js` és a `favicon.svg`.
6. Ha szeretnéd, hogy az eredeti MATLAB-kód letölthető legyen, töltsd fel `mathbloom-original.m` néven a többi fájl mellé. A honlapon a letöltési link csak akkor jelenik meg, ha ez a fájl elérhető.
7. Ha korábban feltöltötted az `assets` mappát, az törölhető; a v5 már nem használja.

Ha a honlap már él, a **Settings → Pages** beállításokat nem kell újra elvégezni. Ha mégis: **Deploy from a branch**, **main**, **/(root)**, majd **Save**.

A honlapcím: https://tomi546258-dev.github.io/mathbloom/

A stíluslap és a szkriptek `?v=7` utótaggal töltődnek be, így a böngészők nem keverik a régi és az új fájlokat.

## Látogatásszámláló

A GitHub Pages nem futtat adatbázist vagy szerveroldali alkalmazást. A számláló egy külön közzétett Cloudflare Worker + D1 szolgáltatás; ennek forrása nem része ennek a csomagnak. A honlap a `counter-config.js` fájl `endpoint` mezőjében megadott HTTPS-címre küldi a kéréseket. Ha nincs megadva cím, a „Látogatások: nem elérhető” szöveg jelenik meg, és nem megy ki számlálókérés.

Egy böngészős munkamenet egyszer számít. A frissítések ugyanazt a névtelen azonosítót használják; a megjelenő szám látogatások, nem egyedi személyek száma. Letiltott munkamenettároló esetén egy frissítés is új látogatás lehet. Az adatbázis csak véletlen azonosítók hashét tárolja; nem tárol IP-címet, nevet, címzettet vagy üzenetet.

## Az ajándéklink felépítése

```
…/mathbloom/#view=gift&gen=2&lang=…&seed=…&count=…&layers=…&variation=…&palette=…&flowers=…&occasion=…&to=…&message=…
```

A `lang` (`hu` vagy `en`) a küldő nyelve; ezen nyílik meg az ajándékoldal. Ha hiányzik (régi link), a címzett böngészőjének nyelve dönt.

A `flowers` a fajták kódja: `d` dália, `m` margaréta, `r` rózsa, `p` pipacs, `t` tulipán, `n` napraforgó, `l` levendula (például `flowers=dmrt`). Ha hiányzik (régi link), klasszikus dália nyílik.

A `gen` a generátor-változat. A `gen=2` linkekben minden virág saját véletlenfolyamból dolgozik; a `gen` nélküli (régi) linkek a közös folyamos régi módon rajzolódnak, ahogy készültek.

A személyes üzenet a linkben szerepel: a link birtokosa elolvashatja. A honlap nem tárolja az üzeneteket adatbázisban.

## Fájlok

- `index.html`: a honlap.
- `style.css`: reszponzív megjelenés.
- `bloom-engine.js`: megismételhető virággenerátor (fajták, színvilágok).
- `app.js`: beállítások, fajtaválasztó, nyelvváltás, ajándék linkek és képletöltés.
- `i18n.js`: az angol fordítás és a program által összerakott szövegek mindkét nyelven.
- `visits.js`, `counter-config.js`: a közös számláló megjelenítése és bekötése (változatlan).
- `favicon.svg`: ikon. Mellé kerülhet az eredeti MATLAB-forrás (`mathbloom-original.m`).

## Ellenőrzés

- A virágok azonos seed és beállítások mellett azonosak.
- 1–9 virágig a v7 bájtra ugyanazt az SVG-t adja, mint a v6 (3000 véletlen beállításon). 10–18 virágnál is igaz, hogy a rétegszám nem változtatja a színeket, a szárakat és a fajtákat, és minden kiválasztott fajta szerepel.
- A régi, fajta nélküli linkek 3000 véletlen beállításon bitre ugyanazt az SVG-t adják, mint az első változat, a szárjavítástól eltekintve. A v2–v3 linkek bitre ugyanazt adják, mint a v3.
- `gen=2`-ben a rétegszám nem változtatja a színeket, a szárakat és a fajtákat.
- `gen=2`-ben a virágszám állításakor a megmaradó virágok megtartják a színüket és a fajtájukat; a helyük a darabszámhoz tartozó elrendezés szerint változik.
- A fajta cseréje nem rendezi át a többi virág helyét, szárát és színét.
- A változatosság csúszka nem mozgatja a fajtákat: 0 és 100% között minden állásban ugyanott ugyanaz a fajta nyílik.
- Ha legalább annyi virág van, ahány fajtát kiválasztottál, mindegyik fajta szerepel a csokorban. `gen=2`-ben két egymás utáni virág sosem azonos fajtájú.
- A GitHub Pages változat relatív fájlutakat használ, így a `/mathbloom/` alkönyvtárban is működik. A számláló HTTPS végpontot fogad, és hibánál nem mutat kitalált számot.
- Angol nézetben sehol nem marad magyar szöveg (a feliratokban, az akadálymentes címkékben és a kitöltési mintákban sem), és angolról visszaváltva az oldal betűre ugyanaz, mint előtte.

Hivatalos GitHub Pages útmutató: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
