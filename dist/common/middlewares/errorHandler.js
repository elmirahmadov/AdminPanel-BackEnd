"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = __importDefault(require("../utils/logger"));
function errorHandler(err, req, res, next) {
    logger_1.default.error((err === null || err === void 0 ? void 0 : err.stack) || (err === null || err === void 0 ? void 0 : err.message) || err);
    res
        .status(err.status || 500)
        .json({ error: err.message || "Bir hata oluştu." });
}
