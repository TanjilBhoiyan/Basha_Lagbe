// Adds secrets from .env on top of app.json (app.json itself stays key-free and safe to commit).
module.exports = ({ config }) => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  if (!mapsKey) {
    console.warn('GOOGLE_MAPS_ANDROID_API_KEY is missing in frontend/.env: the Search map will crash on Android.');
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: mapsKey },
      },
    },
  };
};