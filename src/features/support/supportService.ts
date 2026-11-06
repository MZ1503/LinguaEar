import { authedFetch } from '@/src/features/auth';

export type TicketCategory = 'bug' | 'account' | 'billing' | 'feature' | 'other';

export type Ticket = {
  id: number;
  category: TicketCategory;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  created_at: string;
};

export const CATEGORIES: { id: TicketCategory; label: string }[] = [
  { id: 'bug', label: 'Something is broken' },
  { id: 'account', label: 'My account' },
  { id: 'billing', label: 'Billing' },
  { id: 'feature', label: 'Idea or request' },
  { id: 'other', label: 'Other' },
];

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    throw new Error(
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? String(detail[0].msg)
          : 'Something went wrong.',
    );
  }
  return body as T;
}

export const listTickets = () => authedFetch('/support/tickets').then((r) => parse<Ticket[]>(r));

export const getTicket = (id: number) => authedFetch(`/support/tickets/${id}`).then((r) => parse<Ticket>(r));

export const createTicket = (category: TicketCategory, subject: string, message: string) =>
  authedFetch('/support/tickets', {
    method: 'POST',
    body: JSON.stringify({ category, subject, message }),
  }).then((r) => parse<Ticket>(r));

export const closeTicket = (id: number) =>
  authedFetch(`/support/tickets/${id}/close`, { method: 'POST' }).then((r) => parse<Ticket>(r));
