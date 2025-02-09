## Frontend

- WebAssembly data parsers
- Virtualized sensor lists
- CDN-hosted assets
- **Real User Monitoring**:
  - Track paint timing (LCP, FID, CLS)
  - Session replay for error diagnosis
  - Web Vitals threshold alerts

## Backend

- MQTT QoS 1 guarantees
- Connection pooling
- TimescaleDB compression

## Network

- Protobuf encoding
- HTTP/3 prioritization
- Brotli compression
- **CSP Policies**:
  ```
  connect-src 'self' https://*.stripe.com wss://mqtt-broker.example.com;
  script-src 'self' https://js.stripe.com/v3/;
  ```
