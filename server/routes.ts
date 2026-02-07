import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import {
  createUser,
  getUserByUsername,
  getUserById,
  verifyPassword,
  updateUserProfile,
  saveAnalysis,
  getAnalyses,
  deleteAnalysis,
  clearAnalyses,
  saveDocument,
  getDocuments,
  deleteDocument,
  clearDocuments,
  linkDocumentToAnalysis,
} from "./storage";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "fallback-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    })
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (
        !username ||
        !password ||
        username.length < 3 ||
        password.length < 6
      ) {
        return res.status(400).json({
          message:
            "Username must be at least 3 characters and password at least 6 characters",
        });
      }

      const existing = await getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }

      const user = await createUser(username, password);
      req.session.userId = user.id;
      return res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password required" });
      }

      const user = await getUserByUsername(username);
      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      const valid = await verifyPassword(user, password);
      if (!valid) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      req.session.userId = user.id;
      return res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/user", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    return res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    });
  });

  app.patch(
    "/api/user/profile",
    requireAuth,
    async (req: Request, res: Response) => {
      const { displayName, avatarUrl } = req.body;
      const user = await updateUserProfile(
        req.session.userId!,
        displayName ?? "",
        avatarUrl
      );
      return res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      });
    }
  );

  app.get(
    "/api/analyses",
    requireAuth,
    async (req: Request, res: Response) => {
      const data = await getAnalyses(req.session.userId!);
      return res.json(data);
    }
  );

  app.post(
    "/api/analyses",
    requireAuth,
    async (req: Request, res: Response) => {
      const { id, data } = req.body;
      await saveAnalysis(req.session.userId!, id, data);
      return res.json({ ok: true });
    }
  );

  app.delete(
    "/api/analyses/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      await deleteAnalysis(req.session.userId!, req.params.id as string);
      return res.json({ ok: true });
    }
  );

  app.delete(
    "/api/analyses",
    requireAuth,
    async (req: Request, res: Response) => {
      await clearAnalyses(req.session.userId!);
      return res.json({ ok: true });
    }
  );

  app.get(
    "/api/documents",
    requireAuth,
    async (req: Request, res: Response) => {
      const docs = await getDocuments(req.session.userId!);
      return res.json(docs);
    }
  );

  app.post(
    "/api/documents",
    requireAuth,
    async (req: Request, res: Response) => {
      const { id, name, mimeType, size, linkedAnalysisId } = req.body;
      await saveDocument(
        req.session.userId!,
        id,
        name,
        mimeType,
        size,
        linkedAnalysisId
      );
      return res.json({ ok: true });
    }
  );

  app.delete(
    "/api/documents/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      await deleteDocument(req.session.userId!, req.params.id as string);
      return res.json({ ok: true });
    }
  );

  app.delete(
    "/api/documents",
    requireAuth,
    async (req: Request, res: Response) => {
      await clearDocuments(req.session.userId!);
      return res.json({ ok: true });
    }
  );

  app.patch(
    "/api/documents/:id/link",
    requireAuth,
    async (req: Request, res: Response) => {
      const { analysisId } = req.body;
      await linkDocumentToAnalysis(
        req.session.userId!,
        req.params.id as string,
        analysisId
      );
      return res.json({ ok: true });
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
