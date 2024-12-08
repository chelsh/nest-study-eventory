import { PrismaService } from '../common/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { UserData } from './type/user-data.type';
import { UpdateUserData } from './type/update-user-data.type';
import { ClubData } from 'src/club/type/club-data.type';
import { JoinState } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(userId: number): Promise<UserData | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        birthday: true,
        cityId: true,
      },
    });
  }

  async getUserByEmail(email: string): Promise<UserData | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        birthday: true,
        cityId: true,
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

  async updateUser(userId: number, data: UpdateUserData): Promise<UserData> {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: data,
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

  async getJoinedClubs(userId: number): Promise<ClubData[]> {
    return this.prisma.club.findMany({
      where: {
        clubJoin: {
          some: {
            userId,
            joinState: JoinState.JOINED,
          },
        },
      },
      select: {
        id: true,
        hostId: true,
        name: true,
        description: true,
        maxPeople: true,
      },
    });
  }
}
