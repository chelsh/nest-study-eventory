import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { UpdateUserPayload } from './payload/update-user.payload';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async deleteUser(userId: number): Promise<void> {
    return this.userRepository.deleteUser(userId);
  }

  async updateUser(
    user: UserBaseInfo,
    userId: number,
    payload: UpdateUserPayload,
  ): Promise<UserDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('본인의 유저 정보만 수정할 수 있습니다.');
    }

    const updatedUser = await this.userRepository.updateUser(userId, payload);

    return UserDto.from(updatedUser);
  }
}
