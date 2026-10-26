import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppIcon, AppText } from "@/components/ui";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { MAX_SEARCH_LENGTH } from "../models/muro.model";

interface PostSearchProps {
  value: string;
  activeSearch: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function PostSearch({ value, activeSearch, disabled, onChange, onSearch, onClear }: PostSearchProps) {
  return (
    <View style={styles.search}>
      <View style={styles.inputRow}>
      <AppIcon name="search" size={22} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Buscar publicaciones..."
        placeholderTextColor={Colors.textSecondary}
        maxLength={MAX_SEARCH_LENGTH}
        accessibilityLabel="Buscar publicaciones por título, descripción o contenido"
        accessibilityHint="Escribe hasta 100 caracteres y presiona Buscar."
        accessibilityState={{ disabled }}
        editable={!disabled}
        returnKeyType="search"
        onSubmitEditing={() => { if (!disabled) onSearch(); }}
        style={styles.input}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Buscar publicaciones" disabled={disabled} onPress={onSearch} style={styles.searchButton}><AppIcon name="chevron" size={19} color={Colors.primaryGreen} /></Pressable>
      </View>
      <View style={styles.actions}>
        {value || activeSearch ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" disabled={disabled} onPress={onClear} style={styles.clear}><AppText variant="auxiliary" style={styles.clearText}>Limpiar búsqueda</AppText></Pressable>
        ) : null}
      </View>
      {activeSearch ? <AppText variant="auxiliary" color="textSecondary" accessibilityLiveRegion="polite">Resultados para: {activeSearch}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { gap: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.md, backgroundColor: Colors.muted, borderRadius: Radius.pill, gap: Spacing.sm },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingVertical: Spacing.sm, color: Colors.text, fontFamily: Fonts.regular, fontSize: 15 },
  searchButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  clear: { minHeight: 44, justifyContent: 'center' },
  clearText: { color: Colors.primaryGreen },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  action: { flexGrow: 1 },
});
