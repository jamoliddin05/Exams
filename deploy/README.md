# Static exam site deployment

The repository contains a standalone trainer and a small static-site builder. The online site is hosted separately at **https://exams.eessketit.uz/**. No GitHub Pages settings, Actions permissions, API keys or server credentials are needed in this repository.

## Build locally

Python 3.10+:

```bash
python -m venv .venv
.venv/bin/pip install -r requirements-exam-site.txt
.venv/bin/python Midterms/EmbeddedSoftwareDesign/MidtermSamples/verify_materials.py
.venv/bin/python scripts/build_exam_site.py
.venv/bin/python scripts/check_exam_site.py dist-exams
.venv/bin/python -m http.server 8080 --directory dist-exams
```

Open http://localhost:8080/. The output uses relative links, so it can be served at a domain root or a path prefix. The build publishes only the explicitly listed SOC3050 documents, trainer and bank; it does not expose the repository, homework, tooling or local credentials.

## Nginx / VDS

1. Point the hostname's DNS A/AAAA records at the intended server; avoid a stale AAAA record.
2. Build and validate locally. Copy `dist-exams/` to a new timestamped release directory under `/var/www/exams.eessketit.uz/releases/`.
3. Point `/var/www/exams.eessketit.uz/current` at the new release. Keep the previous release for rollback.
4. Serve that directory from a dedicated Nginx virtual host for `exams.eessketit.uz`. Configure HTTPS with the server's existing ACME tooling after DNS resolves correctly.
5. Run `nginx -t` before reload. Verify the home page, `/embedded/Trainer.html`, study guide and `/release.json` over HTTPS.

The sample Nginx virtual host is in `deploy/exams.nginx.conf`. Install it as an HTTP bootstrap configuration, then use the server's certificate manager to add TLS. Keep the primary portfolio site's configuration separate. A valid `release.json` identifies the question bank and upstream source revision for the deployed release.

## Updating and rollback

Rebuild from the desired Git revision, validate it, upload a new release and switch `current`. Roll back by switching `current` to the previous release; do not rebuild old content in place. Generated HTML files use no-cache revalidation so students receive new question sets after an update. Attempts are browser-tab-local and reset on reload; there is no shared score database.
