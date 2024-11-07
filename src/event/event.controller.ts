import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { EventDto, EventListDto } from './dto/event.dto';
import { CreateEventPayload } from './payload/create-event.payload';
import { EventQuery } from './query/event.query';
import { EventJoinOutPayload } from './payload/event-join-out.payload';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({ summary: '이벤트를 생성합니다' })
  @ApiCreatedResponse({ type: EventDto })
  async createEvent(@Body() payload: CreateEventPayload): Promise<EventDto> {
    return this.eventService.createEvent(payload);
  }

  @Get(':eventId')
  @ApiOperation({ summary: '이벤트 상세 정보를 조회합니다' })
  @ApiOkResponse({ type: EventDto })
  async getEventById(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<EventDto> {
    return this.eventService.getEventById(eventId);
  }

  @Get()
  @ApiOperation({
    summary:
      '조건(hostId, cityId, categoryId)에 따라 여러 개의 이벤트를 조회합니다.',
  })
  @ApiOkResponse({ type: EventListDto })
  async getEvents(@Query() query: EventQuery): Promise<EventListDto> {
    return this.eventService.getEvents(query);
  }

  @Post(':eventId/join')
  @ApiOperation({ summary: 'user가 이벤트에 참여합니다.' })
  @ApiNoContentResponse()
  async joinEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() payload: EventJoinOutPayload,
  ): Promise<void> {
    return this.eventService.joinEvent(eventId, payload.userId);
  }

  @Post(':eventId/out')
  @ApiOperation({ summary: 'user가 이벤트에서 나갑니다.' })
  @ApiNoContentResponse()
  async outEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() payload: EventJoinOutPayload,
  ): Promise<void> {
    return this.eventService.outEvent(eventId, payload.userId);
  }
}
