import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: number;
  email: string;
  name: string;

  @Exclude()
  password: string;
  @Exclude()
  refreshToken: string;
}
