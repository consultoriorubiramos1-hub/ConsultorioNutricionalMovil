import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppIcon, AppText } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';

import type { LegalContentBlock, LegalDocument } from '../models/legal-document.model';

interface LegalDocumentModalProps {
  document: LegalDocument;
  onClose: () => void;
}

export function LegalDocumentModal({ document, onClose }: LegalDocumentModalProps) {
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent} accessibilityViewIsModal>
            <View style={styles.header}>
              <AppText variant="sectionTitle" accessibilityRole="header" style={styles.title}>
                {document.title}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={'Cerrar ' + document.title.toLowerCase()}
                onPress={onClose}
                style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                <AppIcon name="close" color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.document}
              accessibilityLabel={'Contenido de ' + document.title.toLowerCase()}>
              <AppText color="textSecondary" style={styles.subtitle}>{document.subtitle}</AppText>

              {document.sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <AppText variant="sectionTitle" accessibilityRole="header">{section.title}</AppText>
                  {section.blocks.map((block, index) => (
                    <ContentBlock key={index} block={block} />
                  ))}
                </View>
              ))}

              <AppText variant="auxiliary" color="textSecondary" selectable>
                {`Fecha de aprobación: ${document.approvedAt}.`}
              </AppText>
              {document.updatedAt ? (
                <AppText variant="auxiliary" color="textSecondary" selectable>
                  {`Fecha de última actualización: ${document.updatedAt}.`}
                </AppText>
              ) : null}
              <AppButton label="Entendido" variant="secondary" onPress={onClose} style={styles.understood} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function ContentBlock({ block }: { block: LegalContentBlock }) {
  if (block.kind === 'list') {
    return (
      <View style={styles.list}>
        {block.items.map((item) => (
          <View key={item} style={styles.listItem}>
            <AppText accessible={false} style={styles.bullet}>•</AppText>
            <AppText selectable style={styles.listText}>{item}</AppText>
          </View>
        ))}
      </View>
    );
  }

  return (
    <AppText
      variant={block.kind === 'subheading' ? 'sectionTitle' : 'body'}
      accessibilityRole={block.kind === 'subheading' ? 'header' : undefined}
      selectable
      style={styles.paragraph}>
      {block.text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  modalContent: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { flex: 1, fontSize: 20, lineHeight: 28 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  scroll: { flex: 1 },
  document: { padding: Spacing.lg, gap: Spacing.lg },
  subtitle: { lineHeight: 26 },
  section: { gap: 12 },
  paragraph: { lineHeight: 26 },
  list: { gap: Spacing.sm },
  listItem: { flexDirection: 'row', gap: Spacing.sm },
  bullet: { color: Colors.primaryGreen, lineHeight: 26 },
  listText: { flex: 1, lineHeight: 26 },
  understood: { marginBottom: Spacing.sm },
});
