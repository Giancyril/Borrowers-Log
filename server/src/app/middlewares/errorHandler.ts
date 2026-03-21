import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import AppError from "../global/error";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false, statusCode: 400, message: "Validation error",
      errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, statusCode: err.statusCode, message: err.message });
    return;
  }
  if (err?.code === "P2002") {
    res.status(409).json({ success: false, statusCode: 409, message: "A record with this value already exists." });
    return;
  }
  if (err?.code === "P2025") {
    res.status(404).json({ success: false, statusCode: 404, message: "Record not found." });
    return;
  }
  if (err?.name === "JsonWebTokenError") {
    res.status(401).json({ success: false, statusCode: 401, message: "Invalid token." });
    return;
  }
  if (err?.name === "TokenExpiredError") {
    res.status(401).json({ success: false, statusCode: 401, message: "Token expired." });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, statusCode: 500, message: err?.message ?? "Internal server error." });
};

export default errorHandler;