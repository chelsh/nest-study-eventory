import { PrismaService } from '../common/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UpdateUserPayload } from './payload/update-user.payload';
import { UserData } from './type/user-data.type';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(userId: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async deleteUser(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async updateUser(
    userId: number,
    payload: UpdateUserPayload,
  ): Promise<UserData> {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: payload,
      select: {
        id: true,
        email: true,
        name: true,
        birthday: true,
        cityId: true,
      },
    });
  }

  async cityExist(cityId: number): Promise<boolean> {
    const city = await this.prisma.city.findUnique({
      where: {
        id: cityId,
      },
    });

    return !!city;
  }
}
