import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventListDto } from './dto/event.dto';
import { CreateEventPayload } from './payload/create-event.payload';
import { EventQuery } from './query/event.query';
import { EventDetailDto } from './dto/event-detail.dto';
import { UpdateEventPayload } from './payload/update-event.payload';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { CurrentUser } from 'src/auth/decorator/user.decorator';

@Controller('events')
@ApiTags('Event API')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '이벤트를 생성합니다' })
  @ApiCreatedResponse({ type: EventDetailDto })
  async createEvent(
    @CurrentUser() user: UserBaseInfo,
    @Body() payload: CreateEventPayload,
  ): Promise<EventDetailDto> {
    return this.eventService.createEvent(user.id, payload);
  }

  @Get(':eventId')
  @ApiOperation({ summary: '이벤트 상세 정보를 조회합니다' })
  @ApiOkResponse({ type: EventDetailDto })
  async getEventById(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<EventDetailDto> {
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'user가 이벤트에 참여합니다.' })
  @ApiNoContentResponse()
  async joinEvent(
    @CurrentUser() user: UserBaseInfo,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return this.eventService.joinEvent(eventId, user.id);
  }

  @Post(':eventId/out')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'user가 이벤트에서 나갑니다.' })
  @ApiNoContentResponse()
  async outEvent(
    @CurrentUser() user: UserBaseInfo,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return this.eventService.outEvent(eventId, user.id);
  }

  @Patch(':eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '이벤트를 수정합니다.' })
  @ApiOkResponse({ type: EventDetailDto })
  async updateEvent(
    @CurrentUser() user: UserBaseInfo,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() payload: UpdateEventPayload,
  ): Promise<EventDetailDto> {
    return this.eventService.updateEvent(eventId, payload, user.id);
  }

  @Delete(':eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '이벤트를 삭제합니다.' })
  @ApiNoContentResponse()
  async deleteEvent(
    @CurrentUser() user: UserBaseInfo,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return this.eventService.deleteEvent(eventId, user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '이벤트를 삭제합니다.' })
  @ApiOkResponse({ type: EventListDto })
  async getMyEvents(@CurrentUser() user: UserBaseInfo): Promise<EventListDto> {
    return this.eventService.getMyEvents(user.id);
  }
}
