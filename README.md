# MathBloom

Matematikából, szeretettel. Személyre szabható virágcsokrok, amelyek elforgatott ellipszisekből és irányított véletlenből születnek.

Ez a GitHub Pagesre előkészített változat. A virággenerátor, a színvilágok, a változatosság csúszka, a címzett és üzenet, az ajándék link és a PNG-képeslap böngészőben működik. Nincs szükség MATLAB-ra vagy buildre.

## Feltöltés

1. Csomagold ki a ZIP-et.
2. A `tomi546258-dev/mathbloom` kódtárban válaszd az **Add file → Upload files** lehetőséget.
3. A kicsomagolt `mathbloom` mappa **tartalmát** húzd a feltöltőmezőbe. Az `index.html` a kódtár legfelső szintjére kerüljön. A ZIP-fájlt magát ne töltsd fel.
4. Válaszd a **Commit changes** lehetőséget, a `main` ágra.
5. A **Settings → Pages** oldalon: **Deploy from a branch**, **main**, **/(root)**, majd **Save**.

A tervezett honlapcím: https://tomi546258-dev.github.io/mathbloom/

## Látogatásszámláló

A GitHub Pages nem futtat adatbázist vagy szerveroldali alkalmazást. A `counter-service` mappa a külön közzétehető Cloudflare Worker + D1 számlálót tartalmazza. A bekötés előtt a honlap „Látogatások: nem elérhető” szöveget mutat, és nem küld számlálókérést.

A számláló bekötéséhez kövesd a `counter-service/README.md` útmutatóját, majd a közzétett API-címet írd a `counter-config.js` fájl `endpoint` mezőjébe. A korábbi privát honlap címe nem megfelelő erre: az bejelentkezést kér, és nem fogadja a GitHub Pagesről érkező kéréseket.

Egy böngészős munkamenet egyszer számít. A frissítések ugyanazt a névtelen azonosítót használják; a megjelenő szám látogatások, nem egyedi személyek száma. Letiltott munkamenettároló esetén egy frissítés is új látogatás lehet. Az adatbázis csak véletlen azonosítók hashét tárolja; nem tárol IP-címet, nevet, címzettet vagy üzenetet.

## Fájlok

- `index.html`: a honlap.
- `style.css`: reszponzív megjelenés.
- `bloom-engine.js`: megismételhető virággenerátor.
- `app.js`: beállítások, ajándék linkek és képletöltés.
- `visits.js`, `counter-config.js`: a közös számláló megjelenítése és bekötése.
- `assets`: ikon és eredeti MATLAB-forrás.
- `counter-service`: a külön közzétehető számláló szolgáltatás.

A személyes üzenet a megosztott linkben szerepel. A link birtokosa elolvashatja. A honlap nem tárolja az üzeneteket adatbázisban.

## Ellenőrzés

A virágok azonos seed és beállítások mellett azonosak. A GitHub Pages változat relatív fájlutakat használ, így a `/mathbloom/` alkönyvtárban is működik. A számláló HTTPS végpontot fogad, és hibánál nem mutat kitalált számot.

Hivatalos GitHub Pages útmutató: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
