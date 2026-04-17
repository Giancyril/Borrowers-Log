import prisma from "../../config/prisma";

export const getRequests = async (query: any) => {
  const { status } = query;

  return prisma.borrowRequest.findMany({
    where: status ? { status } : {},
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });
};

export const createRequest = async (data: any) => {
  return prisma.borrowRequest.create({
    data,
  });
};

export const approveRequest = async (id: string) => {
  const request = await prisma.borrowRequest.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  // OPTIONAL: create borrow record
  await prisma.borrowRecord.create({
  data: {
    itemId: request.itemId,
    quantityBorrowed: request.quantityRequested, // 

    borrowerName: request.borrowerName,
    borrowerEmail: request.borrowerEmail,
    borrowerDepartment: request.borrowerDepartment,

    borrowDate: new Date(),
    dueDate: request.neededUntil,

    status: "ACTIVE",
  },
});

  return request;
};

export const rejectRequest = async (id: string, reason?: string) => {
  return prisma.borrowRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason || "",
    },
  });
};