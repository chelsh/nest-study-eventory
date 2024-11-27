import { ApiProperty } from '@nestjs/swagger';
import { UserData } from '../type/user-data.type';

export class UserDto {
  @ApiProperty({
    description: '유저 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '유저 이메일',
    type: String,
  })
  email!: string;

  @ApiProperty({
    description: '유저 이름',
    type: String,
  })
  name!: string;

  @ApiProperty({
    description: '유저 생년월일',
    type: Date,
    nullable: true,
  })
  birthday!: Date | null;

  @ApiProperty({
    description: '유저가 속한 도시 ID',
    type: Number,
    nullable: true,
  })
  cityId!: number | null;

  static from(user: UserData): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      birthday: user.birthday,
      cityId: user.cityId,
    };
  }

  static fromArray(users: UserData[]): UserDto[] {
    return users.map((user) => this.from(user));
  }
}

export class UserListDto {
  @ApiProperty({
    description: '유저 목록',
    type: [UserDto],
  })
  users!: UserDto[];

  static from(users: UserData[]): UserListDto {
    return {
      users: UserDto.fromArray(users),
    };
  }
}
