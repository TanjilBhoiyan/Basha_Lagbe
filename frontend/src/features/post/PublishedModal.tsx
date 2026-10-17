import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  /** true = an existing listing was saved; false = a new one went live. */
  edited: boolean;
  onViewListing: () => void;
  /** "Go to My Listings" (new post) or "Done" (edit). */
  onClose: () => void;
};

/** Shown after the owner posts (or saves) a listing. */
export function PublishedModal({ visible, edited, onViewListing, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={40} color={colors.white} />
            </View>
          </View>

          <AppText style={styles.title} align="center">
            {edited ? 'Changes saved' : 'Your property is live!'}
          </AppText>
          <AppText color="textSecondary" align="center" style={styles.message}>
            {edited
              ? 'Tenants will see the updated details right away.'
              : 'Tenants nearby can now find your listing, message you and request a visit.'}
          </AppText>

          <View style={styles.buttons}>
            <Button
              title="View Listing"
              onPress={onViewListing}
              leftIcon={<Ionicons name="eye-outline" size={20} color={colors.white} />}
            />
            <Button title={edited ? 'Done' : 'Go to My Listings'} variant="outline" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
  },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.text },
  message: { marginTop: spacing.sm, lineHeight: 22 },
  buttons: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xl },
});