import { z } from "zod";

export const usernameParamSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/^u\//i, ""))
  .refine((val) => /^[A-Za-z0-9_-]{3,30}$/.test(val), {
    message: "Invalid Reddit username format. Must be 3-30 alphanumeric characters, underscores, or hyphens.",
  });

export const searchUserQuerySchema = z.object({
  username: usernameParamSchema,
});

export const postsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).optional(),
  cursor: z.union([z.string(), z.number()]).optional(),
  before: z.coerce.number().optional(),
  after: z.coerce.number().optional(),
  sort: z.enum(["newest", "oldest", "score", "comments"]).default("newest"),
  status: z.enum(["ALL", "VISIBLE", "DELETED", "REMOVED", "EDITED", "DELETED_LATER", "INITIALLY_UNAVAILABLE"]).default("ALL"),
  subreddit: z.string().trim().optional(),
  from: z.coerce.number().optional(), // Unix epoch seconds
  to: z.coerce.number().optional(),
  search: z.string().trim().optional(),
  hasMedia: z.enum(["true", "false", "all"]).default("all"),
});

export const commentsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).optional(),
  cursor: z.union([z.string(), z.number()]).optional(),
  before: z.coerce.number().optional(),
  after: z.coerce.number().optional(),
  sort: z.enum(["newest", "oldest", "score"]).default("newest"),
  status: z.enum(["ALL", "VISIBLE", "DELETED", "REMOVED", "EDITED", "DELETED_LATER", "INITIALLY_UNAVAILABLE"]).default("ALL"),
  subreddit: z.string().trim().optional(),
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
  search: z.string().trim().optional(),
});

export const timelineQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  type: z.enum(["ALL", "POST", "COMMENT"]).default("ALL"),
  status: z.enum(["ALL", "VISIBLE", "DELETED", "REMOVED", "EDITED"]).default("ALL"),
  subreddit: z.string().trim().optional(),
  year: z.coerce.number().optional(),
});
