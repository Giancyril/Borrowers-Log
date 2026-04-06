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
      // Mock admin user for session-less access
      req.user = {
        id: "00000000-0000-0000-0000-000000000000",
        email: "admin@nbsc.edu.ph",
        role: "ADMIN",
        username: "admin",
        name: "System Admin",
      };
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;