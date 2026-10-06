import test from 'node:test';
import assert from 'node:assert/strict';
import { toBaseUnits, decimal, draftFields, blankDraft, amount, campaignRows } from './model.ts';

test('six-decimal credits convert exactly without rounding or accepting scientific notation', () => {
  for (const [value, base] of [['0.000001', '1'], ['0.004', '4000'], ['1.123456', '1123456'], ['0002.50', '2500000'], ['9007199254740993.000001', '9007199254740993000001']]) {
    assert.equal(toBaseUnits(value), base);
    assert.equal(toBaseUnits(decimal(base)), base);
  }
  for (const value of ['1.0000001', '1e3', '-1', 'Infinity', '', '1,000', 'NaN']) assert.equal(toBaseUnits(value), null);
});

test('resumed drafts submit only draft fields and cannot smuggle server-owned state', () => {
  const submitted = draftFields({ ...blankDraft(), id: 'campaign-example', status: 'draft', approved: true, spendBaseUnits: '4000', createdAt: '2026-10-07' });
  assert.equal(submitted.id, 'campaign-example');
  for (const key of ['status', 'approved', 'spendBaseUnits', 'createdAt']) assert.equal(key in submitted, false);
});

test('available cap excludes reservations; authorization and settlement do not add spend', () => {
  const campaign = { ...blankDraft(), id: 'c', status: 'active', budgetCapBaseUnits: '8000', acceptedBaseUnits: '3000', reservedBaseUnits: '2000', authorizedBaseUnits: '3000', settledBaseUnits: '3000' };
  assert.equal(amount(campaign, 'spend'), '3000');
  assert.equal(amount(campaign, 'remaining'), '3000');
  assert.equal(amount({ ...campaign, reservedBaseUnits: '9000' }, 'remaining'), '0');
});

test('campaign state includes drafts once even when backend also provides a drafts collection', () => {
  const campaign = { ...blankDraft(), id: 'c', status: 'draft' };
  assert.equal(campaignRows({ campaigns: [campaign], drafts: [campaign] }).length, 1);
});

import { DEMO_ADVERTISER, missingDemoValues, isDemoAutofillKey } from './demo.ts';

test('demo Tab only intercepts an empty named text field in an opted-in editable step', () => {
  const base = { enabled: true, key: 'Tab', shiftKey: false, step: 0, name: 'name', value: '', type: 'text' };
  assert.equal(isDemoAutofillKey(base), true);
  for (const change of [{ enabled: false }, { shiftKey: true }, { value: 'My campaign' }, { key: 'Enter' }, { type: 'button' }, { type: 'checkbox' }, { name: 'capabilitySearch' }, { step: 4 }]) assert.equal(isDemoAutofillKey({ ...base, ...change }), false);
  assert.equal(isDemoAutofillKey({ ...base, step: 2, name: 'approvedText', type: 'textarea' }), true);
  assert.equal(isDemoAutofillKey({ ...base, step: 3, name: 'maxBidBaseUnits' }), true);
});

test('whole-step suggestions fill only missing fields and never silently declare capabilities or approve launch', () => {
  const offer = missingDemoValues(0, { name: 'My own name', brandName: '', websiteURL: 'https://my.example/', productDescription: '' });
  assert.deepEqual(Object.keys(offer).sort(), ['brandName', 'productDescription']);
  assert.equal(offer.brandName, 'HarborKey');
  const context = missingDemoValues(1, { contextHints: '' });
  assert.deepEqual(Object.keys(context), ['contextHints']);
  assert.equal('declaredCapabilities' in context, false);
  assert.deepEqual(missingDemoValues(4, {}), {});
  assert.deepEqual(missingDemoValues(3, { maxBidBaseUnits: '0.01', budgetCapBaseUnits: '', depositBaseUnits: '' }), { budgetCapBaseUnits: '0.016', depositBaseUnits: '0.02' });
  assert.equal(DEMO_ADVERTISER.approvedText.includes(DEMO_ADVERTISER.contextHints[0]), false);
});

test('backend-provided advertiser suggestions supply exact money and offer values without changing keyboard boundaries', () => {
  const suggestion = { ...DEMO_ADVERTISER, brandName: 'Backend fixture brand', maxBidBaseUnits: '1234' };
  assert.equal(missingDemoValues(0, {}, suggestion).brandName, 'Backend fixture brand');
  assert.equal(missingDemoValues(3, {}, suggestion).maxBidBaseUnits, '0.001234');
});
