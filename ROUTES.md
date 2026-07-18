# Rowan Workshop routes

The public homepage intentionally contains no navigation to project sites.

- Home: `https://rowanworkshop.com/`
- Home alias: `https://www.rowanworkshop.com/`
- CKD Meal Planner: `https://ckd.rowanworkshop.com/`
- TenderFit HU: `https://tenderfit.rowanworkshop.com/`
- Web App Repair: `https://repair.rowanworkshop.com/`
- Email forwarding: `hello@rowanworkshop.com` to `daavidrowan@gmail.com`

The project subdomains are unlisted, not access-controlled. Anyone who knows or discovers an exact URL can open it.

## Root deployment status

- GitHub repository: `https://github.com/daavidrowan-lang/daavidrowan-lang.github.io`.
- GitHub Pages deployment is live from the `main` branch and serves the redesigned landing page.
- The apex DNS uses GitHub Pages' four A records; the authoritative `www` CNAME points to `daavidrowan-lang.github.io`.
- HTTP verification returns `200`; GitHub is still issuing the custom-domain TLS certificate before HTTPS can be enforced.
- The former Sites deployment remains inaccessible and is no longer the root-domain hosting route.
