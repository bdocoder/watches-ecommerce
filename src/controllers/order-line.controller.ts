// Uncomment these imports to begin using these cool features!

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

// import {inject} from '@loopback/core';

export class OrderLineController {
  @get('/order-lines')
  async getAllOrderLines(
    @param.query.number('watchOrderId') watchOrderId?: number,
    @param.query.number('watchId') watchId?: number,
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 10,
    @param.query.string('sortBy') sortBy: string = 'id',
    @param.query.string('order') order: string = 'asc',
  ) {
    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: order };
    const where = {
      ...(watchOrderId && { watchOrderId }),
      ...(watchId && { watchId }),
    };

    return prisma.watchOrderLine.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { watches: true, orders: true },
    });
  }

  // @post('/order-lines')
  // async addOrderLines(@requestBody() orderLines: Array<any>) {
  //   try {
  //     const createdOrderLines = await prisma.watchOrderLine.createMany({
  //       data: orderLines,
  //     });
  //     return { count: createdOrderLines.count };
  //   } catch (error) {
  //     throw new HttpErrors.BadRequest('Unable to create order lines');
  //   }
  // }

  @post('/order-lines')
  async createOrderLine(@requestBody() orderLineData: any) {
    // Check if the watch exists
    const watch = await prisma.watch.findUnique({
      where: { id: orderLineData.watchId },
    });

    if (!watch) {
      throw new HttpErrors.NotFound('Watch not found');
    }

    // Check if there's enough quantity
    if (watch.quantityOnHand < orderLineData.orderQuantity) {
      throw new HttpErrors.BadRequest('Not enough stock available');
    }

    // Create the order line and adjust the stock
    const newOrderLine = await prisma.watchOrderLine.create({
      data: {
        watchId: orderLineData.watchId,
        watchOrderId: orderLineData.watchOrderId,
        orderQuantity: orderLineData.orderQuantity,
        quantityAllocated: orderLineData.quantityAllocated,
      },
    });

    // Decrease the quantityOnHand
    await prisma.watch.update({
      where: { id: orderLineData.watchId },
      data: {
        quantityOnHand: watch.quantityOnHand - orderLineData.orderQuantity,
      },
    });

    return newOrderLine;
  }

  @patch('/order-lines')
  async updateOrderLines(@requestBody() orderLines: Array<any>) {
    try {
      const updatedOrderLines = await Promise.all(
        orderLines.map(orderLine =>
          prisma.watchOrderLine.update({
            where: { id: orderLine.id },
            data: orderLine,
          }),
        ),
      );
      return updatedOrderLines;
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to update order lines');
    }
  }

  @del('/order-lines')
  async deleteOrderLines(@requestBody() ids: Array<number>) {
    try {
      const deletedOrderLines = await prisma.watchOrderLine.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true },
      });
      return { count: deletedOrderLines.count };
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to delete order lines');
    }
  }
}
