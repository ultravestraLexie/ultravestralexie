/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Galaxy redesign (2026-11-23): the destinations replace the
   * old surface map. Every retired route redirects to its Galaxy
   * home — no functionality is deleted; the engines and API
   * routes behind them are untouched. Temporary (307) while the
   * new map settles. Five-section navigation (owner order
   * 2026-11-23): /money and /passport both moved into /me. */
  async redirects() {
    const map = [
      ["/dashboard", "/today"],
      ["/command-center", "/today"],
      ["/growth-center", "/today"],
      ["/growth-center/deals", "/deals"],
      ["/opportunities", "/brands"],
      ["/discover", "/brands"],
      ["/radar", "/brands"],
      ["/commissions", "/brands"],
      ["/ask", "/brands"],
      ["/trend-radar", "/brands"],
      ["/campaign-match", "/brands"],
      ["/alerts", "/today"],
      ["/proposals", "/deals"],
      ["/revenue", "/me"],
      ["/money", "/me"],
      ["/passport", "/me"],
      ["/creator-lab", "/studio"],
      ["/growth-map", "/today"],
      ["/pillars", "/today"],
    ];
    return map.map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
