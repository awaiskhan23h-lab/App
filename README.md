# Split It

Split shared expenses with friends, roommates, or travel buddies, and settle up in the fewest payments.

## Features

- **Groups** for trips, flats, or nights out, each with its own members and currency (USD, EUR or GBP, defaulting to the visitor's region)
- **Example groups** (Barcelona Weekend in €, London Flat in £, New York Road Trip in $) on first launch, so new visitors see the app in action
- **Expenses** split equally among selected people, or by exact amounts
- **Balances** showing who is owed and who owes
- **Settle up** suggests the minimum set of payments to make everyone even; record them with one tap (and undo)
- **Share summary** via the phone share sheet or clipboard
- **Private by default**: everything is stored on your device, with JSON export/import for backups
- **Installable PWA** with offline support and automatic dark mode

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm test         # run unit tests
npm run build    # typecheck + production build into dist/
```

## How it works

Money is stored as integer cents. Equal splits hand out leftover cents one by one so shares always add up exactly.
Settle-up repeatedly matches the largest debtor with the largest creditor (`src/lib/money.ts`).
