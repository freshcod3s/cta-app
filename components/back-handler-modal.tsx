// Custom modal demonstrating the Android BackHandler pattern.
// Lock rule: "All push code paths tested on BOTH platforms before merge"
// generalizes here: every custom modal/screen with dismissible UI must
// register a BackHandler listener so Android hardware-back closes it
// instead of exiting the app. iOS swipe-back is handled by Expo Router
// natively and needs no custom handler.
//
// Smoke-test (Joe-task per RULE #1, real-device perception): open this
// modal on Android, press hardware-back -> modal closes, app stays open.
import { ReactNode, useEffect } from "react";
import { BackHandler, Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
};

export function BackHandlerModal({ visible, onClose, title, children }: Props) {
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="w-11/12 rounded-2xl bg-white p-6 dark:bg-gray-900">
          <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
            {title}
          </Text>
          {children}
          <Pressable
            onPress={onClose}
            className="mt-4 rounded-lg bg-indigo-500 px-4 py-2"
          >
            <Text className="text-center font-semibold text-white">Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
