import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { AnalysisResult, formatCurrency } from "@/lib/financial";
import { getHistory, deleteAnalysis, clearHistory } from "@/lib/storage";

function HistoryItem({
  item,
  onDelete,
}: {
  item: AnalysisResult;
  onDelete: (id: string) => void;
}) {
  const isPositive = item.ratios.netIncome >= 0;
  const date = new Date(item.date);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: "/results",
          params: { analysisId: item.id },
        });
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert("Delete Analysis", "Remove this analysis from history?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(item.id),
          },
        ]);
      }}
      style={({ pressed }) => [
        styles.historyItem,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.historyItemTop}>
        <View style={styles.historyItemLeft}>
          <View
            style={[
              styles.historyDot,
              { backgroundColor: isPositive ? Colors.success : Colors.error },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.historyPeriod}>
              {item.financialData.period || "No Period"}
            </Text>
            <Text style={styles.historyDate}>
              {formattedDate} at {formattedTime}
            </Text>
          </View>
        </View>
        <View style={styles.historyItemActions}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                "Delete Analysis",
                "Remove this analysis from history?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDelete(item.id),
                  },
                ]
              );
            }}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </Pressable>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>
      </View>

      <View style={styles.historyMetrics}>
        <View style={styles.historyMetric}>
          <Text style={styles.historyMetricLabel}>Net Income</Text>
          <Text
            style={[
              styles.historyMetricValue,
              { color: isPositive ? Colors.success : Colors.error },
            ]}
          >
            {formatCurrency(item.ratios.netIncome)}
          </Text>
        </View>
        <View style={styles.historyDivider} />
        <View style={styles.historyMetric}>
          <Text style={styles.historyMetricLabel}>Gross Margin</Text>
          <Text style={styles.historyMetricValue}>
            {item.ratios.grossMargin.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.historyDivider} />
        <View style={styles.historyMetric}>
          <Text style={styles.historyMetricLabel}>ROE</Text>
          <Text style={styles.historyMetricValue}>
            {item.ratios.roe.toFixed(1)}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const data = await getHistory();
        setHistory(data);
      })();
    }, [])
  );

  const handleDelete = useCallback(async (id: string) => {
    await deleteAnalysis(id);
    setHistory((prev) => prev.filter((a) => a.id !== id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear History",
      "This will permanently delete all saved analyses.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            setHistory([]);
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
          },
        },
      ]
    );
  }, []);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: (insets.top || webTopInset) + 12 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>History</Text>
          {history.length > 0 ? (
            <Pressable
              onPress={handleClearAll}
              style={({ pressed }) => [
                styles.clearBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryItem item={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: (insets.bottom || webBottomInset) + 20,
          paddingTop: 8,
          flexGrow: history.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={history.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="chart-timeline-variant-shimmer"
              size={48}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No Analyses Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your completed analyses will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  historyItem: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  historyItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyPeriod: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  historyDate: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyMetrics: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyMetric: {
    flex: 1,
    alignItems: "center",
  },
  historyMetricLabel: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.textMuted,
    marginBottom: 4,
  },
  historyMetricValue: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
  },
  historyDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
});
