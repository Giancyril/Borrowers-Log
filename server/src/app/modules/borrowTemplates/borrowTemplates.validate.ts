import { z } from "zod";

export const createBorrowTemplateSchema = z.object({
  name:               z.string().min(1, "Template name is required").max(100),
  borrowerName:       z.string().max(100).optional().default(""),
  borrowerEmail:      z.string().email().optional().or(z.literal("")).default(""),
  borrowerDepartment: z.string().max(100).optional().default(""),
  purpose:            z.string().max(500).optional().default(""),
  conditionOnBorrow:  z.enum(["GOOD", "MINOR", "BAD"]).optional().default("GOOD"),
  dueOffsetDays:      z.number().int().min(1).max(365).default(7),
});

export const updateBorrowTemplateSchema = createBorrowTemplateSchema.partial();

export type CreateBorrowTemplateInput = z.infer<typeof createBorrowTemplateSchema>;
export type UpdateBorrowTemplateInput = z.infer<typeof updateBorrowTemplateSchema>;