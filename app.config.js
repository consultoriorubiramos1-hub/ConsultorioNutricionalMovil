// Mantiene app.json como base. Los identificadores los decide el propietario.
module.exports = ({ config }) => ({
  ...config,
  ...(process.env.EXPO_OWNER ? { owner: process.env.EXPO_OWNER } : {}),
  android: {
    ...config.android,
    ...(process.env.ANDROID_PACKAGE ? { package: process.env.ANDROID_PACKAGE } : {}),
  },
  extra: {
    ...config.extra,
    ...(process.env.EXPO_PROJECT_ID ? {
      eas: { ...config.extra?.eas, projectId: process.env.EXPO_PROJECT_ID },
    } : {}),
  },
});
