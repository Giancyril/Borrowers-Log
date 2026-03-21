import { z } from "zod";

export const createItemSchema = z.object({
  name:           z.string().min(1).max(120),
  category:       z.enum(["EQUIPMENT", "BOOKS", "OFFICE_SUPPLIES", "OTHER"]),
  description:    z.string().max(1000).optional().default(""),
  totalQuantity:  z.number().int().min(1),
  conditionNotes: z.string().max(500).optional().default(""),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;