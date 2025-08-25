import { Controller, Post, Get, Put, Body, Headers, HttpCode, HttpStatus, Logger, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyTokenDto, RegistrationRequestDto, UpdateRegistrationRequestDto } from './dto/auth.dto';
import { 
  LoginResponse, 
  UserValidationResponse, 
  ApiResponse, 
  RegistrationRequestDocument,
  UserCredentials
} from '@shoestore/shared-models';

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

  @Post('request-access')
  @HttpCode(HttpStatus.OK)
  async requestAccess(@Body() requestDto: RegistrationRequestDto): Promise<ApiResponse> {
    this.logger.log(`Access request from: ${requestDto.email}`);
    return await this.authService.submitRegistrationRequest(requestDto);
  }

  @Get('registration-requests')
  async getRegistrationRequests(): Promise<RegistrationRequestDocument[]> {
    this.logger.log('Fetching registration requests');
    return await this.authService.getRegistrationRequests();
  }

  @Put('registration-requests/:id')
  async updateRegistrationRequest(
    @Param('id') id: string,
    @Body() updateDto: UpdateRegistrationRequestDto
  ): Promise<{ success: boolean; message?: string; credentials?: UserCredentials }> {
    this.logger.log(`Updating registration request ${id} to ${updateDto.status}`);
    return await this.authService.updateRegistrationRequest(id, updateDto);
  }
}
