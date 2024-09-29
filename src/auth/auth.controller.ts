import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import RequestWithUser from './interface/request-with-user.interface';
import { Response } from 'express';
import { LogInDto } from './dto/logIn.dto';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from 'src/users/users.service';
import { TransformDataInterceptor } from 'src/utils/interceptor/transform-data.interceptor';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtGuard } from './guards/jwt-auth.guard';
import { RefreshJwtGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
@ApiTags('Auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  register(@Body() registerData: RegisterDto) {
    return this.authService.register(registerData);
  }

  @HttpCode(200)
  @Post('log-in')
  @UseInterceptors(new TransformDataInterceptor(UserResponseDto))
  async logIn(@Body() loginData: LogInDto) {
    const user = await this.authService.login(
      loginData.email,
      loginData.password,
    );
    return user;
  }

  @UseGuards(JwtGuard)
  @Post('log-out')
  async logOut(@Req() request: RequestWithUser, @Res() response: Response) {
    await this.usersService.removeRefreshToken(request.user.id);
    return response.sendStatus(200);
  }

  @UseGuards(JwtGuard)
  @Get()
  authenticate(@Req() request: RequestWithUser) {
    const user = request.user;
    user.password = undefined;
    return user;
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refresh(@Req() request: RequestWithUser) {
    return await this.authService.refreshToken(request.user);
  }
}
