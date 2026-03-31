# CYBER HEIST

Cyberpunkowa gra logiczna 3D, w której gracz "hackuje" sieć poprzez łączenie węzłów (nodes) w poprawnej kolejności.

Projekt został zbudowany jako rozbudowane MVP i zawiera:
- główną mechanikę `Node Linking Puzzle`,
- kampanię 10 poziomów statycznych,
- proceduralny generator poziomów z walidacją rozwiązywalności,
- interaktywną mapę sieci 3D (`Network Map`) jako ekran wyboru poziomu.

## Demo Gameplay Loop

1. Boot terminal (`INITIALIZING SYSTEM...`)
2. Wejście do `Network Map`
3. Wybór poziomu
4. Rozwiązywanie puzzla 3D
5. Ekran sukcesu (`ACCESS GRANTED`) + score/grade
6. Kolejny poziom lub powrót do mapy

## Stack

- `React` + `Vite`
- `Three.js`
- `React Three Fiber` (`@react-three/fiber`)
- `@react-three/drei`
- `anime.js`
- `Zustand`
- Web Audio API (efekty dźwiękowe)

## Uruchomienie lokalne

### Wymagania
- Node.js 18+
- npm 9+

### Instalacja i start

```bash
npm install
npm run dev
```

Aplikacja uruchomi się domyślnie pod adresem: [http://localhost:5173](http://localhost:5173)

### Build produkcyjny

```bash
npm run build
npm run preview
```

## Sterowanie i zasady gry

### Podstawowa mechanika
- kliknięcie noda rozpoczyna/utrwala łańcuch,
- łączysz nody ruchem drag (pointer down/up),
- nie możesz odwiedzić tego samego noda drugi raz,
- nie możesz tworzyć przecinających się linii,
- wygrywasz, gdy aktywujesz wszystkie nody.

### Typy nodów
- `normal` - standardowy węzeł,
- `locked` - wymaga wcześniejszego aktywowania `unlockBy`,
- `corrupted` - przy błędnej interakcji może zresetować postęp,
- `boost` - przygotowany pod dalsze rozszerzenia mechanik.

### UI podczas poziomu
- `UNDO` - cofnięcie ostatniego ruchu,
- `RESTART` - restart aktualnego poziomu,
- `HINT` - podświetlenie kolejnego kroku z `solutionPath`,
- `LEVELS` - powrót do mapy sieci,
- `SETTINGS` - przełączniki (hinty, audio, tutorial).

## Scoring i progres

- mierzony jest czas przejścia poziomu,
- błędy dodają karę czasową,
- wynik końcowy zawiera:
  - `grade`: `S / A / B / C`,
  - `score`,
  - `time`.

Dane zapisywane w `localStorage`:
- odblokowane poziomy,
- najlepsze wyniki (`bestResults`) per poziom.

Klucz storage:
- `cyberheist-progress-v2`

## Poziomy

### Kampania statyczna
- 10 poziomów (`id: 1..10`) w `src/data/levels.js`
- każdy poziom zawiera m.in.:
  - `rules`,
  - `tutorial`,
  - `solutionPath`,
  - `nodes`,
  - `connections`,
  - opcjonalnie `blockedConnections`.

### Poziomy proceduralne
Generator znajduje się w `src/systems/proceduralLevels.js`.

Cechy generatora:
- seedowany pseudo-random,
- losowanie geometrii node'ów,
- budowanie bazowej ścieżki rozwiązania,
- dodawanie dodatkowych połączeń,
- walidacja rozwiązywalności (DFS + `canConnectNodes`).

Poziom proceduralny zostaje dodany do mapy i od razu odblokowany.

## Architektura projektu

```text
src/
 ├── components/
 │    ├── Scene.jsx
 │    ├── Node.jsx
 │    └── Connection.jsx
 │
 ├── data/
 │    └── levels.js
 │
 ├── store/
 │    └── useGameStore.js
 │
 ├── systems/
 │    ├── puzzleLogic.js
 │    ├── levelManager.js
 │    └── proceduralLevels.js
 │
 └── ui/
      ├── TerminalUI.jsx
      ├── LevelSelect.jsx
      └── NetworkMap.jsx
```

### Odpowiedzialności modułów
- `useGameStore.js` - centralny stan gry (phase, poziom, timer, scoring, progres, settings, event log),
- `puzzleLogic.js` - walidacja ruchów i reguły puzzla,
- `levelManager.js` - metadane i przejścia między poziomami,
- `proceduralLevels.js` - generowanie i walidacja proceduralnych leveli,
- `Scene.jsx` - render 3D planszy,
- `NetworkMap.jsx` - ekran wyboru poziomu w formie mapy 3D,
- `TerminalUI.jsx` - warstwa HUD/overlay.

## Eventy (wewnętrzny event log)

Store loguje m.in.:
- `onLevelStart`
- `onNodeClick`
- `onError`
- `onLevelComplete`
- `onRestart`
- `onProceduralLevelGenerated`

## Znane ograniczenia (aktualny stan)

- chunk JS jest duży (ostrzeżenie Vite podczas builda),
- część mechanik node typu `boost` jest fundamentem pod dalszy rozwój,
- brak backendu i leaderboardu online (offline-only).

## Roadmap (propozycja)

- pełna mechanika `boost/corrupted/locked` v2,
- efekty shaderowe (glitch/chromatic aberration),
- fake terminal commands (`scan`, `breach`, `override`),
- leaderboard online (Firebase/Supabase),
- tryb `Hardcore`.

## Debug / Troubleshooting

Jeśli ekran jest pusty:
1. usuń cache i odpal ponownie dev server,
2. sprawdź konsolę przeglądarki (runtime errors),
3. sprawdź build:

```bash
npm run build
```

Jeśli coś nadal nie działa, zacznij od plików:
- `src/ui/NetworkMap.jsx`
- `src/store/useGameStore.js`
- `src/components/Scene.jsx`
