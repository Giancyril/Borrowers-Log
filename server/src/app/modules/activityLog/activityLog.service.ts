import prisma from "../../config/prisma";

export interface LogParams {
  action:      string;
  entityType:  string;
  entityId?:   string;
  entityName?: string;
  details?:    string;
  adminId?:    string;
  adminName?:  string;
}

const createLog = async (params: LogParams) => {
  return prisma.activityLog.create({
    data: {
      action:     params.action     as any,
      entityType: params.entityType,
      entityId:   params.entityId,
      entityName: params.entityName,
      details:    params.details    ?? "",
      adminId:    params.adminId,
      adminName:  params.adminName,
    },
  });
};

const getLogs = async (query: Record<string, any>) => {
  const page  = Number(query.page)  || 1;
  const limit = Number(query.limit) || 20;
  const skip  = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count(),
  ]);

  return { logs, total };
};

export const activityLogService = { createLog, getLogs };