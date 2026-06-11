import { z } from "zod";

export const createStaffSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  businessId: z.string().uuid("Invalid business ID"),
  employeeCode: z.string().max(50, "Employee code too long").optional(),
  position: z.string().max(100, "Position too long").optional(),
  hireDate: z.string().optional(),
});

export const updateStaffSchema = z.object({
  employeeCode: z.string().max(50, "Employee code too long").optional(),
  position: z.string().max(100, "Position too long").optional(),
  hireDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createAssignmentSchema = z.object({
  staffId: z.string().uuid("Invalid staff ID"),
  level: z.enum(["business", "branch", "store"], {
    errorMap: () => ({ message: "Level must be business, branch, or store" }),
  }),
  businessId: z.string().uuid("Invalid business ID"),
  branchId: z.string().uuid("Invalid branch ID").optional(),
  storeId: z.string().uuid("Invalid store ID").optional(),
  roleId: z.string().uuid("Invalid role ID").optional(),
  isPrimary: z.boolean().default(false),
});

export const updateAssignmentSchema = z.object({
  level: z.enum(["business", "branch", "store"]).optional(),
  branchId: z.string().uuid("Invalid branch ID").nullable().optional(),
  storeId: z.string().uuid("Invalid store ID").nullable().optional(),
  roleId: z.string().uuid("Invalid role ID").nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export type CreateStaffSchema = z.infer<typeof createStaffSchema>;
export type UpdateStaffSchema = z.infer<typeof updateStaffSchema>;
export type CreateAssignmentSchema = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentSchema = z.infer<typeof updateAssignmentSchema>;
