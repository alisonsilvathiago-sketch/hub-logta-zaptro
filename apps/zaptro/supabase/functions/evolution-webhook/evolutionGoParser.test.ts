import { assertEquals } from 'jsr:@std/assert@1';
import { collectWebhookMessages, previewContent } from '../_shared/evolutionGoParser.ts';

Deno.test('parse text message (Baileys)', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.upsert',
      instance: 'zaptro',
      data: {
        key: { remoteJid: '5511999887766@s.whatsapp.net', fromMe: false, id: 'ABC123' },
        message: { conversation: 'Olá, preciso de ajuda' },
        pushName: 'Cliente Teste',
        messageTimestamp: 1710000000,
      },
    },
    'zaptro',
  );

  assertEquals(parsed.messages.length, 1);
  const msg = parsed.messages[0];
  assertEquals(msg.messageType, 'text');
  assertEquals(msg.content, 'Olá, preciso de ajuda');
  assertEquals(msg.externalId, 'ABC123');
  assertEquals(msg.direction, 'in');
  assertEquals(previewContent(msg), 'Olá, preciso de ajuda');
});

Deno.test('parse audio ptt', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.upsert',
      instance: 'zaptro',
      data: {
        key: { remoteJid: '5511999887766@s.whatsapp.net', fromMe: false, id: 'AUD1' },
        message: {
          audioMessage: { mimetype: 'audio/ogg; codecs=opus', ptt: true, seconds: 12, url: 'https://example.com/a.ogg' },
        },
      },
    },
    'zaptro',
  );

  assertEquals(parsed.messages[0].messageType, 'ptt');
  assertEquals(parsed.messages[0].media?.kind, 'ptt');
});

Deno.test('parse image with caption', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.upsert',
      instance: 'zaptro',
      data: {
        key: { remoteJid: '5511999887766@s.whatsapp.net', fromMe: true, id: 'IMG1' },
        message: {
          imageMessage: { mimetype: 'image/jpeg', caption: 'Foto da carga', url: 'https://example.com/i.jpg' },
        },
      },
    },
    'zaptro',
  );

  const msg = parsed.messages[0];
  assertEquals(msg.messageType, 'image');
  assertEquals(msg.content, 'Foto da carga');
  assertEquals(msg.direction, 'out');
});

Deno.test('parse sticker', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.upsert',
      instance: 'zaptro',
      data: {
        key: { remoteJid: '5511999887766@s.whatsapp.net', fromMe: false, id: 'STK1' },
        message: { stickerMessage: { mimetype: 'image/webp', url: 'https://example.com/s.webp' } },
      },
    },
    'zaptro',
  );
  assertEquals(parsed.messages[0].messageType, 'sticker');
});

Deno.test('parse location', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.upsert',
      instance: 'zaptro',
      data: {
        key: { remoteJid: '5511999887766@s.whatsapp.net', fromMe: false, id: 'LOC1' },
        message: {
          locationMessage: { degreesLatitude: -23.55, degreesLongitude: -46.63, name: 'São Paulo' },
        },
      },
    },
    'zaptro',
  );
  const msg = parsed.messages[0];
  assertEquals(msg.messageType, 'location');
  assertEquals(msg.locationLat, -23.55);
  assertEquals(msg.locationLng, -46.63);
});

Deno.test('parse contact vcard', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.upsert',
      instance: 'zaptro',
      data: {
        key: { remoteJid: '5511999887766@s.whatsapp.net', fromMe: false, id: 'CT1' },
        message: {
          contactMessage: { displayName: 'João', vcard: 'BEGIN:VCARD\nFN:João\nEND:VCARD' },
        },
      },
    },
    'zaptro',
  );
  assertEquals(parsed.messages[0].messageType, 'contact');
  assertEquals(parsed.messages[0].contactVcard?.includes('VCARD'), true);
});

Deno.test('parse reaction', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.reaction',
      instance: 'zaptro',
      data: {
        key: { remoteJid: '5511999887766@s.whatsapp.net', fromMe: false, id: 'RX1' },
        message: {
          reactionMessage: { key: { id: 'TARGET1' }, text: '👍' },
        },
      },
    },
    'zaptro',
  );
  const msg = parsed.messages[0];
  assertEquals(msg.messageType, 'reaction');
  assertEquals(msg.reaction, '👍');
  assertEquals(msg.reactionTargetId, 'TARGET1');
});

Deno.test('parse deleted protocol message', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.update',
      instance: 'zaptro',
      data: {
        key: { remoteJid: '5511999887766@s.whatsapp.net', fromMe: true, id: 'DEL1' },
        message: {
          protocolMessage: { type: 'REVOKE', key: { id: 'OLDMSG' } },
        },
      },
    },
    'zaptro',
  );
  const msg = parsed.messages[0];
  assertEquals(msg.messageType, 'deleted');
  assertEquals(msg.isDeleted, true);
  assertEquals(msg.quotedMessageId, 'OLDMSG');
});

Deno.test('parse group message with participant', () => {
  const parsed = collectWebhookMessages(
    {
      event: 'messages.upsert',
      instance: 'zaptro',
      data: {
        key: {
          remoteJid: '120363012345678901@g.us',
          participant: '5511888777666@s.whatsapp.net',
          fromMe: false,
          id: 'GRP1',
        },
        message: { conversation: 'Mensagem no grupo' },
        pushName: 'Motorista',
      },
    },
    'zaptro',
  );
  const msg = parsed.messages[0];
  assertEquals(msg.isGroup, true);
  assertEquals(msg.messageType, 'text');
  assertEquals(msg.participantJid, '5511888777666@s.whatsapp.net');
});

Deno.test('connection event is skipped but stored path', () => {
  const parsed = collectWebhookMessages(
    { event: 'connection.update', instance: 'zaptro', data: { state: 'open' } },
    'zaptro',
  );
  assertEquals(parsed.skipProcessing, true);
  assertEquals(parsed.messages.length, 0);
});

Deno.test('idempotency hash stable for same payload', async () => {
  const payload = { event: 'messages.upsert', instance: 'zaptro', data: { id: 'x' } };
  const { hashEventPayload } = await import('../_shared/evolutionGoParser.ts');
  const a = await hashEventPayload('zaptro', 'messages.upsert', payload);
  const b = await hashEventPayload('zaptro', 'messages.upsert', payload);
  assertEquals(a, b);
});
