import { Response } from "express";

export type TMeta = {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

type TResponse<T> = {
  success: boolean;
  statusCode: number;
  message?: string | null;
  meta?: TMeta;
  data?: T | null;
};

const sendResponse = <T>(res: Response, data: TResponse<T>): void => {
  res.status(data.statusCode).json({
    success:    data.success,
    statusCode: data.statusCode,
    message:    data.message ?? null,
    meta:       data.meta,
    data:       data.data ?? null,
  });
};

export default sendResponse;