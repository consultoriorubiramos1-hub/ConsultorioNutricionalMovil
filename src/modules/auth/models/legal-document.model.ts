export type LegalDocumentId = 'privacy' | 'terms';

export type LegalContentBlock =
  | { kind: 'paragraph' | 'subheading'; text: string }
  | { kind: 'list'; items: readonly string[] };

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  subtitle: string;
  approvedAt: string;
  // Registrar solo una fecha confirmada de actualización posterior del contenido.
  updatedAt?: string;
  sections: readonly {
    title: string;
    blocks: readonly LegalContentBlock[];
  }[];
}
