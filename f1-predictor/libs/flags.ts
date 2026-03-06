//Returns a flagcdn.com URL for a given ISO 3166-1 alpha-2 country code
export function getFlagUrl(countryCode: string, width = 80): string {
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}
