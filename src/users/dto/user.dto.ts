export class UserDto {
  email: string;
  name: string;
  password: string;
  phoneNumber?: string;
  refreshToken?: string;
  // address?: {
  //   street: string;
  //   city: string;
  //   country: string;
  // };
}
