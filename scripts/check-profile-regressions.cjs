const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
let checks = 0;
function check(condition, label) { assert.ok(condition, label); checks++; }
function load(relative, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require, URL, ...globals });
  return exports;
}
const body = { style: { overflow: 'auto' } };
const { acquireBodyScrollLock } = load('src/lib/body-scroll-lock.ts', { document: { body } });
for (const parentFirst of [true, false]) {
  const parent = acquireBodyScrollLock();
  const child = acquireBodyScrollLock();
  check(body.style.overflow === 'hidden', 'Nested dialogs lock scrolling');
  (parentFirst ? parent : child)();
  check(body.style.overflow === 'hidden', 'Remaining dialog keeps its lock');
  (parentFirst ? child : parent)();
  check(body.style.overflow === 'auto', 'Both cleanup orders restore original overflow');
  parent(); child();
  check(body.style.overflow === 'auto', 'Repeated cleanup is harmless');
}
const { creatorProfileSchema } = load('src/features/creator-studio/types/creator-profile.schema.ts');
const valid = { displayName: 'Creator', availableSlots: 0, isAcceptingOrders: false };
check(creatorProfileSchema.safeParse(valid).success, 'Zero slots and paused commissions are valid');
for (const field of ['websiteUrl', 'bannerUrl']) {
  for (const value of ['javascript:alert(1)', 'data:image/png;base64,abc', 'not-a-url', '//example.com/image'])
    check(!creatorProfileSchema.safeParse({ ...valid, [field]: value }).success, 'Invalid profile URL rejected');
  check(creatorProfileSchema.safeParse({ ...valid, [field]: '' }).success, 'Optional URL can be cleared');
  check(creatorProfileSchema.safeParse({ ...valid, [field]: 'https://example.com/banner.png' }).success, 'HTTPS URL accepted');
  check(!creatorProfileSchema.safeParse({ ...valid, [field]: 'https://example.com/' + 'x'.repeat(500) }).success, 'URL fits SQL limit');
}
check(!creatorProfileSchema.safeParse({ ...valid, availableSlots: -1 }).success, 'Negative slots rejected');
check(!creatorProfileSchema.safeParse({ ...valid, availableSlots: 101 }).success, 'Excess slots rejected');
check(!creatorProfileSchema.safeParse({ ...valid, location: 'x'.repeat(201) }).success, 'Location fits SQL limit');
console.log(`Passed ${checks} profile/modal regression checks.`);

