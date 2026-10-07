import { router } from 'expo-router';

import { locationService } from './locationService';

/** After login/registration: pick a location first, then go to Home. */
export async function goToAppHome() {
  const selected = await locationService.getSelected();
  router.replace(selected ? '/home' : '/select-location');
}