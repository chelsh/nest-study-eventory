import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateEventData } from './type/create-event-data.type';
import { EventData } from './type/event-data.type';
import { User } from '@prisma/client';
import { EventQuery } from './query/event.query';
import { EventDetailData } from './type/event-detail-data.type';
import { UpdateEventData } from './type/update-event-data.type';

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
        cityId: data.cityId,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
        eventJoin: {
          create: {
            userId: data.hostId,
          },
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        cityId: true,
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

  async cityExist(cityId: number): Promise<boolean> {
    const city = await this.prisma.city.findUnique({
      where: {
        id: cityId,
      },
    });

    return !!city;
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
        cityId: true,
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
        cityId: query.cityId,
        categoryId: query.categoryId,
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        cityId: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
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
    return this.prisma.event.update({
      where: { id: eventId },
      data: data,
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        cityId: true,
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

  async deleteEvent(eventId: number): Promise<void> {
    await this.prisma.event.delete({
      where: { id: eventId },
    });
  }
}
