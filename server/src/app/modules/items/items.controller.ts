import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { itemsService } from "./items.service";
import { createItemSchema, updateItemSchema } from "./items.validate";
import { utils } from "../../utils/utils";

const createItem = async (req: Request, res: Response) => {
  try {
    const data   = createItemSchema.parse(req.body);
    const result = await itemsService.createItem(data);
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Item created", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const getItems = async (req: Request, res: Response) => {
  try {
    const { items, total } = await itemsService.getItems(req.query);
    const meta = utils.calculateMeta(req.query, total);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Items retrieved", meta, data: items });
  } catch (err: any) {
    sendResponse(res, { statusCode: 400, success: false, message: err.message, data: null });
  }
};

const getSingleItem = async (req: Request, res: Response) => {
  try {
    const result = await itemsService.getSingleItem(req.params.id);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Item retrieved", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const updateItem = async (req: Request, res: Response) => {
  try {
    const data   = updateItemSchema.parse(req.body);
    const result = await itemsService.updateItem(req.params.id, data);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Item updated", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

const deleteItem = async (req: Request, res: Response) => {
  try {
    await itemsService.deleteItem(req.params.id);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Item deleted", data: null });
  } catch (err: any) {
    sendResponse(res, { statusCode: 400, success: false, message: err.message, data: null });
  }
};

const markRepaired = async (req: Request, res: Response) => {
  try {
    const result = await itemsService.markRepaired(req.params.id);
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Item marked as repaired", data: result });
  } catch (err: any) {
    sendResponse(res, { statusCode: err.statusCode ?? 400, success: false, message: err.message, data: null });
  }
};

export const itemsController = { createItem, getItems, getSingleItem, updateItem, deleteItem, markRepaired, };