import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PersonalitiesService {
  constructor(private readonly prisma: PrismaService) {}
}
