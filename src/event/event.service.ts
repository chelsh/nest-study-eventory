import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from './event.repository';
import { CreateEventPayload } from './payload/create-event.payload';
import { EventListDto } from './dto/event.dto';
import { CreateEventData } from './type/create-event-data.type';
import { EventQuery } from './query/event.query';
import { EventDetailDto } from './dto/event-detail.dto';
import { EventStatus } from './enum/event-status.enum';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(payload: CreateEventPayload): Promise<EventDetailDto> {
    const categoryExistPromise = this.eventRepository.categoryExist(
      payload.categoryId,
    );
    const cityExistPromise = this.eventRepository.cityExist(payload.cityId);
    const [categoryExist, cityExist] = await Promise.all([
      categoryExistPromise,
      cityExistPromise,
    ]);

    if (!categoryExist) {
      throw new NotFoundException('해당 카테고리가 존재하지 않습니다.');
    }
    if (!cityExist) {
      throw new NotFoundException('해당 도시가 존재하지 않습니다.');
    }

    if (payload.startTime < new Date()) {
      throw new BadRequestException(
        'Event는 현재시간 이후에 시작할 수 있습니다.',
      );
    }

    if (payload.startTime >= payload.endTime) {
      throw new BadRequestException('Event는 시작 후에 종료될 수 있습니다.');
    }

    const user = await this.eventRepository.getUserById(payload.hostId);
    if (!user) {
      throw new NotFoundException('Host user가 존재하지 않습니다.');
    }

    const createData: CreateEventData = {
      hostId: payload.hostId,
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      cityId: payload.cityId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
    };

    const event = await this.eventRepository.createEvent(createData);

    const status =
      new Date() < event.startTime
        ? EventStatus.PENDING
        : event.endTime < new Date()
          ? EventStatus.COMPLETED
          : EventStatus.ONGOING;

    const joinedUsers = (
      await this.eventRepository.getJoinedUsers(event.id)
    ).map((user) => {
      return { id: user.id, name: user.name };
    });

    const reviews = await this.eventRepository.getReviews(event.id);

    return EventDetailDto.from({ ...event, status, joinedUsers, reviews });
  }

  async getEventById(eventId: number): Promise<EventDetailDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    const status =
      new Date() < event.startTime
        ? EventStatus.PENDING
        : event.endTime < new Date()
          ? EventStatus.COMPLETED
          : EventStatus.ONGOING;

    const joinedUsers = (
      await this.eventRepository.getJoinedUsers(event.id)
    ).map((user) => {
      return { id: user.id, name: user.name };
    });

    const reviews = await this.eventRepository.getReviews(event.id);

    return EventDetailDto.from({ ...event, status, joinedUsers, reviews });
  }

  async getEvents(query: EventQuery): Promise<EventListDto> {
    const events = await this.eventRepository.getEvents(query);
    return EventListDto.from(events);
  }

  async joinEvent(eventId: number, userId: number): Promise<void> {
    const userPromise = this.eventRepository.getUserById(userId);
    const eventPromise = this.eventRepository.getEventById(eventId);
    const [user, event] = await Promise.all([userPromise, eventPromise]);

    if (!user) {
      throw new NotFoundException('존재하지 않는 user입니다.');
    }
    if (!event) {
      throw new NotFoundException('존재하지 않는 event입니다.');
    }

    const isUserJoinedEvent = await this.eventRepository.isUserJoinedEvent(
      eventId,
      userId,
    );
    if (isUserJoinedEvent) {
      throw new ConflictException('user가 이미 참여 중인 event입니다.');
    }

    const countJoinedUsers =
      await this.eventRepository.countJoinedUsers(eventId);
    if (countJoinedUsers === event.maxPeople) {
      throw new ConflictException('이미 정원이 다 찬 event입니다.');
    }

    if (event.startTime < new Date()) {
      throw new ConflictException(
        '이미 시작된 event에는 참여할 수 없습니다.(진행 중이거나 종료됨)',
      );
    }

    await this.eventRepository.joinUserToEvent(eventId, userId);
  }

  async outEvent(eventId: number, userId: number): Promise<void> {
    const userPromise = this.eventRepository.getUserById(userId);
    const eventPromise = this.eventRepository.getEventById(eventId);
    const [user, event] = await Promise.all([userPromise, eventPromise]);

    if (!user) {
      throw new NotFoundException('존재하지 않는 user입니다.');
    }
    if (!event) {
      throw new NotFoundException('존재하지 않는 event입니다.');
    }

    const isUserJoinedEvent = await this.eventRepository.isUserJoinedEvent(
      eventId,
      userId,
    );
    if (!isUserJoinedEvent) {
      throw new ConflictException('user가 참여중이지 않은 event입니다.');
    }

    if (userId === event.hostId) {
      throw new ConflictException('host는 event에서 나갈 수 없습니다.');
    }

    if (event.startTime < new Date()) {
      throw new ConflictException(
        '이미 시작된 event에서는 나갈 수 없습니다.(진행 중이거나 종료됨)',
      );
    }

    await this.eventRepository.outUserFromEvent({ eventId, userId });
  }
}
