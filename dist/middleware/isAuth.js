"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const isAuth = ({ context }, next) => {
    var _a, _b;
    if (!((_b = (_a = context.req) === null || _a === void 0 ? void 0 : _a.session) === null || _b === void 0 ? void 0 : _b.userId)) {
        throw new Error('not authenticated');
    }
    return next();
};
exports.isAuth = isAuth;
//# sourceMappingURL=isAuth.js.map