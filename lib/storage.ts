import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AnalysisResult } from "./financial";

const HISTORY_KEY = "varia_analysis_history";

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
