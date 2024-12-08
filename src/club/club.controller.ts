import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ClubService } from './club.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ClubDto, ClubListDto } from './dto/club.dto';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { CreateClubPayload } from './payload/create-club.payload';
import { UpdateClubPayload } from './payload/update-club.payload';
import { DelegatePayload } from './payload/delegate.payload';
import { ApprovePayload } from './payload/approve-refuse.payload';

@Controller('clubs')
@ApiTags('Club API')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽을 생성합니다.' })
  @ApiCreatedResponse({ type: ClubDto })
  async createClub(
    @CurrentUser() user: UserBaseInfo,
    @Body() payload: CreateClubPayload,
  ): Promise<ClubDto> {
    return this.clubService.createClub(user.id, payload);
  }

  @Post(':clubId/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '클럽에 가입 신청합니다.' })
  @ApiNoContentResponse()
  async joinClub(
    @CurrentUser() user: UserBaseInfo,
    @Param('clubId', ParseIntPipe) clubId: number,
  ): Promise<void> {
    return this.clubService.joinClub(clubId, user.id);
  }

  @Post(':clubId/out')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: '클럽 가입 요청을 철회하거나, 클럽에서 탈퇴합니다.',
  })
  @ApiNoContentResponse()
  async outClub(
    @CurrentUser() user: UserBaseInfo,
    @Param('clubId', ParseIntPipe) clubId: number,
  ): Promise<void> {
    return this.clubService.outClub(clubId, user.id);
  }

  @Patch(':clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽 정보를 수정합니다.(클럽장 권한)' })
  @ApiOkResponse({ type: ClubDto })
  async updateClub(
    @CurrentUser() user: UserBaseInfo,
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: UpdateClubPayload,
  ): Promise<ClubDto> {
    return this.clubService.updateClub(clubId, payload, user.id);
  }

  @Delete(':clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '클럽을 삭제합니다.(클럽장 권한)' })
  @ApiNoContentResponse()
  async deleteClub(
    @CurrentUser() user: UserBaseInfo,
    @Param('clubId', ParseIntPipe) clubId: number,
  ): Promise<void> {
    return this.clubService.deleteClub(clubId, user.id);
  }

  @Patch(':clubId/delegate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽장을 위임합니다.(클럽장 권한)' })
  @ApiOkResponse({ type: ClubDto })
  async delegate(
    @CurrentUser() user: UserBaseInfo,
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: DelegatePayload,
  ): Promise<ClubDto> {
    return this.clubService.delegate(clubId, user.id, payload);
  }

  @Put(':clubId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽 가입 신청을 승인합니다.(클럽장 권한)' })
  @HttpCode(204)
  @ApiNoContentResponse()
  async approve(
    @CurrentUser() user: UserBaseInfo,
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: ApprovePayload,
  ): Promise<void> {
    return this.clubService.approve(clubId, user.id, payload);
  }

  @Put(':clubId/refuse')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽 가입 신청을 거절합니다.(클럽장 권한)' })
  @HttpCode(204)
  @ApiNoContentResponse()
  async refuse(
    @CurrentUser() user: UserBaseInfo,
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: ApprovePayload,
  ): Promise<void> {
    return this.clubService.refuse(clubId, user.id, payload);
  }

  @Get()
  @ApiOperation({ summary: '클럽 목록을 조회합니다.' })
  @ApiOkResponse({ type: ClubListDto })
  async getClubs(): Promise<ClubListDto> {
    return this.clubService.getClubs();
  }
}
