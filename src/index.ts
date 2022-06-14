import 'reflect-metadata';
// import { MikroORM } from '@mikro-orm/core';
import { COOKIE_NAME, __prod__ } from './constants';
// import mikroOrmConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import session from 'express-session';
// import * as redis from 'redis';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import { MyContext } from 'src/types';

import { createConnection } from 'typeorm';
import { Post } from './entities/Post';
import { User } from './entities/User';
import { Updoot } from './entities/Updoot';
import path from 'path';

const main = async () => {
  // sendEmail('bob@bob.com', 'hello there!');

  const conn = await createConnection({
    type: 'postgres',
    database: 'lireddit2',
    username: 'postgres',
    password: '12345',
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, User, Updoot],
  });
  await conn.runMigrations();

  // await Post.delete({});
  // console.log('running');

  // const orm = await MikroORM.init(mikroOrmConfig);
  // await orm.getMigrator().up();

  const app = express();

  let RedisStore = connectRedis(session);
  const redis = new Redis();
  //redisClient.connect().catch(console.error);

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: false,
        secure: false, //cookie only works in https
        sameSite: 'lax',
      },
      saveUninitialized: false,
      secret: 'keyboard cat',
      resave: false,
    })
  );

  // app.use(
  //   cors({
  //     credentials: true,
  //     origin: [
  //       'https://studio.apollographql.com',
  //       'http://localhost:3000',
  //       'http://localhost:4000/graphql',
  //     ],
  //   })
  // );

  app.set('trust proxy', true);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    cors: {
      credentials: true,
      origin: [
        'https://studio.apollographql.com',
        'http://localhost:3000',
        'http://localhost:4000/graphql',
      ],
    },
  });

  // app.get('/a', (req, res) => {
  //   console.log('session : ', req.session);
  // });

  app.listen(4000, () => {
    console.log('Server is running on port 4000');
  });

  // const post = orm.em.create(Post, new Post('my first post'));
  // orm.em.persistAndFlush(post);

  // console.log('Posts : ', posts);
};

main();
