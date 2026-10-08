import type { ImageSourcePropType } from 'react-native';

export type OnboardingSlideData = {
  id: string;
  image: ImageSourcePropType;
  title: string;
  /** Optional second line of the title, shown in the brand green. */
  highlight?: string;
  description: string;
};

export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: 'verified',
    image: require('../../../assets/images/onboarding-1.jpg'),
    title: 'Find Verified',
    highlight: 'Properties',
    description: 'Browse verified houses, flats, and rooms across Bangladesh.',
  },
  {
    id: 'direct-contact',
    image: require('../../../assets/images/onboarding-2.jpg'),
    title: 'Directly Connect with Owners',
    description:
      'No extra broker fees. Easily call, chat and book a visit directly with property owners.',
  },
  {
    id: 'rent-your-way',
    image: require('../../../assets/images/onboarding-3.jpg'),
    title: 'Rent Your Way',
    description:
      'Find the perfect rental home with options for families, bachelors, students and professionals.',
  },
];