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
  const item = await prisma.item.findFirst({ where: { id: data.itemId, isDeleted: false } });
  if (!item) throw new AppError(StatusCodes.NOT_FOUND, "Item not found");

  const agg = await prisma.borrowRecord.aggregate({
    where: { itemId: data.itemId, status: { in: ["ACTIVE", "OVERDUE"] }, isDeleted: false },
    _sum:  { quantityBorrowed: true },
  });
  const borrowed  = agg._sum.quantityBorrowed ?? 0;
  const available = item.totalQuantity - borrowed;

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
  const status = query.status   as string | undefined;
  const search = query.search   as string | undefined;
  const dateFrom = query.dateFrom as string | undefined;
  const dateTo   = query.dateTo   as string | undefined;

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
  if (dateFrom || dateTo) {
    where.borrowDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo   && { lte: new Date(new Date(dateTo).setHours(23, 59, 59)) }),
    };
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

// ── Update record ─────────────────────────────────────────────────────────────
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
      ...(data.quantityBorrowed   && { quantityBorrowed:   data.quantityBorrowed }),
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

// ── Bulk return ───────────────────────────────────────────────────────────────
const bulkReturn = async (ids: string[]) => {
  const eligible = await prisma.borrowRecord.findMany({
    where:  { id: { in: ids }, status: { in: ["ACTIVE", "OVERDUE"] }, isDeleted: false },
    select: { id: true },
  });
  const eligibleIds = eligible.map(r => r.id);

  if (eligibleIds.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No eligible records to return");
  }

  await prisma.borrowRecord.updateMany({
    where: { id: { in: eligibleIds } },
    data:  { status: "RETURNED", actualReturnDate: new Date() },
  });

  return { returned: eligibleIds.length };
};

// ── Bulk delete ───────────────────────────────────────────────────────────────
const bulkDelete = async (ids: string[]) => {
  const eligible = await prisma.borrowRecord.findMany({
    where:  { id: { in: ids }, isDeleted: false },
    select: { id: true },
  });
  const eligibleIds = eligible.map(r => r.id);

  if (eligibleIds.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No records found to delete");
  }

  await prisma.borrowRecord.updateMany({
    where: { id: { in: eligibleIds } },
    data:  { isDeleted: true, deletedAt: new Date() },
  });

  return { deleted: eligibleIds.length };
};

// ── Delete single (soft) ──────────────────────────────────────────────────────
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

  return records.map(r => ({
    ...r,
    daysOverdue: Math.floor((now.getTime() - new Date(r.dueDate).getTime()) / 86400000),
  }));
};

