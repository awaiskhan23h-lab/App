# Rehearse

Practise difficult conversations out loud before they happen: asking for a raise, negotiating an offer, ending a relationship, setting a boundary with a parent. The app plays the other person, then scores how you did and shows you exactly what to fix, quoting your own words.

## Features

- **Voice first**: tap the mic and speak; replies are read out loud (Web Speech API). Typing works everywhere as a fallback.
- **9 built-in scenarios** across work and personal life, plus **your own situation**
- **Three difficulty levels**: easy, realistic, tough
- **Scored feedback** (0–100): clear ask, hedging, apologising, filler words, blaming language, questions asked, rambling, plus your strongest line
- **Progress tracking**: history, average and best scores, stored on your device
- Installable PWA with dark mode

## Demo mode

The other person is currently played by a scripted **demo coach** (`src/lib/coach.ts`) that reacts to what you say: it pushes back harder when you sound unsure and acknowledges a clear ask. To switch to a real AI, implement the `Coach` interface with a call to a small server that holds the API key (never put the key in the app itself).

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm test         # run unit tests
npm run build    # typecheck + production build into dist/
```

Speech recognition works in Chrome, Edge and Safari. Firefox falls back to typing.
