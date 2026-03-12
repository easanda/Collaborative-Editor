import { Router, type IRouter } from "express";
import { SaveToGithubBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/save", async (req, res) => {
  const token = process.env["GITHUB_TOKEN"];
  if (!token) {
    res.status(401).json({
      error: "no_github_token",
      message:
        "GITHUB_TOKEN secret is not configured. Please add it in the Secrets tab with 'gist' scope permissions.",
    });
    return;
  }

  const parsed = SaveToGithubBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { filename, content, description, isPublic, gistId } = parsed.data;

  let response: Response;
  let isUpdate = false;

  if (gistId) {
    isUpdate = true;
    response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        description: description ?? `Updated from Collaborative Markdown Editor`,
        files: {
          [filename]: { content },
        },
      }),
    });
  } else {
    response = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        description: description ?? `Saved from Collaborative Markdown Editor`,
        public: isPublic ?? false,
        files: {
          [filename]: { content },
        },
      }),
    });
  }

  if (!response.ok) {
    const err = await response.text();
    res.status(response.status).json({
      error: "github_error",
      message: `GitHub API error: ${err}`,
    });
    return;
  }

  const gist = await response.json() as { id: string; url: string; html_url: string };

  res.json({
    gistId: gist.id,
    url: gist.url,
    htmlUrl: gist.html_url,
    isUpdate,
  });
});

export default router;
