# React frontend

React 18 + Vite frontend for the Stripe sandbox demo.

## Requirements

- Node.js 20+ and npm
- Backend running at http://localhost:8080

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
npm run preview
```

The production bundle is generated in `dist/`.

## Payment flow

1. Enter a USD amount and click **Pay with Stripe**.
2. React calls `POST /api/payments/checkout` via the Vite development proxy.
3. The backend creates a Stripe-hosted Checkout Session and returns its URL.
4. React redirects the browser to Stripe Checkout.
5. After Stripe redirects back, React checks `GET /api/payments/by-session/{sessionId}` every three seconds.

The browser redirect does **not** confirm successful payment. The backend updates MongoDB only after verifying Stripe's webhook.

## Test card

- Card number: `4242 4242 4242 4242`
- Expiration: any future valid date
- CVC: any three digits

Use only Stripe's test environment. The frontend does not need a Stripe secret key.

## Troubleshooting

- **API request fails:** confirm Spring Boot is running on port 8080.
- **Checkout cannot start:** check backend logs, MongoDB, and `STRIPE_SECRET_KEY`.
- **Payment remains PENDING:** check the Stripe CLI webhook forwarder and backend `STRIPE_WEBHOOK_SECRET`.

See [root README](../README.md) and [Stripe account setup](../docs/STRIPE_ACCOUNT_SETUP.md).
