import { Module } from '@nestjs/common';
import { CategoriesController, CategoriesAdminController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({ controllers: [CategoriesController, CategoriesAdminController], providers: [CategoriesService] })
export class CategoriesModule {}
