import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';
import { RolesGuard } from '../authz/roles.guard';
import { Roles } from '../authz/roles.decorator';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'coordinator')
    create(@Body('name') name: string) {
        return this.categoriesService.create(name);
    }
}
