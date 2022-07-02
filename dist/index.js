"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const constants_1 = require("./constants");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const express_session_1 = __importDefault(require("express-session"));
const ioredis_1 = __importDefault(require("ioredis"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const typeorm_1 = require("typeorm");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const Updoot_1 = require("./entities/Updoot");
const path_1 = __importDefault(require("path"));
const userLoader_1 = require("./utils/userLoader");
const updootLoader_1 = require("./utils/updootLoader");
const main = async () => {
    const conn = await (0, typeorm_1.createConnection)({
        type: 'postgres',
        database: 'lireddit2',
        username: 'postgres',
        password: '12345',
        logging: true,
        synchronize: true,
        migrations: [path_1.default.join(__dirname, './migrations/*')],
        entities: [Post_1.Post, User_1.User, Updoot_1.Updoot],
    });
    await conn.runMigrations();
    const app = (0, express_1.default)();
    let RedisStore = (0, connect_redis_1.default)(express_session_1.default);
    const redis = new ioredis_1.default();
    app.use((0, express_session_1.default)({
        name: constants_1.COOKIE_NAME,
        store: new RedisStore({ client: redis, disableTouch: true }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
        },
        saveUninitialized: false,
        secret: 'keyboard cat',
        resave: false,
    }));
    app.set('trust proxy', true);
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: (0, userLoader_1.userLoader)(),
            updootLoader: (0, updootLoader_1.updootLoader)(),
        }),
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
    app.listen(4000, () => {
        console.log('Server is running on port 4000');
    });
};
main();
//# sourceMappingURL=index.js.map