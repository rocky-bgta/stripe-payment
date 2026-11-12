# Spring Boot backend

Java 21 / Spring Boot 3 backend for Stripe-hosted Checkout, webhook processing, and MongoDB payment persistence.

## Requirements

- JDK 21 and Maven 3.9+
- MongoDB running locally on port 27017
- Stripe test account and test API key
- Stripe CLI for local webhook forwarding

## Configure environment

Set variables in the **same terminal** where you run Maven. PowerShell example:

```powershell
$env:STRIPE_SECRET_KEY = "sk_test_REPLACE_ME"
$env:MONGODB_URI = "mongodb://localhost:27017/stripe_payment"
$env:FRONTEND_URL = "http://localhost:5173"
```

Open a separate terminal, run `stripe login` (first time only), then:

```bash
stripe listen --forward-to localhost:8080/api/stripe/webhook
```

The CLI prints a `whsec_...` signing secret. Set that value in the **backend terminal**:

```powershell
$env:STRIPE_WEBHOOK_SECRET = "whsec_REPLACE_ME"
```

These placeholders must be replaced with your own **test** credentials. Never commit credentials to GitHub. The webhook signing secret is different from the Stripe API key.

## Build and run

From the repository root:

```bash
cd backend
mvn clean verify
mvn spring-boot:run
```

Backend URL: http://localhost:8080.

The backend uses `application.yml` for configuration defaults. MongoDB database: `stripe_payment`; collection: `payments`.

## API endpoints

### Create Checkout Session

```http
POST /api/payments/checkout
Content-Type: application/json

{"amount":1000,"currency":"usd"}
```

Amount is in **cents**: `1000` means USD $10.00. Demo supports USD only, from $0.50 to $100,000.00.

Response contains `url` (Stripe Checkout redirect URL) and `paymentId`.

### Check payment status

```http
GET /api/payments/{paymentId}
GET /api/payments/by-session/{sessionId}
```

Possible statuses include `PENDING`, `SUCCESS`, `FAILED`, and `EXPIRED`.

### Stripe webhook

```http
POST /api/stripe/webhook
```

Stripe sends events here; do not call it manually without a valid Stripe signature. Webhook signature verification is required before updating the MongoDB record. Duplicate successful events do not reverse a successful payment.

## Local test sequence

1. Start MongoDB.
2. Start the Stripe CLI webhook listener.
3. Set the secret environment variables.
4. Start Spring Boot.
5. Start React in another terminal using [frontend instructions](../frontend/README.md).
6. Complete Stripe Checkout using a test card.
7. Confirm the backend receives a webhook and MongoDB status becomes `SUCCESS`.

## Troubleshooting

- **MongoDB connection refused:** ensure MongoDB is running and `MONGODB_URI` is correct.
- **Stripe authentication failure:** use a valid `sk_test_` key.
- **Webhook HTTP 400:** check the `whsec_` value from the currently running Stripe CLI listener.
- **Status remains PENDING:** inspect Stripe CLI event delivery and backend logs.
- **Build failure:** run `java -version` and `mvn -version` to confirm Java 21.

See [root README](../README.md) and [Stripe account setup](../docs/STRIPE_ACCOUNT_SETUP.md).
