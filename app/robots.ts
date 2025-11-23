import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/profile/'],
      },
    ],
    sitemap: 'https://solvefy.vercel.app/sitemap.xml', // Change to your domain
  }
}
