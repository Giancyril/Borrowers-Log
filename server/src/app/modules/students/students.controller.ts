import { Request, Response, NextFunction } from "express";
import { studentService } from "./students.service";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";

/**
 * Controller to fetch student info by ID.
 */
const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await studentService.getStudentById(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Student info fetched successfully",
      data:       result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch student info by Name and Email.
 */
const getStudentByDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.query;
    if (!name && !email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Either student name or email is required to search.",
      });
    }

    const result = await studentService.getStudentByDetails(name as string, email as string);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Student info fetched successfully",
      data:       result,
    });
  } catch (err) {
    next(err);
  }
};

export const studentController = {
  getStudentById,
  getStudentByDetails,
};
