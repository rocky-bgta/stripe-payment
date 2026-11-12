# Stripe account and test API key setup

This guide explains how to create a Stripe account and configure **test-only** credentials for this React + Spring Boot demo.

## 1. Create or sign in to Stripe

1. Visit https://dashboard.stripe.com/register and sign up with your email address, or sign in at https://dashboard.stripe.com/login.
2. Verify your email if Stripe asks.
3. Open the Stripe Dashboard. Stripe may ask for business details or account verification; follow the dashboard's instructions. Availability and onboarding requirements vary by country.
4. For this demo, use a **sandbox/test environment**, not live payments. If your location or onboarding prevents account creation, do not enter a false country or business address.

**Country note:** Stripe does not generally support opening a live Stripe Payments merchant account for a Bangladesh-based business. Access to sandbox features may also depend on Stripe's account onboarding rules. This guide does not guarantee eligibility.

## 2. Find your test secret key

1. Open https://dashboard.stripe.com/test/apikeys (or navigate to **Developers → API keys** in the test/sandbox context).
2. Make sure you are viewing **test** data or the intended **sandbox**, not live mode.
3. Find the **Secret key** beginning with `sk_test_`. Click **Reveal test key** if shown, then copy it.
4. Never commit this key to GitHub, paste it into React, or share it in screenshots or logs.

Stripe's Dashboard navigation can change. See https://docs.stripe.com/keys for the current instructions.

The publishable key (`pk_test_...`) is safe to use in a browser when needed, but **this demo uses Stripe-hosted Checkout** and does not need the publishable key in React.

## 3. Configure the Spring Boot backend

The backend reads environment variables:

| Variable | Example | Purpose |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Creates Stripe Checkout Sessions |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Verifies webhook signatures |
| `MONGODB_URI` | `mongodb://localhost:27017/stripe_payment` | Local MongoDB |
| `FRONTEND_URL` | `http://localhost:5173` | Checkout return URLs |

For PowerShell (current terminal only):

```powershell
$env:STRIPE_SECRET_KEY = "sk_test_REPLACE_WITH_YOUR_TEST_KEY"
$env:MONGODB_URI = "mongodb://localhost:27017/stripe_payment"
$env:FRONTEND_URL = "http://localhost:5173"
```

Do not use the placeholder as an actual key.

## 4. Get the local webhook signing secret

1. Install the Stripe CLI: https://docs.stripe.com/stripe-cli
2. Sign in from a terminal with `stripe login`.
3. Run:

```bash
stripe listen --forward-to localhost:8080/api/stripe/webhook
```

4. The CLI prints a signing secret starting with `whsec_`. Copy it to the backend terminal:

```powershell
$env:STRIPE_WEBHOOK_SECRET = "whsec_REPLACE_WITH_CLI_VALUE"
```

The webhook signing secret is **not** the Stripe API secret key. Keep the CLI running while testing. If you restart the CLI and the signing secret changes, update the backend variable and restart Spring Boot.

## 5. Run the app and make a test payment

Start local MongoDB, then run:

```bash
cd backend
mvn spring-boot:run
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, enter an amount, and click **Pay with Stripe**.

On Stripe Checkout use:

- Card: `4242 4242 4242 4242`
- Expiry: any future valid date
- CVC: any three digits

After returning to the app, the status may initially be `PENDING`. The verified Stripe webhook updates the MongoDB payment record to `SUCCESS`. A browser redirect alone does not prove payment success.

For additional decline, authentication, and failure test cases see https://docs.stripe.com/testing.

## Security reminders

- Never put `sk_test_`, `sk_live_`, or `whsec_` values in source control.
- Use only test credentials and test cards for this demo.
- Do not expose your secret key through frontend environment variables prefixed with `VITE_`.
- Never accept the frontend success URL as proof of payment; verify Stripe webhook signatures server-side.
