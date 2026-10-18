import assert from 'node:assert/strict';
import test from 'node:test';
import type { CoffeeEntry } from '@shared/schema';
import { createNotionCoffeePage, updateNotionCoffeePage } from './notion';
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

test('updating a legacy database retries without the absent Roast Level property', async () => {
  const writes: Record<string, any>[] = [];
  const client = {
    pages: {
      update: async ({ properties }: { properties: Record<string, any> }) => {
        writes.push({ ...properties });
        if ('Roast Level' in properties) {
          throw { code: 'validation_error', message: 'Roast Level is not a property that exists.' };
        }
      },
    },
  };

  const result = await updateNotionCoffeePage(existingEntry.id, { roasterName: 'Updated', roastLevel: null }, client as any);
  assert.equal(result.roastLevelOmitted, true);
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[0]['Roast Level'], { select: null });
  assert.equal('Roast Level' in writes[1], false);
  assert.equal(writes[1].Roaster.rich_text[0].text.content, 'Updated');
});

test('creating in a legacy database retries without the absent Roast Level property', async () => {
  const writes: Record<string, any>[] = [];
  const client = {
    pages: {
      create: async ({ properties }: { properties: Record<string, any> }) => {
        writes.push({ ...properties });
        if ('Roast Level' in properties) {
          throw { code: 'validation_error', message: 'Roast Level is not a property that exists.' };
        }
        return { id: 'new-page' };
      },
    },
  };

  const result = await createNotionCoffeePage('database-id', existingEntry, client as any);
  assert.deepEqual(result, { pageId: 'new-page', roastLevelOmitted: true });
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[0]['Roast Level'], { select: { name: 'Medium' } });
  assert.equal('Roast Level' in writes[1], false);
  assert.equal(writes[1].Roaster.rich_text[0].text.content, 'Test Roaster');
});

test('unrelated Notion schema errors are not retried', async () => {
  let attempts = 0;
  const error = { code: 'validation_error', message: 'Origin is not a property that exists.' };
  const client = {
    pages: {
      create: async () => {
        attempts++;
        throw error;
      },
    },
  };

  await assert.rejects(createNotionCoffeePage('database-id', existingEntry, client as any), (actual) => actual === error);
  assert.equal(attempts, 1);
});

test('storage returns the persisted roast level after legacy create fallback', async () => {
  const storage = new NotionStorage('database-id');
  (storage as any).getClient = () => ({
    pages: {
      create: async ({ properties }: { properties: Record<string, any> }) => {
        if ('Roast Level' in properties) {
          throw { code: 'validation_error', message: 'Roast Level is not a property that exists.' };
        }
        return { id: 'new-page' };
      },
    },
  });

  const created = await storage.createCoffeeEntry({
    roasterName: 'Test Roaster',
    frontPhotoUrl: 'https://example.com/front.jpg',
    roastLevel: 'Medium',
  });
  assert.equal(created.id, 'new-page');
  assert.equal(created.roastLevel, null);
});

test('storage returns the persisted roast level after legacy update fallback', async () => {
  const storage = new NotionStorage('database-id');
  (storage as any).getCoffeeEntry = async () => existingEntry;
  (storage as any).getClient = () => ({
    pages: {
      update: async ({ properties }: { properties: Record<string, any> }) => {
        if ('Roast Level' in properties) {
          throw { code: 'validation_error', message: 'Roast Level is not a property that exists.' };
        }
      },
    },
  });

  const updated = await storage.updateCoffeeEntry(existingEntry.id, { roasterName: 'Updated' });
  assert.equal(updated?.roasterName, 'Updated');
  assert.equal(updated?.roastLevel, null);
});
