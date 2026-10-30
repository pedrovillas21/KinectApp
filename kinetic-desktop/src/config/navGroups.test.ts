// Rodar: node --experimental-strip-types --test src/config/navGroups.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGroupOpen } from './navGroups.ts';

test('abre na rota do grupo e nas filhas', () => {
  assert.equal(isGroupOpen('/root/auditoria', '/root/auditoria'), true);
  assert.equal(isGroupOpen('/root/auditoria', '/root/auditoria/lgpd'), true);
  assert.equal(isGroupOpen('/root/auditoria/', '/root/auditoria/acoes'), true);
});

test('fica fechado fora do grupo, inclusive em rota com o mesmo prefixo', () => {
  assert.equal(isGroupOpen('/root/auditoria', '/root'), false);
  assert.equal(isGroupOpen('/root/auditoria', '/root/usuarios'), false);
  assert.equal(isGroupOpen('/root/auditoria', '/root/auditoria-antiga'), false);
});
