import fs from 'node:fs';
import path from 'node:path';

export interface NextAppDir {
  dir: string;
  label: string;
}

function unique(paths: string[]) {
  return [...new Set(paths.map((p) => path.resolve(p)))];
}

function isDirectory(dir: string) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

export function getNextAppDirCandidates(cwd = process.cwd()) {
  return unique([
    path.join(cwd, 'app'),
    path.join(cwd, 'src', 'app'),
    path.join(cwd, 'apps', 'web', 'app'),
    path.join(cwd, 'apps', 'admin', 'app'),
    path.resolve(cwd, '..', '..', 'app'),
    path.resolve(cwd, '..', '..', 'src', 'app'),
    path.resolve(cwd, '..', '..', 'apps', 'web', 'app'),
    path.resolve(cwd, '..', '..', 'apps', 'admin', 'app'),
  ]);
}

export function discoverNextAppDirs(cwd = process.cwd()): NextAppDir[] {
  return getNextAppDirCandidates(cwd)
    .filter(isDirectory)
    .map((dir) => {
      const rel = path.relative(cwd, dir);
      return {
        dir,
        label: rel && !rel.startsWith('..') ? rel : dir,
      };
    });
}

export function describeCheckedAppDirs(cwd = process.cwd()) {
  return getNextAppDirCandidates(cwd).join(', ');
}
