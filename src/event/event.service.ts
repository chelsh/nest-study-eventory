import {
  BadRequestException,
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
      throw new BadRequestException('해당 카테고리가 존재하지 않습니다.');
    }

    const isCityExist = await this.eventRepository.isCityExist(payload.cityId);
    if (!isCityExist) {
      throw new BadRequestException('해당 도시가 존재하지 않습니다.');
    }

    if (payload.startTime < new Date()) {
      throw new BadRequestException(
        'Event는 현재시간 이후에 시작할 수 있습니다.',
      );
    }

    if (payload.startTime >= payload.endTime) {
      throw new BadRequestException('Event는 시작 후에 종료될 수 있습니다.');
    }

    if (payload.maxPeople < 2) {
      throw new BadRequestException('Event에는 2명 이상 참가해야 합니다.');
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
}
