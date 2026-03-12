import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { documentsTable, insertDocumentSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateDocumentBody,
  UpdateDocumentBody,
  GetDocumentParams,
  UpdateDocumentParams,
  DeleteDocumentParams,
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
  });

  const [doc] = await db.insert(documentsTable).values(data).returning();
  res.status(201).json(doc);
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
  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const updateData: { title?: string; content?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.content !== undefined) updateData.content = parsed.data.content;

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

export default router;
