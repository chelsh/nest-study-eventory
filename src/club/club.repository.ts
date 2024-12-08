import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateClubData } from './type/create-club-data.type';
import { ClubData } from './type/club-data.type';
import { JoinState } from '@prisma/client';
import { UpdateClubData } from './type/update-club-data.type';

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
      //이벤트 시작 전인 경우) 호스트면 이벤트 삭제, 일반 참여자면 모임에서 나가기
      const clubEventsJoinedByUser = await prisma.event.findMany({
        where: {
          clubId,
          eventJoin: {
            some: {
              userId,
            },
          },
        },
        select: {
          id: true,
          startTime: true,
          hostId: true,
        },
      });

      const deleteEvents = clubEventsJoinedByUser
        .filter(
          (event) => new Date() < event.startTime && event.hostId === userId,
        )
        .map((event) => event.id);

      const removeEventJoins = clubEventsJoinedByUser
        .filter(
          (event) => new Date() < event.startTime && event.hostId !== userId,
        )
        .map((event) => ({
          eventId: event.id,
        }));

      if (deleteEvents.length > 0) {
        await prisma.event.deleteMany({
          where: {
            id: { in: deleteEvents },
          },
        });
      }

      if (removeEventJoins.length > 0) {
        await prisma.eventJoin.deleteMany({
          where: {
            userId,
            eventId: {
              in: removeEventJoins.map((event) => event.eventId),
            },
          },
        });
      }

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

  async updateClub(clubId: number, data: UpdateClubData): Promise<ClubData> {
    return this.prisma.club.update({
      where: {
        id: clubId,
      },
      data,
    });
  }

  async deleteClub(clubId: number): Promise<void> {
    const clubEvents = await this.prisma.event.findMany({
      where: {
        clubId,
      },
    });
    return this.prisma.$transaction(async (prisma) => {
      prisma.club.delete({
        where: {
          id: clubId,
        },
      });

      const deleteEvents = clubEvents
        .filter((event) => new Date() < event.startTime)
        .map((event) => event.id);

      const updateToArchiveEvents = clubEvents
        .filter((event) => new Date() >= event.startTime)
        .map((event) => event.id);

      if (deleteEvents.length > 0) {
        await prisma.event.deleteMany({
          where: {
            id: {
              in: deleteEvents,
            },
          },
        });
      }

      if (updateToArchiveEvents.length > 0) {
        await prisma.event.updateMany({
          where: {
            id: {
              in: updateToArchiveEvents,
            },
          },
          data: {
            clubId: null,
            isArchiveEvent: true,
          },
        });
      }
    });
  }

  async delegate(clubId: number, userId: number): Promise<ClubData> {
    return this.prisma.club.update({
      where: { id: clubId },
      data: {
        hostId: userId,
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

  async approve(clubId: number, userId: number): Promise<void> {
    await this.prisma.clubJoin.update({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
      data: { joinState: JoinState.JOINED },
    });
  }

  async refuse(clubId: number, userId: number): Promise<void> {
    await this.prisma.clubJoin.update({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
      data: { joinState: JoinState.REFUSED },
    });
  }

  async getClubs(): Promise<ClubData[]> {
    return this.prisma.club.findMany({
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
