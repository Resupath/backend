import { Controller } from '@nestjs/common';
import { PositionsService } from 'src/services/positions.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}
}
