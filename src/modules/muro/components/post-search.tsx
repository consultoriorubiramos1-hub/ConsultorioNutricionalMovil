import { StyleSheet, TextInput, View } from "react-native";

import { AppButton, AppText } from "@/components/ui";
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
      <AppText variant="auxiliary" color="textSecondary">Buscar por título, descripción o contenido</AppText>
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
      <View style={styles.actions}>
        <AppButton label="Buscar" disabled={disabled} accessibilityState={{ disabled }} onPress={onSearch} style={styles.action} />
        {value || activeSearch ? (
          <AppButton label="Limpiar búsqueda" variant="secondary" disabled={disabled} accessibilityState={{ disabled }} onPress={onClear} style={styles.action} />
        ) : null}
      </View>
      {activeSearch ? <AppText variant="auxiliary" color="textSecondary" accessibilityLiveRegion="polite">Resultados para: {activeSearch}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { gap: Spacing.sm },
  input: { minHeight: 52, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.white, color: Colors.text, fontFamily: Fonts.regular, fontSize: 16 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  action: { flexGrow: 1 },
});
