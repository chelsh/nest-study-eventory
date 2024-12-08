import { ClubRepository } from './club.repository';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClubPayload } from './payload/create-club.payload';
import { ClubDto } from './dto/club.dto';
import { CreateClubData } from './type/create-club-data.type';
import { JoinState } from '@prisma/client';
import { UpdateClubPayload } from './payload/update-club.payload';
import { UpdateClubData } from './type/update-club-data.type';
import { DelegatePayload } from './payload/delegate.payload';
import { ApprovePayload } from './payload/approve-refuse.payload';

@Injectable()
export class ClubService {
  constructor(private readonly clubRepository: ClubRepository) {}

  async createClub(
    userId: number,
    payload: CreateClubPayload,
  ): Promise<ClubDto> {
    const clubNameExist = await this.clubRepository.clubNameExist(payload.name);

    if (clubNameExist) {
      throw new ConflictException('동일한 클럽 이름이 이미 존재합니다.');
    }

    const createData: CreateClubData = {
      hostId: userId,
      name: payload.name,
      description: payload.description,
      maxPeople: payload.maxPeople,
    };

    const club = await this.clubRepository.createClub(createData);

    return ClubDto.from(club);
  }

  async joinClub(clubId: number, userId: number): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('존재하지 않는 club입니다.');
    }

    const joinState = await this.clubRepository.getJoinState(clubId, userId);
    if (joinState === JoinState.PENDING) {
      throw new ConflictException(
        '이미 가입 신청한 club입니다. 클럽장이 요청을 처리할 때까지 기다려주세요.',
      );
    }
    if (joinState === JoinState.JOINED) {
      throw new ConflictException('이미 가입된 club입니다.');
    }
    if (joinState === JoinState.REFUSED) {
      throw new ConflictException('가입 거절된 club입니다.');
    }

    const countJoinedUsers = await this.clubRepository.countJoinedUsers(clubId);
    if (countJoinedUsers === club.maxPeople) {
      throw new ConflictException('이미 정원이 다 찬 club입니다.');
    }

    await this.clubRepository.joinClub(clubId, userId);
  }

  async outClub(clubId: number, userId: number): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('존재하지 않는 club입니다.');
    }

    //joinState가 PENDING인 경우엔 가입 신청 철회, JOINED인 경우엔 클럽 탈퇴
    const joinState = await this.clubRepository.getJoinState(clubId, userId);
    if (!joinState) {
      throw new ConflictException('가입 신청 이력이 없는 club입니다.');
    }
    if (joinState === JoinState.REFUSED) {
      throw new ConflictException('가입 거절된 club입니다.');
    }

    if (userId === club.hostId) {
      throw new ConflictException(
        '클럽장은 club에서 나갈 수 없습니다. 클럽장 역할을 다른 회원에게 위임한 후에 탈퇴가 가능합니다.',
      );
    }

    await this.clubRepository.outClub(clubId, userId);
  }

  async updateClub(
    clubId: number,
    payload: UpdateClubPayload,
    userId: number,
  ): Promise<ClubDto> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('존재하지 않는 club입니다.');
    }

    if (club.hostId !== userId) {
      throw new ForbiddenException('클럽장만 클럽 정보를 수정할 수 있습니다.');
    }

    if (payload.maxPeople) {
      const countJoinedUsers =
        await this.clubRepository.countJoinedUsers(clubId);
      if (countJoinedUsers > payload.maxPeople) {
        throw new ConflictException(
          '클럽 최대 인원을 현재 가입된 회원 수보다 적게 설정할 수 없습니다.',
        );
      }
    }

    const updateClubData: UpdateClubData = {
      name: payload.name,
      description: payload.description,
      maxPeople: payload.maxPeople,
    };

    const updatedClub = await this.clubRepository.updateClub(
      clubId,
      updateClubData,
    );

    return ClubDto.from(updatedClub);
  }

  async deleteClub(clubId: number, userId: number): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('존재하지 않는 club입니다.');
    }

    if (club.hostId !== userId) {
      throw new ForbiddenException('클럽장만 클럽을 삭제할 수 있습니다.');
    }

    return this.clubRepository.deleteClub(clubId);
  }

  async delegate(
    clubId: number,
    userId: number,
    payload: DelegatePayload,
  ): Promise<ClubDto> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('존재하지 않는 club입니다.');
    }

    if (club.hostId !== userId) {
      throw new ForbiddenException('클럽장만 클럽장을 위임할 수 있습니다.');
    }

    if (payload.userId === userId) {
      throw new ConflictException('이미 클럽장인 회원입니다.');
    }

    const joinState = await this.clubRepository.getJoinState(
      clubId,
      payload.userId,
    );
    if (joinState !== JoinState.JOINED) {
      throw new ConflictException(
        '클럽 회원에게만 클럽장을 위임할 수 있습니다.',
      );
    }

    const clubData = await this.clubRepository.delegate(clubId, payload.userId);

    return ClubDto.from(clubData);
  }

  async approve(
    clubId: number,
    userId: number,
    payload: ApprovePayload,
  ): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('존재하지 않는 club입니다.');
    }

    if (club.hostId !== userId) {
      throw new ForbiddenException('클럽장만 가입을 승인할 수 있습니다.');
    }

    //JoinState가 PENDING/REFUSED인 경우에만 승인 가능
    const joinState = await this.clubRepository.getJoinState(
      clubId,
      payload.userId,
    );
    if (joinState === JoinState.JOINED) {
      throw new ConflictException('이미 클럽 회원인 유저입니다.');
    }
    if (!joinState) {
      throw new ConflictException('가입 신청하지 않은 유저입니다.');
    }

    await this.clubRepository.approve(clubId, payload.userId);
  }

  async refuse(
    clubId: number,
    userId: number,
    payload: ApprovePayload,
  ): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('존재하지 않는 club입니다.');
    }

    if (club.hostId !== userId) {
      throw new ForbiddenException('클럽장만 가입을 거절할 수 있습니다.');
    }

    //JoinState가 PENDING인 경우에만 거절 가능
    const joinState = await this.clubRepository.getJoinState(
      clubId,
      payload.userId,
    );
    if (joinState === JoinState.JOINED) {
      throw new ConflictException('이미 클럽 회원인 유저입니다.');
    }
    if (joinState === JoinState.REFUSED) {
      throw new ConflictException('이미 가입 거절된 유저입니다.');
    }
    if (!joinState) {
      throw new ConflictException('가입 신청하지 않은 유저입니다.');
    }

    await this.clubRepository.refuse(clubId, payload.userId);
  }
}
