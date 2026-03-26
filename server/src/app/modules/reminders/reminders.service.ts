import prisma from "../../config/prisma";

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

export const sendReminders = async () => {
  const records = await prisma.borrowRecord.findMany({
    where: { status: "ACTIVE" },
  });

  // Stub logic
  return { count: records.length };
};