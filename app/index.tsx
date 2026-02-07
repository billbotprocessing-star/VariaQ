import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import Colors from "@/constants/colors";
import {
  FinancialData,
  createEmptyFinancialData,
  calculateRatios,
  cleanFormatting,
} from "@/lib/financial";
import { saveAnalysis, saveDocument, linkDocumentToAnalysis } from "@/lib/storage";

function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "numeric",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, focused && styles.fieldInputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || "0"}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType === "numeric" ? "decimal-pad" : "default"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={Colors.primary}
      />
    </View>
  );
}

export default function InputScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<FinancialData>(createEmptyFinancialData());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(false);
  const [lastSavedDocId, setLastSavedDocId] = useState<string | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const updateField = useCallback(
    (field: keyof FinancialData, value: string) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleFileUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
      });

      if (result.canceled) return;

      setUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const file = result.assets[0];
      let base64: string;

      if (Platform.OS === "web") {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(",")[1]);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const mediaType =
        file.mimeType ||
        (file.name?.endsWith(".pdf")
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      const response = await fetch(
        "https://billbotprocessing.app.n8n.cloud/webhook/financial-parser",
        {
          method: "POST",
          body: JSON.stringify({
            file: base64,
            mediaType,
            fileName: file.name,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const rawParsed = await response.json();
      console.log("[QuickFill] Raw API response:", JSON.stringify(rawParsed));

      const parsed =
        rawParsed && typeof rawParsed === "object" && !Array.isArray(rawParsed)
          ? rawParsed.financialData ?? rawParsed.data ?? rawParsed
          : null;

      const fieldAliases: Record<keyof FinancialData, string[]> = {
        period: ["period", "Period", "fiscal_period", "fiscalPeriod"],
        revenue: ["revenue", "Revenue", "total_revenue", "totalRevenue", "sales", "Sales"],
        cogs: ["cogs", "COGS", "cost_of_goods_sold", "costOfGoodsSold", "cos", "COS"],
        opex: ["opex", "OPEX", "operating_expenses", "operatingExpenses", "operating_expense", "operatingExpense"],
        assets: ["assets", "Assets", "total_assets", "totalAssets"],
        liabilities: ["liabilities", "Liabilities", "total_liabilities", "totalLiabilities"],
        equity: ["equity", "Equity", "total_equity", "totalEquity", "shareholders_equity", "shareholdersEquity"],
        cashOps: ["cashOps", "cash_ops", "cashFromOperations", "cash_from_operations", "operatingCashFlow", "operating_cash_flow"],
        cashInv: ["cashInv", "cash_inv", "cashFromInvesting", "cash_from_investing", "investingCashFlow", "investing_cash_flow"],
        cashFin: ["cashFin", "cash_fin", "cashFromFinancing", "cash_from_financing", "financingCashFlow", "financing_cash_flow"],
      };

      if (parsed && typeof parsed === "object") {
        let fieldsMatched = 0;
        setData((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as Array<keyof FinancialData>).forEach(
            (key) => {
              const aliases = fieldAliases[key] || [key];
              for (const alias of aliases) {
                if (parsed[alias] !== undefined && parsed[alias] !== null && parsed[alias] !== "") {
                  updated[key] = String(parsed[alias]);
                  fieldsMatched++;
                  break;
                }
              }
            }
          );
          console.log("[QuickFill] Fields matched:", fieldsMatched, "Updated data:", JSON.stringify(updated));
          return updated;
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Data Extracted & Saved",
          "Document saved and fields auto-filled. Verify the values below."
        );
      } else {
        console.log("[QuickFill] Could not extract data from response");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Document Saved",
          "Document saved but could not extract data. Please enter values manually."
        );
      }

      try {
        const docId = Crypto.randomUUID();
        await saveDocument(
          docId,
          file.name || "Unnamed Document",
          mediaType,
          file.uri,
          file.size || 0
        );
        setLastSavedDocId(docId);
      } catch (docErr) {
        console.log("[QuickFill] Document save failed (non-blocking):", docErr);
      }
    } catch {
      Alert.alert(
        "Upload Failed",
        "Could not extract data. Please enter values manually."
      );
    } finally {
      setUploading(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    const hasData =
      data.revenue || data.cogs || data.opex || data.assets || data.liabilities;
    if (!hasData) {
      Alert.alert(
        "Missing Data",
        "Please enter at least some financial data before analyzing."
      );
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const ratios = calculateRatios(data);

    try {
      const response = await fetch(
        "https://billbotprocessing.app.n8n.cloud/webhook/varia-analysis",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            period: data.period,
            financialData: data,
            ratios,
            includeSummary,
          }),
        }
      );

      const rawResult = await response.json();
      console.log("[Analyze] Raw API response:", JSON.stringify(rawResult));

      const result = Array.isArray(rawResult) ? rawResult[0] : rawResult;

      if (!result || typeof result !== "object") {
        Alert.alert(
          "Analysis Failed",
          "The AI service did not return any insights. Please try again."
        );
        return;
      }

      const insights =
        result.insights || result.analysis || result.output || result.response || "";
      const summary =
        result.summary || result.executiveSummary || result.executive_summary || "";

      if (!insights && !summary) {
        Alert.alert(
          "Analysis Failed",
          "The AI service did not return valid results. Please check your n8n workflow configuration for the includeSummary=false path."
        );
        return;
      }

      const analysisId = Crypto.randomUUID();
      const analysis: AnalysisResult = {
        id: analysisId,
        date: new Date().toISOString(),
        financialData: data,
        ratios,
        insights: cleanFormatting(insights),
        summary: includeSummary ? cleanFormatting(summary) : "",
      };

      try {
        await saveAnalysis(analysis);
        if (lastSavedDocId) {
          await linkDocumentToAnalysis(lastSavedDocId, analysisId);
        }
      } catch (saveErr) {
        console.log("[Analyze] Save to server failed (non-blocking):", saveErr);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.push({
        pathname: "/results",
        params: { analysisId, analysisData: JSON.stringify(analysis) },
      });
    } catch {
      Alert.alert(
        "Analysis Failed",
        "Could not complete the analysis. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [data, includeSummary, lastSavedDocId]);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: (insets.top || webTopInset) + 16,
          paddingBottom: (insets.bottom || webBottomInset) + 120,
          paddingHorizontal: 20,
        }}
        bottomOffset={60}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.appTitle}>VariaQ</Text>
              <Text style={styles.appSubtitle}>AI Financial Analysis</Text>
            </View>
            <View style={styles.headerBtns}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/documents");
                }}
                style={({ pressed }) => [
                  styles.historyBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="folder-outline" size={21} color={Colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/history");
                }}
                style={({ pressed }) => [
                  styles.historyBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="time-outline" size={22} color={Colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/profile");
                }}
                style={({ pressed }) => [
                  styles.historyBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="person-circle-outline" size={23} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleFileUpload}
          disabled={uploading}
          style={({ pressed }) => [
            styles.uploadSection,
            pressed && { opacity: 0.85 },
          ]}
        >
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.15)", "rgba(59, 130, 246, 0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadGradient}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.secondary} />
            ) : (
              <Feather name="upload" size={22} color={Colors.secondary} />
            )}
            <View style={styles.uploadTextContainer}>
              <Text style={styles.uploadTitle}>
                {uploading ? "Processing..." : "Quick Fill from Document"}
              </Text>
              <Text style={styles.uploadSubtitle}>
                Upload a PDF to auto-fill fields
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textMuted} />
          </LinearGradient>
        </Pressable>

        <View style={styles.card}>
          <FieldInput
            label="Period"
            value={data.period}
            onChangeText={(v) => updateField("period", v)}
            placeholder="e.g., Q4 2024"
            keyboardType="default"
          />
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon={
              <MaterialCommunityIcons
                name="chart-line"
                size={18}
                color={Colors.success}
              />
            }
            title="Income Statement"
            color={Colors.success}
          />
          <FieldInput
            label="Revenue ($)"
            value={data.revenue}
            onChangeText={(v) => updateField("revenue", v)}
          />
          <FieldInput
            label="COGS ($)"
            value={data.cogs}
            onChangeText={(v) => updateField("cogs", v)}
          />
          <FieldInput
            label="Operating Expenses ($)"
            value={data.opex}
            onChangeText={(v) => updateField("opex", v)}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon={
              <MaterialCommunityIcons
                name="scale-balance"
                size={18}
                color={Colors.primary}
              />
            }
            title="Balance Sheet"
            color={Colors.primary}
          />
          <FieldInput
            label="Total Assets ($)"
            value={data.assets}
            onChangeText={(v) => updateField("assets", v)}
          />
          <FieldInput
            label="Total Liabilities ($)"
            value={data.liabilities}
            onChangeText={(v) => updateField("liabilities", v)}
          />
          <FieldInput
            label="Total Equity ($)"
            value={data.equity}
            onChangeText={(v) => updateField("equity", v)}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon={
              <MaterialCommunityIcons
                name="cash-multiple"
                size={18}
                color={Colors.accent}
              />
            }
            title="Cash Flow"
            color={Colors.accent}
          />
          <FieldInput
            label="Operating ($)"
            value={data.cashOps}
            onChangeText={(v) => updateField("cashOps", v)}
          />
          <FieldInput
            label="Investing ($)"
            value={data.cashInv}
            onChangeText={(v) => updateField("cashInv", v)}
          />
          <FieldInput
            label="Financing ($)"
            value={data.cashFin}
            onChangeText={(v) => updateField("cashFin", v)}
          />
        </View>

        <View style={styles.summaryToggle}>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryLabel}>Executive Summary</Text>
            <Text style={styles.summaryHint}>
              Include a detailed executive report
            </Text>
          </View>
          <Switch
            value={includeSummary}
            onValueChange={(val) => {
              setIncludeSummary(val);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            trackColor={{ false: "rgba(255,255,255,0.1)", true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: (insets.bottom || webBottomInset) + 12 },
        ]}
      >
        <Pressable
          onPress={handleAnalyze}
          disabled={loading}
          style={({ pressed }) => [
            styles.analyzeBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            loading && { opacity: 0.7 },
          ]}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.analyzeBtnGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appTitle: {
    fontSize: 32,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadSection: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  uploadGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.25)",
    borderStyle: "dashed",
  },
  uploadTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  uploadTitle: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  uploadSubtitle: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: Colors.text,
  },
  fieldInputFocused: {
    borderColor: Colors.inputFocusBorder,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
  },
  summaryToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  summaryHint: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "rgba(11, 20, 38, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  analyzeBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  analyzeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  analyzeBtnText: {
    fontSize: 17,
    fontFamily: "DMSans_700Bold",
    color: "#fff",
  },
});
