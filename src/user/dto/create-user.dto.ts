export class CreateUserDto {
  email: string;
  name?: string;
  provider: string;
  providerId: string;
}