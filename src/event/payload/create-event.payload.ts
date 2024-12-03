import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsInt, IsString, Min } from 'class-validator';

export class CreateEventPayload {
  @IsString()
  @ApiProperty({
    description: '이벤트 이름',
    type: String,
  })
  title!: string;

  @IsString()
  @ApiProperty({
    description: '이벤트 설명',
    type: String,
  })
  description!: string;

  @IsInt()
  @ApiProperty({
    description: '이벤트가 속한 카테고리 ID',
    type: Number,
  })
  categoryId!: number;

  @IsArray()
  @IsInt({ each: true })
  @ApiProperty({
    description: '이벤트 도시 ID 목록',
    type: [Number],
  })
  cityIdList!: number[];

  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    description: '이벤트 시작 시간',
    type: Date,
  })
  startTime!: Date;

  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    description: '이벤트 종료 시간',
    type: Date,
  })
  endTime!: Date;

  @Min(2) //모임은 두 명 이상(호스트 포함)
  @IsInt()
  @ApiProperty({
    description: '이벤트에 참여가능한 최대 인원',
    type: Number,
  })
  maxPeople!: number;
}
