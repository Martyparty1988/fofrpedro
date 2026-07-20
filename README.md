# FofrPedro

Kyberpunkový 3D endless runner zasazený do Prahy. Hráč mění jízdní pruhy, dělá salta a skluzy, sbírá bonusy a vyhýbá se překážkám v postupně se zrychlující hře.

> Hra obsahuje drsný humor a narážky na návykové látky. Je určena pro dospělé publikum (18+).

## Funkce

- ovládání klávesnicí i dotykovými gesty,
- pauza bez ztráty rozehrané hry,
- rigovaná lidská postava s kosterní animací běhu a bezpečným procedurálním fallbackem,
- procedurální noční Praha s PBR fasádami, tramvajovými zastávkami a odrazy na mokré vozovce,
- tři vzhledy postavy s 3D náhledem,
- lokální rekordy, žebříček a export/import postupu,
- nastavení zvuku, vibrací, chvění kamery a omezeného pohybu,
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

Aplikace nevyžaduje API klíč ani externí backend. Postup se ukládá pouze do `localStorage` prohlížeče. Detailnější CC0 model postavy se načítá z verze připnuté na konkrétní commit; při nedostupnosti sítě se použije lokální rigovaný model a následně procedurální fallback.

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
