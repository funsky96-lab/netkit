#!/usr/bin/env python3
"""Publish a static site through gh's authenticated API to an enabled Pages repo."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.request
import base64

EXTENSIONS = {'.html', '.css', '.js', '.mjs', '.json', '.svg', '.png', '.jpg',
              '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.txt', '.webmanifest'}
SKIP = {'node_modules', 'tests', 'scripts', '__pycache__', 'venv'}


def api(path, method='GET', data=None):
    args = ['gh', 'api', path, '--method', method]
    if data is not None:
        args.extend(['--input', '-'])
    result = subprocess.run(args, input=json.dumps(data) if data is not None else None,
                            capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout) if result.stdout else None


def blob_sha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def collect(source, includes=None):
    if includes:
        files = [source / name for name in includes]
    else:
        files = []
        for directory, dirs, names in os.walk(source, followlinks=False):
            dirs[:] = [name for name in dirs if not name.startswith('.') and name not in SKIP
                       and not (Path(directory) / name).is_symlink()]
            for name in names:
                path = Path(directory) / name
                if (not name.startswith('.') and path.suffix.lower() in EXTENSIONS) or path == source / '.nojekyll':
                    files.append(path)
    output = {}
    for path in sorted(files):
        if path.is_symlink() or not path.is_file() or not path.resolve().is_relative_to(source):
            raise ValueError(f'Invalid source file: {path}')
        data = path.read_bytes()
        if len(data) > 20 * 1024 * 1024:
            raise ValueError(f'File exceeds 20 MiB: {path}')
        output[path.relative_to(source).as_posix()] = data
    if not output:
        raise ValueError('No website files found.')
    return output


def publish(repo, files, prefix='', dry_run=False):
    endpoint = 'repos/' + repo
    pages = api(endpoint + '/pages')
    if pages.get('build_type') != 'legacy' or pages.get('source') != {'branch': 'main', 'path': '/'}:
        raise RuntimeError('Target must already have GitHub Pages enabled on main at /(root).')
    head = api(endpoint + '/commits/main')
    tree = api(endpoint + '/git/trees/' + head['commit']['tree']['sha'] + '?recursive=1')
    if tree.get('truncated'):
        raise RuntimeError('Remote tree is too large to verify safely.')
    existing = {item['path']: item['sha'] for item in tree['tree'] if item['type'] == 'blob'}
    changes = {(prefix + '/' if prefix else '') + name: data for name, data in files.items()
               if existing.get((prefix + '/' if prefix else '') + name) != blob_sha(data)}
    url = pages['html_url'].rstrip('/') + '/' + (prefix + '/' if prefix else '')
    print(f'{len(changes)} changed files; target: {url}', flush=True)
    if dry_run or not changes:
        return head['sha'], url, False
    entries = []
    for name, data in changes.items():
        blob = api(endpoint + '/git/blobs', 'POST',
                   {'content': base64.b64encode(data).decode(), 'encoding': 'base64'})
        entries.append({'path': name, 'mode': '100644', 'type': 'blob', 'sha': blob['sha']})
    new_tree = api(endpoint + '/git/trees', 'POST',
                   {'base_tree': head['commit']['tree']['sha'], 'tree': entries})
    commit = api(endpoint + '/git/commits', 'POST',
                 {'message': 'Publish ' + (prefix or 'NetKit') + ' website updates',
                  'tree': new_tree['sha'], 'parents': [head['sha']]})
    # A concurrent update is rejected, preserving changes from other contributors.
    api(endpoint + '/git/refs/heads/main', 'PATCH', {'sha': commit['sha'], 'force': False})
    print('Published commit ' + commit['sha'], flush=True)
    return commit['sha'], url, True


def wait_for_site(repo, commit, url, files, timeout=180):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        build = api('repos/' + repo + '/pages/builds/latest')
        if build.get('commit') == commit:
            if build.get('status') == 'errored':
                raise RuntimeError('Pages build failed: ' + str(build.get('error')))
            if build.get('status') == 'built':
                if 'index.html' in files:
                    try:
                        with urllib.request.urlopen(url + '?deploy=' + commit, timeout=20) as response:
                            if response.status == 200 and response.read() == files['index.html']:
                                print('Verified live website: ' + url, flush=True)
                                return
                    except OSError:
                        pass
                else:
                    print('Pages deployment succeeded: ' + url, flush=True)
                    return
        time.sleep(5)
    raise RuntimeError('Deployment verification timed out; check GitHub Actions before retrying.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument('--site', help='Site folder slug, e.g. my-new-site')
    target.add_argument('--root-update', action='store_true', help='Update existing NetKit root')
    parser.add_argument('--repo', default='funsky96-lab/netkit')
    parser.add_argument('--include', action='append', help='Explicit source file; may be repeated')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--no-wait', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', args.repo):
        parser.error('Invalid repository.')
    if args.site and not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.site):
        parser.error('Site must be a lowercase slug such as my-new-site.')
    source = args.source.resolve()
    if not source.is_dir():
        parser.error('Source must be a directory.')
    try:
        files = collect(source, args.include)
        if not args.include and 'index.html' not in files:
            raise ValueError('Website requires index.html at its source root.')
        commit, url, changed = publish(args.repo, files, args.site or '', args.dry_run)
        if not args.dry_run and not args.no_wait:
            wait_for_site(args.repo, commit, url, files)
    except (ValueError, RuntimeError, OSError) as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__':
    main()
