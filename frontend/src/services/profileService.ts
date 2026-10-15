import type { Result, User } from '@/types/auth';

import { apiRequest } from './apiClient';
import { uploadImage, type LocalPhoto } from './imageUpload';
import { session } from './session';

export type ProfileChanges = {
  fullName: string;
  email: string;
  /**
   * undefined = keep the current photo
   * null      = remove the photo
   * LocalPhoto = a new photo picked on the phone (uploaded first)
   */
  photo?: LocalPhoto | null;
};

/** Edit Profile (backend: POST /uploads/avatar + PATCH /auth/me). */
export const profileService = {
  async update(changes: ProfileChanges): Promise<Result<User>> {
    let avatarUrl: string | null | undefined;
    if (changes.photo === null) {
      avatarUrl = null;
    } else if (changes.photo) {
      const uploaded = await uploadImage('/uploads/avatar', changes.photo, 'Your photo');
      if (!uploaded.ok) return uploaded;
      avatarUrl = uploaded.data;
    }

    const result = await apiRequest<User>('/auth/me', {
      method: 'PATCH',
      auth: true,
      body: { fullName: changes.fullName.trim(), email: changes.email.trim(), avatarUrl },
    });
    // Keep the saved user in sync, so Profile and other screens show the new name/photo.
    if (result.ok) await session.save(result.data);
    return result;
  },
};