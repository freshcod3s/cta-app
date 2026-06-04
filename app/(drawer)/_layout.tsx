// Drawer layout. expo-router/drawer wraps @react-navigation/drawer and
// preserves file-based routing for child screens.
//
// Header is provided by the drawer; we customize per-screen below. Hamburger
// (default left button) opens the drawer; left-edge swipe also opens it on
// both iOS + Android.
//
// Account avatar is a shared headerRight across all drawer screens for
// consistent global access.
//
// Web-parity slices add Watchlist + Leaderboard (Track A) and Daily Dive +
// FAQ + Press (Track B) as drawer destinations.
import { Drawer } from "expo-router/drawer";
import { Pressable, Alert, useColorScheme } from "react-native";
import {
  House,
  Star,
  Trophy,
  Newspaper,
  BookOpen,
  HelpCircle,
  Megaphone,
  Settings as SettingsIcon,
  Info,
  User,
} from "lucide-react-native";
import { ctaColors } from "@/lib/theme/tokens";

const ICON_SIZE = 22;

// CTA-App-1-4 fix: User icon was hardcoded to gray-700 which renders too dark
// against a dark-mode header background. Resolve at runtime against the
// device colorScheme so the icon stays legible in both modes.
function AccountButton() {
  const scheme = useColorScheme();
  const tint = scheme === "dark" ? "#d1d5db" : "#374151"; // gray-300 / gray-700
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Account"
      hitSlop={8}
      onPress={() =>
        Alert.alert(
          "Account",
          "Account flow ships when Pro tier lands on mobile.",
        )
      }
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
      }}
    >
      <User size={24} color={tint} />
    </Pressable>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerRight: () => <AccountButton />,
        drawerActiveTintColor: ctaColors.accent,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Congress Trade Alerts",
          drawerLabel: "Feed",
          drawerIcon: ({ color }) => <House size={ICON_SIZE} color={color} />,
        }}
      />
      <Drawer.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
          drawerLabel: "Watchlist",
          drawerIcon: ({ color }) => <Star size={ICON_SIZE} color={color} />,
        }}
      />
      <Drawer.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          drawerLabel: "Leaderboard",
          drawerIcon: ({ color }) => <Trophy size={ICON_SIZE} color={color} />,
        }}
      />
      <Drawer.Screen
        name="daily-dive"
        options={{
          title: "Daily Dive",
          drawerLabel: "Daily Dive",
          drawerIcon: ({ color }) => (
            <Newspaper size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="methodology"
        options={{
          title: "Methodology",
          drawerLabel: "Methodology",
          drawerIcon: ({ color }) => (
            <BookOpen size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="faq"
        options={{
          title: "FAQ",
          drawerLabel: "FAQ",
          drawerIcon: ({ color }) => (
            <HelpCircle size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="press"
        options={{
          title: "Press",
          drawerLabel: "Press",
          drawerIcon: ({ color }) => (
            <Megaphone size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
          drawerLabel: "Settings",
          drawerIcon: ({ color }) => (
            <SettingsIcon size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          title: "About",
          drawerLabel: "About",
          drawerIcon: ({ color }) => <Info size={ICON_SIZE} color={color} />,
        }}
      />
    </Drawer>
  );
}
