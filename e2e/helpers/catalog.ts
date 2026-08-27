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
  title?: string;
  description?: string;
  precondition?: string;
  steps?: string;
  data?: string;
  expected?: string;
  tags?: string;
  skipReason?: string;
  type?: string;
  save?: string;
  roleName?: string;
  clicks?: string;
  expectedResult?: string;
  name?: string;
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

export function uniqueShift() {
  const stamp = Date.now().toString().slice(-6);
  return {
    stamp,
    name: `auto_shift_${stamp}`,
    weekdays: `auto_shift_weekdays_${stamp}`,
    night: `auto_shift_night_${stamp}`,
    clone: `auto_shift_clone_${stamp}`,
  };
}

export function uniqueProject() {
  const stamp = Date.now().toString().slice(-6);
  return {
    stamp,
    name: `auto_proj_${stamp}`,
    code: `AP${stamp}`,
    moreName: `auto_proj_more_${stamp}`,
    moreCode: `AM${stamp}`,
    edited: `auto_proj_${stamp}_ed`,
  };
}

export function catalogAnnotations(c: CatalogCase, extra: { env?: string } = {}) {
  return [
    { type: 'id', description: c.id },
    { type: 'priority', description: c.priority || 'P2' },
    { type: 'automated', description: c.automated },
    { type: 'expected', description: c.expected || '' },
    ...(extra.env ? [{ type: 'env', description: extra.env }] : []),
  ];
}
