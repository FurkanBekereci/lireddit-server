// import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { userLoader } from './utils/userLoader';
import { updootLoader } from './utils/updootLoader';

export interface MyContext {
  //em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & any;
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof userLoader>;
  updootLoader: ReturnType<typeof updootLoader>;
}
