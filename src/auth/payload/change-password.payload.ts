import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordPayload {
  @IsString()
  @ApiProperty({
    description: '기존 비밀번호',
    type: String,
  })
  previousPassword!: string;

  @IsString()
  @ApiProperty({
    description: '새 비밀번호',
    type: String,
  })
  newPassword!: string;
}
