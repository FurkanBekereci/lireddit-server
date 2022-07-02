"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const User_1 = require("./../entities/User");
const userLoader = () => new dataloader_1.default(async (userIds) => {
    const users = await User_1.User.findByIds(userIds);
    const userIdUserMap = {};
    users.forEach((user) => {
        userIdUserMap[user.id] = user;
    });
    return userIds.map((userId) => userIdUserMap[userId]);
});
exports.userLoader = userLoader;
//# sourceMappingURL=userLoader.js.map