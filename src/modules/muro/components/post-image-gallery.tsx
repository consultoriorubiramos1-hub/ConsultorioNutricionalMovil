import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from "react-native";

import { AppButton, AppScreen, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import type { PostImage } from "../models/muro.model";

function RemotePostImage({ url, label, onExpand }: { url: string; label: string; onExpand?: () => void }) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  if (failed) return (
    <View style={styles.imageState} accessibilityLiveRegion="polite">
      <AppText color="textSecondary">No se pudo cargar esta imagen.</AppText>
      <AppButton label="Reintentar imagen" variant="secondary" onPress={() => { setLoading(true); setFailed(false); }} />
    </View>
  );
  return (
    <Pressable
      style={styles.imageContainer}
      accessibilityRole={onExpand ? "button" : "image"}
      accessibilityLabel={onExpand ? "Ampliar " + label.toLowerCase() : label}
      accessibilityHint={onExpand ? "Abre la imagen en una vista ampliada." : undefined}
      onPress={onExpand}
      disabled={!onExpand}
    >
      <Image
        source={{ uri: url }}
        style={styles.image}
        contentFit="contain"
        recyclingKey={url}
        cachePolicy="disk"
        accessible={false}
        onDisplay={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
      />
      {loading ? <ActivityIndicator style={styles.spinner} pointerEvents="none" color={Colors.headerGreen} accessibilityLabel="Cargando imagen" /> : null}
    </Pressable>
  );
}

function ImageControls({ index, total, onPrevious, onNext }: { index: number; total: number; onPrevious: () => void; onNext: () => void }) {
  if (total < 2) return null;
  return (
    <View style={styles.controls}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Imagen anterior"
        accessibilityState={{ disabled: index === 0 }}
        disabled={index === 0}
        onPress={onPrevious}
        style={({ pressed }) => [styles.arrow, index === 0 && styles.disabled, pressed && styles.pressed]}
      >
        <AppText variant="subtitle">‹</AppText>
      </Pressable>
      <AppText variant="auxiliary" color="textSecondary" style={styles.counter} accessibilityLiveRegion="polite" accessibilityLabel={"Imagen " + (index + 1) + " de " + total}>
        {index + 1} / {total}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Imagen siguiente"
        accessibilityState={{ disabled: index === total - 1 }}
        disabled={index === total - 1}
        onPress={onNext}
        style={({ pressed }) => [styles.arrow, index === total - 1 && styles.disabled, pressed && styles.pressed]}
      >
        <AppText variant="subtitle">›</AppText>
      </Pressable>
    </View>
  );
}

export function PostImageGallery({ images, title, disabled }: { images: PostImage[]; title: string; disabled: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const index = Math.min(selectedIndex, images.length - 1);
  const current = images[index];
  if (!current) return null;
  const label = "Imagen " + (index + 1) + " de " + images.length + " de la publicación " + title;
  const previous = () => setSelectedIndex((value) => Math.max(0, value - 1));
  const next = () => setSelectedIndex((value) => Math.min(images.length - 1, value + 1));
  const controls = <ImageControls index={index} total={images.length} onPrevious={previous} onNext={next} />;
  return (
    <View style={styles.gallery}>
      <View style={styles.preview}>
        <RemotePostImage key={current.url} url={current.url} label={label} onExpand={disabled ? undefined : () => setExpanded(true)} />
      </View>
      <AppButton
        label="Ampliar imagen"
        variant="secondary"
        accessibilityLabel={"Ampliar " + label.toLowerCase()}
        accessibilityState={{ disabled, expanded }}
        disabled={disabled}
        onPress={() => setExpanded(true)}
      />
      {controls}
      <Modal visible={expanded && !disabled} animationType="fade" onRequestClose={() => setExpanded(false)}>
        <AppScreen scrollable={false} contentContainerStyle={styles.modal}>
          <View style={styles.modalBody} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <AppText variant="sectionTitle" style={styles.modalTitle}>Imágenes de la publicación</AppText>
              <AppButton label="Cerrar" variant="secondary" accessibilityLabel="Cerrar imagen ampliada" onPress={() => setExpanded(false)} />
            </View>
            <View style={styles.expandedImage}>
              <RemotePostImage key={current.url} url={current.url} label={label} />
            </View>
            {controls}
          </View>
        </AppScreen>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { gap: Spacing.sm },
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: Radius.md, overflow: "hidden", backgroundColor: Colors.background },
  imageContainer: { flex: 1 },
  image: { width: "100%", height: "100%" },
  spinner: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  imageState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm, padding: Spacing.md },
  controls: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  arrow: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.white },
  counter: { flex: 1, textAlign: "center" },
  modal: { flex: 1, padding: Spacing.md, gap: Spacing.md },
  modalBody: { flex: 1, gap: Spacing.md },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  modalTitle: { flex: 1 },
  expandedImage: { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.md, overflow: "hidden" },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
