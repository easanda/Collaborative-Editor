import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { documentsTable } from "./documents";

export const documentVersionsTable = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documentsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentVersionSchema = createInsertSchema(
  documentVersionsTable
).omit({ id: true, createdAt: true });

export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersionsTable.$inferSelect;
