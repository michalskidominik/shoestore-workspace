# Authentication Module

This module provides Firebase-based authentication endpoints for the NestJS API.

## Overview

The authentication system uses Firebase Admin SDK to handle user authentication, token management, and user validation. It supports email/password authentication with Firebase Auth integration.

## Endpoints

### POST `/api/auth/login`
Authenticates a user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "contactName": "User Name",
    "phone": "+1234567890",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "City",
      "postalCode": "12345",
      "country": "Country"
    },
    "billingAddress": {
      "street": "123 Main St",
      "city": "City",
      "postalCode": "12345",
      "country": "Country"
    },
    "invoiceInfo": {
      "companyName": "Company Name",
      "vatNumber": "VAT123456"
    }
  }
}
```

### POST `/api/auth/logout`
Logs out the current user (stateless operation).

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST `/api/auth/refresh`
Refreshes a Firebase token.

**Request Body:**
```json
{
  "token": "firebase-id-token"
}
```

**Response:**
```json
{
  "success": true,
  "token": "new-custom-token",
  "expiresAt": 1634567890123
}
```

### GET `/api/auth/validate`
Validates a user token and returns user information.

**Headers:**
```
Authorization: Bearer firebase-id-token
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "contactName": "User Name",
    // ... other user fields
  }
}
```

## Test User

For testing purposes, there's a predefined test user:

- **Email:** `b2b-test@sgats.com`
- **Password:** `test123`
- **Firebase UID:** `zMhqDEJXF0ZyspKK0s7HmIRFSfH2`

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `200 OK` - Successful operations
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid credentials or expired tokens
- `500 Internal Server Error` - Server-side errors

## Security Features

- Firebase Admin SDK integration for secure token validation
- Input validation using class-validator
- Proper error handling without exposing sensitive information
- Stateless authentication using Firebase tokens

## Dependencies

- Firebase Admin SDK
- class-validator for DTO validation
- class-transformer for data transformation
- NestJS core modules

## Usage

The authentication module is automatically imported in the main AppModule and provides authentication services throughout the application.
