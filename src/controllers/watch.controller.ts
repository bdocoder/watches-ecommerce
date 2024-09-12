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
import {Watch} from '@prisma/client';

export class WatchController {
  @get('/watches')
  async getAllWatches(
    @param.query.string('model') model?: string,
    @param.query.string('origin') origin?: string,
    @param.query.string('serialNumber') serialNumber?: string,
    @param.query.string('category') category?: string,
    @param.query.string('price') price?: number,
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 10,
    @param.query.string('sortBy') sortBy: string = 'id',
    @param.query.string('order') order: string = 'asc',
  ) {
    // Pagination and sorting logic
    const skip = (page - 1) * limit;
    const orderBy = {[sortBy]: order};

    const where = {
      ...(model && {model}),
      ...(origin && {origin}),
      ...(serialNumber && {serialNumber}),
      ...(price && {price}),
      ...(category && {
        watchCategories: {
          some: {
            category: {description: category},
          },
        },
      }),
      isDeleted: false,
    };

    const watches = await prisma.watch.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        watchCategories: {include: {category: true}},
      },
    });

    return watches;
  }

  @post('/watches')
  async addWatches(@requestBody() watches: Array<Omit<Watch, 'id'>>) {
    try {
      const createdWatches = await prisma.watch.createMany({
        data: watches,
      });
      return {count: createdWatches.count};
    } catch (error) {
      console.log(error);
      throw new HttpErrors.BadRequest('Unable to create watches');
    }
  }

  @patch('/watches')
  async updateWatches(@requestBody() watches: Array<Watch>) {
    try {
      const updatedWatches = await Promise.all(
        watches.map(watch =>
          prisma.watch.update({
            where: {id: watch.id},
            data: watch,
          }),
        ),
      );
      return updatedWatches;
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to update watches');
    }
  }

  @del('/watches')
  async deleteWatches(@requestBody() ids: Array<number>) {
    try {
      const deletedWatches = await prisma.watch.updateMany({
        where: {id: {in: ids}},
        data: {isDeleted: true},
      });
      return {count: deletedWatches.count};
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to delete watches');
    }
  }

  @get('/watches/deleted')
  async getDeletedWatches() {
    return prisma.watch.findMany({
      where: {isDeleted: true},
    });
  }
}
