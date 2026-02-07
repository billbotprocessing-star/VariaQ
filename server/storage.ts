import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  analyses,
  documents,
  type User,
  type InsertUser,
} from "@shared/schema";
import bcrypt from "bcrypt";

export async function createUser(
  username: string,
  password: string
): Promise<User> {
  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ username, password: hashed })
    .returning();
  return user;
}

export async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function verifyPassword(
  user: User,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

export async function updateUserProfile(
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<User> {
  const updates: Record<string, unknown> = { displayName };
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  const [user] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();
  return user;
}

export async function saveAnalysis(
  userId: string,
  id: string,
  data: unknown
): Promise<void> {
  await db.insert(analyses).values({ id, userId, data });
}

export async function getAnalyses(userId: string) {
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.date));
}

export async function deleteAnalysis(
  userId: string,
  id: string
): Promise<void> {
  await db
    .delete(analyses)
    .where(eq(analyses.id, id));
}

export async function clearAnalyses(userId: string): Promise<void> {
  await db.delete(analyses).where(eq(analyses.userId, userId));
}

export async function saveDocument(
  userId: string,
  id: string,
  name: string,
  mimeType: string,
  size: string,
  linkedAnalysisId?: string
): Promise<void> {
  await db
    .insert(documents)
    .values({ id, userId, name, mimeType, size, linkedAnalysisId });
}

export async function getDocuments(userId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.savedAt));
}

export async function deleteDocument(
  userId: string,
  id: string
): Promise<void> {
  await db
    .delete(documents)
    .where(eq(documents.id, id));
}

export async function clearDocuments(userId: string): Promise<void> {
  await db.delete(documents).where(eq(documents.userId, userId));
}

export async function linkDocumentToAnalysis(
  userId: string,
  docId: string,
  analysisId: string
): Promise<void> {
  await db
    .update(documents)
    .set({ linkedAnalysisId: analysisId })
    .where(eq(documents.id, docId));
}
