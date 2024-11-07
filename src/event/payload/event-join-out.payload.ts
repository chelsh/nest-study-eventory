import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class EventJoinOutPayload {
  @IsInt()
  @ApiProperty({
    description: '이벤트에 참여/탈퇴할 user ID',
    type: Number,
  })
  userId!: number;
}
