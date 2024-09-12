import {
  HttpErrors,
  del,
  get,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import prisma from '../datasources/prisma';
import {Category} from '@prisma/client';

export class CategoryController {
  // @post('/categories') async createCategory(
  //   @requestBody({
  //     description: 'Create a new category',
  //     required: true,
  //     content: {
  //       'application/json': {
  //         schema: {
  //           type: 'object',
  //           properties: {
  //             description: { type: 'string' },
  //           },
  //           required: ['description'],
  //         },
  //       },
  //     },
  //   })
  //   data: {
  //     description: string;
  //   },
  // ) {
  //   try {
  //     return await prisma.category.create({ data });
  //   } catch (e) {
  //     throw new HttpErrors.InternalServerError('An error occurred!\n' + e);
  //   }
  // }
  //
  // @get('/categories')
  // async getCategories() {
  //   return prisma.category.findMany();
  // }
  //
  // @get('/categories/{id}')
  // async getCategory(@param.path.number('id') id: number) {
  //   const category = await prisma.category.findUnique({ where: { id } });
  //   if (category) return category;
  //   throw new HttpErrors.NotFound(`Category with id ${id} isn't found!`);
  // }

  // @get('/categories')
  // async getAllCategories() {
  //   return await prisma.category.findMany({where: {isDeleted: false}});
  // }

  @get('/categories')
  async getAllCategories(
    @param.query.string('description') description?: string,
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 10,
    @param.query.string('sortBy') sortBy: string = 'id',
    @param.query.string('order') order: string = 'asc',
  ) {
    // Pagination and sorting logic
    const skip = (page - 1) * limit;
    const orderBy = {[sortBy]: order};

    const where = {
      ...(description && {description}),
    };

    const categories = await prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });

    return categories;
  }

  @post('/categories')
  async addCategories(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              description: {type: 'string'},
            },
          },
        },
      },
    })
    categories: Array<Omit<Category, 'id'>>,
  ) {
    try {
      const createdCategories = await prisma.category.createMany({
        data: categories,
      });
      return {count: createdCategories.count};
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to create categories');
    }
  }

  @patch('/categories')
  async updateCategories(@requestBody() categories: Array<any>) {
    try {
      const updatedCategories = await Promise.all(
        categories.map(category =>
          prisma.category.update({
            where: {id: category.id},
            data: category,
          }),
        ),
      );
      return updatedCategories;
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to update categories');
    }
  }

  @del('/categories')
  async deleteCategories(@requestBody() ids: Array<number>) {
    try {
      const deletedCategories = await prisma.category.updateMany({
        where: {id: {in: ids}},
        data: {isDeleted: true},
      });
      return {count: deletedCategories.count};
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to delete categories');
    }
  }
}
