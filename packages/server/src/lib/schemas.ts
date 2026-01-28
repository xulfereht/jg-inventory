import { z } from "zod";

// ── Item Schemas ──

export const CreateItemSchema = z.object({
  name: z.string().min(1, "품명은 필수입니다"),
  synonyms: z.array(z.string()).optional(),
  openUnit: z.string().optional().default("봉"),
  safetyStock: z.number().int().min(0).optional().default(5),
  storage: z.string().optional(),
  isFavorite: z.boolean().optional().default(false),
});

export const UpdateItemSchema = z.object({
  name: z.string().min(1, "품명은 필수입니다").optional(),
  synonyms: z.array(z.string()).optional(),
  openUnit: z.string().optional(),
  safetyStock: z.number().int().min(0).optional(),
  storage: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
});

// ── Supplier Schemas ──

export const CreateSupplierSchema = z.object({
  name: z.string().min(1, "거래처명은 필수입니다"),
  contact: z.string().optional(),
  leadTime: z.number().int().min(0).optional(),
});

export const UpdateSupplierSchema = z.object({
  name: z.string().min(1, "거래처명은 필수입니다").optional(),
  contact: z.string().nullable().optional(),
  leadTime: z.number().int().min(0).nullable().optional(),
});

// ── Lot Schemas ──

export const CreateLotSchema = z.object({
  itemId: z.string().min(1, "품목 ID는 필수입니다"),
  supplierId: z.string().optional(),
  purchaseDate: z.string().transform((val) => new Date(val)),
  expiryDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  origin: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  initialQty: z.number().int().min(1, "초기 수량은 1 이상이어야 합니다"),
  note: z.string().optional(),
});

// ── OpenEvent Schemas ──

export const CreateOpenEventSchema = z.object({
  itemId: z.string().min(1, "품목 ID는 필수입니다"),
  lotId: z.string().optional(),
  quantity: z.number().int().min(1).optional().default(1),
  location: z.string().optional(),
});

export const UpdateLotSchema = z.object({
  supplierId: z.string().nullable().optional(),
  purchaseDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  expiryDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) =>
      val === null ? null : val ? new Date(val) : undefined
    ),
  origin: z.string().nullable().optional(),
  unitPrice: z.number().min(0).nullable().optional(),
  note: z.string().nullable().optional(),
});
