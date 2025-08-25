# Firebase Integration Documentation

## Overview

This API integrates with Firebase Admin SDK for authentication and Firestore database operations. The integration is designed for production deployment on Render.com with proper security and configuration management.

## Firebase Services

### 1. Firebase Authentication
- User management and verification
- Custom token generation
- ID token validation
- User claims management

### 2. Firestore Database
- Document CRUD operations
- Pagination and filtering
- Batch operations and transactions
- Collection management

### 3. Firebase Storage
- File upload and management
- Secure URL generation
- Access control

### 4. Firebase Messaging (Optional)
- Push notifications
- Topic management

## Configuration

### Environment Variables

#### Option 1: Firebase Config JSON (Recommended for Render.com)
```bash
FIREBASE_CONFIG='{"type":"service_account","project_id":"shoestore-d2e97","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@shoestore-d2e97.iam.gserviceaccount.com",...}'
```

#### Option 2: Individual Environment Variables (Fallback)
```bash
FIREBASE_PROJECT_ID=shoestore-d2e97
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@shoestore-d2e97.iam.gserviceaccount.com
```

#### Optional URLs (Auto-generated if not provided)
```bash
FIREBASE_DATABASE_URL=https://shoestore-d2e97-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=shoestore-d2e97.appspot.com
```

## Usage Examples

### 1. Authentication Service Example

```typescript
import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase';

@Injectable()
export class AuthService {
  constructor(private firebaseAdmin: FirebaseAdminService) {}

  async verifyToken(idToken: string) {
    const decodedToken = await this.firebaseAdmin.verifyIdToken(idToken);
    return decodedToken;
  }

  async getUser(uid: string) {
    return await this.firebaseAdmin.getUser(uid);
  }
}
```

### 2. Firestore Database Example

```typescript
import { Injectable } from '@nestjs/common';
import { FirestoreService, FIRESTORE_COLLECTIONS } from '../firebase';

@Injectable()
export class UserService {
  constructor(private firestore: FirestoreService) {}

  async createUser(userData: any) {
    return await this.firestore.create(
      FIRESTORE_COLLECTIONS.USERS,
      userData
    );
  }

  async getUser(userId: string) {
    return await this.firestore.findById(
      FIRESTORE_COLLECTIONS.USERS,
      userId
    );
  }

  async getUsersPaginated(page: number = 1, pageSize: number = 10) {
    return await this.firestore.findMany(
      FIRESTORE_COLLECTIONS.USERS,
      { page, pageSize, orderBy: 'createdAt' }
    );
  }
}
```

## Health Checks

The API includes comprehensive Firebase health checks:

- **GET /health** - Overall health including Firebase status
- **GET /health/firebase** - Detailed Firebase services health

Health check verifies:
- Firestore connectivity
- Firebase Auth service
- Firebase Storage availability

## Error Handling

All Firebase operations include proper error handling with detailed logging:

```typescript
try {
  const result = await this.firebaseAdmin.verifyIdToken(token);
  return result;
} catch (error) {
  this.logger.error('Firebase operation failed', error.stack);
  throw new UnauthorizedException('Invalid token');
}
```

## Security Best Practices

1. **Environment Variables**: Never commit Firebase credentials to source control
2. **Token Validation**: Always validate Firebase ID tokens on protected routes
3. **User Claims**: Use custom claims for role-based access control
4. **Firestore Rules**: Implement proper security rules in Firebase Console
5. **CORS Configuration**: Restrict origins to your frontend applications

## Monitoring and Logging

- All Firebase operations are logged with appropriate levels
- Health checks provide service availability metrics
- Error tracking includes Firebase-specific error codes

## Firestore Collections

The integration defines standardized collection names:

```typescript
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CARTS: 'carts',
  // ... and more
};
```

## Production Deployment

### Render.com Configuration

1. Set the `FIREBASE_CONFIG` environment variable with the complete JSON
2. Ensure proper CORS origins are configured
3. Monitor health check endpoints for service availability

### Performance Considerations

- Firebase Admin SDK uses connection pooling
- Firestore operations include pagination for large datasets
- Batch operations minimize API calls
- Proper indexing should be configured in Firebase Console
