# Financial Dashboard

The goal of this project is to use the Plaid API to pull transactions and balances into a time series database and build a basic dashboard using Graphana.  Some long term goals would include building anomoly detection to get notified of significant changes in my accounts

## Getting Started

This is a pure TypeScript project that requires an inital build step before running.

```
npm install && npm run build
```

To run the application:

```
PLAID_CLIENT_ID=xxxx \
PLAID_SECRET=xxxx \
PLAID_PUBLIC_KEY=xxxx \
PLAID_PRODUCTS=transactions \
PLAID_ENV=sandbox \
node index.js
```
