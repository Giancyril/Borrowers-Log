import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { CreateBorrowTemplateInput, UpdateBorrowTemplateInput } from "./borrowTemplates.validate";

const templateSelect = {
  id: true, name: true,
  borrowerName: true, borrowerEmail: true,
  borrowerDepartment: true,
  conditionOnBorrow: true, dueOffsetDays: true,
  createdById: true, createdAt: true, updatedAt: true,
};

const getTemplates = async () => {
  return prisma.borrowTemplate.findMany({
    orderBy: { createdAt: "desc" },
    select: templateSelect,
  });
};

const createTemplate = async (data: CreateBorrowTemplateInput, adminId: string) => {
  return prisma.borrowTemplate.create({
    data: { 
      ...data, 
      createdById: adminId,
      conditionOnBorrow: data.conditionOnBorrow as any
    },
    select: templateSelect,
  });
};

const updateTemplate = async (id: string, data: UpdateBorrowTemplateInput) => {
  const template = await prisma.borrowTemplate.findUnique({ where: { id } });
  if (!template) throw new AppError(StatusCodes.NOT_FOUND, "Template not found");
  return prisma.borrowTemplate.update({
    where: { id }, 
    data: {
      ...data,
      conditionOnBorrow: data.conditionOnBorrow ? (data.conditionOnBorrow as any) : undefined
    }, 
    select: templateSelect,
  });
};

const deleteTemplate = async (id: string) => {
  const template = await prisma.borrowTemplate.findUnique({ where: { id } });
  if (!template) throw new AppError(StatusCodes.NOT_FOUND, "Template not found");
  return prisma.borrowTemplate.delete({ where: { id } });
};

export const borrowTemplatesService = { getTemplates, createTemplate, updateTemplate, deleteTemplate };