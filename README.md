# MathBloom v2

Matematikából, szeretettel. Személyre szabható virágcsokrok, amelyek elforgatott ellipszisekből és irányított véletlenből születnek.

Ez a GitHub Pagesre előkészített változat. A virággenerátor, a fajtaválasztó, a színvilágok, a változatosság csúszka, a címzett és üzenet, az ajándék link és a PNG-képeslap böngészőben működik. Nincs szükség MATLAB-ra vagy buildre.

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
3. A kicsomagolt `mathbloom` mappa **tartalmát** húzd a feltöltőmezőbe, **az `assets` mappával együtt**. Az `index.html` a kódtár legfelső szintjére kerüljön. A ZIP-fájlt magát ne töltsd fel.
4. Válaszd a **Commit changes** lehetőséget, a `main` ágra.
5. Ellenőrizd, hogy a kódtárban megjelent az `assets/favicon.svg`. Ha nem, a mappa kimaradt a feltöltésből. Ilyenkor: **Add file → Create new file**, a fájlnév legyen `assets/favicon.svg` (a perjel létrehozza a mappát), és másold bele a fájl tartalmát.
6. Az eredeti MATLAB-kódot tedd fel `assets/mathbloom-original.m` néven. A honlapon a letöltési link csak akkor jelenik meg, ha ez a fájl elérhető.

Ha a honlap már él, a **Settings → Pages** beállításokat nem kell újra elvégezni. Ha mégis: **Deploy from a branch**, **main**, **/(root)**, majd **Save**.

A honlapcím: https://tomi546258-dev.github.io/mathbloom/

A stíluslap és a szkriptek `?v=2` utótaggal töltődnek be, így a böngészők nem keverik a régi és az új fájlokat.

## Látogatásszámláló

A GitHub Pages nem futtat adatbázist vagy szerveroldali alkalmazást. A számláló egy külön közzétett Cloudflare Worker + D1 szolgáltatás; ennek forrása nem része ennek a csomagnak. A honlap a `counter-config.js` fájl `endpoint` mezőjében megadott HTTPS-címre küldi a kéréseket. Ha nincs megadva cím, a „Látogatások: nem elérhető” szöveg jelenik meg, és nem megy ki számlálókérés.

Egy böngészős munkamenet egyszer számít. A frissítések ugyanazt a névtelen azonosítót használják; a megjelenő szám látogatások, nem egyedi személyek száma. Letiltott munkamenettároló esetén egy frissítés is új látogatás lehet. Az adatbázis csak véletlen azonosítók hashét tárolja; nem tárol IP-címet, nevet, címzettet vagy üzenetet.

## Az ajándéklink felépítése

```
…/mathbloom/#view=gift&seed=…&count=…&layers=…&variation=…&palette=…&flowers=…&occasion=…&to=…&message=…
```

A `flowers` a fajták kódja: `d` dália, `m` margaréta, `r` rózsa, `p` pipacs, `t` tulipán, `n` napraforgó, `l` levendula (például `flowers=dmrt`). Ha hiányzik (régi link), klasszikus dália nyílik.

A személyes üzenet a linkben szerepel: a link birtokosa elolvashatja. A honlap nem tárolja az üzeneteket adatbázisban.

## Fájlok

- `index.html`: a honlap.
- `style.css`: reszponzív megjelenés.
- `bloom-engine.js`: megismételhető virággenerátor (fajták, színvilágok).
- `app.js`: beállítások, fajtaválasztó, ajándék linkek és képletöltés.
- `visits.js`, `counter-config.js`: a közös számláló megjelenítése és bekötése (változatlan).
- `assets/favicon.svg`: ikon. Ide kerül az eredeti MATLAB-forrás is (`mathbloom-original.m`).

## Ellenőrzés

- A virágok azonos seed és beállítások mellett azonosak.
- A klasszikus dália 3000 véletlen beállításon bitre ugyanazt az SVG-t adja, mint az első változat, a szárjavítástól eltekintve.
- A fajta cseréje nem rendezi át a többi virág helyét, szárát és színét.
- 0%-os változatosságnál a fajták sorrendje is rögzített; az új csokor ugyanilyen lesz.
- A GitHub Pages változat relatív fájlutakat használ, így a `/mathbloom/` alkönyvtárban is működik. A számláló HTTPS végpontot fogad, és hibánál nem mutat kitalált számot.

Hivatalos GitHub Pages útmutató: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
