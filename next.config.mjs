/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'mn'],
    defaultLocale: 'en'
  },
  experimental: {
    appDir: true
  }
};

export default nextConfig;
