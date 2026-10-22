import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';

import { LEGAL_DOCUMENTS } from '../content/legal-documents';
import type { LegalDocumentId } from '../models/legal-document.model';
import { LegalDocumentModal } from './legal-document-modal';

const documentIds: readonly LegalDocumentId[] = ['privacy', 'terms'];

export function LoginLegalLinks() {
  const [activeDocument, setActiveDocument] = useState<LegalDocumentId | null>(null);

  const openDocument = (id: LegalDocumentId) => {
    Keyboard.dismiss();
    setActiveDocument(id);
  };

  return (
    <>
      <View style={styles.links}>
        {documentIds.map((id) => (
          <Pressable
            key={id}
            accessibilityRole="link"
            accessibilityLabel={LEGAL_DOCUMENTS[id].title}
            onPress={() => openDocument(id)}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <AppText variant="auxiliary" style={styles.text}>{LEGAL_DOCUMENTS[id].title}</AppText>
          </Pressable>
        ))}
      </View>
      {activeDocument ? (
        <LegalDocumentModal
          key={activeDocument}
          document={LEGAL_DOCUMENTS[activeDocument]}
          onClose={() => setActiveDocument(null)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  links: { width: '100%', maxWidth: 480, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, columnGap: Spacing.sm },
  link: { maxWidth: '100%', minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm },
  text: { color: Colors.primaryGreen, fontSize: 12, lineHeight: 18, textAlign: 'center', textDecorationLine: 'underline' },
  pressed: { opacity: 0.65 },
});
