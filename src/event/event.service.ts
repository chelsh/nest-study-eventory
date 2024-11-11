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
import { UpdateEventPayload } from './payload/update-event.payload';

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

    return EventDetailDto.from(event);
  }

  async getEventById(eventId: number): Promise<EventDetailDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    return EventDetailDto.from(event);
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

    await this.eventRepository.outUserFromEvent(eventId, userId);
  }

  async updateEvent(
    eventId: number,
    payload: UpdateEventPayload,
  ): Promise<EventDetailDto> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (payload.categoryId) {
      const categoryExist = await this.eventRepository.categoryExist(
        payload.categoryId,
      );
      if (!categoryExist) {
        throw new NotFoundException('해당 카테고리가 존재하지 않습니다.');
      }
    }

    if (payload.cityId) {
      const cityExist = this.eventRepository.categoryExist(payload.cityId);
      if (!cityExist) {
        throw new NotFoundException('해당 도시가 존재하지 않습니다.');
      }
    }

    if (event.startTime < new Date()) {
      throw new BadRequestException(
        '이미 시작된 event는 수정할 수 없습니다.(진행 중이거나 종료됨)',
      );
    }

    const startTime = payload.startTime ? payload.startTime : event.startTime;
    const endTime = payload.endTime ? payload.endTime : event.endTime;
    if (startTime < new Date()) {
      throw new BadRequestException(
        'Event는 현재시간 이후에 시작할 수 있습니다.',
      );
    }
    if (startTime >= endTime) {
      throw new BadRequestException('Event는 시작 후에 종료될 수 있습니다.');
    }

    if (payload.maxPeople) {
      const countJoinedUsers =
        await this.eventRepository.countJoinedUsers(eventId);
      if (payload.maxPeople < countJoinedUsers) {
        throw new BadRequestException(
          '최대 참여 인원은 현재 참여한 인원보다 적게 설정할 수 없습니다.',
        );
      }
    }

    const updatedEvent = await this.eventRepository.updateEvent(
      eventId,
      payload,
    );

    return EventDetailDto.from(updatedEvent);
  }
}
