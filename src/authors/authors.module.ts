import { Module } from '@nestjs/common';
import { AuthorsController, AuthorsAdminController } from './authors.controller';
import { AuthorsService } from './authors.service';

@Module({ controllers: [AuthorsController, AuthorsAdminController], providers: [AuthorsService] })
export class AuthorsModule {}
