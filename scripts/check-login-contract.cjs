const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

(async () => {
  for (const file of ['src/services/auth.service.ts', 'src/features/auth/services/auth.service.ts']) {
    const calls = [];
    const exports = {};
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const auth = { user: { id: 'test-user' }, tokens: {}, roles: ['Client'] };
    vm.runInNewContext(compiled, {
      exports,
      require: (name) => {
        assert.equal(name, '@/lib/api-client');
        return { apiClient: { post: async (url, body) => {
          calls.push({ url, body });
          return { data: { data: auth } };
        } } };
      },
    });
    assert.equal(await exports.authService.login({ email: 'test@example.test', password: 'fixture-only' }), auth);
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{
      url: '/auth/login', body: { emailOrUsername: 'test@example.test', password: 'fixture-only' },
    }]);
  }
  console.log('Passed login API contract checks for both services.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
