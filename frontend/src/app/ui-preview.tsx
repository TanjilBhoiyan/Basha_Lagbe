// import { router } from 'expo-router';
// import { useEffect, useState } from 'react';
// import { ScrollView, StyleSheet, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { AppText, Button, Input } from '@/components/ui';
// import { APP_CONFIG } from '@/config/app';
// import { onboardingStorage } from '@/services/onboardingStorage';
// import { session } from '@/services/session';
// import { colors, SCREEN_PADDING, spacing } from '@/theme';
// import type { User } from '@/types/auth';

// /**
//  * Temporary screen shown after login until Home is built.
//  * Also holds developer tools for testing the auth/onboarding flows.
//  */
// export default function UiPreviewScreen() {
//   const [user, setUser] = useState<User | null>(null);
//   const [phone, setPhone] = useState('');

//   useEffect(() => {
//     session.getUser().then(setUser);
//   }, []);

//   const logout = async () => {
//     await session.clear();
//     router.replace('/login');
//   };

//   const resetAll = async () => {
//     await session.clear();
//     await onboardingStorage.reset();
//     router.replace('/');
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ScrollView contentContainerStyle={styles.container}>
//         <AppText variant="h1" color="primary">{APP_CONFIG.name}</AppText>
//         <AppText color="textSecondary">
//           {user ? `Logged in as ${user.fullName} (+880${user.phone})` : 'Not logged in'}
//         </AppText>

//         <View style={styles.section}>
//           <AppText variant="h3">Typography</AppText>
//           <AppText variant="h2">Heading 2</AppText>
//           <AppText variant="body">Body text — 3 Bedroom Apartment, Mirpur 10</AppText>
//           <AppText variant="bodyBold" color="primary">
//             {APP_CONFIG.currency.symbol}25,000/month
//           </AppText>
//         </View>

//         <View style={styles.section}>
//           <AppText variant="h3">Input</AppText>
//           <Input
//             label="Sample input"
//             placeholder="Type something"
//             value={phone}
//             onChangeText={setPhone}
//           />
//         </View>

//         <View style={styles.section}>
//           <AppText variant="h3">Developer</AppText>
//           <Button title="Logout" variant="outline" onPress={logout} />
//           <Button title="Reset everything & restart" variant="danger" onPress={resetAll} />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: colors.background },
//   container: { padding: SCREEN_PADDING, gap: spacing.sm },
//   section: { marginTop: spacing.xl, gap: spacing.md },
// });