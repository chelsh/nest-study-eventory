import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { UpdateEventData } from './type/update-event-data.type';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(
    userId: number,
    payload: CreateEventPayload,
  ): Promise<EventDetailDto> {
    const [categoryExist, citiesExist] = await Promise.all([
      this.eventRepository.categoryExist(payload.categoryId),
      this.eventRepository.citiesExist(payload.cityIdList),
    ]);

    if (!categoryExist) {
      throw new NotFoundException('해당 카테고리가 존재하지 않습니다.');
    }
    if (citiesExist.includes(false)) {
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

    if (payload.clubId) {
      const isJoinedClub = await this.eventRepository.isJoinedClub(
        payload.clubId,
        userId,
      );
      if (!isJoinedClub) {
        throw new ForbiddenException(
          '클럽 전용 모임은 클럽 회원만 개설할 수 있습니다.',
        );
      }
    }

    const createData: CreateEventData = {
      hostId: userId,
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      cityIdList: payload.cityIdList,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
      clubId: payload.clubId,
      isArchiveEvent: false,
    };

    const event = await this.eventRepository.createEvent(createData);

    return EventDetailDto.from(event);
  }

  async getEventById(userId: number, eventId: number): Promise<EventDetailDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (event.clubId) {
      const isJoinedClub = await this.eventRepository.isJoinedClub(
        event.clubId,
        userId,
      );
      if (!isJoinedClub) {
        throw new ForbiddenException(
          '클럽 전용 모임은 클럽 회원만 조회 가능합니다.',
        );
      }
    }

    if (event.isArchiveEvent) {
      const isUserJoinedEvent = await this.eventRepository.isUserJoinedEvent(
        event.id,
        userId,
      );
      if (!isUserJoinedEvent) {
        throw new ForbiddenException(
          '아카이브 모임은 해당 모임에 참여했던 회원만 조회 가능합니다.',
        );
      }
    }

    return EventDetailDto.from(event);
  }

  async getEvents(query: EventQuery, userId: number): Promise<EventListDto> {
    const events = await this.eventRepository.getEvents(query);

    const joinedClubs = await this.eventRepository.getJoinedClubs(userId);
    const joinedClubIds = joinedClubs.map((club) => club.id);

    const joinedEvents = await this.eventRepository.getMyEvents(userId);
    const joinedEventIds = joinedEvents.map((event) => event.id);

    const filteredEvents = events.filter((event) => {
      // 클럽 전용 모임이면 클럽 회원만 조회 가능
      if (event.clubId && !joinedClubIds.includes(event.clubId)) {
        return false;
      }

      // 아카이브 모임(삭제된 클럽의 모임)이면 참여했던 회원만 조회 가능
      if (event.isArchiveEvent && !joinedEventIds.includes(event.id)) {
        return false;
      }

      return true;
    });

    return EventListDto.from(filteredEvents);
  }

  async joinEvent(eventId: number, userId: number): Promise<void> {
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

    if (event.clubId) {
      const isJoinedClub = await this.eventRepository.isJoinedClub(
        event.clubId,
        userId,
      );
      if (!isJoinedClub) {
        throw new ForbiddenException(
          '클럽 전용 모임은 클럽 회원만 참여할 수 있습니다.',
        );
      }
    }

    await this.eventRepository.joinUserToEvent(eventId, userId);
  }

  async outEvent(eventId: number, userId: number): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);

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
    userId: number,
  ): Promise<EventDetailDto> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (event.hostId !== userId) {
      throw new ForbiddenException('host만 이벤트를 수정할 수 있습니다.');
    }

    if (payload.categoryId) {
      const categoryExist = await this.eventRepository.categoryExist(
        payload.categoryId,
      );
      if (!categoryExist) {
        throw new NotFoundException('해당 카테고리가 존재하지 않습니다.');
      }
    }

    if (payload.cityIdList) {
      const citiesExist = await this.eventRepository.citiesExist(
        payload.cityIdList,
      );

      if (citiesExist.includes(false)) {
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

    const updateEventData: UpdateEventData = {
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      cityIdList: payload.cityIdList,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
    };

    const updatedEvent = await this.eventRepository.updateEvent(
      eventId,
      updateEventData,
    );

    return EventDetailDto.from(updatedEvent);
  }

  async deleteEvent(eventId: number, userId: number): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (event.hostId !== userId) {
      throw new ForbiddenException('host만 이벤트를 삭제할 수 있습니다.');
    }

    if (event.startTime < new Date()) {
      throw new BadRequestException('이미 시작된 event는 삭제할 수 없습니다.');
    }

    return this.eventRepository.deleteEvent(eventId);
  }

  async getMyEvents(userId: number): Promise<EventListDto> {
    const myEvents = await this.eventRepository.getMyEvents(userId);

    return EventListDto.from(myEvents);
  }
}
