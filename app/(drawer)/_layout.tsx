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
import { Pressable, Alert } from "react-native";
import {
  House,
  Star,
  Trophy,
  Scale,
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

// The nav chrome is locked dark (Product Invariant #6, via the NavThemeProvider
// in app/_layout.tsx), so the header is always dark -- the account icon uses a
// fixed light tint (gray-300) instead of resolving against the device scheme.
function AccountButton() {
  const tint = "#d1d5db"; // gray-300, legible on the dark header
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
        name="conflicts"
        options={{
          title: "Conflicts",
          drawerLabel: "Conflicts",
          drawerIcon: ({ color }) => <Scale size={ICON_SIZE} color={color} />,
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
