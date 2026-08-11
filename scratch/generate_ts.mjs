import fs from 'fs';

const stbs = JSON.parse(fs.readFileSync('./scratch/venkatesa_stbs.json', 'utf8'));

const tsContent = `import { ApprovedOperator, StbMapping } from "./store";

export const VENKATESA_OPERATOR: ApprovedOperator = {
  id: "op-venkatesa-perumal",
  name: "VENKATESA PERUMAL",
  mobile: "9787312758",
  email: "venkatesaperumal@stb.com",
  stbBoxName: "SCV",
  portalLink: "https://scvportal.com",
  addedAt: "2026-08-11",
  active: true,
};

export const VENKATESA_STB_MAPPINGS: StbMapping[] = ${JSON.stringify(stbs, null, 2)};
`;

fs.writeFileSync('./frontend/src/services/venkatesaStbs.ts', tsContent);
fs.writeFileSync('./src/services/venkatesaStbs.ts', tsContent);
console.log('Successfully generated venkatesaStbs.ts files in both frontend/src and src!');
