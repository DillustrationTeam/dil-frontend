const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/features/creator-studio/utils/creator-assets.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const sandbox = { exports: {}, require, URL };
vm.runInNewContext(output, sandbox);
const { assetSchema, assetDetails, assetMessage } = sandbox.exports;
let checks = 0;
function check(condition, message) { if (!condition) throw new Error(message); checks++; }
const draft = { assetType: 'Palette', name: ' Moonlight ', colors: ['#112233', '#FFAA66'], notes: 'Night scene', assetUrl: '' };
check(assetSchema.parse(draft).name === 'Moonlight', 'Trim asset names');
for (const invalid of [
  { ...draft, name: '' }, { ...draft, name: 'x'.repeat(121) },
  { ...draft, colors: ['red', '#112233'] }, { ...draft, colors: ['#112233'] },
  { ...draft, colors: Array(17).fill('#112233') },
  { ...draft, notes: 'x'.repeat(3001) }, { ...draft, assetUrl: 'javascript:alert(1)' },
  { ...draft, assetUrl: 'https://user:pass@example.com/image.png' },
  { ...draft, assetType: 'Pose', colors: [] },
  { ...draft, assetType: 'Preset', notes: '', colors: [] },
]) check(!assetSchema.safeParse(invalid).success, 'Reject incomplete or unsafe assets');
check(assetSchema.safeParse({ ...draft, assetType: 'Preset', colors: [] }).success, 'Preset instructions do not require image');
check(assetSchema.safeParse({ ...draft, assetType: 'Pose', colors: [], assetUrl: 'https://example.com/pose.png' }).success, 'Pose accepts image URL');
const asset = { id: 'id', assetType: 'Palette', name: 'Moonlight', metadataJson: JSON.stringify({ colors: draft.colors, notes: draft.notes }) };
check(assetDetails(asset).colors.join(',') === draft.colors.join(','), 'Read actual stored colors');
check(assetMessage(asset) === 'Bảng màu: Moonlight\n#112233 · #FFAA66\nNight scene', 'Workroom draft contains actual name, colors and notes');
check(assetDetails({ ...asset, metadataJson: 'broken' }).colors.length === 0, 'Legacy malformed metadata remains readable');
check(assetDetails({ ...asset, metadataJson: '{"preset":"soft shading"}' }).notes === 'soft shading', 'Legacy preset text is retained');
check(assetDetails({ ...asset, metadataJson: '{"colors":["red",null,"#112233"]}' }).colors.join(',') === '#112233', 'Invalid legacy colors are ignored');
console.log(`Passed ${checks} creator asset frontend checks.`);
