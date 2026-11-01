# Evidencia técnica: configuración de R8/ProGuard

Proyecto: ConsultorioNutricionalMovil
Rama: feature/ofuscacion-r8
Framework: React Native / Expo SDK 58
Fecha: 01/11/2026

## Configuración aplicada

Plugin: expo-build-properties 58.0.12

- enableMinifyInReleaseBuilds: true
- enableShrinkResourcesInReleaseBuilds: true

## Verificación nativa

Se ejecutó expo prebuild para Android.

En android/gradle.properties:
- android.enableMinifyInReleaseBuilds=true
- android.enableShrinkResourcesInReleaseBuilds=true

En android/app/build.gradle:
- minifyEnabled utiliza la configuración de Release.
- shrinkResources utiliza la configuración de Release.
- proguardFiles incluye proguard-android-optimize.txt y proguard-rules.pro.

El archivo proguard-rules.pro contiene reglas para:
- React Native Reanimated.
- React Native TurboModules.

## Pruebas realizadas

- TypeScript: aprobado.
- ESLint: aprobado.
- Jest: 391 pruebas aprobadas.
- Pruebas originales: 67 aprobadas.
- Integración simulada: 10 aprobadas.
- Total: 468 pruebas aprobadas, 0 fallidas.

## Pendientes

- Compilar un nuevo AAB Release con esta configuración.
- Verificar el resultado de la ofuscación mediante JADX.
- Ejecutar pruebas funcionales del AAB optimizado.
- Adjuntar capturas y resultados de descompilación.

Estado: configuración comprobada; verificación del binario pendiente.
