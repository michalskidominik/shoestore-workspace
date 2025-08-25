import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import * as admin from 'firebase-admin';

export interface FirestoreCollections {
  USERS: 'users';
  PRODUCTS: 'products';
  ORDERS: 'orders';
  CARTS: 'carts';
  CATEGORIES: 'productCategories';
  SIZE_TEMPLATES: 'sizeTemplates';
  USER_SESSIONS: 'userSessions';
  REGISTRATION_REQUESTS: 'registrationRequests';
  PASSWORD_RESET_TOKENS: 'passwordResetTokens';
  EMAIL_CHANGE_TOKENS: 'emailChangeTokens';
  STOCK_RESERVATIONS: 'stockReservations';
  ORDER_STATUS_HISTORY: 'orderStatusHistory';
  CURRENCY_CONFIG: 'currencyConfig';
  QUOTES: 'quotes';
  INVENTORY_MOVEMENTS: 'inventoryMovements';
  AUDIT_LOGS: 'auditLogs';
  USER_NOTIFICATIONS: 'userNotifications';
  NOTIFICATION_TEMPLATES: 'notificationTemplates';
  SAVED_SEARCHES: 'savedSearches';
  BUSINESS_ACCOUNTS: 'businessAccounts';
  SIZE_PREFERENCES: 'sizePreferences';
  SYSTEM_CONFIG: 'systemConfig';
}

export const FIRESTORE_COLLECTIONS: FirestoreCollections = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CARTS: 'carts',
  CATEGORIES: 'productCategories',
  SIZE_TEMPLATES: 'sizeTemplates',
  USER_SESSIONS: 'userSessions',
  REGISTRATION_REQUESTS: 'registrationRequests',
  PASSWORD_RESET_TOKENS: 'passwordResetTokens',
  EMAIL_CHANGE_TOKENS: 'emailChangeTokens',
  STOCK_RESERVATIONS: 'stockReservations',
  ORDER_STATUS_HISTORY: 'orderStatusHistory',
  CURRENCY_CONFIG: 'currencyConfig',
  QUOTES: 'quotes',
  INVENTORY_MOVEMENTS: 'inventoryMovements',
  AUDIT_LOGS: 'auditLogs',
  USER_NOTIFICATIONS: 'userNotifications',
  NOTIFICATION_TEMPLATES: 'notificationTemplates',
  SAVED_SEARCHES: 'savedSearches',
  BUSINESS_ACCOUNTS: 'businessAccounts',
  SIZE_PREFERENCES: 'sizePreferences',
  SYSTEM_CONFIG: 'systemConfig',
};

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Array<{
    field: string;
    operator: admin.firestore.WhereFilterOp;
    value: unknown;
  }>;
}

@Injectable()
export class FirestoreService {
  private readonly logger = new Logger(FirestoreService.name);
  private firestore: admin.firestore.Firestore;

  constructor(private firebaseAdminService: FirebaseAdminService) {}

  /**
   * Get Firestore instance (lazy initialization)
   */
  private getFirestore(): admin.firestore.Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseAdminService.getFirestore();
    }
    return this.firestore;
  }

  /**
   * Get collection reference
   */
  collection(collectionName: string): admin.firestore.CollectionReference {
    return this.getFirestore().collection(collectionName);
  }

  /**
   * Get document reference
   */
  doc(collectionName: string, docId: string): admin.firestore.DocumentReference {
    return this.getFirestore().collection(collectionName).doc(docId);
  }

  /**
   * Create a new document
   */
  async create<T>(collectionName: string, data: T, docId?: string): Promise<string> {
    try {
      const collection = this.collection(collectionName);

      if (docId) {
        await collection.doc(docId).set({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return docId;
      } else {
        const docRef = await collection.add({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return docRef.id;
      }
    } catch (error) {
      this.logger.error(`Failed to create document in ${collectionName}`, error.stack);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async findById<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const doc = await this.doc(collectionName, docId).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as T;
    } catch (error) {
      this.logger.error(`Failed to get document ${docId} from ${collectionName}`, error.stack);
      throw error;
    }
  }

  /**
   * Update document
   */
  async update<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    try {
      await this.doc(collectionName, docId).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      this.logger.error(`Failed to update document ${docId} in ${collectionName}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async delete(collectionName: string, docId: string): Promise<void> {
    try {
      await this.doc(collectionName, docId).delete();
    } catch (error) {
      this.logger.error(`Failed to delete document ${docId} from ${collectionName}`, error.stack);
      throw error;
    }
  }

  /**
   * Find documents with pagination and filtering
   */
  async findMany<T>(
    collectionName: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const {
        page = 1,
        pageSize = 10,
        orderBy,
        orderDirection = 'desc',
        filters = [],
      } = options;

      let query: admin.firestore.Query = this.collection(collectionName);

      // Apply filters
      filters.forEach((filter) => {
        query = query.where(filter.field, filter.operator, filter.value);
      });

      // Apply ordering
      if (orderBy) {
        query = query.orderBy(orderBy, orderDirection);
      }

      // Get total count
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query.offset(offset).limit(pageSize);

      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      const totalPages = Math.ceil(total / pageSize);

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to query documents from ${collectionName}`, error.stack);
      throw error;
    }
  }

  /**
   * Find documents with custom query
   */
  async findWithQuery<T>(
    query: admin.firestore.Query
  ): Promise<T[]> {
    try {
      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      this.logger.error('Failed to execute custom query', error.stack);
      throw error;
    }
  }

  /**
   * Execute transaction
   */
  async runTransaction<T>(
    updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>
  ): Promise<T> {
    try {
      return await this.getFirestore().runTransaction(updateFunction);
    } catch (error) {
      this.logger.error('Failed to execute transaction', error.stack);
      throw error;
    }
  }

  /**
   * Execute batch write
   */
  async batch(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: Record<string, unknown>;
  }>): Promise<void> {
    try {
      const batch = this.getFirestore().batch();

      operations.forEach(({ type, collection, docId, data }) => {
        const docRef = this.doc(collection, docId);

        switch (type) {
          case 'create':
            batch.set(docRef, {
              ...data,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...data,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      this.logger.error('Failed to execute batch operation', error.stack);
      throw error;
    }
  }

  /**
   * Get server timestamp
   */
  getServerTimestamp(): admin.firestore.FieldValue {
    return admin.firestore.FieldValue.serverTimestamp();
  }

  /**
   * Get array union
   */
  arrayUnion(...elements: unknown[]): admin.firestore.FieldValue {
    return admin.firestore.FieldValue.arrayUnion(...elements);
  }

  /**
   * Get array remove
   */
  arrayRemove(...elements: unknown[]): admin.firestore.FieldValue {
    return admin.firestore.FieldValue.arrayRemove(...elements);
  }

  /**
   * Get increment value
   */
  increment(n: number): admin.firestore.FieldValue {
    return admin.firestore.FieldValue.increment(n);
  }
}
