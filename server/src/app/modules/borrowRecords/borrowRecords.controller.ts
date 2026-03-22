import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { borrowRecordsService } from "./borrowRecords.service";
import {
  createBorrowRecordSchema,
  returnBorrowRecordSchema,
  updateBorrowRecordSchema,
} from "./borrowRecords.validate";
import { utils } from "../../utils/utils";

const createRecord = async (req: Request, res: Response) => {
  try {
    const data   = createBorrowRecordSchema.parse(req.body);
    const result = await borrowRecordsService.createRecord(data, req.user!.id);
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Borrow record created", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const getRecords = async (req: Request, res: Response) => {
  try {
    const { records, total } = await borrowRecordsService.getRecords(req.query);
    const meta = utils.calculateMeta(req.query, total);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Records retrieved", meta, data: records });
  } catch (err: any) {
    sendResponse(res, { statusCode: 400, success: false, message: err.message, data: null });
  }
};

const getSingleRecord = async (req: Request, res: Response) => {
  try {
    const result = await borrowRecordsService.getSingleRecord(req.params.id);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Record retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const updateRecord = async (req: Request, res: Response) => {
  try {
    const data   = updateBorrowRecordSchema.parse(req.body);
    const result = await borrowRecordsService.updateRecord(req.params.id, data, req.user!.id);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Record updated", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const returnRecord = async (req: Request, res: Response) => {
  try {
    const data   = returnBorrowRecordSchema.parse(req.body);
    const result = await borrowRecordsService.returnRecord(req.params.id, data);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Return processed successfully", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const bulkReturn = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { statusCode: 400, success: false, message: "No record IDs provided", data: null });
    }
    const result = await borrowRecordsService.bulkReturn(ids);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: `${result.returned} record(s) marked as returned`, data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const bulkDelete = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, { statusCode: 400, success: false, message: "No record IDs provided", data: null });
    }
    const result = await borrowRecordsService.bulkDelete(ids);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: `${result.deleted} record(s) deleted`, data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const deleteRecord = async (req: Request, res: Response) => {
  try {
    await borrowRecordsService.deleteRecord(req.params.id, req.user!.id);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Record deleted", data: null });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const getOverdue = async (_req: Request, res: Response) => {
  try {
    const result = await borrowRecordsService.getOverdue();
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Overdue records retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: 400, success: false, message: err.message, data: null });
  }
};

const getStats = async (_req: Request, res: Response) => {
  try {
    const result = await borrowRecordsService.getStats();
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Stats retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: 400, success: false, message: err.message, data: null });
  }
};

export const borrowRecordsController = {
  createRecord,
  getRecords,
  getSingleRecord,
  updateRecord,
  returnRecord,
  bulkReturn,
  bulkDelete,
  deleteRecord,
  getOverdue,
  getStats,
};