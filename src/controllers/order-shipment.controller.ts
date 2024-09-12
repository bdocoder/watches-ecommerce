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

export class OrderShipmentController {
  @get('/order-shipments')
  async getAllOrderShipments(
    @param.query.string('trackingNumber') trackingNumber?: string,
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 10,
    @param.query.string('sortBy') sortBy: string = 'id',
    @param.query.string('order') order: string = 'asc',
  ) {
    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: order };
    const where = trackingNumber ? { trackingNumber } : {};

    return prisma.watchOrderShipment.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { orders: true },
    });
  }

  @post('/order-shipments')
  async addOrderShipments(@requestBody() shipments: Array<any>) {
    try {
      const createdShipments = await prisma.watchOrderShipment.createMany({
        data: shipments,
      });
      return { count: createdShipments.count };
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to create shipments');
    }
  }

  @patch('/order-shipments')
  async updateOrderShipments(@requestBody() shipments: Array<any>) {
    try {
      const updatedShipments = await Promise.all(
        shipments.map(shipment =>
          prisma.watchOrderShipment.update({
            where: { id: shipment.id },
            data: shipment,
          }),
        ),
      );
      return updatedShipments;
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to update shipments');
    }
  }

  @del('/order-shipments')
  async deleteOrderShipments(@requestBody() ids: Array<number>) {
    try {
      const deletedShipments = await prisma.watchOrderShipment.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true },
      });
      return { count: deletedShipments.count };
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to delete shipments');
    }
  }
}
