import { z } from "zod";

export const emailSchema = z.email().min(1);

export type EmailSchema = z.infer<typeof emailSchema>;
