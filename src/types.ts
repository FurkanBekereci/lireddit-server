// import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from 'ioredis';

export interface MyContext {
  //em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & any;
  res: Response;
  redis: Redis;
}
