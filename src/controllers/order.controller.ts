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

export class OrderController {
  @get('/orders')
  async getAllOrders(
    @param.query.number('customerId') customerId?: number,
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 10,
    @param.query.string('sortBy') sortBy: string = 'id',
    @param.query.string('order') order: string = 'asc',
  ) {
    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: order };
    const where = customerId ? { customerId } : {};

    return prisma.watchOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { orderLines: true, orderShipment: true },
    });
  }

  // @post('/orders')
  // async addOrders(@requestBody() orders: Array<any>) {
  //   try {
  //     const createdOrders = await prisma.watchOrder.createMany({
  //       data: orders,
  //     });
  //     return {count: createdOrders.count};
  //   } catch (error) {
  //     throw new HttpErrors.BadRequest('Unable to create orders');
  //   }
  // }

  @post('/orders')
  async createOrder(@requestBody() orderData: any) {
    // Check if the customer exists
    const customerExists = await prisma.customer.findUnique({
      where: { id: orderData.customerId },
    });

    if (!customerExists) {
      throw new HttpErrors.NotFound('Customer not found');
    }

    // Proceed with order creation
    const newOrder = await prisma.watchOrder.create({
      data: {
        customerId: orderData.customerId,
        customerRef: orderData.customerRef,
        orderShipmentId: orderData.orderShipmentId,
        orderLines: {
          create: orderData.orderLines, // Assuming orderLines are passed as part of the body
        },
      },
    });

    return newOrder;
  }

  @patch('/orders')
  async updateOrders(@requestBody() orders: Array<any>) {
    try {
      const updatedOrders = await Promise.all(
        orders.map(order =>
          prisma.watchOrder.update({
            where: { id: order.id },
            data: order,
          }),
        ),
      );
      return updatedOrders;
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to update orders');
    }
  }

  // @del('/orders')
  // async deleteOrders(@requestBody() ids: Array<number>) {
  //   try {
  //     const deletedOrders = await prisma.watchOrder.updateMany({
  //       where: { id: { in: ids } },
  //       data: { isDeleted: true },
  //     });
  //     return { count: deletedOrders.count };
  //   } catch (error) {
  //     throw new HttpErrors.BadRequest('Unable to delete orders');
  //   }
  // }

  @del('/orders')
  async deleteOrders(@requestBody() orderIds: number[]) {
    return prisma.$transaction(async prisma => {
      // Delete related order lines
      await prisma.watchOrderLine.deleteMany({
        where: { watchOrderId: { in: orderIds } },
      });

      // Delete related shipments
      await prisma.watchOrderShipment.deleteMany({
        where: { id: { in: orderIds } },
      });

      // Soft delete the orders
      const deletedOrders = await prisma.watchOrder.updateMany({
        where: { id: { in: orderIds } },
        data: { isDeleted: true },
      });

      return { count: deletedOrders.count };
    });
  }

  @get('/orders/{id}')
  async getOrderById(@param.path.number('id') id: number) {
    const order = await prisma.watchOrder.findUnique({
      where: { id },
      include: { orderLines: true, orderShipment: true, customer: true },
    });

    if (!order) {
      throw new HttpErrors.NotFound(`Order with ID ${id} not found.`);
    }

    return order;
  }
}
