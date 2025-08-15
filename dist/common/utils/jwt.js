"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = (process.env.JWT_SECRET ||
    "supersecretkey");
function generateToken(payload, expiresIn = "7d") {
    // Cast to any to accommodate string durations like '7d'
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: expiresIn,
    });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
