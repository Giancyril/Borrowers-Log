import { Request, Response } from "express";
import * as service from "./reminders.service";

const getSettings = async (req: Request, res: Response) => {
  try {
    const data = await service.getSettings();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = await service.updateSettings(req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendReminders = async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    const data = await service.sendReminders(type);

    res.json({
      success: true,
      message: `${type} reminders processed`,
      data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ EXPORT OBJECT
export const remindersController = {
  getSettings,
  updateSettings,
  sendReminders,
};