import { z } from "zod";

const signatureSchema = z
  .string()
  .min(1, "Signature is required")
  .refine(
    (v) => v.startsWith("data:image/") || v.startsWith("["),
    "Must be a valid signature (image data URI or JSON stroke data)"
  );

export const createBorrowRecordSchema = z.object({
  itemId:             z.string().uuid("Invalid item ID"),
  quantityBorrowed:   z.number().int().min(1),
  borrowerName:       z.string().min(1, "Borrower name is required").max(100),
  borrowerEmail:      z.string().email().optional().or(z.literal("")).default(""),
  borrowerDepartment: z.string().max(100).optional().default(""),
  purpose:            z.string().max(500).optional().default(""),
  borrowDate:         z.string().or(z.date()),
  dueDate:            z.string().or(z.date()),
  conditionOnBorrow:  z.string().max(300).optional().default(""),
  borrowSignature:    signatureSchema,
}).refine(
  (d) => new Date(d.dueDate) >= new Date(d.borrowDate),
  { message: "Due date must be after borrow date", path: ["dueDate"] }
);

export const returnBorrowRecordSchema = z.object({
  conditionOnReturn: z.string().max(300).optional().default(""),
  damageNotes:       z.string().max(500).optional().default(""),
  returnSignature:   signatureSchema,
});

export const updateBorrowRecordSchema = z.object({
  borrowerName:       z.string().min(1).max(100).optional(),
  borrowerEmail:      z.string().email().optional(),
  borrowerDepartment: z.string().max(100).optional(),
  purpose:            z.string().max(500).optional(),
  dueDate:            z.string().or(z.date()).optional(),
  conditionOnBorrow:  z.string().max(300).optional(),
  quantityBorrowed:   z.number().int().min(1).optional(),
});

export type CreateBorrowRecordInput  = z.infer<typeof createBorrowRecordSchema>;
export type ReturnBorrowRecordInput  = z.infer<typeof returnBorrowRecordSchema>;
export type UpdateBorrowRecordInput  = z.infer<typeof updateBorrowRecordSchema>;