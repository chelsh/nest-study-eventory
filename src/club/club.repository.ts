import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateClubData } from './type/create-club-data.type';
import { ClubData } from './type/club-data.type';
import { JoinState } from '@prisma/client';

@Injectable()
export class ClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async clubNameExist(clubName: string): Promise<boolean> {
    const club = await this.prisma.club.findUnique({
      where: {
        name: clubName,
      },
    });

    return !!club;
  }

  async createClub(data: CreateClubData): Promise<ClubData> {
    return this.prisma.club.create({
      data: {
        hostId: data.hostId,
        name: data.name,
        description: data.description,
        maxPeople: data.maxPeople,
        clubJoin: {
          create: {
            userId: data.hostId,
            joinState: JoinState.JOINED,
          },
        },
      },
    });
  }

  async getClubById(clubId: number): Promise<ClubData | null> {
    return this.prisma.club.findUnique({
      where: {
        id: clubId,
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

  async getJoinState(
    clubId: number,
    userId: number,
  ): Promise<JoinState | undefined> {
    const clubJoin = await this.prisma.clubJoin.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
        user: {
          deletedAt: null,
        },
      },
      select: {
        joinState: true,
      },
    });

    return clubJoin?.joinState;
  }

  async countJoinedUsers(clubId: number): Promise<number> {
    const countJoinedUsers = await this.prisma.clubJoin.count({
      where: {
        clubId,
        user: {
          deletedAt: null,
        },
        joinState: JoinState.JOINED,
      },
    });

    return countJoinedUsers;
  }

  async joinClub(clubId: number, userId: number): Promise<void> {
    await this.prisma.clubJoin.create({
      data: { clubId, userId, joinState: JoinState.PENDING },
    });
  }

  async outClub(clubId: number, userId: number): Promise<void> {
    return this.prisma.$transaction(async (prisma) => {
      const clubEventsJoinedByUser = await prisma.event.findMany({
        where: {
          clubId,
          eventJoin: {
            some: {
              userId,
            },
          },
        },
      });

      clubEventsJoinedByUser.map(async (event) => {
        //이벤트 시작 전인 경우) 호스트면 이벤트 삭제, 일반 참여자면 모임에서 나가기
        if (new Date() < event.startTime) {
          if (event.hostId === userId) {
            await prisma.event.delete({
              where: {
                id: event.id,
              },
            });
          } else {
            await prisma.eventJoin.delete({
              where: {
                eventId_userId: {
                  eventId: event.id,
                  userId,
                },
              },
            });
          }
        }
      });

      await this.prisma.clubJoin.delete({
        where: {
          userId_clubId: {
            userId,
            clubId,
          },
        },
      });
    });
  }
}
