/** Minimal Next.js config */
/** Proxy API calls to backend during development */
module.exports = {
	reactStrictMode: true,
	async rewrites() {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL
		if (!apiUrl) return []
		const dest = apiUrl.replace(/\/$/, '') + '/:path*'
		return [
			{ source: '/api/:path*', destination: dest }
		]
	}
}
