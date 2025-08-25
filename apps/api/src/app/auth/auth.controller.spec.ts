import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { FirestoreService } from '../firebase/firestore.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockFirebaseAdminService = {
    getAuth: jest.fn(),
  };

  const mockFirestoreService = {
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: FirebaseAdminService,
          useValue: mockFirebaseAdminService,
        },
        {
          provide: FirestoreService,
          useValue: mockFirestoreService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    it('should return login response', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse = {
        success: true,
        user: {
          id: 1,
          email: 'test@example.com',
          contactName: 'Test User',
          phone: '+1234567890',
          shippingAddress: {
            street: '123 Test Street',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          billingAddress: {
            street: '123 Test Street',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          invoiceInfo: {
            companyName: 'Test Company',
            vatNumber: 'TEST123456',
          },
        },
      };

      jest.spyOn(authService, 'login').mockResolvedValue(expectedResponse);

      const result = await controller.login(credentials);
      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(credentials);
    });
  });

  describe('logout', () => {
    it('should return logout response', async () => {
      const expectedResponse = {
        success: true,
        message: 'Logged out successfully',
      };

      jest.spyOn(authService, 'logout').mockResolvedValue(expectedResponse);

      const result = await controller.logout();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('refresh', () => {
    it('should return token response', async () => {
      const tokenDto = { token: 'test-token' };
      const expectedResponse = {
        success: true,
        token: 'new-token',
        expiresAt: Date.now() + 3600000,
      };

      jest.spyOn(authService, 'refreshToken').mockResolvedValue(expectedResponse);

      const result = await controller.refreshToken(tokenDto);
      expect(result).toEqual(expectedResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(tokenDto.token);
    });
  });

  describe('validate', () => {
    it('should return validation response with authorization header', async () => {
      const authorization = 'Bearer test-token';
      const expectedResponse = {
        success: true,
        valid: true,
        user: {
          id: 1,
          email: 'test@example.com',
          contactName: 'Test User',
          phone: '+1234567890',
          shippingAddress: {
            street: '123 Test Street',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          billingAddress: {
            street: '123 Test Street',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          invoiceInfo: {
            companyName: 'Test Company',
            vatNumber: 'TEST123456',
          },
        },
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(expectedResponse);

      const result = await controller.validateUser(authorization);
      expect(result).toEqual(expectedResponse);
      expect(authService.validateUser).toHaveBeenCalledWith('test-token');
    });

    it('should return error when no authorization header', async () => {
      const result = await controller.validateUser();
      expect(result).toEqual({
        success: false,
        valid: false,
        message: 'No authorization header provided',
      });
    });

    it('should return error when no token in authorization header', async () => {
      const result = await controller.validateUser('Bearer ');
      expect(result).toEqual({
        success: false,
        valid: false,
        message: 'No token provided',
      });
    });
  });
});
