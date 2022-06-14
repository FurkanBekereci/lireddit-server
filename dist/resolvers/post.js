"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResolver = void 0;
const type_graphql_1 = require("type-graphql");
const Post_1 = require("./../entities/Post");
const isAuth_1 = require("./../middleware/isAuth");
const typeorm_1 = require("typeorm");
const type_graphql_2 = require("type-graphql");
const Updoot_1 = require("./../entities/Updoot");
let PostInput = class PostInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], PostInput.prototype, "text", void 0);
PostInput = __decorate([
    (0, type_graphql_1.InputType)()
], PostInput);
let PaginatedPosts = class PaginatedPosts {
};
__decorate([
    (0, type_graphql_1.Field)(() => [Post_1.Post]),
    __metadata("design:type", Array)
], PaginatedPosts.prototype, "posts", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", Boolean)
], PaginatedPosts.prototype, "hasMore", void 0);
PaginatedPosts = __decorate([
    (0, type_graphql_2.ObjectType)()
], PaginatedPosts);
let PostResolver = class PostResolver {
    textSnippet(root) {
        var _a;
        return (_a = root.text) === null || _a === void 0 ? void 0 : _a.slice(0, 50);
    }
    voteStatus(root, { req }) {
        var _a, _b;
        const { userId } = req.session;
        console.log('userId:', userId);
        console.log('updoots:', root.updoots.find((u) => u.userId == Number(userId)));
        return userId
            ? (_b = (_a = root.updoots) === null || _a === void 0 ? void 0 : _a.find((updoot) => updoot.userId == userId)) === null || _b === void 0 ? void 0 : _b.value
            : null;
    }
    async vote(postId, value, { req }) {
        const { userId } = req.session;
        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;
        const updoot = await Updoot_1.Updoot.findOne({ where: { postId, userId } });
        if (updoot && updoot.value !== realValue) {
            await (0, typeorm_1.getConnection)().transaction(async (tem) => {
                await tem.query(`
        
          update updoot 
          set value = $1
          where "postId" = $2 and "userId" = $3

        `, [realValue, postId, userId]);
                await tem.query(`
        
          update post 
          set points = points + $1
          where id =$2

        `, [2 * realValue, postId]);
            });
        }
        else if (!updoot) {
            await (0, typeorm_1.getConnection)().transaction(async (tem) => {
                await tem.query(`
        
          insert into updoot ("userId", "postId", value)
          values ($1, $2, $3)

        `, [userId, postId, realValue]);
                await tem.query(`
        
          update post 
          set points = points + $1
          where id = $2

        `, [realValue, postId]);
            });
        }
        return true;
    }
    async getPosts(limit, cursor) {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;
        const qb = await (0, typeorm_1.getConnection)()
            .getRepository(Post_1.Post)
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.user', 'u')
            .leftJoinAndSelect('p.updoots', 'up')
            .orderBy('p."createdAt"', 'DESC')
            .limit(realLimitPlusOne);
        if (cursor) {
            qb.where('p."createdAt" < :cursor', {
                cursor: new Date(parseInt(cursor)),
            });
        }
        const posts = await qb.getMany();
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        };
    }
    getPostById(id) {
        return Post_1.Post.findOne({ where: { id }, relations: ['user', 'updoots'] });
    }
    async addPost(postData, { req }) {
        return Post_1.Post.create(Object.assign(Object.assign({}, postData), { userId: req.session.userId })).save();
    }
    async updatePost(id, title) {
        const post = await Post_1.Post.findOneBy({ id });
        if (!post) {
            throw new Error('Id not found');
        }
        if (typeof title !== 'undefined') {
            await Post_1.Post.update({ id }, { title });
        }
        return post;
    }
    async deletePost(id) {
        try {
            const result = await Post_1.Post.delete(id);
            return !!(result === null || result === void 0 ? void 0 : result.affected);
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)(() => String),
    __param(0, (0, type_graphql_1.Root)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textSnippet", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(() => String),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "voteStatus", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('postId', () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('value', () => type_graphql_1.Int)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
__decorate([
    (0, type_graphql_1.Query)(() => PaginatedPosts),
    __param(0, (0, type_graphql_1.Arg)('limit', () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('cursor', () => String, { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "getPosts", null);
__decorate([
    (0, type_graphql_1.Query)(() => Post_1.Post, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)('id', () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "getPostById", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Post_1.Post),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('postData')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "addPost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Post_1.Post, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)('id')),
    __param(1, (0, type_graphql_1.Arg)('title', () => String, { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
PostResolver = __decorate([
    (0, type_graphql_1.Resolver)(Post_1.Post)
], PostResolver);
exports.PostResolver = PostResolver;
//# sourceMappingURL=post.js.map