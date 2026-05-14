import type { Metadata } from 'next';
import CosmetologyPartnerPage from '../cosmetology-apprenticeship/page';

export { dynamic } from '../cosmetology-apprenticeship/page';

export const metadata: Metadata = {
	title: 'Cosmetology Partner Shop Program | Elevate for Humanity',
	description:
		'Become a host salon partner for the Indiana cosmetology apprenticeship pathway. Apply, complete onboarding, and host apprentices at your shop.',
	alternates: {
		canonical: 'https://www.elevateforhumanity.org/partners/cosmetology-partner-shop',
	},
	openGraph: {
		title: 'Cosmetology Partner Shop Program | Elevate for Humanity',
		description: 'Host apprentices and grow your salon with structured training support.',
		url: 'https://www.elevateforhumanity.org/partners/cosmetology-partner-shop',
	},
};

export default CosmetologyPartnerPage;
