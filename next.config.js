/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    async rewrites() {
        return [
            {
                source: '/millis-proxy/:path*',
                destination: 'https://app.millis.ai/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig; 