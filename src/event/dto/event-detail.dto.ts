import { ApiProperty } from '@nestjs/swagger';
import { ReviewDto } from 'src/review/dto/review.dto';
import { EventDetailData } from '../type/event-detail-data.type';
import { EventStatus, EventStatusData } from '../enum/event-status.enum';

export class JoinedUserDto {
  @ApiProperty({
    description: 'user ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: 'user 이름',
    type: String,
  })
  name!: string;
}

export class EventDetailDto {
  @ApiProperty({
    description: '이벤트 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '호스트 ID',
    type: Number,
  })
  hostId!: number;

  @ApiProperty({
    description: '이벤트 이름',
    type: String,
  })
  title!: string;

  @ApiProperty({
    description: '이벤트 설명',
    type: String,
  })
  description!: string;

  @ApiProperty({
    description: '이벤트가 속한 카테고리 ID',
    type: Number,
  })
  categoryId!: number;

  @ApiProperty({
    description: '이벤트 도시 ID',
    type: Number,
  })
  cityId!: number;

  @ApiProperty({
    description: '이벤트 시작 시간',
    type: Date,
  })
  startTime!: Date;

  @ApiProperty({
    description: '이벤트 종료 시간',
    type: Date,
  })
  endTime!: Date;

  @ApiProperty({
    description: '이벤트에 참여가능한 최대 인원',
    type: Number,
  })
  maxPeople!: number;

  @ApiProperty({
    description: '이벤트의 현재 상태',
    enum: EventStatus,
  })
  status!: EventStatusData;

  @ApiProperty({
    description: '참여하는 유저 목록',
    type: [JoinedUserDto],
  })
  joinedUsers!: JoinedUserDto[];

  @ApiProperty({
    description: '이벤트의 리뷰 목록',
    type: [ReviewDto],
  })
  reviews!: ReviewDto[];

  static from(event: EventDetailData): EventDetailDto {
    return {
      id: event.id,
      hostId: event.hostId,
      title: event.title,
      description: event.description,
      categoryId: event.categoryId,
      cityId: event.cityId,
      startTime: event.startTime,
      endTime: event.endTime,
      maxPeople: event.maxPeople,
      status:
        new Date() < event.startTime
          ? EventStatus.PENDING
          : event.endTime < new Date()
            ? EventStatus.COMPLETED
            : EventStatus.ONGOING,
      joinedUsers: event.eventJoin.map((eventJoin) => {
        return { id: eventJoin.user.id, name: eventJoin.user.name };
      }),
      reviews: ReviewDto.fromArray(event.review),
    };
  }

  static fromArray(events: EventDetailData[]): EventDetailDto[] {
    return events.map((event) => this.from(event));
  }
}

export class EventDetailListDto {
  @ApiProperty({
    description: '이벤트 목록',
    type: [EventDetailDto],
  })
  events!: EventDetailDto[];

  static from(events: EventDetailData[]): EventDetailListDto {
    return {
      events: EventDetailDto.fromArray(events),
    };
  }
}
