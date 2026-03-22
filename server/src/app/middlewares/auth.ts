import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../global/error";
import { StatusCodes } from "http-status-codes";

export interface JwtPayload {
  id:       string;
  email:    string;
  role:     "ADMIN";
  username: string;
  name:     string; // ← added
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const auth = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");

      const secret = process.env.JWT_SECRET;
      if (!secret) throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret not configured");

      const decoded = jwt.verify(token, secret) as JwtPayload;
      req.user = decoded;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;