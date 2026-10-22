# Splash e íconos de Rubí Ramos

`assets/images/logo-rubi.png` es la fuente original y no se modifica. Los recursos se derivan de sus píxeles mediante recorte del símbolo separado y escalado proporcional. No se redibujan formas, letras ni colores.

## Recursos y configuración

Todos los PNG generados tienen 1024 × 1024 píxeles:

| Archivo en `assets/images/` | Uso |
| --- | --- |
| `splash-icon.png` | Logo completo centrado sobre lienzo transparente. |
| `icon.png` | Símbolo original sobre blanco opaco, para iOS y Android sin íconos adaptativos. |
| `android-icon-foreground.png` | Símbolo sobre transparencia, con margen para las máscaras de Android. |
| `android-icon-background.png` | Fondo blanco opaco de la capa adaptativa. |
| `android-icon-monochrome.png` | Máscara blanca que conserva el alfa del símbolo para los íconos temáticos. |

`app.json` configura `expo-splash-screen` con fondo `#FFFFFF`, `resizeMode: "contain"` y el mismo fondo blanco en modo oscuro. El tamaño del lienzo es 260 puntos en iOS y 180 dp en Android; el espacio transparente permite conservar el logo completo dentro del área del sistema. El plugin genera los recursos correspondientes a cada densidad.

El símbolo de Android ocupa como máximo 592 px del lienzo de 1024 px (62.44 de los 108 dp de la capa), dentro del margen recomendado por [Android](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive). No se precortan esquinas en el PNG de iOS.

`ios.icon` apunta a `./assets/images/icon.png`: el antiguo bundle `assets/expo.icon` ya no está referenciado. El formato PNG sigue siendo compatible con SDK 57, según la [guía de íconos de Expo](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).

Para regenerar exactamente estos recursos con las herramientas de imagen incluidas en las dependencias de Expo CLI:

```powershell
node scripts/generate-brand-assets.cjs
```

## Comprobar Android e iOS

Los íconos y el splash son recursos nativos: reiniciar Metro, recargar JavaScript o enviar una actualización OTA no reemplaza los recursos de una aplicación ya instalada. Hace falta compilar e instalar una versión nueva.

Expo Go puede mostrar el ícono de la app y su propia pantalla de carga. Un development build también tiene limitaciones al reproducir el splash final. La comprobación visual definitiva debe hacerse con un build **preview o production**, como indica la [documentación de SplashScreen para SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/).

El perfil `preview` de `eas.json` ya configura distribución interna y APK para Android. Con la cuenta, el proyecto EAS, los identificadores reales y las credenciales correspondientes configurados, ejecutar desde PowerShell:

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
npx.cmd eas-cli@latest build --platform ios --profile preview
```

Instalar el APK nuevo en Android. Para iOS, el perfil de distribución interna requiere firma y un dispositivo registrado en la cuenta de Apple; instalar el build desde su enlace de distribución. No se deben inventar un `android.package`, `ios.bundleIdentifier`, owner o projectId para pasar esta preparación.

En cada plataforma:

1. Cerrar completamente la aplicación y abrirla desde su nuevo ícono.
2. Comprobar el fondo blanco y el logo completo centrado durante el arranque en frío.
3. Repetir en modo claro y oscuro.
4. Revisar el ícono en el launcher; en Android, comprobar también una máscara circular y los íconos temáticos cuando estén disponibles.
5. Si el sistema conserva una imagen antigua, reinstalar el build actualizado en un dispositivo de pruebas. Desinstalar borra los datos locales y la sesión.

Las verificaciones de configuración e imágenes no sustituyen esta revisión en dispositivos. Esta preparación no ejecuta builds remotos ni publicaciones y no crea directorios nativos.
