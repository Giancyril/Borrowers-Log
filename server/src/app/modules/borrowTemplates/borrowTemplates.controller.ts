import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { borrowTemplatesService } from "./borrowTemplates.service";
import { createBorrowTemplateSchema, updateBorrowTemplateSchema } from "./borrowTemplates.validate";

const getTemplates = async (_req: Request, res: Response) => {
  try {
    const result = await borrowTemplatesService.getTemplates();
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Templates retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: 400, success: false, message: err.message, data: null });
  }
};

const createTemplate = async (req: Request, res: Response) => {
  try {
    const data   = createBorrowTemplateSchema.parse(req.body);
    const result = await borrowTemplatesService.createTemplate(data, req.user!.id);
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Template created", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const updateTemplate = async (req: Request, res: Response) => {
  try {
    const data   = updateBorrowTemplateSchema.parse(req.body);
    const result = await borrowTemplatesService.updateTemplate(req.params.id, data);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Template updated", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const deleteTemplate = async (req: Request, res: Response) => {
  try {
    await borrowTemplatesService.deleteTemplate(req.params.id);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Template deleted", data: null });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

export const borrowTemplatesController = { getTemplates, createTemplate, updateTemplate, deleteTemplate };