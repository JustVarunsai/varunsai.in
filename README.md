# VarunSai.in

Static site for `varunsai.in`, designed to deploy cleanly on GitHub Pages.

## Structure

- `index.html`: main landing page
- `notes/`: working notes landing page
- `builds/`: project and build landing page
- `newsletter/`: newsletter landing page
- `debug/`: debug archive landing page
- `styles.css`: shared styles
- `script.js`: lightweight reveal and text rotation
- `CNAME`: custom domain for GitHub Pages

## Preview locally

From this folder:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy with GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo settings, set Pages to use `GitHub Actions`.
3. Make sure the domain DNS points to GitHub Pages.
4. The included `CNAME` file keeps `varunsai.in` attached to the deployment.

## DNS reminder

For an apex domain like `varunsai.in`, GitHub Pages typically needs A records pointing to GitHub Pages IPs, and a `www` CNAME pointing to the GitHub Pages host if you want both root and `www`.
