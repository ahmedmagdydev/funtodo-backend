# Backend Services

## Core Modules

- MQTT Broker (Aedes)
- Device Auth Service
- Stripe Webhook Handler
- WS Connection Manager

## API Characteristics

- RESTful principles for CRUD
- WebSocket for real-time data
- Rate-limited public endpoints
- JWT authentication

## Scaling Strategy

- Horizontal pod autoscaling
- Redis-backed session store
- Connection pooling for PostgreSQL

## MQTT Infrastructure

- **Broker:** Aedes (Node.js)
- **Authentication:**
  - Devices: X.509 certificates
  - Users: JWT role claims
- **Topic Structure:** {tenantID}/{location}/{sensorType}

## Subscription Enforcement

```javascript
// Middleware example
function checkSensorLimit(userTier) {
  const limits = { basic: 5, pro: 50 };
  return (req, res, next) => {
    if (user.sensors >= limits[userTier])
      throw new HTTPError(403, "Upgrade required");
    next();
  };
}
```

## Core Stripe Routes

1. Checkout Session Creation

```javascript
app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: STRIPE_PRICE_IDS[req.body.tier],
        quantity: 1,
      },
    ],
    success_url: `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${DOMAIN}/canceled`,
  });
  res.send({ sessionId: session.id });
});
```

```javascript
app.post(
  "/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      await handleNewSubscription(event.data.object);
    }
    res.status(200).end();
  }
);
```
