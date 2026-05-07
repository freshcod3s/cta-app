// Drawer layout. expo-router/drawer wraps @react-navigation/drawer and
// preserves file-based routing for child screens.
//
// Header is provided by the drawer; we customize per-screen below. Hamburger
// (default left button) opens the drawer; left-edge swipe also opens it on
// both iOS + Android.
//
// Account avatar is a shared headerRight across all drawer screens for
// consistent global access (CTA-App-1-3 spec calls it out for Feed; placing
// it at the drawer-level screenOptions covers all 4 destinations identically).
import { Drawer } from "expo-router/drawer";
import { Pressable, Alert } from "react-native";
import {
  House,
  BookOpen,
  Settings as SettingsIcon,
  Info,
  User,
} from "lucide-react-native";

const ICON_SIZE = 22;

function AccountButton() {
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
      <User size={24} color="#374151" />
    </Pressable>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerRight: () => <AccountButton />,
        drawerActiveTintColor: "#6366f1",
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
