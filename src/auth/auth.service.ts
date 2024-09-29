import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { PgErrorCode } from 'src/db/utils/pg-code.enum';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword,
    );
    if (!isPasswordMatching) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async register(registerData: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerData.password, 10);

    try {
      const createdUser = await this.usersService.create({
        ...registerData,
        password: hashedPassword,
      });
      createdUser.password = undefined;
      return createdUser;
    } catch (error) {
      if (error?.code === PgErrorCode.UNIQUE_VIOLATION) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async login(email: string, password: string) {
    try {
      const user = await this.usersService.getByEmail(email);
      await this.verifyPassword(password, user.password);
      const backendTokens = await this.generateTokens(user);

      await this.usersService.setRefreshToken(
        backendTokens.refreshToken,
        user.id,
      );

      return {
        user,
        backendTokens,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async generateTokens(payload: any) {
    try {
      return {
        accessToken: await this.jwtService.signAsync(payload, {
          expiresIn: '1d',
          secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        }),
        refreshToken: await this.jwtService.signAsync(payload, {
          expiresIn: '7d',
          secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        }),
        expiresIn: new Date().setTime(
          new Date().getTime() +
            this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
        ),
      };
    } catch (error) {
      console.log(error);
    }
  }

  public async refreshToken(user: any) {
    const payload = {
      name: user.name,
      id: user.id,
      email: user.email,
    };
    const t = await this.generateTokens(payload);

    return t;
  }
}
