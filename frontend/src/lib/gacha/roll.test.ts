import { test, expect, beforeEach } from 'bun:test';
import './test-setup';
import { getMilestoneQty } from './roll';
import { localPity, rollCounter, guaranteedStatus, owneditem, fatepointManager } from './storage';

beforeEach(() => {
  localStorage.clear();
});

test('getMilestoneQty: weapon bonuses', () => {
  expect(getMilestoneQty(3, 'weapon', false, true)).toBe(15);
  expect(getMilestoneQty(4, 'weapon', false, true)).toBe(2);
  expect(getMilestoneQty(5, 'weapon', false, true)).toBe(10);
  expect(getMilestoneQty(3, 'weapon', true, true)).toBe(15);
  expect(getMilestoneQty(4, 'weapon', true, true)).toBe(2);
  expect(getMilestoneQty(5, 'weapon', true, true)).toBe(10);
});

test('getMilestoneQty: character bonuses', () => {
  expect(getMilestoneQty(3, 'character', false, true)).toBe(0);
  expect(getMilestoneQty(4, 'character', false, true)).toBe(0);
  expect(getMilestoneQty(5, 'character', false, true)).toBe(0);
  expect(getMilestoneQty(4, 'character', false, false)).toBe(2);
  expect(getMilestoneQty(4, 'character', true, false)).toBe(5);
  expect(getMilestoneQty(5, 'character', false, false)).toBe(10);
  expect(getMilestoneQty(5, 'character', true, false)).toBe(25);
});

test('localPity: get/set per banner', () => {
  localPity.set('pity5-character-event', 75);
  expect(localPity.get('pity5-character-event')).toBe(75);
  expect(localPity.get('pity5-weapon-event')).toBe(0);
});

test('rollCounter: increments per banner', () => {
  rollCounter.put('character-event');
  rollCounter.put('character-event');
  expect(rollCounter.get('character-event')).toBe(2);
  expect(rollCounter.get('weapon-event')).toBe(0);
});

test('guaranteedStatus: tracks 50/50 state', () => {
  guaranteedStatus.set('character-event-5star', true);
  expect(guaranteedStatus.get('character-event-5star')).toBe(true);
  expect(guaranteedStatus.get('weapon-event-5star')).toBe(false);
});

test('owneditem: tracks manual vs wish sources', () => {
  owneditem.put({ itemID: 1001, source: 'wish', qty: 1 });
  owneditem.put({ itemID: 1001, source: 'wish', qty: 1 });
  owneditem.put({ itemID: 1001, source: 'manual', qty: 1 });
  const item = owneditem.get(1001);
  expect(item.qty).toBe(3);
  expect(item.itemID).toBe(1001);
});

test('fatepointManager: init/getInfo/set/remove', () => {
  fatepointManager.init({ version: '6.6', phase: 1, banner: 'weapon-event' });
  fatepointManager.set(1, 0);
  const info = fatepointManager.getInfo();
  expect(info.point).toBe(1);
  expect(info.selected).toBe(0);
  fatepointManager.remove();
  expect(fatepointManager.getInfo().selected).toBeNull();
});