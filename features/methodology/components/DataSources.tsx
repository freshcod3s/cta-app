import { Alert, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import type { InformationSource } from "../sources";

export function DataSources({ sources }: { sources: InformationSource[] }) {
  const openSource = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Could not open source", "Please try again, or copy the source address into your browser.");
    }
  };

  return (
    <View>
      {sources.map((source) => (
        <View key={source.url} className="mb-4">
          <Pressable
            onPress={() => void openSource(source.url)}
            accessibilityRole="link"
            accessibilityLabel={`Open ${source.name}`}
            className="py-2"
          >
            <Text className="text-sm font-semibold text-cta-accent underline">
              {source.name}
            </Text>
          </Pressable>
          <Text selectable className="mb-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
            {source.url}
          </Text>
          <Text selectable className="text-sm leading-5 text-gray-700 dark:text-gray-300">
            {source.description}
          </Text>
        </View>
      ))}
    </View>
  );
}
