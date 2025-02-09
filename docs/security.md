## Certificate Provisioning Flow

1. Factory Programming:

   - Generate unique keypair per sensor
   - Sign with company CA
   - Burn into secure element (TPM)

2. Backend Trust Store:
   - Deploy CA public cert to brokers
   - Map cert CommonName to tenantID (CN=tenant123_sensor456)

## Revocation Strategy

- Certificate Revocation List (CRL) endpoint
- OCSP stapling for real-time validation
- Automatic alerts when sensor exceeds 5 auth failures

## Authentication Flow

1. Sensor connects with pre-installed certificate
2. Broker validates certificate:
   - Valid signature chain
   - CN format: {tenantID}\_{sensorID}
3. Broker checks tenant's active subscription tier

## Attack Mitigations

- TLS 1.3 mandatory for all connections
- Certificate revocation via monthly CRL updates
- Rate limiting: 10 connections/second per sensor

## MQTT Broker Config Simplification

# Removed Features

OCSP_STAPLING=false
TPM_SUPPORT=false
