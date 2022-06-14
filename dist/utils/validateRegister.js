"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
const validateRegister = (registerData) => {
    var _a, _b, _c;
    const errorArray = [];
    if (!((_a = registerData === null || registerData === void 0 ? void 0 : registerData.email) === null || _a === void 0 ? void 0 : _a.includes('@'))) {
        errorArray.push({
            field: 'email',
            message: 'invalid email',
        });
    }
    if (((_b = registerData === null || registerData === void 0 ? void 0 : registerData.username) === null || _b === void 0 ? void 0 : _b.length) <= 2) {
        errorArray.push({
            field: 'username',
            message: 'length must be greater than 2',
        });
    }
    if (((_c = registerData === null || registerData === void 0 ? void 0 : registerData.password) === null || _c === void 0 ? void 0 : _c.length) <= 3) {
        errorArray.push({
            field: 'password',
            message: 'length must be greater than 3',
        });
    }
    return errorArray;
};
exports.validateRegister = validateRegister;
//# sourceMappingURL=validateRegister.js.map