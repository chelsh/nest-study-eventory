import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateEventData } from './type/create-event-data.type';
import { EventData } from './type/event-data.type';
import { JoinState, User } from '@prisma/client';
import { EventQuery } from './query/event.query';
import { EventDetailData } from './type/event-detail-data.type';
import { UpdateEventData } from './type/update-event-data.type';
import { ClubData } from 'src/club/type/club-data.type';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(data: CreateEventData): Promise<EventDetailData> {
    return this.prisma.event.create({
      data: {
        hostId: data.hostId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        eventCity: {
          createMany: {
            data: data.cityIdList.map((cityId) => ({
              cityId: cityId,
            })),
          },
        },
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
        eventJoin: {
          create: {
            userId: data.hostId,
          },
        },
        isArchiveEvent: data.isArchiveEvent,
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        eventCity: {
          select: {
            cityId: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
        eventJoin: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        clubId: true,
        isArchiveEvent: true,
        review: {
          select: {
            id: true,
            eventId: true,
            userId: true,
            score: true,
            title: true,
            description: true,
          },
        },
      },
    });
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
  }

  async categoryExist(categoryId: number): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    return !!category;
  }

  async citiesExist(cityIdList: number[]): Promise<boolean[]> {
    const cities = await this.prisma.city.findMany({
      where: {
        id: {
          in: cityIdList,
        },
      },
      select: { id: true },
    });

    const existingCityIds = cities.map((city) => city.id);

    return cityIdList.map((cityId) => existingCityIds.includes(cityId));
  }

  async joinUserToEvent(eventId: number, userId: number): Promise<void> {
    await this.prisma.eventJoin.create({
      data: { eventId, userId },
    });
  }

  async getEventById(eventId: number): Promise<EventDetailData | null> {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        eventCity: {
          select: {
            cityId: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
        eventJoin: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        clubId: true,
        isArchiveEvent: true,
        review: {
          select: {
            id: true,
            eventId: true,
            userId: true,
            score: true,
            title: true,
            description: true,
          },
        },
      },
    });
  }

  async getEvents(query: EventQuery): Promise<EventData[]> {
    return await this.prisma.event.findMany({
      where: {
        hostId: query.hostId,
        eventCity: {
          some: {
            cityId: query.cityId,
          },
        },
        categoryId: query.categoryId,
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        eventCity: {
          select: {
            cityId: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
        clubId: true,
        isArchiveEvent: true,
      },
    });
  }

  async isUserJoinedEvent(eventId: number, userId: number): Promise<boolean> {
    const eventJoin = await this.prisma.eventJoin.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
        user: {
          deletedAt: null,
        },
      },
    });

    return !!eventJoin;
  }

  async countJoinedUsers(eventId: number): Promise<number> {
    const countJoinedUsers = await this.prisma.eventJoin.count({
      where: {
        eventId,
        user: {
          deletedAt: null,
        },
      },
    });

    return countJoinedUsers;
  }

  async outUserFromEvent(eventId: number, userId: number): Promise<void> {
    await this.prisma.eventJoin.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  async updateEvent(
    eventId: number,
    data: UpdateEventData,
  ): Promise<EventDetailData> {
    return this.prisma.$transaction(async (prisma) => {
      if (data.cityIdList === undefined) {
        return prisma.event.update({
          where: { id: eventId },
          data: {
            title: data.title,
            description: data.description,
            categoryId: data.categoryId,
            startTime: data.startTime,
            endTime: data.endTime,
            maxPeople: data.maxPeople,
          },
          select: {
            id: true,
            hostId: true,
            title: true,
            description: true,
            categoryId: true,
            eventCity: {
              select: {
                cityId: true,
              },
            },
            startTime: true,
            endTime: true,
            maxPeople: true,
            clubId: true,
            isArchiveEvent: true,
            eventJoin: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            review: {
              select: {
                id: true,
                eventId: true,
                userId: true,
                score: true,
                title: true,
                description: true,
              },
            },
          },
        });
      }

      await prisma.eventCity.deleteMany({
        where: { eventId },
      });

      return prisma.event.update({
        where: { id: eventId },
        data: {
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          eventCity: {
            createMany: {
              data:
                data.cityIdList?.map((cityId) => ({
                  cityId: cityId,
                })) || [],
            },
          },
          startTime: data.startTime,
          endTime: data.endTime,
          maxPeople: data.maxPeople,
        },
        select: {
          id: true,
          hostId: true,
          title: true,
          description: true,
          categoryId: true,
          eventCity: {
            select: {
              cityId: true,
            },
          },
          startTime: true,
          endTime: true,
          maxPeople: true,
          clubId: true,
          isArchiveEvent: true,
          eventJoin: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          review: {
            select: {
              id: true,
              eventId: true,
              userId: true,
              score: true,
              title: true,
              description: true,
            },
          },
        },
      });
    });
  }

  async deleteEvent(eventId: number): Promise<void> {
    await this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  async getMyEvents(userId: number): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        eventJoin: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        eventCity: {
          select: {
            cityId: true,
          },
        },
        startTime: true,
        endTime: true,
        maxPeople: true,
        clubId: true,
        isArchiveEvent: true,
      },
    });
  }

  async isJoinedClub(clubId: number, userId: number): Promise<boolean> {
    const isJoined = await this.prisma.clubJoin.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
        joinState: JoinState.JOINED,
      },
    });

    return !!isJoined;
  }

  async getJoinedClubs(userId: number): Promise<ClubData[]> {
    return this.prisma.club.findMany({
      where: {
        clubJoin: {
          some: {
            userId,
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
