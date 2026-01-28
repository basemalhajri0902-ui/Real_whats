/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['supabase.co', 'localhost'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
    // للدعم العربي RTL
    i18n: {
        locales: ['ar'],
        defaultLocale: 'ar',
    },
};

module.exports = nextConfig;
