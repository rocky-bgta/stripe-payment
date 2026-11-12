# Stripe Sandbox Payment Demo

React + Vite frontend, Spring Boot 3 / Java 21 backend, local MongoDB and Stripe hosted Checkout.

## Requirements

- Java 21 and Maven
- Node.js 20+ and npm
- MongoDB running at localhost:27017
- Stripe account with **test** secret key
- Stripe CLI for local webhook forwarding

## Run

1. Set environment variables in the backend terminal:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Optional: `MONGODB_URI=mongodb://localhost:27017/stripe_payment`
2. Start Stripe CLI: `stripe listen --forward-to localhost:8080/api/stripe/webhook`. Copy its `whsec_...` signing secret to the backend environment.
3. Start backend: `cd backend && mvn spring-boot:run`.
4. Start frontend: `cd frontend && npm install && npm run dev`.
5. Open http://localhost:5173 and pay with test card `4242 4242 4242 4242`, any future expiry and any three-digit CVC.

The backend stores amounts in **cents**, and only USD is supported in this demo. The frontend never receives the Stripe secret key. Stripe webhook signatures are verified before updating MongoDB.

## Endpoints

- `POST /api/payments/checkout`: JSON `{"amount":1000,"currency":"usd"}`
- `GET /api/payments/{id}`: payment status
- `GET /api/payments/by-session/{sessionId}`: status for Checkout redirect
- `POST /api/stripe/webhook`: Stripe-signed webhook

**Important:** Checkout redirect is not proof of successful payment. The webhook is authoritative. This is a learning demo, not a complete production payment system.
