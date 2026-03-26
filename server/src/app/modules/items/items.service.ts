import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { CreateItemInput, UpdateItemInput } from "./items.validate";

const createItem = (data: CreateItemInput) =>
  prisma.item.create({ data });

const getItems = async (query: Record<string, any>) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = query.search as string | undefined;
  const category = query.category as string | undefined;

  const where: any = { isDeleted: false };
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
  if (category) where.category = category;

  const [items, total] = await Promise.all([
    prisma.item.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.item.count({ where }),
  ]);

  // Compute available quantity for each item
  const withAvailability = await Promise.all(
    items.map(async (item) => {
      const agg = await prisma.borrowRecord.aggregate({
        where: { itemId: item.id, status: { in: ["ACTIVE", "OVERDUE"] }, isDeleted: false },
        _sum: { quantityBorrowed: true },
      });
      const borrowed = agg._sum.quantityBorrowed ?? 0;
      const availableQuantity = Math.max(0, item.totalQuantity - borrowed);
      return { ...item, availableQuantity };
    })
  );

  return { items: withAvailability, total };
};

const getSingleItem = async (id: string) => {
  const item = await prisma.item.findFirst({ where: { id, isDeleted: false } });
  if (!item) throw new AppError(StatusCodes.NOT_FOUND, "Item not found");

  const agg = await prisma.borrowRecord.aggregate({
    where: { itemId: id, status: { in: ["ACTIVE", "OVERDUE"] }, isDeleted: false },
    _sum: { quantityBorrowed: true },
  });
  const borrowed = agg._sum.quantityBorrowed ?? 0;
  const availableQuantity = Math.max(0, item.totalQuantity - borrowed);
  return { ...item, availableQuantity };
};

const updateItem = async (id: string, data: UpdateItemInput) => {
  const exists = await prisma.item.findFirst({ where: { id, isDeleted: false } });
  if (!exists) throw new AppError(StatusCodes.NOT_FOUND, "Item not found");
  return prisma.item.update({ where: { id }, data });
};

const deleteItem = async (id: string) =>
  prisma.item.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });

export const itemsService = { createItem, getItems, getSingleItem, updateItem, deleteItem };