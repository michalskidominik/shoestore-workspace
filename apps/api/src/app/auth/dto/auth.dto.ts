import { IsNotEmpty, IsString, IsEmail, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Address } from '@shoestore/shared-models';

export class VerifyTokenDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class AddressDto implements Address {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class RegistrationRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  vatId: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ValidateNested()
  @Type(() => AddressDto)
  deliveryAddress: AddressDto;

  @IsBoolean()
  acceptsTerms: boolean;
}

export class UpdateRegistrationRequestDto {
  @IsString()
  @IsNotEmpty()
  status: 'approved' | 'rejected';

  @IsString()
  rejectionReason?: string;

  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  reviewedBy: string;
}
