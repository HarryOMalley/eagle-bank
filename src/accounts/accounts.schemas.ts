import { z } from "zod";

export const CreateAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["CURRENT", "SAVINGS"]),
});
export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;

export const UpdateAccountSchema = z
  .object({
    name: z.string().min(1).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });
export type UpdateAccountDto = z.infer<typeof UpdateAccountSchema>;
