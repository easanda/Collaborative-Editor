import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { documentsTable, documentVersionsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  ListDocumentVersionsParams,
  SaveDocumentVersionParams,
  SaveDocumentVersionBody,
  DeleteDocumentVersionParams,
  RestoreDocumentVersionParams,
} from "@workspace/api-zod";

const router: IRouter = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const { id } = ListDocumentVersionsParams.parse(req.params);
  const versions = await db
    .select()
    .from(documentVersionsTable)
    .where(eq(documentVersionsTable.documentId, id))
    .orderBy(desc(documentVersionsTable.createdAt));
  res.json(versions);
});

router.post("/", async (req, res) => {
  const { id } = SaveDocumentVersionParams.parse(req.params);
  const parsed = SaveDocumentVersionBody.safeParse(req.body ?? {});
  const label = parsed.success ? parsed.data.label ?? null : null;

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, id));
  if (!doc) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }

  const [version] = await db
    .insert(documentVersionsTable)
    .values({
      documentId: id,
      title: doc.title,
      content: doc.content,
      label,
    })
    .returning();

  res.status(201).json(version);
});

router.delete("/:versionId", async (req, res) => {
  const { id, versionId } = DeleteDocumentVersionParams.parse(req.params);
  const [deleted] = await db
    .delete(documentVersionsTable)
    .where(
      and(
        eq(documentVersionsTable.id, versionId),
        eq(documentVersionsTable.documentId, id)
      )
    )
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "not_found", message: "Version not found" });
    return;
  }
  res.status(204).end();
});

router.post("/:versionId/restore", async (req, res) => {
  const { id, versionId } = RestoreDocumentVersionParams.parse(req.params);
  const [version] = await db
    .select()
    .from(documentVersionsTable)
    .where(
      and(
        eq(documentVersionsTable.id, versionId),
        eq(documentVersionsTable.documentId, id)
      )
    );
  if (!version) {
    res.status(404).json({ error: "not_found", message: "Version not found" });
    return;
  }

  const [restored] = await db
    .update(documentsTable)
    .set({
      title: version.title,
      content: version.content,
      updatedAt: new Date(),
    })
    .where(eq(documentsTable.id, id))
    .returning();

  res.json(restored);
});

export default router;
