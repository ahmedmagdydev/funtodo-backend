# Frontend Stack

## Core Components

- React 18 + TypeScript
- Material-UI v5 components
- React-Query v4 for server state
- Redux Toolkit for global state

## Key Screens

1. Dashboard View
2. Device Registration
3. Subscription Management
4. Real-Time Charts

## Performance

- Lazy-loaded visualization modules
- WebSocket binary protocol support
- CSP-compliant asset loading

### Hosted Checkout (Initial Purchase)

```javascript
// Launch Stripe hosted page
const handleSubscribe = async (tier) => {
  const { sessionId } = await fetch("/v1/subscriptions/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ 
      tier,
      success_url: window.location.href,
      cancel_url: window.location.href
    }),
  });

  const stripe = await loadStripe(STRIPE_KEY);
  stripe.redirectToCheckout({ sessionId });
};
```

# UpgradeForm.jsx

```jsx
<Elements stripe={stripePromise}>
  <PaymentElement />
  <TierSelect onChange={setSelectedTier} />
  <button onClick={handleUpgrade}>Upgrade to {selectedTier}</button>
</Elements>
