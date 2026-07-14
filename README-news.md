# Lottery Spheres News Integration

`lottery-spheres.html` keeps the original Lottery Spheres experience as the primary page. The existing `#spheres` section, sphere animation, lottery-number controls, page layout, IDs, and scripts remain in place.

The page adds a secondary `#lottery-news` section that loads Lottery articles from `articles.json` with client-side JavaScript. The widget filters to category `Lottery` only, so paranormal, UFO, hauntings, cryptids, and mystery categories do not appear on the Lottery Spheres page.

If `articles.json` cannot be loaded, the widget logs a clear warning, shows a small fallback message, and leaves the sphere UI usable. The page also includes `#sources` as a lightweight source-verification section and links to `rss.xml`.

To disable the widget, remove the `#lottery-news` and `#sources` sections from `lottery-spheres.html`, remove the `sd-news` CSS block from `lottery-spheres.css`, and remove the `lottery-news-widget.js` script tag. The original `#spheres` route will continue to work.
