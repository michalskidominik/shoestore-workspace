import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyTokenDto } from './dto/auth.dto';
import { LoginResponse, UserValidationResponse } from '@shoestore/shared-models';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto): Promise<LoginResponse> {
    this.logger.log('Token verification request');
    return await this.authService.verifyToken(verifyTokenDto.idToken);
  }

  @Get('validate')
  async validateUser(@Headers('authorization') authorization?: string): Promise<UserValidationResponse> {
    this.logger.log('User validation request');

    if (!authorization) {
      return {
        success: false,
        valid: false,
        message: 'No authorization header provided'
      };
    }

    // Extract token from Bearer header
    const token = authorization.replace('Bearer ', '');

    if (!token) {
      return {
        success: false,
        valid: false,
        message: 'No token provided'
      };
    }

    return await this.authService.validateUser(token);
  }
}
