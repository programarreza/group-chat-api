import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Req, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('api/v1/rooms')
@UseGuards(AuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  getRooms() {
    return this.roomsService.getRooms();
  }

  @Post()
  createRoom(@Body() dto: CreateRoomDto, @Req() req: any) {
    return this.roomsService.createRoom(dto, req.user);
  }

  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.roomsService.getRoom(id);
  }

  @Delete(':id')
  deleteRoom(@Param('id') id: string, @Req() req: any) {
    return this.roomsService.deleteRoom(id, req.user);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('before') before?: string,
  ) {
    return this.roomsService.getMessages(id, limit, before);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @Req() req: any) {
    return this.roomsService.sendMessage(id, dto, req.user);
  }
}
