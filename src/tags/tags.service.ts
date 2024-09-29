import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { DrizzleService } from '../db/drizzle.service';
import { eq } from 'drizzle-orm';
import { databaseSchema } from 'src/db/schemas';

@Injectable()
export class TagsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(tag: CreateTagDto) {
    try {
      const createdTags = await this.drizzleService.db
        .insert(databaseSchema.tags)
        .values(tag)
        .returning();

      return createdTags.pop();
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all tags`;
  }

  async findOne(id: number) {
    try {
      const tag = await this.drizzleService.db.query.tags.findFirst({
        where: eq(databaseSchema.tags.id, id),
      });

      if (!tag) throw new NotFoundException();
    } catch (error) {
      throw error;
    }
  }

  update(id: number, tag: UpdateTagDto) {
    return `This action updates a #${id} category ${tag}`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
