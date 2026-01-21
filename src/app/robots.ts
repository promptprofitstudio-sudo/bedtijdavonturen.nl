import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/pricing', '/privacy', '/terms'],
            disallow: ['/account', '/library', '/profiles', '/wizard', '/story/', '/listen/'],
        },
        sitemap: 'https://bedtijdavonturen.nl/sitemap.xml',
    }
}
