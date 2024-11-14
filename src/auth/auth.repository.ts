import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { UserBaseInfo } from './type/user-base-info.type';
import { SignUpData } from './type/sign-up-data.type';
import { UpdateUserData } from './type/update-user-data.type';
import { City } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: SignUpData): Promise<UserBaseInfo> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        birthday: data.birthday,
        cityId: data.cityId,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        birthday: true,
        cityId: true,
      },
    });
  }

  async updateUser(id: number, data: UpdateUserData): Promise<UserBaseInfo> {
    return this.prisma.user.update({
      where: {
        id: id,
      },
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        birthday: data.birthday,
        cityId: data.cityId,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        birthday: true,
        cityId: true,
      },
    });
  }

  async getUserById(id: number): Promise<UserBaseInfo | null> {
    return this.prisma.user.findUnique({
      where: {
        id: id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        birthday: true,
        cityId: true,
      },
    });
  }

  async getUserByEmail(email: string): Promise<UserBaseInfo | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        birthday: true,
        cityId: true,
      },
    });
  }

  async getCityById(id: number): Promise<City | null> {
    return this.prisma.city.findUnique({
      where: {
        id,
      },
    });
  }
}
