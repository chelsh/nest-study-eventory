import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { UpdateUserPayload } from './payload/update-user.payload';
import { UserDto } from './dto/user.dto';
import { UpdateUserData } from './type/update-user-data.type';

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

    if (payload.email) {
      const isEmailUsed = await this.userRepository.getUserByEmail(
        payload.email,
      );
      if (isEmailUsed) {
        throw new ConflictException('이미 사용중인 이메일입니다.');
      }
    }

    if (payload.cityId) {
      const cityExist = await this.userRepository.cityExist(payload.cityId);

      if (!cityExist) {
        throw new NotFoundException('해당 도시가 존재하지 않습니다.');
      }
    }

    const updateUserData: UpdateUserData = {
      email: payload.email,
      name: payload.name,
      birthday: payload.birthday,
      cityId: payload.cityId,
    };

    const updatedUser = await this.userRepository.updateUser(
      userId,
      updateUserData,
    );

    return UserDto.from(updatedUser);
  }

  async getUser(userId: number): Promise<UserDto> {
    const user = await this.userRepository.getUserById(userId);

    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    return UserDto.from(user);
  }
}
