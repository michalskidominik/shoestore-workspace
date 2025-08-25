import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('No valid authorization header found');
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const validation = await this.authService.validateUser(token);

      if (!validation.success || !validation.user) {
        this.logger.warn('Invalid token provided');
        throw new UnauthorizedException('Access denied. Admin privileges required.');
      }

      // Check if user has admin role
      if (validation.user.role !== 'admin') {
        this.logger.warn(`User ${validation.user.email} attempted to access admin endpoint without admin role`);
        throw new UnauthorizedException('Access denied. Admin privileges required.');
      }

      // Attach user to request for use in controllers
      request.user = validation.user;

      this.logger.log(`Admin access granted to user: ${validation.user.email}`);
      return true;

    } catch (error) {
      this.logger.error(`Admin guard error: ${error.message}`);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }
  }
}
