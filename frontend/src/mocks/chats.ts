import type { ChatMessage } from '@/types/chat';
import type { Property } from '@/types/property';
import { formatBdNumber } from '@/utils/format';
import { SAMPLE_PROPERTY_IDS as ID } from './sampleIds';

/** Owners shown as "Online" in the mock. The backend will send real presence. */
export const MOCK_ONLINE_PROPERTY_IDS: string[] = [ID.p1, ID.p2];

/** A sample conversation for p1 (like the design), dated a few minutes ago. */
export function seedMessages(conversationId: string, propertyId: string): ChatMessage[] {
  if (propertyId !== ID.p1) return [];
  const lines: [ChatMessage['sender'], string, number][] = [
    ['me', 'Assalamu Alaikum ভাই,\nIs this apartment still available?', 30],
    ['owner', 'Wa Alaikum Assalam!\nYes, it’s still available.', 28],
    ['me', 'Great! Can you please tell me if the rent is 28,000 BDT fixed? Are there any additional charges (like service charge or utilities)?', 26],
    ['owner', 'The rent is 28,000 BDT per month. Service charge is 1,500 BDT. Utilities (gas, electricity, water) are separate as per actual usage.', 24],
    ['me', 'That sounds good. Can I visit the apartment tomorrow around 4 PM?', 22],
    ['owner', 'Sure! Tomorrow at 4 PM works for me. I will be at the apartment. Please let me know before you arrive.', 20],
    ['me', 'Thank you! I’ll confirm tomorrow and see you at 4 PM.', 19],
  ];
  const now = Date.now();
  return lines.map(([sender, text, minutesAgo], i) => ({
    id: `seed_${conversationId}_${i}`,
    conversationId,
    sender,
    text,
    createdAt: new Date(now - minutesAgo * 60_000).toISOString(),
    status: 'read',
  }));
}

/** Canned owner replies so the mock chat feels alive. */
export function mockOwnerReply(text: string, property: Property | undefined): string {
  const t = text.toLowerCase();
  if (!property) return 'Thanks for your message! I’ll get back to you soon.';
  if (t.includes('available')) return 'Yes, it’s still available. When would you like to visit?';
  if (t.includes('negotiable') || t.includes('discount') || t.includes('fixed')) {
    return property.negotiable
      ? `The rent is ৳${formatBdNumber(property.monthlyRent)}. We can discuss a little when you visit.`
      : `Sorry, the rent is fixed at ৳${formatBdNumber(property.monthlyRent)} per month.`;
  }
  if (t.includes('visit') || t.includes('see') || t.includes('dekh')) {
    return 'Sure! Please send a visit request from the app with your preferred time, I’ll confirm it.';
  }
  if (t.includes('advance') || t.includes('deposit')) {
    return `Advance is ${property.advanceMonths} month(s) rent.`;
  }
  return 'Thanks for your message! I’ll get back to you soon.';
}