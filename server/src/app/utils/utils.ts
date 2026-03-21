import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JwtPayload } from "../middlewares/auth";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALTROUNDS) || 10;

const hashPassword   = (p: string) => bcrypt.hash(p, SALT_ROUNDS);
const comparePassword = (plain: string, hashed: string) => bcrypt.compare(plain, hashed);

const generateToken = (payload: JwtPayload): string => {
  const secret    = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN as any) || "7d";
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
};

const calculateMeta = (query: Record<string, any>, total: number) => {
  const page      = Number(query.page)  || 1;
  const limit     = Number(query.limit) || 10;
  const totalPage = Math.ceil(total / limit);
  return { total, page, limit, totalPage };
};

export const utils = { hashPassword, comparePassword, generateToken, verifyToken, calculateMeta };