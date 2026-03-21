import prisma from "../../config/prisma";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import {
  CreateBorrowRecordInput,
  ReturnBorrowRecordInput,
  UpdateBorrowRecordInput,
} from "./borrowRecords.validate";

// ── Auto-flag overdue records ─────────────────────────────────────────────────
const flagOverdue = async () => {
  await prisma.borrowRecord.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() }, isDeleted: false },
    data:  { status: "OVERDUE" },
  });
};

// ── Create borrow record ──────────────────────────────────────────────────────
const createRecord = async (data: CreateBorrowRecordInput, adminId: string) => {
  // Check item exists
  const item = await prisma.item.findFirst({ where: { id: data.itemId, isDeleted: false } });
  if (!item) throw new AppError(StatusCodes.NOT_FOUND, "Item not found");

  // Check available quantity
  const agg = await prisma.borrowRecord.aggregate({
    where: { itemId: data.itemId, status: { in: ["ACTIVE", "OVERDUE"] }, isDeleted: false },
    _sum:  { quantityBorrowed: true },
  });
  const borrowed      = agg._sum.quantityBorrowed ?? 0;
  const available     = item.totalQuantity - borrowed;

  if (data.quantityBorrowed > available) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Only ${available} unit${available !== 1 ? "s" : ""} available`
    );
  }

  return prisma.borrowRecord.create({
    data: {
      itemId:             data.itemId,
      quantityBorrowed:   data.quantityBorrowed,
      borrowerName:       data.borrowerName,
      borrowerEmail:      data.borrowerEmail ?? "",
      borrowerDepartment: data.borrowerDepartment ?? "",
      purpose:            data.purpose ?? "",
      borrowDate:         new Date(data.borrowDate),
      dueDate:            new Date(data.dueDate),
      conditionOnBorrow:  data.conditionOnBorrow ?? "",
      borrowSignature:    data.borrowSignature,
      processedById:      adminId,
      status:             "ACTIVE",
    },
    include: {
      item:        { select: { id: true, name: true, category: true } },
      processedBy: { select: { id: true, name: true, username: true } },
    },
  });
};

// ── Get all records ───────────────────────────────────────────────────────────
const getRecords = async (query: Record<string, any>) => {
  await flagOverdue();

  const page   = Number(query.page)  || 1;
  const limit  = Number(query.limit) || 10;
  const skip   = (page - 1) * limit;
  const status = query.status as string | undefined;
  const search = query.search as string | undefined;

  const where: any = { isDeleted: false };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { borrowerName:  { contains: search, mode: "insensitive" } },
      { borrowerEmail: { contains: search, mode: "insensitive" } },
      { purpose:       { contains: search, mode: "insensitive" } },
      { item: { name:  { contains: search, mode: "insensitive" } } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.borrowRecord.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: "desc" },
      include: {
        item:        { select: { id: true, name: true, category: true } },
        processedBy: { select: { id: true, name: true, username: true } },
      },
    }),
    prisma.borrowRecord.count({ where }),
  ]);

  return { records, total };
};

// ── Get single record ─────────────────────────────────────────────────────────
const getSingleRecord = async (id: string) => {
  const record = await prisma.borrowRecord.findFirst({
    where:   { id, isDeleted: false },
    include: {
      item:        true,
      processedBy: { select: { id: true, name: true, username: true } },
    },
  });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Borrow record not found");
  return record;
};

// ── Update record (before return) ─────────────────────────────────────────────
const updateRecord = async (id: string, data: UpdateBorrowRecordInput) => {
  const record = await prisma.borrowRecord.findFirst({ where: { id, isDeleted: false } });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Borrow record not found");
  if (record.status === "RETURNED") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Cannot edit a returned record");
  }

  return prisma.borrowRecord.update({
    where: { id },
    data: {
      ...(data.borrowerName       && { borrowerName:       data.borrowerName }),
      ...(data.borrowerEmail      && { borrowerEmail:      data.borrowerEmail }),
      ...(data.borrowerDepartment && { borrowerDepartment: data.borrowerDepartment }),
      ...(data.purpose            && { purpose:            data.purpose }),
      ...(data.dueDate            && { dueDate:            new Date(data.dueDate) }),
      ...(data.conditionOnBorrow  && { conditionOnBorrow:  data.conditionOnBorrow }),
    },
    include: { item: { select: { id: true, name: true, category: true } } },
  });
};

// ── Process return ────────────────────────────────────────────────────────────
const returnRecord = async (id: string, data: ReturnBorrowRecordInput) => {
  const record = await prisma.borrowRecord.findFirst({
    where:   { id, isDeleted: false },
    include: { item: true },
  });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Borrow record not found");
  if (record.status === "RETURNED") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Item has already been returned");
  }

  return prisma.borrowRecord.update({
    where: { id },
    data: {
      status:            "RETURNED",
      actualReturnDate:  new Date(),
      conditionOnReturn: data.conditionOnReturn ?? "",
      damageNotes:       data.damageNotes ?? "",
      returnSignature:   data.returnSignature,
    },
    include: {
      item:        { select: { id: true, name: true, category: true } },
      processedBy: { select: { id: true, name: true, username: true } },
    },
  });
};

// ── Delete (soft) ─────────────────────────────────────────────────────────────
const deleteRecord = async (id: string) => {
  const record = await prisma.borrowRecord.findFirst({ where: { id, isDeleted: false } });
  if (!record) throw new AppError(StatusCodes.NOT_FOUND, "Borrow record not found");

  return prisma.borrowRecord.update({
    where: { id },
    data:  { isDeleted: true, deletedAt: new Date() },
  });
};

// ── Get overdue records ───────────────────────────────────────────────────────
const getOverdue = async () => {
  await flagOverdue();

  const now     = new Date();
  const records = await prisma.borrowRecord.findMany({
    where:   { status: "OVERDUE", isDeleted: false },
    orderBy: { dueDate: "asc" },
    include: { item: { select: { id: true, name: true, category: true } } },
  });

  return records.map((r) => ({
    ...r,
    daysOverdue: Math.floor((now.getTime() - new Date(r.dueDate).getTime()) / 86400000),
  }));
};

// ── Dashboard stats ───────────────────────────────────────────────────────────
const getStats = async () => {
  await flagOverdue();

  const [totalItems, activeRecords, overdueRecords, returnedRecords] = await Promise.all([
    prisma.item.count({ where: { isDeleted: false } }),
    prisma.borrowRecord.count({ where: { status: "ACTIVE",   isDeleted: false } }),
    prisma.borrowRecord.count({ where: { status: "OVERDUE",  isDeleted: false } }),
    prisma.borrowRecord.count({ where: { status: "RETURNED", isDeleted: false } }),
  ]);

  const recentRecords = await prisma.borrowRecord.findMany({
    where:   { isDeleted: false },
    orderBy: { createdAt: "desc" },
    take:    5,
    include: { item: { select: { id: true, name: true } } },
  });

  return { totalItems, activeRecords, overdueRecords, returnedRecords, recentRecords };
};

export const borrowRecordsService = {
  createRecord,
  getRecords,
  getSingleRecord,
  updateRecord,
  returnRecord,
  deleteRecord,
  getOverdue,
  getStats,
};