// FAQ -- the 6 STOCK Act / product Q&A, mirrored from the web FAQ.
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FaqAccordion } from "@/features/faq/components/FaqAccordion";

export default function FaqScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <FaqAccordion />
      </ScrollView>
    </SafeAreaView>
  );
}
