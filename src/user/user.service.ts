import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly db: DbService) {}

  async findByEmail(email: string) {
    return await this.db.user.findUnique({
      where: { email },
    });
  }

  async create(createUserDto: CreateUserDto) {
    return await this.db.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        provider: createUserDto.provider,
        providerId: createUserDto.providerId,
      },
    });
  }
}
