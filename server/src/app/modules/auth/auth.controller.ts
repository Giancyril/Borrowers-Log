import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { authService } from "./auth.service";
import {
  loginSchema, registerSchema,
  changePasswordSchema, changeEmailSchema, changeUsernameSchema,
} from "./auth.validate";

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

// ── Change password ───────────────────────────────────────────────────────────
const changePassword = async (req: Request, res: Response) => {
  try {
    const data   = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(req.user!.id, data);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Password changed successfully", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

// ── Change email — no password required ──────────────────────────────────────
const changeEmail = async (req: Request, res: Response) => {
  try {
    const data   = changeEmailSchema.parse(req.body);
    const result = await authService.changeEmail(req.user!.id, data);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Email changed successfully", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

// ── Change username ───────────────────────────────────────────────────────────
const changeUsername = async (req: Request, res: Response) => {
  try {
    const data   = changeUsernameSchema.parse(req.body);
    const result = await authService.changeUsername(req.user!.id, data);
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