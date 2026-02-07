import { apiRequest, getApiUrl } from "./query-client";
import { fetch } from "expo/fetch";
import type { AnalysisResult } from "./financial";

export interface SavedDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number | string;
  savedAt: string;
  linkedAnalysisId?: string | null;
}

export interface UserProfile {
  name: string;
  avatarUri?: string;
  createdAt: string;
}

export async function saveAnalysis(analysis: AnalysisResult): Promise<void> {
  await apiRequest("POST", "/api/analyses", {
    id: analysis.id,
    data: analysis,
  });
}

export async function getHistory(): Promise<AnalysisResult[]> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/analyses", baseUrl);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map((r: any) => r.data as AnalysisResult);
}

export async function deleteAnalysis(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/analyses/${id}`);
}

export async function clearHistory(): Promise<void> {
  await apiRequest("DELETE", "/api/analyses");
}

export async function saveDocument(
  id: string,
  name: string,
  mimeType: string,
  _sourceUri: string,
  size: number,
  linkedAnalysisId?: string
): Promise<SavedDocument> {
  await apiRequest("POST", "/api/documents", {
    id,
    name,
    mimeType,
    size: String(size),
    linkedAnalysisId,
  });

  return {
    id,
    name,
    mimeType,
    size,
    savedAt: new Date().toISOString(),
    linkedAnalysisId,
  };
}

export async function getDocuments(): Promise<SavedDocument[]> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/documents", baseUrl);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/documents/${id}`);
}

export async function clearDocuments(): Promise<void> {
  await apiRequest("DELETE", "/api/documents");
}

export async function linkDocumentToAnalysis(
  docId: string,
  analysisId: string
): Promise<void> {
  await apiRequest("PATCH", `/api/documents/${docId}/link`, { analysisId });
}

export async function getProfile(): Promise<UserProfile> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/user", baseUrl);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) {
    return { name: "", createdAt: new Date().toISOString() };
  }
  const user = await res.json();
  return {
    name: user.displayName || user.username || "",
    avatarUri: user.avatarUrl || undefined,
    createdAt: user.createdAt || new Date().toISOString(),
  };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await apiRequest("PATCH", "/api/user/profile", {
    displayName: profile.name,
    avatarUrl: profile.avatarUri || null,
  });
}

export async function saveProfileAvatar(sourceUri: string): Promise<string> {
  return sourceUri;
}
