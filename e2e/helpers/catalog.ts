import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const generated = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'generated');

export type CatalogCase = {
  id: string;
  module?: string;
  env?: string;
  priority?: string;
  automated: string;
  title: string;
  precondition?: string;
  steps?: string;
  data?: string;
  expected?: string;
  tags?: string;
  skipReason?: string;
};

export function loadCatalog(name: string): CatalogCase[] {
  const file = path.join(generated, `${name}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as CatalogCase[];
}

export function uniqueUser() {
  const stamp = Date.now().toString().slice(-6);
  return {
    stamp,
    email: `auto.um.${stamp}@idx.com`,
    phone: `98${stamp}01`,
    name: `Auto${stamp}`,
  };
}
