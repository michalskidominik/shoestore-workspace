import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { FirestoreService } from '../firebase/firestore.service';
import { 
  LoginResponse, 
  UserValidationResponse, 
  User, 
  RegistrationRequestDocument, 
  ApiResponse,
  UserCredentials
} from '@shoestore/shared-models';
import { RegistrationRequestDto, UpdateRegistrationRequestDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly firestore: FirestoreService
  ) {}

  async verifyToken(idToken: string): Promise<LoginResponse> {
    try {
      this.logger.log('Verifying Firebase ID token');

      // Get Firebase Auth service
      const auth = this.firebaseAdmin.getAuth();

      // Verify the ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      this.logger.log(`Token verified for user: ${decodedToken.email}`);

      // Get user from Firestore using the Firebase UID
      let userDoc = await this.firestore.findById('users', decodedToken.uid);

      if (!userDoc) {
        this.logger.log(`Creating new user document for UID: ${decodedToken.uid}`);

        // Create a user document if it doesn't exist
        const newUser: User = {
          id: parseInt(decodedToken.uid.slice(-8), 16), // Generate numeric ID from UID
          email: decodedToken.email || '',
          contactName: decodedToken.name || decodedToken.email?.split('@')[0] || '',
          phone: decodedToken.phone_number || '',
          role: 'user', // Default role is 'user', can be changed in Firebase custom claims or Firestore
          shippingAddress: {
            street: '',
            city: '',
            postalCode: '',
            country: ''
          },
          billingAddress: {
            street: '',
            city: '',
            postalCode: '',
            country: ''
          },
          invoiceInfo: {
            companyName: '',
            vatNumber: ''
          }
        };

        // Store user in Firestore with Firebase UID as document ID
        await this.firestore.create('users', newUser, decodedToken.uid);
        userDoc = newUser;

        this.logger.log(`Created user document for UID: ${decodedToken.uid}`);
      }

      const user = userDoc as User;
      this.logger.log(`Token verification successful for user: ${user.email}`);

      return {
        success: true,
        user
      };

    } catch (error) {
      this.logger.error(`Token verification error: ${error.message}`, error.stack);

      if (error.code === 'auth/id-token-expired') {
        return {
          success: false,
          message: 'Token has expired. Please log in again.'
        };
      }

      if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked') {
        return {
          success: false,
          message: 'Invalid token. Please log in again.'
        };
      }

      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  async validateUser(token: string): Promise<UserValidationResponse> {
    try {
      const auth = this.firebaseAdmin.getAuth();

      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(token);

      // Get user from Firestore
      const userDoc = await this.firestore.findById('users', decodedToken.uid);

      if (!userDoc) {
        this.logger.warn(`User document not found for UID: ${decodedToken.uid}`);
        return {
          success: false,
          valid: false,
          message: 'User not found'
        };
      }

      const user = userDoc as User;

      this.logger.log(`Token validated for user: ${user.email}`);

      return {
        success: true,
        valid: true,
        user
      };
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`, error.stack);

      if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return {
          success: false,
          valid: false,
          message: 'Invalid or expired token'
        };
      }

      return {
        success: false,
        valid: false,
        message: 'Token validation failed'
      };
    }
  }

  async submitRegistrationRequest(requestDto: RegistrationRequestDto): Promise<ApiResponse> {
    try {
      this.logger.log(`Processing registration request for email: ${requestDto.email}`);

      // Check if a pending or approved request already exists for this email
      const existingRequests = await this.firestore.findMany('registrationRequests', {
        filters: [
          { field: 'email', operator: '==', value: requestDto.email },
          { field: 'status', operator: 'in', value: ['pending', 'approved'] }
        ]
      });

      if (existingRequests.data.length > 0) {
        this.logger.warn(`Duplicate registration request for email: ${requestDto.email}`);
        throw new ConflictException('A registration request for this email already exists');
      }

      // Create registration request document
      const registrationRequest: Omit<RegistrationRequestDocument, 'id'> = {
        email: requestDto.email,
        companyName: requestDto.companyName,
        vatId: requestDto.vatId,
        phoneNumber: requestDto.phoneNumber,
        deliveryAddress: requestDto.deliveryAddress,
        acceptsTerms: requestDto.acceptsTerms,
        status: 'pending',
        submittedAt: new Date()
      };

      // Save to Firestore
      const docId = await this.firestore.create('registrationRequests', registrationRequest);
      
      this.logger.log(`Registration request created with ID: ${docId}`);

      // Log email content to console (as requested, no actual email sending)
      this.logRegistrationRequestEmail(registrationRequest);

      return {
        success: true,
        message: 'Your registration request has been submitted successfully. Our team will review it and contact you soon.'
      };

    } catch (error) {
      this.logger.error(`Registration request submission error: ${error.message}`, error.stack);
      
      if (error instanceof ConflictException) {
        throw error;
      }

      return {
        success: false,
        message: 'Failed to submit registration request. Please try again.'
      };
    }
  }

  async getRegistrationRequests(): Promise<RegistrationRequestDocument[]> {
    try {
      const result = await this.firestore.findMany<RegistrationRequestDocument>('registrationRequests', {
        orderBy: 'submittedAt',
        orderDirection: 'desc'
      });
      return result.data;
    } catch (error) {
      this.logger.error(`Error fetching registration requests: ${error.message}`, error.stack);
      return [];
    }
  }

  async updateRegistrationRequest(
    requestId: string, 
    updateDto: UpdateRegistrationRequestDto
  ): Promise<{ success: boolean; message?: string; credentials?: UserCredentials }> {
    try {
      this.logger.log(`Updating registration request ${requestId} to status: ${updateDto.status}`);

      // Get the registration request
      const request = await this.firestore.findById('registrationRequests', requestId);
      if (!request) {
        throw new NotFoundException('Registration request not found');
      }

      const registrationRequest = request as RegistrationRequestDocument;

      // Update the request
      const updateData = {
        status: updateDto.status,
        reviewedAt: new Date(),
        reviewedBy: updateDto.reviewedBy,
        rejectionReason: updateDto.rejectionReason,
        notes: updateDto.notes
      };

      await this.firestore.update('registrationRequests', requestId, updateData);

      let userCredentials: UserCredentials | undefined;

      if (updateDto.status === 'approved') {
        // Create user in Firebase Auth with temporary password
        userCredentials = await this.createFirebaseUser(registrationRequest);
        
        // Log approval email content
        this.logApprovalEmail(registrationRequest, userCredentials);
      } else if (updateDto.status === 'rejected') {
        // Log rejection email content
        this.logRejectionEmail(registrationRequest, updateDto.rejectionReason || 'No reason provided');
      }

      this.logger.log(`Registration request ${requestId} updated successfully`);

      return {
        success: true,
        message: `Registration request ${updateDto.status} successfully`,
        credentials: userCredentials
      };

    } catch (error) {
      this.logger.error(`Error updating registration request: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        success: false,
        message: 'Failed to update registration request'
      };
    }
  }

  private async createFirebaseUser(request: RegistrationRequestDocument): Promise<UserCredentials> {
    try {
      const auth = this.firebaseAdmin.getAuth();
      
      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: request.email,
        password: temporaryPassword,
        displayName: request.companyName,
        emailVerified: false
      });

      this.logger.log(`Firebase user created for ${request.email} with UID: ${userRecord.uid}`);

      // Create user document in Firestore
      const userData: User = {
        id: parseInt(userRecord.uid.slice(-8), 16),
        email: request.email,
        contactName: request.companyName,
        phone: request.phoneNumber,
        role: 'user',
        shippingAddress: request.deliveryAddress,
        billingAddress: request.deliveryAddress, // Use delivery address as billing initially
        invoiceInfo: {
          companyName: request.companyName,
          vatNumber: request.vatId
        }
      };

      await this.firestore.create('users', userData, userRecord.uid);

      return {
        email: request.email,
        temporaryPassword
      };

    } catch (error) {
      this.logger.error(`Error creating Firebase user: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateTemporaryPassword(): string {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private logRegistrationRequestEmail(request: Omit<RegistrationRequestDocument, 'id'>): void {
    console.log('\n=== NEW REGISTRATION REQUEST EMAIL ===');
    console.log('To: admin@mandraime.com');
    console.log('Subject: New B2B Registration Request');
    console.log('---');
    console.log(`Company: ${request.companyName}`);
    console.log(`Email: ${request.email}`);
    console.log(`VAT ID: ${request.vatId}`);
    console.log(`Phone: ${request.phoneNumber}`);
    console.log(`Address: ${request.deliveryAddress.street}, ${request.deliveryAddress.city}, ${request.deliveryAddress.postalCode}, ${request.deliveryAddress.country}`);
    console.log(`Submitted: ${request.submittedAt}`);
    console.log('=====================================\n');
  }

  private logApprovalEmail(request: RegistrationRequestDocument, credentials: UserCredentials): void {
    console.log('\n=== REGISTRATION APPROVED EMAIL ===');
    console.log(`To: ${request.email}`);
    console.log('Subject: Your B2B Access Request Has Been Approved');
    console.log('---');
    console.log(`Dear ${request.companyName},`);
    console.log('');
    console.log('Your B2B access request has been approved! You can now access MANDRAIME with the following credentials:');
    console.log('');
    console.log(`Email: ${credentials.email}`);
    console.log(`Temporary Password: ${credentials.temporaryPassword}`);
    console.log('');
    console.log('Please log in and change your password immediately.');
    console.log('===================================\n');
  }

  private logRejectionEmail(request: RegistrationRequestDocument, reason: string): void {
    console.log('\n=== REGISTRATION REJECTED EMAIL ===');
    console.log(`To: ${request.email}`);
    console.log('Subject: Your B2B Access Request Status');
    console.log('---');
    console.log(`Dear ${request.companyName},`);
    console.log('');
    console.log('We regret to inform you that your B2B access request has been rejected.');
    console.log(`Reason: ${reason}`);
    console.log('');
    console.log('If you have any questions, please contact our support team.');
    console.log('===================================\n');
  }
}
