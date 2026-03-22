import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { activityLogService } from "./activityLog.service";
import { utils } from "../../utils/utils";

const getLogs = async (req: Request, res: Response) => {
  try {
    const { logs, total } = await activityLogService.getLogs(req.query);
    const meta = utils.calculateMeta(req.query, total);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Logs retrieved", meta, data: logs });
  } catch (err: any) {
    sendResponse(res, { statusCode: 400, success: false, message: err.message, data: null });
  }
};

export const activityLogController = { getLogs };