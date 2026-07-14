import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const distDir = resolve('dist');

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (entry.isFile() && /\.(html|js)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
};

for (const file of await walk(distDir)) {
  const source = await readFile(file, 'utf8');
  const relativePaths = source
    .replaceAll('"/assets/', '"./assets/')
    .replaceAll('"/_expo/', '"./_expo/')
    .replaceAll('href="/favicon.ico"', 'href="./favicon.ico"')
    .replaceAll('src="/_expo/', 'src="./_expo/');

  if (source !== relativePaths) {
    await writeFile(file, relativePaths);
  }
}
