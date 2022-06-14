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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const type_graphql_1 = require("type-graphql");
const User_1 = require("./../entities/User");
const argon2_1 = __importDefault(require("argon2"));
const constants_1 = require("../constants");
const UsernamePasswordInput_1 = require("./UsernamePasswordInput");
const validateRegister_1 = require("./../utils/validateRegister");
const sendEmail_1 = require("../utils/sendEmail");
const uuid_1 = require("uuid");
const constants_2 = require("./../constants");
const typeorm_1 = require("typeorm");
let FieldError = class FieldError {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    (0, type_graphql_1.ObjectType)()
], FieldError);
let UserResponse = class UserResponse {
};
__decorate([
    (0, type_graphql_1.Field)(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => User_1.User, { nullable: true }),
    __metadata("design:type", User_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], UserResponse);
var LoginType;
(function (LoginType) {
    LoginType["USERNAME"] = "username";
    LoginType["EMAIL"] = "email";
})(LoginType || (LoginType = {}));
(0, type_graphql_1.registerEnumType)(LoginType, {
    name: 'LoginType',
    description: 'The ways of login',
});
let UserResolver = class UserResolver {
    email(user, { req }) {
        var _a;
        if (((_a = req.session) === null || _a === void 0 ? void 0 : _a.userId) === user.id)
            return user.email;
        return '';
    }
    me({ req }) {
        var _a;
        if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.userId)) {
            return null;
        }
        return User_1.User.findOneBy({ id: req.session.userId });
    }
    async register(registerData) {
        const errors = (0, validateRegister_1.validateRegister)(registerData);
        if (errors.length > 0) {
            return { errors };
        }
        const hashedPassword = await argon2_1.default.hash(registerData.password);
        let user;
        try {
            const result = await (0, typeorm_1.getConnection)()
                .createQueryBuilder()
                .insert()
                .into(User_1.User)
                .values({
                username: registerData.username,
                email: registerData.email,
                password: hashedPassword,
            })
                .returning('*')
                .execute();
            user = result.raw[0];
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === '23505') {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: 'this username already taken.',
                        },
                    ],
                };
            }
            throw new Error('Something went wrong!!');
        }
        return { user };
    }
    async login(loginData, loginType, { req }) {
        console.log('login type : ', loginType);
        const searcher = loginType == LoginType.EMAIL
            ? { email: loginData.email }
            : { username: loginData.username };
        const user = await User_1.User.findOneBy(searcher);
        if (!user) {
            return {
                errors: [
                    {
                        field: loginType,
                        message: `${loginType} does not exist`,
                    },
                ],
            };
        }
        const isPasswordValid = await argon2_1.default.verify(user.password, loginData.password);
        if (!isPasswordValid) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'incorrect password',
                    },
                ],
            };
        }
        req.session.userId = user.id;
        return { user };
    }
    logout({ req, res }) {
        return new Promise((resolve) => {
            var _a;
            return (_a = req.session) === null || _a === void 0 ? void 0 : _a.destroy((err) => {
                if (err) {
                    console.log('destroy session error: ', err);
                    resolve(false);
                    return;
                }
                console.log('Cookie is clearing...');
                res.clearCookie(constants_1.COOKIE_NAME);
                resolve(true);
            });
        });
    }
    async forgotPassword(email, { req, res, redis }) {
        const user = await User_1.User.findOneBy({ email });
        if (!user) {
            console.log('user not found!!');
            return false;
        }
        const resetToken = (0, uuid_1.v4)();
        await redis.set(`${constants_2.FORGOT_PASSWORD_PREFIX}${resetToken}`, user.id, 'EX', 1000 * 60 * 60);
        const resetPasswordLink = `<a href="http://localhost:3000/auth/reset-password/${resetToken}">reset password</a>`;
        await (0, sendEmail_1.sendEmail)(email, resetPasswordLink);
        return true;
    }
    async resetPassword(token, newPassword, { redis }) {
        if ((newPassword === null || newPassword === void 0 ? void 0 : newPassword.length) <= 2) {
            return {
                errors: [
                    {
                        field: 'newPassword',
                        message: 'length must be greater than 2',
                    },
                ],
            };
        }
        const key = `${constants_2.FORGOT_PASSWORD_PREFIX}${token}`;
        const userId = await redis.get(key);
        if (!userId) {
            console.log('token not valid');
            return false;
        }
        const userIdNum = Number(userId);
        const user = await User_1.User.findOneBy({ id: userIdNum });
        if (!user) {
            console.log('user not found');
            return true;
        }
        await User_1.User.update({ id: userIdNum }, { password: await argon2_1.default.hash(newPassword) });
        await redis.del(key);
        return true;
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)(() => String),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [User_1.User, Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "email", null);
__decorate([
    (0, type_graphql_1.Query)(() => User_1.User, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)('registerData')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UsernamePasswordInput_1.UsernamePasswordInput]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)('loginData')),
    __param(1, (0, type_graphql_1.Arg)('loginType', () => LoginType)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UsernamePasswordInput_1.UsernamePasswordInput, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "logout", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)('email')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)('token')),
    __param(1, (0, type_graphql_1.Arg)('newPassword')),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "resetPassword", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)(User_1.User)
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map