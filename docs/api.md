# Sensor Dashboard API v1

**Base URL**: `https://api.yourdomain.com/v1`  
**Authentication**: `Authorization: Bearer <JWT_TOKEN>`

---

## Authentication

### Login

`POST /auth/login`

**Request Body**:

```json
{
  "email": "user@company.com",
  "password": "securePassword123!"
}
```

## Success Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "def456xyz",
  "tier": "pro",
  "sensor_limit": 50,
  "rate_limit": 1000,
  "data_retention": "720h"
}
```

## Subscription Management

- POST /subscriptions/create-checkout-session

### Request Body:

```json
{
  "tier": "pro",
  "success_url": "https://app.yourdomain.com/success",
  "cancel_url": "https://app.yourdomain.com/cancel"
}
```

### Success Response

```json
{
  "session_id": "cs_test_a1B2c3D4e5F6G7H8i9J0k"
}
```

## Sensor Management

### Register Sensor

`POST /sensors/register`

## Error Responses

```json
{
  "error": "subscription_limit_exceeded",
  "message": "Pro tier allows maximum 50 sensors",
  "upgrade_url": "/v1/subscriptions/upgrade"
}
