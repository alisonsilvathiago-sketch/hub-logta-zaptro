import type { WhatsappMirrorContact } from '../lib/zaptroWhatsappMirrorContacts';

/** Exemplos para pré-visualizar a página Contatos (não grava no CRM). */
export const ZAPTRO_DEMO_MIRROR_CONTACTS: WhatsappMirrorContact[] = [
  { id: 'wa-mirror-demo-1', phone: '5511987654321', name: 'João Ferreira', profilePicUrl: 'https://i.pravatar.cc/150?u=joao1' },
  { id: 'wa-mirror-demo-2', phone: '5511976543210', name: 'Maria Santos', profilePicUrl: 'https://i.pravatar.cc/150?u=maria1' },
  { id: 'wa-mirror-demo-3', phone: '5511965432109', name: 'Pedro Costa', profilePicUrl: 'https://i.pravatar.cc/150?u=pedro1' },
  { id: 'wa-mirror-demo-4', phone: '5511954321098', name: 'Ana Oliveira', profilePicUrl: 'https://i.pravatar.cc/150?u=ana1' },
  { id: 'wa-mirror-demo-5', phone: '5511943210987', name: 'Carlos Mendes', profilePicUrl: null },
];

export function isZaptroDemoMirrorContactId(id: string): boolean {
  return String(id).startsWith('wa-mirror-demo-');
}
