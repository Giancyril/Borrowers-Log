import { Request, Response } from "express";
import * as service from "./reminders.service";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const data = await service.getSettings();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = await service.updateSettings(req.body);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false });
  }
};

export const sendReminders = async (req: Request, res: Response) => {
  try {
    const data = await service.sendReminders();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false });
  }
};