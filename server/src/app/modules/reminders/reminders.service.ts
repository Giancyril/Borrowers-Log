import prisma from "../../config/prisma";

// ✅ named exports
export const getSettings = async () => {
  let settings = await prisma.reminderSettings.findFirst();

  if (!settings) {
    settings = await prisma.reminderSettings.create({ data: {} });
  }

  return settings;
};

export const updateSettings = async (data: any) => {
  const existing = await prisma.reminderSettings.findFirst();

  if (existing) {
    return prisma.reminderSettings.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.reminderSettings.create({ data });
};

export const sendReminders = async (type: "upcoming" | "overdue") => {
  let whereCondition: any = {};

  if (type === "upcoming") {
    whereCondition = {
      status: "ACTIVE",
      dueDate: {
        lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    };
  }

  if (type === "overdue") {
    whereCondition = {
      status: "OVERDUE",
    };
  }

  const records = await prisma.borrowRecord.findMany({
    where: whereCondition,
  });

  return { count: records.length, type };
};