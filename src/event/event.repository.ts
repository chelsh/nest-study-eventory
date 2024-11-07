import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateEventData } from './type/create-event-data.type';
import { EventData } from './type/event-data.type';
import { User } from '@prisma/client';
import { EventQuery } from './query/event.query';
import { EventDetailData, EventStatus } from './type/event-detail-data.type';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(data: CreateEventData): Promise<EventDetailData> {
    const createdEvent = await this.prisma.event.create({
      data: {
        hostId: data.hostId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        cityId: data.cityId,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
      },
    });

    await this.joinUserToEvent({
      eventId: createdEvent.id,
      userId: createdEvent.hostId,
    });

    const { status, joinedUsers, reviews } = await this.getMoreEventDetail(
      createdEvent.id,
      createdEvent.startTime,
      createdEvent.endTime,
    );

    return { ...createdEvent, status, joinedUsers, reviews };
  }

  //get status, joinedUsers, reviews
  async getMoreEventDetail(eventId: number, startTime: Date, endTime: Date) {
    const status =
      new Date() < startTime
        ? EventStatus.PENDING
        : endTime < new Date()
          ? EventStatus.COMPLETED
          : EventStatus.ONGOING;

    const joinedUserObjects = await this.prisma.eventJoin.findMany({
      where: { eventId, user: { deletedAt: null } },
      select: { user: { select: { id: true, name: true } } },
    });
    const joinedUsers = joinedUserObjects.map((userObj) => {
      return { id: userObj.user.id, name: userObj.user.name };
    });

    const reviews = await this.prisma.review.findMany({
      where: { eventId },
    });

    return { status, joinedUsers, reviews };
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
  }

  async isCategoryExist(categoryId: number): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    return !!category;
  }

  async isCityExist(cityId: number): Promise<boolean> {
    const city = await this.prisma.city.findUnique({
      where: {
        id: cityId,
      },
    });

    return !!city;
  }

  async joinUserToEvent({
    eventId,
    userId,
  }: {
    eventId: number;
    userId: number;
  }): Promise<void> {
    await this.prisma.eventJoin.create({
      data: { eventId, userId },
    });
  }

  async getEventById(eventId: number): Promise<EventDetailData | null> {
    const event = await this.prisma.event.findUnique({
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
      },
    });

    if (!event) return event;

    const { status, joinedUsers, reviews } = await this.getMoreEventDetail(
      event.id,
      event.startTime,
      event.endTime,
    );

    return { ...event, status, joinedUsers, reviews };
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

  //isEventFull 대신 countJoinedUsers로 대체
  // async isEventFull(eventId: number): Promise<boolean> {
  //   const event = await this.prisma.event.findUnique({
  //     where: { id: eventId },
  //   });
  //   const countJoinedUsers = await this.prisma.eventJoin.count({
  //     where: { eventId, user: { deletedAt: null } },
  //   });

  //   return event!.maxPeople === countJoinedUsers;
  // }

  async countJoinedUsers(eventId: number): Promise<number> {
    const countJoinedUsers = await this.prisma.eventJoin.count({
      where: { eventId, user: { deletedAt: null } },
    });

    return countJoinedUsers;
  }

  async outUserFromEvent({
    eventId,
    userId,
  }: {
    eventId: number;
    userId: number;
  }): Promise<void> {
    await this.prisma.eventJoin.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }
}
