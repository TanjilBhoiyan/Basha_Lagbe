import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, FormError, Input } from '@/components/ui';
import { initials } from '@/features/property/OwnerAvatar';
import { apiImage } from '@/services/apiClient';
import type { LocalPhoto } from '@/services/imageUpload';
import { profileService } from '@/services/profileService';
import { session } from '@/services/session';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';
import type { User } from '@/types/auth';
import { formatBdPhone, validateEmail, validateFullName } from '@/utils/validation';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Errors = { fullName?: string; email?: string };

const AVATAR = 112;

/** Square crop, smaller file: a profile photo is only ever shown small. */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.6,
};

export default function EditProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  /** undefined = keep the current photo, null = remove it, LocalPhoto = new photo. */
  const [photo, setPhoto] = useState<LocalPhoto | null | undefined>(undefined);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    session.getUser().then((u) => {
      setUser(u);
      setFullName(u?.fullName ?? '');
      setEmail(u?.email ?? '');
    });
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  /** What the circle shows right now: the new photo, the saved one, or nothing. */
  const shownPhoto = photo ? { uri: photo.uri } : photo === null || !user.avatarUrl ? null : apiImage(user.avatarUrl);

  const changed =
    fullName.trim() !== user.fullName || email.trim().toLowerCase() !== user.email || photo !== undefined;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  const goBack = () => {
    if (!changed || saving) return leave();
    Alert.alert('Discard changes?', 'Your changes to your profile will not be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: leave },
    ]);
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    setSheetOpen(false);
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access in your phone settings to take a photo.');
        return;
      }
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPhoto({ uri: asset.uri, mimeType: asset.mimeType ?? undefined });
  };

  const removePhoto = () => {
    setSheetOpen(false);
    // No saved photo: "keep" already means no photo. Otherwise ask the server to remove it.
    setPhoto(user.avatarUrl ? null : undefined);
  };

  const save = async () => {
    const next: Errors = { fullName: validateFullName(fullName), email: validateEmail(email) };
    setErrors(next);
    setFormError(null);
    if (next.fullName || next.email) return;

    setSaving(true);
    const result = await profileService.update({ fullName, email, photo });
    setSaving(false);

    if (!result.ok) {
      // Show the email problem next to the email field, anything else above the button.
      if (/email/i.test(result.error)) setErrors({ email: result.error });
      else setFormError(result.error);
      return;
    }
    Alert.alert('Profile updated', 'Your changes have been saved.', [{ text: 'OK', onPress: leave }]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <AppText style={styles.title} accessibilityRole="header">
          Edit Profile
        </AppText>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarBox}>
            <Pressable
              onPress={() => setSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              {shownPhoto ? (
                <Image source={shownPhoto} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.noPhoto]}>
                  <AppText style={styles.initials}>{initials(fullName.trim() || user.fullName)}</AppText>
                </View>
              )}
              <View style={styles.camera}>
                <Ionicons name="camera" size={17} color={colors.white} />
              </View>
            </Pressable>
            <View style={styles.photoLinks}>
              <Pressable onPress={() => setSheetOpen(true)} hitSlop={8} accessibilityRole="button">
                <AppText variant="bodyBold" color="primary">
                  {shownPhoto ? 'Change photo' : 'Add photo'}
                </AppText>
              </Pressable>
              {shownPhoto ? (
                <Pressable onPress={removePhoto} hitSlop={8} accessibilityRole="button">
                  <AppText variant="bodyBold" color="danger">
                    Remove
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <Input
              label="Full Name *"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              placeholder="Your full name"
              autoCapitalize="words"
              maxLength={60}
              error={errors.fullName}
              prefix={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
            />
            <Input
              label="Email *"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              prefix={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            />
            <View>
              <AppText variant="bodyBold" style={styles.label}>
                Phone Number
              </AppText>
              <View style={styles.readOnly} accessible accessibilityLabel={`Phone number ${formatBdPhone(user.phone)}`}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                <AppText color="textSecondary" style={styles.flex}>
                  {formatBdPhone(user.phone)}
                </AppText>
                {user.phoneVerified ? (
                  <View style={styles.verified}>
                    <Ionicons name="checkmark" size={12} color={colors.primaryDark} />
                    <AppText style={styles.verifiedText}>Verified</AppText>
                  </View>
                ) : null}
              </View>
              <View style={styles.hintRow}>
                <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
                <AppText variant="caption" color="textSecondary" style={styles.flex}>
                  Phone number can't be changed. It is your login ID.
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={20} color={colors.info} />
            <AppText variant="caption" style={styles.noteText}>
              Your name and photo are shown to owners and tenants on listings and in chat. Your email is never shown.
            </AppText>
          </View>

          <FormError message={formError ?? undefined} />
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Save Changes" loading={saving} disabled={!changed} onPress={save} style={styles.save} />
        </View>
      </KeyboardAvoidingView>

      <PhotoSheet
        visible={sheetOpen}
        canRemove={!!shownPhoto}
        onCamera={() => pickPhoto('camera')}
        onGallery={() => pickPhoto('gallery')}
        onRemove={removePhoto}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

/** Bottom sheet: Take a photo / Choose from gallery / Remove photo. */
function PhotoSheet({
  visible,
  canRemove,
  onCamera,
  onGallery,
  onRemove,
  onClose,
}: {
  visible: boolean;
  canRemove: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.handle} />
        <AppText variant="h3" style={styles.sheetTitle}>
          Profile Photo
        </AppText>
        {Platform.OS !== 'web' ? <SheetRow icon="camera-outline" label="Take a photo" onPress={onCamera} /> : null}
        <SheetRow icon="image-outline" label="Choose from gallery" onPress={onGallery} />
        {canRemove ? <SheetRow icon="trash-can-outline" label="Remove photo" danger onPress={onRemove} /> : null}
      </View>
    </Modal>
  );
}

function SheetRow({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: IconName;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sheetRow, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={[styles.sheetIcon, danger && styles.sheetIconDanger]}>
        <MaterialCommunityIcons name={icon} size={22} color={danger ? colors.danger : colors.primaryDeep} />
      </View>
      <AppText variant="bodyBold" style={danger ? styles.dangerText : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundMint },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundMint },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
  },
  title: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.text },
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xl, gap: spacing.lg },
  avatarBox: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.surface,
  },
  noPhoto: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 40, lineHeight: 48, fontWeight: '800', color: colors.primaryDeep },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDeep,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLinks: { flexDirection: 'row', gap: spacing.lg },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  label: { marginBottom: spacing.sm },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#F3F4F6',
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoLight,
  },
  noteText: { flex: 1, color: colors.text },
  footer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  save: { minHeight: 54, borderRadius: radius.full },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: { marginBottom: spacing.sm },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  sheetIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconDanger: { backgroundColor: colors.dangerLight },
  dangerText: { color: colors.danger },
});