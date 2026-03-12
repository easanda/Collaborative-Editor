import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db } from "@workspace/db";
import { documentsTable, insertDocumentSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateDocumentBody,
  UpdateDocumentBody,
  GetDocumentParams,
  GetDocumentByShareTokenParams,
  UpdateDocumentParams,
  UpdateDocumentBody as UpdateDocumentBodySchema,
  DeleteDocumentParams,
  DuplicateDocumentParams,
  UpdateDocumentTagsParams,
  UpdateDocumentTagsBody,
  GenerateShareTokenParams,
  RevokeShareTokenParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const docs = await db
    .select()
    .from(documentsTable)
    .orderBy(documentsTable.updatedAt);
  res.json(docs);
});

router.post("/", async (req, res) => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }
  const data = insertDocumentSchema.parse({
    title: parsed.data.title,
    content: parsed.data.content ?? "",
    tags: parsed.data.tags ?? [],
  });
  const [doc] = await db.insert(documentsTable).values(data).returning();
  res.status(201).json(doc);
});

router.get("/share/:token", async (req, res) => {
  const { token } = GetDocumentByShareTokenParams.parse(req.params);
  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.shareToken, token));
  if (!doc) {
    res.status(404).json({ error: "not_found", message: "Document not found or link revoked" });
    return;
  }
  res.json(doc);
});

router.get("/:id", async (req, res) => {
  const { id } = GetDocumentParams.parse(req.params);
  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, id));
  if (!doc) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  res.json(doc);
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateDocumentParams.parse(req.params);
  const parsed = UpdateDocumentBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }
  const updateData: Partial<typeof documentsTable.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;

  const [updated] = await db
    .update(documentsTable)
    .set(updateData)
    .where(eq(documentsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteDocumentParams.parse(req.params);
  const [deleted] = await db
    .delete(documentsTable)
    .where(eq(documentsTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  res.status(204).end();
});

router.post("/:id/duplicate", async (req, res) => {
  const { id } = DuplicateDocumentParams.parse(req.params);
  const [original] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, id));
  if (!original) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  const [copy] = await db
    .insert(documentsTable)
    .values({
      title: `${original.title} (Copy)`,
      content: original.content,
      tags: original.tags,
    })
    .returning();
  res.status(201).json(copy);
});

router.patch("/:id/tags", async (req, res) => {
  const { id } = UpdateDocumentTagsParams.parse(req.params);
  const parsed = UpdateDocumentTagsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(documentsTable)
    .set({ tags: parsed.data.tags, updatedAt: new Date() })
    .where(eq(documentsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  res.json(updated);
});

router.post("/:id/share", async (req, res) => {
  const { id } = GenerateShareTokenParams.parse(req.params);
  const token = randomBytes(24).toString("base64url");
  const [updated] = await db
    .update(documentsTable)
    .set({ shareToken: token })
    .where(eq(documentsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  res.json({ shareToken: token, shareUrl: `/share/${token}` });
});

router.delete("/:id/share", async (req, res) => {
  const { id } = RevokeShareTokenParams.parse(req.params);
  const [updated] = await db
    .update(documentsTable)
    .set({ shareToken: null })
    .where(eq(documentsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  res.json(updated);
});

export default router;
