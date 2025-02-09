## Must-Have Packages

- `mqtt.js@4.3.7` - MQTT client/server
- `stripe@12.0.0` - Payment processing
- `echarts-for-react@4.1.0` - Real-time dashboards
- `socket.io@4.7.2` - WebSocket layer

## Security Stack

- `node-forge` (basic cert validation)
- `@fastify/helmet` - HTTP headers
- `express-rate-limit` - API protection
- `mqtt-packet` - Validate MQTT packets

## Stripe Ecosystem

- `@stripe/stripe-js` (Frontend loader)
- `@stripe/react-stripe-js` (React wrappers)
- `stripe` (Node.js SDK)
- `body-parser` (Webhook handling)

## Security Additions

- `express-rate-limit` (Prevent checkout abuse)
- `uuid` (Idempotency keys)

## Core Dependencies

- React 18
- Redux Toolkit
- Stripe.js
- MQTT.js

## Utilities

- date-fns
- zod
- lodash-es
- immer

## Visualization

- ECharts (Primary)
- react-thermo (Specialized gauge displays)

_Removed Victory charts due to bundle size concerns_
