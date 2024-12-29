import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoomsService } from 'src/services/rooms.service';

@ApiTags('Room')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
}
