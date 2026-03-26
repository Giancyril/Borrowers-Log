import { Request, Response } from "express";
import * as service from "./borrowRequests.service";

export const getRequests = async (req: Request, res: Response) => {
  try {
    const data = await service.getRequests(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch requests" });
  }
};

export const createRequest = async (req: Request, res: Response) => {
  try {
    const data = await service.createRequest(req.body);
    res.status(201).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false });
  }
};

export const approveRequest = async (req: Request, res: Response) => {
  try {
    const data = await service.approveRequest(req.params.id);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false });
  }
};

export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const data = await service.rejectRequest(req.params.id, req.body.reason);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false });
  }
};

// ✅ ADD THIS
export const borrowRequestsController = {
  getRequests,
  createRequest,
  approveRequest,
  rejectRequest,
};