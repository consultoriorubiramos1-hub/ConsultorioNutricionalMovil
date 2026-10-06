import {
  Lato_400Regular,
  Lato_700Bold,
  useFonts,
} from "@expo-google-fonts/lato";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { getCurrentSession } from "@/modules/auth/services/auth-session.service";

const PUBLIC_ROUTES = ["", "login", "recuperar-contrasena"];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
  });

  const segments = useSegments();

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const protectRoute = async () => {
      setCheckingSession(true);

      const currentRoute = segments.join("/");
      const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

      const user = await getCurrentSession();

      if (!isMounted) {
        return;
      }

      if (!user && !isPublicRoute) {
        router.replace("/login");
      }

      if (
        user &&
        (currentRoute === "login" || currentRoute === "recuperar-contrasena")
      ) {
        router.replace("/inicio");
      }

      setCheckingSession(false);
    };

    protectRoute();

    return () => {
      isMounted = false;
    };
  }, [segments]);

  if (!fontsLoaded || checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});
