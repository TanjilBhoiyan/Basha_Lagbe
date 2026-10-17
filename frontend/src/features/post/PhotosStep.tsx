import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { AMENITY_OPTIONS } from '@/features/filters/filters';
import { CheckTile } from '@/features/filters/FilterControls';
import { colors, radius, spacing } from '@/theme';
import type { Amenity } from '@/types/property';
import { MAX_PHOTOS, type DraftErrors, type PropertyDraft } from './draft';
import { FieldFooter, GroupTitle, StepCard } from './FormFields';

type Props = {
  draft: PropertyDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<PropertyDraft>) => void;
};

const GAP = spacing.sm;

export function PhotosStep({ draft, errors, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const photos = draft.photos;
  const left = MAX_PHOTOS - photos.length;
  const tile = width ? (width - GAP * 2) / 3 : 0;
  const amenityWidth = width ? (width - GAP) / 2 : 0;

  const pick = async () => {
    if (left <= 0) {
      Alert.alert('Photo limit reached', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: left,
      orderedSelection: true,
      // Smaller files upload faster on mobile data; still sharp on a phone screen.
      quality: 0.7,
    });
    if (result.canceled) return;
    const added = result.assets
      .filter((a) => !photos.some((p) => p.uri === a.uri))
      .slice(0, left)
      .map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? undefined }));
    onChange({ photos: [...photos, ...added] });
  };

  const remove = (uri: string) => onChange({ photos: photos.filter((p) => p.uri !== uri) });

  const makeCover = (uri: string) => {
    const photo = photos.find((p) => p.uri === uri);
    if (photo) onChange({ photos: [photo, ...photos.filter((p) => p.uri !== uri)] });
  };

  const toggleAmenity = (a: Amenity) =>
    onChange({
      amenities: draft.amenities.includes(a) ? draft.amenities.filter((x) => x !== a) : [...draft.amenities, a],
    });

  return (
    <StepCard title="Photos" subtitle="Add clear photos of your property">
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.gap}>
        <Pressable
          onPress={pick}
          style={[styles.upload, !!errors.photos && styles.uploadError]}
          accessibilityRole="button"
          accessibilityLabel="Select photos"
        >
          <MaterialCommunityIcons name="image-outline" size={44} color={colors.textSecondary} />
          <AppText variant="bodyBold">Tap to upload photos</AppText>
          <AppText variant="caption" color="textSecondary">
            You can upload up to {MAX_PHOTOS} photos ({photos.length}/{MAX_PHOTOS})
          </AppText>
          <View style={styles.selectBtn}>
            <MaterialCommunityIcons name="image-multiple" size={20} color={colors.primaryDeep} />
            <AppText variant="bodyBold" color="primaryDeep">
              Select Photos
            </AppText>
          </View>
        </Pressable>
        <FieldFooter error={errors.photos} />

        {photos.length ? (
          <>
            <View style={styles.grid}>
              {photos.map((p, i) => (
                <Pressable
                  key={p.uri}
                  onLongPress={() => makeCover(p.uri)}
                  style={{ width: tile, height: tile }}
                  accessibilityLabel={i === 0 ? 'Cover photo' : `Photo ${i + 1}, hold to make cover`}
                >
                  <Image source={{ uri: p.uri }} style={styles.photo} />
                  {i === 0 ? (
                    <View style={styles.cover}>
                      <AppText variant="small" style={styles.coverText}>
                        Cover
                      </AppText>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => remove(p.uri)}
                    style={styles.remove}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${i + 1}`}
                  >
                    <Ionicons name="close" size={16} color={colors.white} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
            <AppText variant="caption" color="textSecondary">
              Tip: hold a photo to make it the cover. Living room, bedroom, kitchen and bathroom photos get the most
              visits.
            </AppText>
          </>
        ) : null}
      </View>

      <GroupTitle icon="star-four-points-outline">Facilities</GroupTitle>
      <View style={styles.amenities}>
        {AMENITY_OPTIONS.map((a) => (
          <CheckTile
            key={a.value}
            label={a.label}
            icon={a.icon}
            checked={draft.amenities.includes(a.value)}
            onPress={() => toggleAmenity(a.value)}
            width={amenityWidth}
          />
        ))}
      </View>
    </StepCard>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
  upload: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  uploadError: { borderColor: colors.danger },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  photo: { width: '100%', height: '100%', borderRadius: radius.md, backgroundColor: colors.surface },
  cover: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDeep,
  },
  coverText: { color: colors.white, fontWeight: '700' },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});