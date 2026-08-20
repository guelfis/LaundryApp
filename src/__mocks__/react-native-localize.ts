// src/__mocks__/react-native-localize.ts

export const getLocales = () => [
  { languageCode: 'en', countryCode: 'EN', scriptCode: undefined, isRTL: false }
];

export const getCalendar = () => 'gregorian';
export const getCountry = () => 'CH';
export const getCurrency = () => 'CHF';
export const getTemperatureUnit = () => 'celsius';
export const getTimeZone = () => 'Europe/Rome';
export const uses24HourClock = () => true;
export const usesMetricSystem = () => true;

export const addEventListener = () => {};
export const removeEventListener = () => {};

// Default export containing all methods
const mockLocalize = {
  getLocales,
  getCalendar,
  getCountry,
  getCurrency,
  getTemperatureUnit,
  getTimeZone,
  uses24HourClock,
  usesMetricSystem,
  addEventListener,
  removeEventListener,
};

export default mockLocalize;
