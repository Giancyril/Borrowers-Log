import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { authService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validate";
import { z } from "zod";

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

const getAdmins = async (_req: Request, res: Response) => {
  try {
    const result = await authService.getAdmins();
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Admins retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const deleteAdmin = async (req: Request, res: Response) => {
  try {
    await authService.deleteAdmin(req.params.id, req.user!.id);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Admin deleted", data: null });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = z.object({
      oldPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }).parse(req.body);
    const result = await authService.changePassword(req.user!.id, oldPassword, newPassword);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Password changed successfully", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const changeEmail = async (req: Request, res: Response) => {
  try {
    const { email, password } = z.object({
      email:    z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);
    const result = await authService.changeEmail(req.user!.id, email, password);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Email changed successfully", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const changeUsername = async (req: Request, res: Response) => {
  try {
    const { username } = z.object({
      username: z.string().min(3).max(50),
    }).parse(req.body);
    const result = await authService.changeUsername(req.user!.id, username);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Username changed successfully", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

export const authController = {
  login,
  register,
  getAdmins,
  deleteAdmin,
  changePassword,
  changeEmail,
  changeUsername,
};