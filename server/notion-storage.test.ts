import assert from 'node:assert/strict';
import test from 'node:test';
import type { CoffeeEntry } from '@shared/schema';
import { NotionStorage } from './notion-storage';

const existingEntry: CoffeeEntry = {
  id: 'coffee-page',
  frontPhotoUrl: 'https://example.com/front.jpg',
  backPhotoUrl: null,
  roasterName: 'Test Roaster',
  roasterLocation: null,
  roasterAddress: null,
  roasterWebsite: null,
  placeUrl: null,
  farm: null,
  origin: null,
  variety: null,
  processMethod: null,
  roastLevel: 'Medium',
  roastDate: null,
  flavorNotes: null,
  rating: null,
  tastingNotes: null,
  weight: null,
  price: null,
  purchaseAgain: false,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

test('editing roast level writes the new select to Notion', async () => {
  const storage = new NotionStorage('database-id');
  let writtenProperties: Record<string, any> | undefined;
  (storage as any).getCoffeeEntry = async () => existingEntry;
  (storage as any).getClient = () => ({
    pages: {
      update: async ({ properties }: { properties: Record<string, any> }) => {
        writtenProperties = properties;
      },
    },
  });

  const updated = await storage.updateCoffeeEntry(existingEntry.id, { roastLevel: 'Light' });
  assert.equal(updated?.roastLevel, 'Light');
  assert.deepEqual(writtenProperties?.['Roast Level'], { select: { name: 'Light' } });
});

test('clearing roast level removes the select in Notion', async () => {
  const storage = new NotionStorage('database-id');
  let writtenProperties: Record<string, any> | undefined;
  (storage as any).getCoffeeEntry = async () => existingEntry;
  (storage as any).getClient = () => ({
    pages: {
      update: async ({ properties }: { properties: Record<string, any> }) => {
        writtenProperties = properties;
      },
    },
  });

  const updated = await storage.updateCoffeeEntry(existingEntry.id, { roastLevel: null });
  assert.equal(updated?.roastLevel, null);
  assert.deepEqual(writtenProperties?.['Roast Level'], { select: null });
});
