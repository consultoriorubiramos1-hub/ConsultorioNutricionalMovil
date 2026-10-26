import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { getCurrentSession } from "@/modules/auth/services/auth-session.service";

export default function Index() {
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const user = await getCurrentSession();

      if (!isMounted) {
        return;
      }

      if (user) {
        router.replace("/inicio");
      } else {
        router.replace("/login");
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primaryGreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});
