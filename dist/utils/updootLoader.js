"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updootLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const Updoot_1 = require("./../entities/Updoot");
const updootLoader = () => new dataloader_1.default(async (keys) => {
    const updoots = await Updoot_1.Updoot.findByIds(keys);
    const keysToUpdoot = {};
    updoots.forEach((updoot) => {
        keysToUpdoot[`${updoot.userId}-${updoot.postId}`] = updoot;
    });
    return keys.map((key) => keysToUpdoot[`${key.userId}-${key.postId}`]);
});
exports.updootLoader = updootLoader;
//# sourceMappingURL=updootLoader.js.map