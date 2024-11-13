import { PrismaService } from 'src/common/services/prisma.service';
import { CategoryData } from './type/category-data.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(): Promise<CategoryData[]> {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }
}
