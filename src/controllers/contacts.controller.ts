import { Controller } from '@nestjs/common';
import { ContactsService } from 'src/services/contacts.service';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}
}
