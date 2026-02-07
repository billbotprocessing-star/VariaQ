import React, { useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import {
  getProfile,
  saveProfile,
  saveProfileAvatar,
  getHistory,
  getDocuments,
  UserProfile,
} from "@/lib/storage";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [docsCount, setDocsCount] = useState(0);
  const nameRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [p, h, d] = await Promise.all([
          getProfile(),
          getHistory(),
          getDocuments(),
        ]);
        setProfile(p);
        setNameInput(p.name);
        setHistoryCount(h.length);
        setDocsCount(d.length);
      })();
    }, [])
  );

  const handlePickAvatar = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSaving(true);
      try {
        const uri = await saveProfileAvatar(result.assets[0].uri);
        const updated = { ...profile!, avatarUri: uri };
        await saveProfile(updated);
        setProfile(updated);
      } catch {}
      setSaving(false);
    }
  }, [profile]);

  const handleSaveName = useCallback(async () => {
    if (!profile) return;
    const trimmed = nameInput.trim();
    const updated = { ...profile, name: trimmed };
    await saveProfile(updated);
    setProfile(updated);
    setEditingName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [profile, nameInput]);

  const startEditName = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingName(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: (insets.top || webTopInset) + 20 }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: (insets.top || webTopInset) + 8 },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <Pressable
            onPress={handlePickAvatar}
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <View style={styles.avatarContainer}>
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={[Colors.gradientStart, Colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarPlaceholder}
                >
                  {initials ? (
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  ) : (
                    <Ionicons name="person" size={44} color="rgba(255,255,255,0.8)" />
                  )}
                </LinearGradient>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
              {saving && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
          </Pressable>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                ref={nameRef}
                value={nameInput}
                onChangeText={setNameInput}
                style={styles.nameInput}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
                autoFocus
                maxLength={40}
              />
              <Pressable
                onPress={handleSaveName}
                style={({ pressed }) => [styles.saveNameBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="checkmark" size={22} color={Colors.success} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditingName(false);
                  setNameInput(profile.name);
                }}
                style={({ pressed }) => [styles.saveNameBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={startEditName} style={styles.nameRow}>
              <Text style={styles.userName}>
                {profile.name || "Tap to set name"}
              </Text>
              <Feather name="edit-2" size={16} color={Colors.textMuted} />
            </Pressable>
          )}

          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["rgba(59,130,246,0.15)", "rgba(59,130,246,0.05)"]}
              style={styles.statGradient}
            >
              <View style={styles.statIconWrap}>
                <Ionicons name="time" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statNumber}>{historyCount}</Text>
              <Text style={styles.statLabel}>Analyses</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["rgba(139,92,246,0.15)", "rgba(139,92,246,0.05)"]}
              style={styles.statGradient}
            >
              <View style={styles.statIconWrap}>
                <Ionicons name="document" size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.statNumber}>{docsCount}</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/history");
            }}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { backgroundColor: Colors.surfaceHover },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Analysis History</Text>
              <Text style={styles.menuSubtitle}>View past financial analyses</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/documents");
            }}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { backgroundColor: Colors.surfaceHover },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "rgba(139,92,246,0.12)" }]}>
              <Ionicons name="folder" size={20} color={Colors.secondary} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Saved Documents</Text>
              <Text style={styles.menuSubtitle}>Uploaded files and reports</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    position: "relative",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 34,
    fontFamily: "DMSans_700Bold",
    color: "#fff",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.background,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameInput: {
    fontSize: 20,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 160,
    textAlign: "center",
  },
  saveNameBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  memberSince: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statGradient: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 26,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 70,
  },
});
