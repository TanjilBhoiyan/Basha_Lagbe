import type { Result } from '@/types/auth';

import { apiRequest } from './apiClient';
import { session } from './session';

/** What the backend puts in a notification's `data` (where a tap should go). */
export type NotificationData = {
  screen?: 'visits' | 'listing-reminder' | 'my-listings' | string;
  propertyId?: string;
  visitId?: string;
};

/** One row of the in-app notification list (bell icon). */
export type AppNotification = {
  id: string;
  title: string;
  body: string;
  data: NotificationData;
  read: boolean;
  /** ISO timestamp */
  createdAt: string;
};

export type NotificationPage = { items: AppNotification[]; nextCursor: string | null };

/** Screens showing the bell (red dot) listen here, so a new push or "mark read" updates them at once. */
const listeners = new Set<() => void>();

/** The logged-in user's notification list (backend: /notifications). */
export const notificationService = {
  /** Newest first. `before` = nextCursor from the previous page. */
  async list(before?: string): Promise<Result<NotificationPage>> {
    const query = before ? `?before=${encodeURIComponent(before)}` : '';
    return apiRequest<NotificationPage>(`/notifications${query}`, { auth: true });
  },

  /** For the red dot on the bell. 0 when logged out or offline. */
  async unreadCount(): Promise<number> {
    if (!(await session.getToken())) return 0;
    const result = await apiRequest<{ count: number }>('/notifications/unread-count', { auth: true });
    return result.ok ? result.data.count : 0;
  },

  async markRead(id: string): Promise<void> {
    await apiRequest<null>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', auth: true });
    notificationService.notifyChanged();
  },

  async markAllRead(): Promise<void> {
    await apiRequest<null>('/notifications/read-all', { method: 'POST', auth: true });
    notificationService.notifyChanged();
  },

  /** Listen for changes (new push, read). Returns a function that stops listening. */
  onChange(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notifyChanged() {
    listeners.forEach((listener) => listener());
  },
};