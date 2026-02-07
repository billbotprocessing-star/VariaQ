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
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  SavedDocument,
  getDocuments,
  deleteDocument,
  clearDocuments,
} from "@/lib/storage";

function getFileIcon(mimeType: string): { name: string; color: string } {
  if (mimeType.includes("pdf")) {
    return { name: "file-text", color: "#EF4444" };
  }
  if (mimeType.includes("sheet") || mimeType.includes("excel")) {
    return { name: "grid", color: "#10B981" };
  }
  return { name: "file", color: Colors.textSecondary };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentItem({
  item,
  onDelete,
}: {
  item: SavedDocument;
  onDelete: (id: string) => void;
}) {
  const { name: iconName, color: iconColor } = getFileIcon(item.mimeType);
  const date = new Date(item.savedAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isPdf = item.mimeType.includes("pdf");
  const isExcel =
    item.mimeType.includes("sheet") || item.mimeType.includes("excel");

  const sizeNum = typeof item.size === "string" ? parseInt(item.size, 10) : item.size;

  return (
    <Pressable
      onLongPress={async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS === "web") {
          const confirmed = window.confirm(`Delete "${item.name}"?`);
          if (confirmed) onDelete(item.id);
        } else {
          Alert.alert(item.name, "What would you like to do?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive" as const,
              onPress: () => onDelete(item.id),
            },
          ]);
        }
      }}
      style={({ pressed }) => [
        styles.docItem,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.docIconContainer, { backgroundColor: iconColor + "15" }]}>
        <Feather name={iconName as any} size={22} color={iconColor} />
      </View>

      <View style={styles.docInfo}>
        <Text style={styles.docName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.docMeta}>
          <View style={styles.docTag}>
            <Text style={[styles.docTagText, { color: iconColor }]}>
              {isPdf ? "PDF" : isExcel ? "Excel" : "File"}
            </Text>
          </View>
          <Text style={styles.docSize}>{formatFileSize(sizeNum || 0)}</Text>
          <Text style={styles.docDate}>{formattedDate}</Text>
        </View>
        {item.linkedAnalysisId && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/results",
                params: { analysisId: item.linkedAnalysisId! },
              });
            }}
            style={({ pressed }) => [
              styles.linkedBadge,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="link" size={12} color={Colors.primary} />
            <Text style={styles.linkedText}>View Analysis</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.docActions}>
        <Pressable
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const confirmed =
              Platform.OS === "web"
                ? window.confirm(`Remove "${item.name}" from saved documents?`)
                : await new Promise<boolean>((resolve) =>
                    Alert.alert(
                      "Delete Document",
                      `Remove "${item.name}" from saved documents?`,
                      [
                        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                        { text: "Delete", style: "destructive", onPress: () => resolve(true) },
                      ]
                    )
                  );
            if (confirmed) onDelete(item.id);
          }}
          style={({ pressed }) => [
            styles.docActionBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="trash-2" size={16} color={Colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const [documents, setDocuments] = useState<SavedDocument[]>([]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const docs = await getDocuments();
        setDocuments(docs);
      })();
    }, [])
  );

  const handleDelete = useCallback(async (id: string) => {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleClearAll = useCallback(async () => {
    if (documents.length === 0) return;
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("This will permanently delete all saved documents.")
        : await new Promise<boolean>((resolve) =>
            Alert.alert(
              "Clear All Documents",
              "This will permanently delete all saved documents.",
              [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                { text: "Clear All", style: "destructive", onPress: () => resolve(true) },
              ]
            )
          );
    if (confirmed) {
      await clearDocuments();
      setDocuments([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [documents.length]);

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
          <Text style={styles.headerTitle}>Documents</Text>
          {documents.length > 0 ? (
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
        {documents.length > 0 && (
          <Text style={styles.countText}>
            {documents.length} document{documents.length !== 1 ? "s" : ""} saved
          </Text>
        )}
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DocumentItem
            item={item}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: (insets.bottom || webBottomInset) + 20,
          paddingTop: 12,
          flexGrow: documents.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={documents.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons
                name="folder-open-outline"
                size={52}
                color={Colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>No Documents Saved</Text>
            <Text style={styles.emptySubtitle}>
              Upload a financial document on the home screen and it will be
              automatically saved here for future reference.
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
  countText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  docIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: {
    flex: 1,
    marginLeft: 12,
  },
  docName: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  docTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  docTagText: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 0.5,
  },
  docSize: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
  },
  docDate: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  linkedText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.primary,
  },
  docActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
  },
  docActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
