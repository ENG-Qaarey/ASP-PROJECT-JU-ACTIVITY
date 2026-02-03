import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async create(name: string) {
        const existing = await this.prisma.category.findUnique({
            where: { name },
        });
        if (existing) {
            throw new ConflictException('Category already exists');
        }

        return this.prisma.category.create({
            data: { name },
        });
    }
}
