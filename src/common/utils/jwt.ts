import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = (process.env.JWT_SECRET ||
  "supersecretkey") as Secret;

export function generateToken(payload: object, expiresIn: string = "7d") {
  // Cast to any to accommodate string durations like '7d'
  return jwt.sign(payload as any, JWT_SECRET, {
    expiresIn: expiresIn as any,
  } as any);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
