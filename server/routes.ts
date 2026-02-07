import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import crypto from "crypto";
import { pool } from "./db";
import {
  createUser,
  getUserByUsername,
  getUserById,
  getUserByToken,
  setAuthToken,
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

declare global {
  namespace Express {
    interface Request {
      tokenUserId?: string;
    }
  }
}

async function resolveUserId(req: Request): Promise<string | undefined> {
  if (req.session.userId) {
    return req.session.userId;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const user = await getUserByToken(token);
      if (user) return user.id;
    } catch {}
  }
  return undefined;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  resolveUserId(req).then((uid) => {
    if (!uid) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    (req as any)._resolvedUserId = uid;
    next();
  }).catch(() => {
    res.status(401).json({ message: "Not authenticated" });
  });
}

function getUserId(req: Request): string {
  return (req as any)._resolvedUserId || req.session.userId;
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
      const token = crypto.randomBytes(32).toString("hex");
      await setAuthToken(user.id, token);
      req.session.userId = user.id;
      return res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        token,
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

      const token = crypto.randomBytes(32).toString("hex");
      await setAuthToken(user.id, token);
      req.session.userId = user.id;
      return res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        token,
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const uid = getUserId(req);
    if (uid) {
      await setAuthToken(uid, null);
    }
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/user", async (req: Request, res: Response) => {
    const uid = await resolveUserId(req);
    if (!uid) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await getUserById(uid);
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
        getUserId(req)!,
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
      const data = await getAnalyses(getUserId(req)!);
      return res.json(data);
    }
  );

  app.post(
    "/api/analyses",
    requireAuth,
    async (req: Request, res: Response) => {
      const { id, data } = req.body;
      await saveAnalysis(getUserId(req)!, id, data);
      return res.json({ ok: true });
    }
  );

  app.delete(
    "/api/analyses/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      await deleteAnalysis(getUserId(req)!, req.params.id as string);
      return res.json({ ok: true });
    }
  );

  app.delete(
    "/api/analyses",
    requireAuth,
    async (req: Request, res: Response) => {
      await clearAnalyses(getUserId(req)!);
      return res.json({ ok: true });
    }
  );

  app.get(
    "/api/documents",
    requireAuth,
    async (req: Request, res: Response) => {
      const docs = await getDocuments(getUserId(req)!);
      return res.json(docs);
    }
  );

  app.post(
    "/api/documents",
    requireAuth,
    async (req: Request, res: Response) => {
      const { id, name, mimeType, size, linkedAnalysisId } = req.body;
      await saveDocument(
        getUserId(req)!,
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
      await deleteDocument(getUserId(req)!, req.params.id as string);
      return res.json({ ok: true });
    }
  );

  app.delete(
    "/api/documents",
    requireAuth,
    async (req: Request, res: Response) => {
      await clearDocuments(getUserId(req)!);
      return res.json({ ok: true });
    }
  );

  app.patch(
    "/api/documents/:id/link",
    requireAuth,
    async (req: Request, res: Response) => {
      const { analysisId } = req.body;
      await linkDocumentToAnalysis(
        getUserId(req)!,
        req.params.id as string,
        analysisId
      );
      return res.json({ ok: true });
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
