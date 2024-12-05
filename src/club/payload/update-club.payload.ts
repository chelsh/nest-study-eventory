import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  NotEquals,
  ValidateIf,
} from 'class-validator';

export class UpdateClubPayload {
  @IsString()
  @NotEquals(null)
  @ValidateIf((object, value) => value !== undefined)
  @ApiProperty({
    description: '클럽 이름',
    type: String,
  })
  name?: string;

  @IsString()
  @NotEquals(null)
  @ValidateIf((object, value) => value !== undefined)
  @ApiProperty({
    description: '클럽 소개',
    type: String,
  })
  description?: string;

  @IsInt()
  @IsPositive()
  @NotEquals(null)
  @ValidateIf((object, value) => value !== undefined)
  @ApiProperty({
    description: '클럽 최대 인원',
    type: Number,
  })
  maxPeople?: number;
}
