"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jwt_1 = require("../utils/jwt");
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "Token gerekli." });
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({ error: "Geçersiz token." });
    }
}
