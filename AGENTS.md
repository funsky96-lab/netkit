# NetKit deployment

This repository is already configured for GitHub Pages from `main` at `/`.
Public URL: https://funsky96-lab.github.io/netkit/

For authorized NetKit updates, publish without requesting Pages setup again.
Use `python scripts/publish.py . --root-update`. The script uses the authenticated
GitHub API because direct Git push authentication is unavailable in this cloud
session. It preserves unrelated files and does not force-push.

For a new static website that the user wants hosted automatically without an
independent repository, publish its output directory with
`python scripts/publish.py /path/to/site --site site-slug`.
It will be available at `https://funsky96-lab.github.io/netkit/site-slug/`.
Use relative asset paths. Keep existing NetKit and other sites intact.

Do not claim that new independent repository creation or first-time Pages setup
can be automated under the current connector permissions: those API calls
returned 403. If the user explicitly requires an independent repository, explain
the limitation and use an already authorized repository when available.

Run appropriate calculation tests for logic changes. Complete publishing by
checking the Pages build and public URL. Never expose credentials or copy secret
configuration into published files. Documentation-only updates do not require
re-running the calculation suite.
