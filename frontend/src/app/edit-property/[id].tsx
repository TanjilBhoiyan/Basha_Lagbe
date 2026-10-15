import { useLocalSearchParams } from 'expo-router';

import { PropertyFormScreen } from '@/features/post/PropertyFormScreen';

/** Owner edits one of their listings (opened from the dashboard). */
export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PropertyFormScreen editId={id} />;
}