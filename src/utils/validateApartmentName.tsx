import i18n from '../locales/i18n'; 

export const validateApartmentName = (name: string, invalidNames: string[]): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        return i18n.t('apartmentNameSection.error_empty', "Can't be empty");
    }
    const exists = invalidNames.some(
        (aptName) => aptName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
        return i18n.t('apartmentNameSection.error_taken', "Name taken");
    }
    return null;
};