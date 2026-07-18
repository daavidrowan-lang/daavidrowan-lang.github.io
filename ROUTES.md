# Rowan Workshop routes

The public homepage intentionally contains no navigation to project sites.

- Home: `http://rowanworkshop.com/`
- Home alias: `http://www.rowanworkshop.com/`
- CKD Meal Planner: `http://rowanworkshop.com/ckd/`
- TenderFit HU: `http://rowanworkshop.com/tenderfit/`
- Web App Repair: `http://rowanworkshop.com/repair/`
- Email forwarding: `hello@rowanworkshop.com` to `daavidrowan@gmail.com`

The project paths are unlisted, excluded from the homepage navigation, and marked `noindex`. They are not access-controlled: anyone who knows or discovers an exact URL can open it.

## Root deployment status

- GitHub repository: `https://github.com/daavidrowan-lang/daavidrowan-lang.github.io`.
- GitHub Pages deployment is live from the `main` branch and serves the redesigned landing page.
- The apex DNS uses GitHub Pages' four A records; the authoritative `www` CNAME points to `daavidrowan-lang.github.io`.
- The root and project paths are hosted together on GitHub Pages. Each HTTP route is verified with a `200` response and a real-browser render; GitHub is still issuing the custom-domain TLS certificate before HTTPS can be used reliably.
- The former Sites subdomains all show a permission page despite public access metadata. They are retired and must not be promoted.
