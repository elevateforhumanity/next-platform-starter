// Extend root Tailwind config so custom tokens (shadow-card, brand colors, etc.)
// are available in the admin app without duplication.
import rootConfig from '../../tailwind.config.js';

/** @type {import('tailwindcss').Config} */
export default {
  ...rootConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};
