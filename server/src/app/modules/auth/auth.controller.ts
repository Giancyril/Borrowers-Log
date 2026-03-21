import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validate";

const login = async (req: Request, res: Response) => {
  try {
    const data   = loginSchema.parse(req.body);
    const result = await authService.login(data);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Login successful", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const register = async (req: Request, res: Response) => {
  try {
    const data   = registerSchema.parse(req.body);
    const result = await authService.register(data);
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Admin registered", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

export const authController = { login, register };