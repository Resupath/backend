import { Module } from '@nestjs/common';
import { ContactsController } from 'src/controllers/contacts.controller';
import { ContactsService } from 'src/services/contacts.service';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
