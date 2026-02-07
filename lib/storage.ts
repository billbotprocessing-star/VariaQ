import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import type { AnalysisResult } from "./financial";

const HISTORY_KEY = "varia_analysis_history";
const DOCUMENTS_KEY = "varia_saved_documents";
const PROFILE_KEY = "varia_user_profile";

export interface UserProfile {
  name: string;
  avatarUri?: string;
  createdAt: string;
}

export async function getProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(PROFILE_KEY);
  if (!data) {
    return {
      name: "",
      createdAt: new Date().toISOString(),
    };
  }
  return JSON.parse(data);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function saveProfileAvatar(sourceUri: string): Promise<string> {
  if (Platform.OS === "web") {
    return sourceUri;
  }

  await ensureDocsDir();
  const destPath = (DOCS_DIR || "") + "profile-avatar.jpg";
  try {
    const info = await FileSystem.getInfoAsync(destPath);
    if (info.exists) {
      await FileSystem.deleteAsync(destPath);
    }
  } catch {}
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  return destPath;
}

export interface SavedDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  savedAt: string;
  localUri?: string;
  linkedAnalysisId?: string;
}

export async function saveAnalysis(analysis: AnalysisResult): Promise<void> {
  const history = await getHistory();
  history.unshift(analysis);
  if (history.length > 50) {
    history.length = 50;
  }
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export async function getHistory(): Promise<AnalysisResult[]> {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function deleteAnalysis(id: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter((a) => a.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

const DOCS_DIR = FileSystem.documentDirectory
  ? FileSystem.documentDirectory + "varia-docs/"
  : null;

async function ensureDocsDir() {
  if (!DOCS_DIR || Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(DOCS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
  }
}

export async function saveDocument(
  id: string,
  name: string,
  mimeType: string,
  sourceUri: string,
  size: number,
  linkedAnalysisId?: string
): Promise<SavedDocument> {
  await ensureDocsDir();

  let localUri: string | undefined;

  if (Platform.OS !== "web" && DOCS_DIR) {
    const ext = name.includes(".") ? name.substring(name.lastIndexOf(".")) : "";
    const destPath = DOCS_DIR + id + ext;
    await FileSystem.copyAsync({ from: sourceUri, to: destPath });
    localUri = destPath;
  }

  const doc: SavedDocument = {
    id,
    name,
    mimeType,
    size,
    savedAt: new Date().toISOString(),
    localUri,
    linkedAnalysisId,
  };

  const docs = await getDocuments();
  docs.unshift(doc);
  if (docs.length > 100) {
    docs.length = 100;
  }
  await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  return doc;
}

export async function getDocuments(): Promise<SavedDocument[]> {
  const data = await AsyncStorage.getItem(DOCUMENTS_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function deleteDocument(id: string): Promise<void> {
  const docs = await getDocuments();
  const doc = docs.find((d) => d.id === id);

  if (doc?.localUri && Platform.OS !== "web") {
    try {
      const info = await FileSystem.getInfoAsync(doc.localUri);
      if (info.exists) {
        await FileSystem.deleteAsync(doc.localUri);
      }
    } catch {}
  }

  const filtered = docs.filter((d) => d.id !== id);
  await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(filtered));
}

export async function clearDocuments(): Promise<void> {
  const docs = await getDocuments();

  if (Platform.OS !== "web") {
    for (const doc of docs) {
      if (doc.localUri) {
        try {
          const info = await FileSystem.getInfoAsync(doc.localUri);
          if (info.exists) {
            await FileSystem.deleteAsync(doc.localUri);
          }
        } catch {}
      }
    }
  }

  await AsyncStorage.removeItem(DOCUMENTS_KEY);
}

export async function linkDocumentToAnalysis(
  docId: string,
  analysisId: string
): Promise<void> {
  const docs = await getDocuments();
  const idx = docs.findIndex((d) => d.id === docId);
  if (idx >= 0) {
    docs[idx].linkedAnalysisId = analysisId;
    await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  }
}
