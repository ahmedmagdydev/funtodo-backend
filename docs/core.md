flowchart LR
A[Hardware] --> B[Cloud]
B --> C[Web Dashboard]
C --> D[Multi-Tier Access]
D --> D1(Basic: 5 Sensors)
D --> D2(Pro: 50 Sensors)
D --> D3(Enterprise: 500+ Sensors)

sequenceDiagram
participant Sensor
participant MQTT Broker
participant Backend
participant Frontend
participant Stripe

    Sensor->>MQTT Broker: Publish data (TLS 1.3)
    MQTT Broker->>Backend: Forward to authenticated topics
    Backend->>Frontend: WebSocket relay (filtered by tier)
    Frontend->>Backend: JWT-auth API calls
    Backend->>Stripe: Handle subscription events
