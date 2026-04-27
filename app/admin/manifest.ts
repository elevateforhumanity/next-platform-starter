import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Elevate Admin',
    short_name: 'EFH Admin',
    description: 'Elevate for Humanity — Admin Portal',
    start_url: '/admin/dashboard',
    scope: '/admin',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/admin-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/icons/admin-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icons/admin-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/admin-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
