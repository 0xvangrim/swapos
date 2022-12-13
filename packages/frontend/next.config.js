/* eslint-env node */
// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  reactStrictMode: true,
}

// eslint-disable-next-line
const withTM = require('next-transpile-modules')(['@ethathon/contracts', 'undici'])

module.exports = withTM(nextConfig)
