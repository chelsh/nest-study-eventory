import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  NotEquals,
  ValidateIf,
} from 'class-validator';

export class UpdateUserPayload {
  @IsString()
  @NotEquals(null)
  @ValidateIf((object, value) => value !== undefined)
  @ApiProperty({
    description: '유저 이메일',
    type: String,
  })
  email?: string;

  @IsString()
  @NotEquals(null)
  @ValidateIf((object, value) => value !== undefined)
  @ApiProperty({
    description: '유저 이름',
    type: String,
  })
  name?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @ApiProperty({
    description: '유저 생년월일',
    type: Date,
  })
  birthday?: Date | null;

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: '유저가 속한 도시 ID',
    type: Number,
  })
  cityId?: number | null;
}