// ── Dashboard stats ───────────────────────────────────────────────────────────
const getStats = async () => {
  await flagOverdue();

  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow  = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter  = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);
  const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // Build last 7 days date ranges
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const [
    totalItems,
    activeRecords,
    overdueRecords,
    returnedRecords,
    dueTodayCount,
    dueTomorrowCount,
    borrowsToday,
    borrowsThisWeek,
    recentRecords,
    topItemsRaw,
    returnedRecordsRaw,
    allActiveOverdue,
    departmentRaw,
    uniqueBorrowersRaw,
  ] = await Promise.all([
    prisma.item.count({ where: { isDeleted: false } }),
    prisma.borrowRecord.count({ where: { status: "ACTIVE",   isDeleted: false } }),
    prisma.borrowRecord.count({ where: { status: "OVERDUE",  isDeleted: false } }),
    prisma.borrowRecord.count({ where: { status: "RETURNED", isDeleted: false } }),

    // Due today
    prisma.borrowRecord.count({
      where: {
        isDeleted: false,
        status:    { in: ["ACTIVE", "OVERDUE"] },
        dueDate:   { gte: today, lt: tomorrow },
      },
    }),

    // Due tomorrow
    prisma.borrowRecord.count({
      where: {
        isDeleted: false,
        status:    { in: ["ACTIVE", "OVERDUE"] },
        dueDate:   { gte: tomorrow, lt: dayAfter },
      },
    }),

    // Borrows today
    prisma.borrowRecord.count({
      where: { isDeleted: false, createdAt: { gte: today } },
    }),

    // Borrows this week
    prisma.borrowRecord.count({
      where: { isDeleted: false, createdAt: { gte: weekStart } },
    }),

    // Recent 5 records
    prisma.borrowRecord.findMany({
      where:   { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take:    5,
      include: { item: { select: { id: true, name: true } } },
    }),

    // Top borrowed items
    prisma.borrowRecord.groupBy({
      by:      ["itemId"],
      where:   { isDeleted: false },
      _count:  { itemId: true },
      orderBy: { _count: { itemId: "desc" } },
      take:    5,
    }),

    // Returned records with dates for avg duration + on-time calc
    prisma.borrowRecord.findMany({
      where: {
        isDeleted:        false,
        status:           "RETURNED",
        actualReturnDate: { not: null },
      },
      select: {
        borrowDate:       true,
        dueDate:          true,
        actualReturnDate: true,
      },
    }),

    // Active/overdue records for longest active borrow
    prisma.borrowRecord.findMany({
      where:   { isDeleted: false, status: { in: ["ACTIVE", "OVERDUE"] } },
      orderBy: { borrowDate: "asc" },
      take:    1,
      select: {
        borrowerName: true,
        borrowDate:   true,
        item:         { select: { name: true } },
      },
    }),

    // Department breakdown
    prisma.borrowRecord.groupBy({
      by:      ["borrowerDepartment"],
      where:   { isDeleted: false, borrowerDepartment: { not: "" } },
      _count:  { borrowerDepartment: true },
      orderBy: { _count: { borrowerDepartment: "desc" } },
      take:    8,
    }),

    // Unique borrowers
    prisma.borrowRecord.groupBy({
      by:    ["borrowerName"],
      where: { isDeleted: false },
    }),
  ]);

  // ── Resolve top item names ──
  const topItemIds     = topItemsRaw.map(t => t.itemId);
  const topItemDetails = await prisma.item.findMany({
    where:  { id: { in: topItemIds } },
    select: { id: true, name: true },
  });
  const nameMap  = Object.fromEntries(topItemDetails.map(i => [i.id, i.name]));
  const topItems = topItemsRaw.map(t => ({
    itemId:   t.itemId,
    itemName: nameMap[t.itemId] ?? "Unknown",
    count:    t._count.itemId,
  }));

  // ── Average borrow duration (days) ──
  const durations = returnedRecordsRaw
    .filter(r => r.actualReturnDate)
    .map(r => {
      const ms = new Date(r.actualReturnDate!).getTime() - new Date(r.borrowDate).getTime();
      return ms / 86400000;
    });
  const avgBorrowDays = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // ── On-time vs late returns ──
  const onTimeReturnCount = returnedRecordsRaw.filter(r =>
    r.actualReturnDate && new Date(r.actualReturnDate) <= new Date(r.dueDate)
  ).length;
  const lateReturnCount = returnedRecordsRaw.filter(r =>
    r.actualReturnDate && new Date(r.actualReturnDate) > new Date(r.dueDate)
  ).length;

  // ── On-time return rate % ──
  const totalReturned   = onTimeReturnCount + lateReturnCount;
  const onTimeRate      = totalReturned > 0
    ? Math.round((onTimeReturnCount / totalReturned) * 100)
    : 0;

  // ── Longest active borrow ──
  const longestActiveBorrow = allActiveOverdue.length > 0 ? {
    borrowerName: allActiveOverdue[0].borrowerName,
    itemName:     allActiveOverdue[0].item?.name ?? "Unknown",
    days:         Math.floor((now.getTime() - new Date(allActiveOverdue[0].borrowDate).getTime()) / 86400000),
  } : null;

  // ── Borrows per day (last 7 days) ──
  const borrowsPerDay = await Promise.all(
    last7Days.map(async (dayStart) => {
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.borrowRecord.count({
        where: {
          isDeleted: false,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      });
      return {
        date:  dayStart.toISOString().slice(0, 10),
        label: dayStart.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" }),
        count,
      };
    })
  );

  // ── Department stats ──
  const departmentStats = departmentRaw.map(d => ({
    department: d.borrowerDepartment || "Unknown",
    count:      d._count.borrowerDepartment,
  }));

  // ── Unique borrowers count ──
  const uniqueBorrowers    = uniqueBorrowersRaw.length;
  const repeatBorrowers    = uniqueBorrowersRaw.filter(async () => false).length; // placeholder
  const avgBorrowsPerPerson = uniqueBorrowers > 0
    ? Math.round(((activeRecords + overdueRecords + returnedRecords) / uniqueBorrowers) * 10) / 10
    : 0;

  return {
    // existing
    totalItems,
    activeRecords,
    overdueRecords,
    returnedRecords,
    dueTodayCount,
    dueTomorrowCount,
    borrowsToday,
    borrowsThisWeek,
    topItems,
    recentRecords,

    // new analytics
    avgBorrowDays,
    onTimeReturnCount,
    lateReturnCount,
    onTimeRate,
    longestActiveBorrow,
    borrowsPerDay,
    departmentStats,
    uniqueBorrowers,
    avgBorrowsPerPerson,
  };
};

export const borrowRecordsService = {
  createRecord,
  getRecords,
  getSingleRecord,
  updateRecord,
  returnRecord,
  bulkReturn,
  bulkDelete,
  deleteRecord,
  getOverdue,
  getStats,
};