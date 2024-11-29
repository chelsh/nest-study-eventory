import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional } from 'class-validator';

export class EventQuery {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'host ID',
    type: Number,
  })
  hostId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'city ID',
    type: Number,
  })
  cityId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'category ID',
    type: Number,
  })
  categoryId?: number;
}
