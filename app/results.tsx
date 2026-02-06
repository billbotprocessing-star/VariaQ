import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Colors from "@/constants/colors";
import {
  AnalysisResult,
  formatCurrency,
  generateReport,
} from "@/lib/financial";
import { getHistory } from "@/lib/storage";

function MetricCard({
  icon,
  iconColor,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconBg, { backgroundColor: iconColor + "20" }]}>
          {icon}
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
}

function RatioBar({
  label,
  value,
  maxValue,
  color,
  suffix,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  suffix: string;
}) {
  const width = Math.min(Math.max((Math.abs(value) / maxValue) * 100, 5), 100);

  return (
    <View style={styles.ratioBarContainer}>
      <View style={styles.ratioBarHeader}>
        <Text style={styles.ratioBarLabel}>{label}</Text>
        <Text style={[styles.ratioBarValue, { color }]}>
          {value.toFixed(1)}
          {suffix}
        </Text>
      </View>
      <View style={styles.ratioBarTrack}>
        <View
          style={[styles.ratioBarFill, { width: `${width}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

function CashFlowBar({
  label,
  value,
  maxVal,
}: {
  label: string;
  value: number;
  maxVal: number;
}) {
  const isPositive = value >= 0;
  const width = maxVal > 0 ? Math.min((Math.abs(value) / maxVal) * 100, 100) : 0;

  return (
    <View style={styles.cashFlowItem}>
      <Text style={styles.cashFlowLabel}>{label}</Text>
      <View style={styles.cashFlowBarContainer}>
        <View style={styles.cashFlowBarTrack}>
          <View
            style={[
              styles.cashFlowBarFill,
              {
                width: `${Math.max(width, 5)}%`,
                backgroundColor: isPositive ? Colors.success : Colors.error,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.cashFlowValue,
            { color: isPositive ? Colors.success : Colors.error },
          ]}
        >
          {formatCurrency(value)}
        </Text>
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingExport, setLoadingExport] = useState(false);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    (async () => {
      const history = await getHistory();
      const found = history.find((a) => a.id === analysisId);
      if (found) setAnalysis(found);
    })();
  }, [analysisId]);

  const handleExport = async () => {
    if (!analysis) return;
    setLoadingExport(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const report = generateReport(
      analysis.financialData,
      analysis.ratios,
      analysis.insights,
      analysis.summary
    );

    try {
      if (Platform.OS === "web") {
        await Share.share({ message: report });
      } else {
        const fileUri =
          FileSystem.cacheDirectory +
          `varia-${analysis.financialData.period || "report"}.txt`;
        await FileSystem.writeAsStringAsync(fileUri, report);
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Export Analysis Report",
        });
      }
    } catch {
      Alert.alert("Export Error", "Could not export the report.");
    } finally {
      setLoadingExport(false);
    }
  };

  if (!analysis) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const { ratios, financialData } = analysis;
  const cashValues = [
    parseFloat(financialData.cashOps) || 0,
    parseFloat(financialData.cashInv) || 0,
    parseFloat(financialData.cashFin) || 0,
  ];
  const maxCash = Math.max(...cashValues.map(Math.abs), 1);

  const balanceValues = [
    parseFloat(financialData.assets) || 0,
    parseFloat(financialData.liabilities) || 0,
    parseFloat(financialData.equity) || 0,
  ];
  const totalBalance = balanceValues.reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: (insets.top || webTopInset) + 12,
          paddingBottom: (insets.bottom || webBottomInset) + 30,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <View style={styles.navActions}>
            <Pressable
              onPress={handleExport}
              disabled={loadingExport}
              style={({ pressed }) => [
                styles.navBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              {loadingExport ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Feather name="share" size={20} color={Colors.text} />
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace("/");
              }}
              style={({ pressed }) => [
                styles.newAnalysisBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.newAnalysisBtnText}>New</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Analysis Results</Text>
          <Text style={styles.periodText}>
            {financialData.period || "Period not specified"} {"  "}
            <Text style={styles.dateText}>
              {new Date(analysis.date).toLocaleDateString()}
            </Text>
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsRow}
        >
          <MetricCard
            icon={
              <MaterialCommunityIcons
                name="currency-usd"
                size={20}
                color={Colors.success}
              />
            }
            iconColor={Colors.success}
            title="Net Income"
            value={formatCurrency(ratios.netIncome)}
            subtitle={`${ratios.netMargin.toFixed(1)}% margin`}
          />
          <MetricCard
            icon={
              <MaterialCommunityIcons
                name="trending-up"
                size={20}
                color={Colors.primary}
              />
            }
            iconColor={Colors.primary}
            title="Current Ratio"
            value={ratios.currentRatio.toFixed(2)}
            subtitle="Liquidity"
          />
          <MetricCard
            icon={
              <MaterialCommunityIcons
                name="scale-balance"
                size={20}
                color={Colors.secondary}
              />
            }
            iconColor={Colors.secondary}
            title="Debt/Equity"
            value={ratios.debtToEquity.toFixed(2)}
            subtitle="Leverage"
          />
          <MetricCard
            icon={
              <MaterialCommunityIcons
                name="chart-areaspline"
                size={20}
                color={Colors.accent}
              />
            }
            iconColor={Colors.accent}
            title="ROE"
            value={`${ratios.roe.toFixed(1)}%`}
            subtitle="Return on Equity"
          />
        </ScrollView>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profitability</Text>
          <RatioBar
            label="Gross Margin"
            value={ratios.grossMargin}
            maxValue={100}
            color={Colors.success}
            suffix="%"
          />
          <RatioBar
            label="Net Margin"
            value={ratios.netMargin}
            maxValue={100}
            color={Colors.primary}
            suffix="%"
          />
          <RatioBar
            label="Return on Equity"
            value={ratios.roe}
            maxValue={100}
            color={Colors.accent}
            suffix="%"
          />
        </View>

        {(cashValues[0] !== 0 ||
          cashValues[1] !== 0 ||
          cashValues[2] !== 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cash Flow</Text>
            <CashFlowBar
              label="Operating"
              value={cashValues[0]}
              maxVal={maxCash}
            />
            <CashFlowBar
              label="Investing"
              value={cashValues[1]}
              maxVal={maxCash}
            />
            <CashFlowBar
              label="Financing"
              value={cashValues[2]}
              maxVal={maxCash}
            />
          </View>
        )}

        {totalBalance > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Balance Sheet</Text>
            <View style={styles.balanceRow}>
              {[
                {
                  label: "Assets",
                  value: balanceValues[0],
                  color: Colors.primary,
                },
                {
                  label: "Liabilities",
                  value: balanceValues[1],
                  color: Colors.secondary,
                },
                {
                  label: "Equity",
                  value: balanceValues[2],
                  color: Colors.accent,
                },
              ].map((item) => {
                const pct =
                  totalBalance > 0
                    ? ((item.value / totalBalance) * 100).toFixed(0)
                    : "0";
                return (
                  <View key={item.label} style={styles.balanceItem}>
                    <View
                      style={[styles.balanceDot, { backgroundColor: item.color }]}
                    />
                    <Text style={styles.balanceLabel}>{item.label}</Text>
                    <Text style={styles.balancePct}>{pct}%</Text>
                    <Text style={styles.balanceVal}>
                      {formatCurrency(item.value)}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.balanceBar}>
              {balanceValues.map((val, i) => {
                const pct =
                  totalBalance > 0 ? (val / totalBalance) * 100 : 33.3;
                const colors = [Colors.primary, Colors.secondary, Colors.accent];
                const isFirst = i === 0;
                const isLast = i === 2;
                return (
                  <View
                    key={i}
                    style={[
                      styles.balanceBarSegment,
                      {
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: colors[i],
                        borderTopLeftRadius: isFirst ? 6 : 0,
                        borderBottomLeftRadius: isFirst ? 6 : 0,
                        borderTopRightRadius: isLast ? 6 : 0,
                        borderBottomRightRadius: isLast ? 6 : 0,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        )}

        {analysis.insights ? (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={styles.insightsTitle}>AI Insights</Text>
            </View>
            <Text style={styles.insightsText}>{analysis.insights}</Text>
          </View>
        ) : null}

        {analysis.summary ? (
          <LinearGradient
            colors={["rgba(15, 23, 42, 0.9)", "rgba(30, 58, 138, 0.4)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <Feather name="file-text" size={16} color={Colors.accent} />
              <Text style={styles.summaryTitle}>EXECUTIVE SUMMARY</Text>
            </View>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </LinearGradient>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  newAnalysisBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  newAnalysisBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  headerSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  periodText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
    marginTop: 4,
  },
  dateText: {
    color: Colors.textMuted,
  },
  metricsRow: {
    paddingBottom: 16,
    gap: 12,
  },
  metricCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    width: 155,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  metricIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metricTitle: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    marginBottom: 16,
  },
  ratioBarContainer: {
    marginBottom: 14,
  },
  ratioBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ratioBarLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
  },
  ratioBarValue: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  ratioBarTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  ratioBarFill: {
    height: 8,
    borderRadius: 4,
  },
  cashFlowItem: {
    marginBottom: 14,
  },
  cashFlowLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  cashFlowBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cashFlowBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  cashFlowBarFill: {
    height: 8,
    borderRadius: 4,
  },
  cashFlowValue: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    minWidth: 70,
    textAlign: "right",
  },
  balanceRow: {
    marginBottom: 14,
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  balanceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
    flex: 1,
  },
  balancePct: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    width: 40,
    textAlign: "right",
  },
  balanceVal: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.textMuted,
    width: 80,
    textAlign: "right",
  },
  balanceBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    gap: 2,
  },
  balanceBarSegment: {
    height: 12,
  },
  insightsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  insightsTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  insightsText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
    color: Colors.accent,
    letterSpacing: 1.5,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
    fontStyle: "italic",
  },
});
