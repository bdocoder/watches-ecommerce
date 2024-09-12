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

export class CustomerController {
  @get('/customers')
  async getAllCustomers(
    @param.query.string('name') name?: string,
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 10,
    @param.query.string('sortBy') sortBy: string = 'id',
    @param.query.string('order') order: string = 'asc',
  ) {
    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: order };
    const where = name ? { name: { contains: name } } : {};

    return prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { orders: true },
    });
  }

  @post('/customers')
  async addCustomers(@requestBody() customers: Array<any>) {
    try {
      const createdCustomers = await prisma.customer.createMany({
        data: customers,
      });
      return { count: createdCustomers.count };
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to create customers');
    }
  }

  @patch('/customers')
  async updateCustomers(@requestBody() customers: Array<any>) {
    try {
      const updatedCustomers = await Promise.all(
        customers.map(customer =>
          prisma.customer.update({
            where: { id: customer.id },
            data: customer,
          }),
        ),
      );
      return updatedCustomers;
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to update customers');
    }
  }

  @del('/customers')
  async deleteCustomers(@requestBody() ids: Array<number>) {
    try {
      const deletedCustomers = await prisma.customer.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true },
      });
      return { count: deletedCustomers.count };
    } catch (error) {
      throw new HttpErrors.BadRequest('Unable to delete customers');
    }
  }

  @get('/customers/{id}')
  async getCustomerById(@param.path.number('id') id: number) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!customer) {
      throw new HttpErrors.NotFound(`Customer with ID ${id} not found.`);
    }

    return customer;
  }
}
