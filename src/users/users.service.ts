import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DrizzleService } from 'src/db/drizzle.service';
import { PgErrorCode } from 'src/db/utils/pg-code.enum';
import { UserAlreadyExistsException } from './exceptions/user-exists.exception';
import { isRecord } from 'src/utils/is-record';
import { eq } from 'drizzle-orm';
import { databaseSchema } from 'src/db/schemas';
import { PostgresTransaction } from 'src/db/pg-transaction';
import { isDatabaseError } from 'src/db/utils/db-error';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(user: CreateUserDto) {
    try {
      const createdUsers = await this.drizzleService.db
        .insert(databaseSchema.users)
        .values(user)
        .returning();
      return createdUsers.pop();
    } catch (error) {
      if (isRecord(error) && error.code === PgErrorCode.UNIQUE_VIOLATION) {
        throw new UserAlreadyExistsException(user.email);
      }
      throw error;
    }
  }

  async getByEmail(email: string) {
    const user = await this.drizzleService.db.query.users.findFirst({
      where: eq(databaseSchema.users.email, email),
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async setRefreshToken(refreshToken: string, userId: number) {
    const token = await bcrypt.hash(refreshToken, 10);
    await this.drizzleService.db
      .update(databaseSchema.users)
      .set({ refreshToken: token } as UpdateUserDto)
      .where(eq(databaseSchema.users.id, userId));
  }

  async removeRefreshToken(userId: number) {
    return await this.drizzleService.db
      .update(databaseSchema.users)
      .set({ refreshToken: null } as UpdateUserDto)
      .where(eq(databaseSchema.users.id, userId));
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user = await this.getById(userId);

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
  }

  async getById(userId: number) {
    const user = await this.drizzleService.db.query.users.findFirst({
      where: eq(databaseSchema.users.id, userId),
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, user: UpdateUserDto) {
    return `This action updates a #${id} user ${user}`;
  }

  async delete(userId: number, transaction?: PostgresTransaction) {
    const db = transaction ?? this.drizzleService.db;
    try {
      // return this.drizzleService.db.transaction(async (transaction) => {
      //   await transaction
      //     .delete(databaseSchema.articles)
      //     .where(eq(databaseSchema.articles.authorId, userId));
      // });
      const deletedUsers = await db
        .delete(databaseSchema.users)
        .where(eq(databaseSchema.users.id, userId))
        .returning();

      if (deletedUsers.length === 0) throw new NotFoundException();
    } catch (error) {
      if (
        isDatabaseError(error) &&
        error.code === PgErrorCode.FOREIGN_KEY_VIOLATION
      ) {
        throw new BadRequestException('Can not remove a user');
      }
      throw error;
    }
  }
}
