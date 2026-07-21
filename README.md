# Fofr Pedro

Kyberpunkový 3D endless runner zasazený do Prahy. Hráč mění jízdní pruhy, dělá salta a skluzy, sbírá bonusy a vyhýbá se překážkám v postupně se zrychlující hře.

> Hra obsahuje drsný humor a narážky na návykové látky. Je určena pro dospělé publikum (18+).

## Funkce

- plynulé přebíhání mezi pruhy se shodnou vizuální a kolizní pozicí,
- odlišné typy překážek pro úhyb, salto a skluz,
- komba, násobič skóre, těsné průlety a detailní souhrn každého běhu,
- denní výzvy, mince a odemykání vzhledů,
- ovládání klávesnicí i dotykovými gesty včetně prvního interaktivního tutoriálu,
- pauza bez ztráty rozehrané hry,
- lokálně uložená rigovaná lidská postava se sedmi kosterními animacemi a bezpečným procedurálním fallbackem,
- procedurální noční Praha s PBR fasádami, tramvajovými zastávkami a odrazy na mokré vozovce,
- tři vzhledy postavy s 3D náhledem,
- lokální rekordy, žebříček a export/import postupu,
- oddělené nastavení hudby a efektů, vibrací, chvění kamery, omezeného pohybu a kvality grafiky,
- automatické přizpůsobení kvality slabším mobilním zařízením,
- instalovatelná PWA se základní offline podporou,
- responzivní rozhraní se zohledněním výřezů mobilních displejů.

## Ovládání

| Akce | Klávesnice | Mobil |
| --- | --- | --- |
| Pohyb | `←` / `→` | přejetí doleva / doprava |
| Salto | `↑` nebo mezerník | přejetí nahoru |
| Skluz | `↓` | přejetí dolů |
| Pauza | `Esc` | tlačítko pauzy |

## Lokální spuštění

Požadavky: Node.js 22 a npm.

```bash
npm ci
npm run dev
```

Aplikace nevyžaduje API klíč, externí backend ani síťové načítání herních assetů. Postup se ukládá pouze do `localStorage` prohlížeče. Model postavy i vybrané animace jsou součástí repozitáře; při chybě 3D assetu se použije procedurální fallback.

## Kontroly kvality

```bash
npm run typecheck
npm test
npm run build
```

Všechny kontroly lze spustit najednou příkazem `npm run check`. Stejný příkaz běží také v GitHub Actions u každého pull requestu.

## Technologie

React 19, TypeScript, Vite, Three.js, React Three Fiber, Drei a Tailwind CSS.

Licence a původ 3D modelů jsou popsané v [THIRD_PARTY_ASSETS.md](./THIRD_PARTY_ASSETS.md).
