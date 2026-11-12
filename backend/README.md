# Spring Boot backend

Java 21 / Spring Boot 3 backend for Stripe-hosted Checkout, webhook processing, and MongoDB payment persistence.

## Requirements

- JDK 21 and Maven 3.9+
- MongoDB running locally on port 27017
- Stripe test account and test API key
- Stripe CLI for local webhook forwarding

## Configure credentials without PowerShell environment variables

1. Copy `backend/.env.example` to `backend/.env`.
2. Open `backend/.env` in your editor and replace the placeholders with your own Stripe test credentials.
3. Run Maven **from the backend directory**, so Spring Boot can load `./.env`.

Example `backend/.env`:

```dotenv
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
MONGODB_URI=mongodb://localhost:27017/stripe_payment
FRONTEND_URL=http://localhost:5173
```

Spring Boot reads the file through `spring.config.import: optional:file:./.env[.properties]` in `application.yml`. No dotenv dependency or operating-system environment-variable setup is required. Use plain `KEY=value` lines, without `export` or surrounding quotes. Environment variables or command-line overrides can still be used when needed.

**Never commit `backend/.env`**: it is excluded by `.gitignore`. The checked-in `.env.example` contains placeholders only.

## Get the webhook signing secret

Open a separate terminal, run `stripe login` (first time only), then:

```bash
stripe listen --forward-to localhost:8080/api/stripe/webhook
```

Copy the CLI's `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `backend/.env`. The webhook URL is already mapped in the backend; it is not a secret and does not need to be configured in Stripe Dashboard for this local CLI setup. If the signing secret changes, update the file and restart Spring Boot.

## Build and run

From the repository root:

```bash
cd backend
mvn clean verify
mvn spring-boot:run
```

Backend URL: http://localhost:8080. MongoDB database: `stripe_payment`; collection: `payments`.

## API endpoints

- `POST /api/payments/checkout` with `{"amount":1000,"currency":"usd"}` creates a Checkout Session. Amount is in cents; 1000 means $10.00.
- `GET /api/payments/{paymentId}` retrieves payment status.
- `GET /api/payments/by-session/{sessionId}` retrieves the status for the Checkout redirect.
- `GET /api/payments?page=0&size=20` returns recent MongoDB payments.
- `POST /api/stripe/webhook` accepts signed Stripe events.

The browser redirect is **not** proof of payment. Only verified webhook events update payment status.

## Local test sequence

1. Start MongoDB.
2. Start Stripe CLI forwarding to the backend webhook endpoint.
3. Copy the CLI signing secret to `backend/.env`.
4. Start Spring Boot from the `backend` directory.
5. Start React from `frontend` using [frontend instructions](../frontend/README.md).
6. Use Stripe test card `4242 4242 4242 4242` with a future expiry and any three-digit CVC.
7. Check the dashboard and MongoDB for a `SUCCESS` payment.

## Troubleshooting

- **MongoDB connection refused:** check MongoDB and `MONGODB_URI`.
- **Stripe authentication error:** check `STRIPE_SECRET_KEY` and that it begins with `sk_test_`.
- **Webhook HTTP 400:** copy the signing secret from the currently running Stripe CLI listener.
- **Status remains PENDING:** check Stripe CLI delivery and backend logs.
- **.env not loaded:** run Maven from `backend/`, not the repository root, and check the filename is exactly `.env`.
- **Build failure:** check `java -version` and `mvn -version`.

See [Stripe account setup](../docs/STRIPE_ACCOUNT_SETUP.md).
