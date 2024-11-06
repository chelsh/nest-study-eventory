import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from './event.repository';
import { CreateEventPayload } from './payload/create-event.payload';
import { EventDto, EventListDto } from './dto/event.dto';
import { CreateEventData } from './type/create-event-data.type';
import { EventQuery } from './query/event.query';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(payload: CreateEventPayload): Promise<EventDto> {
    const isCategoryExist = await this.eventRepository.isCategoryExist(
      payload.categoryId,
    );
    if (!isCategoryExist) {
      throw new NotFoundException('해당 카테고리가 존재하지 않습니다.');
    }

    const isCityExist = await this.eventRepository.isCityExist(payload.cityId);
    if (!isCityExist) {
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

    //host를 event 참여 인원에 추가
    await this.eventRepository.joinUserToEvent({
      eventId: event.id,
      userId: event.hostId,
    });

    return EventDto.from(event);
  }

  async getEventById(eventId: number): Promise<EventDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    return EventDto.from(event);
  }

  async getEvents(query: EventQuery): Promise<EventListDto> {
    const events = await this.eventRepository.getEvents(query);
    return EventListDto.from(events);
  }

  async joinEvent(eventId: number, userId: number): Promise<void> {
    const user = await this.eventRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundException('존재하지 않는 user입니다.');
    }

    const event = await this.eventRepository.getEventById(eventId);
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

    const isEventFull = await this.eventRepository.isEventFull(eventId);
    if (isEventFull) {
      throw new ConflictException('이미 정원이 다 찬 event입니다.');
    }

    if (event.startTime < new Date()) {
      throw new ConflictException(
        '이미 시작된 event입니다.(진행 중이거나 종료됨)',
      );
    }

    await this.eventRepository.joinUserToEvent({ eventId, userId });
  }
}
