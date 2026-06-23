/**
 * Application Fee Configuration
 * 
 * Policy:
 * - Programs: $15 fee required
 * - Host Shops: $15 fee required  
 * - Apprenticeships: $0 NO FEE
 */

// Stripe Price ID for $15 application fee
export const APPLICATION_FEE_PRICE_ID = 'price_1TiEDyH4a2yrVOt5pYBCQc2D';
export const APPLICATION_FEE_AMOUNT_CENTS = 1500; // $15
export const APPLICATION_FEE_AMOUNT_DOLLARS = 15;

// Programs that require application fee
export const FEE_REQUIRED_PROGRAMS = [
  'healthcare',
  'skilled-trades',
  'technology',
  'business',
  'cna',
  'hvac',
  'phlebotomy',
  'medical-assistant',
  'pharmacy-technician',
  'welding',
  'electrical',
  'plumbing',
  'cdl',
  'it-help-desk',
  'cybersecurity',
  'software-development',
  'web-development',
];

// Programs with NO application fee (apprenticeships)
export const NO_FEE_PROGRAMS = [
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'nail-technician-apprenticeship',
  'culinary-apprenticeship',
  'barber',
  'cosmetology',
  'esthetician',
  'nail-tech',
];

// Host shop types (these require fee)
export const HOST_SHOP_TYPES = [
  'barber-host-shop',
  'cosmetology-host-shop',
  'esthetician-host-shop',
  'nail-host-shop',
];

// Check if a program type requires application fee
export function requiresApplicationFee(programSlug: string): boolean {
  const slug = programSlug.toLowerCase();
  
  // Check NO_FEE list first (apprenticeships)
  if (NO_FEE_PROGRAMS.some(p => slug.includes(p))) {
    return false;
  }
  
  // Check FEE_REQUIRED list
  if (FEE_REQUIRED_PROGRAMS.some(p => slug.includes(p))) {
    return true;
  }
  
  // Default: require fee for unknown programs (except apprenticeships)
  // If unsure, require fee - safer to charge than waive
  return true;
}

// Check if this is a host shop application
export function isHostShopApplication(programSlug: string): boolean {
  const slug = programSlug.toLowerCase();
  return HOST_SHOP_TYPES.some(type => slug.includes(type));
}

// Get fee amount for a program
export function getApplicationFeeAmount(programSlug: string): number {
  if (requiresApplicationFee(programSlug)) {
    return APPLICATION_FEE_AMOUNT_CENTS;
  }
  return 0;
}
