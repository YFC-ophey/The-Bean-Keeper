const configuredUrl = import.meta.env.VITE_BUY_ME_A_COFFEE_URL?.trim() ||
  'https://buymeacoffee.com/opheliachen';

function validateDonationUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['buymeacoffee.com', 'www.buymeacoffee.com'].includes(url.hostname)) {
      return null;
    }
    return url.pathname !== '/' ? url.toString() : null;
  } catch {
    return null;
  }
}

export const buyMeACoffeeUrl = validateDonationUrl(configuredUrl);
