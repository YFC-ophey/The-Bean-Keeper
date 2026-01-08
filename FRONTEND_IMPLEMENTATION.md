# Frontend Implementation Guide

## 🎯 Goal
Implement automatic Notion sync when users save coffee entries - no manual export needed!

---

## 📋 Implementation Checklist

### ✅ Step 1: Add Notion Auth State Management

Create a context/hook to manage Notion authentication state:

```typescript
// client/src/hooks/useNotionAuth.tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotionAuth {
  accessToken: string | null;
  databaseId: string | null;
  workspaceName: string | null;
  isConnected: boolean;
}

interface NotionAuthStore extends NotionAuth {
  setAuth: (auth: Partial<NotionAuth>) => void;
  clearAuth: () => void;
}

export const useNotionAuth = create<NotionAuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      databaseId: null,
      workspaceName: null,
      isConnected: false,
      setAuth: (auth) => set((state) => ({ ...state, ...auth, isConnected: true })),
      clearAuth: () => set({
        accessToken: null,
        databaseId: null,
        workspaceName: null,
        isConnected: false,
      }),
    }),
    {
      name: 'notion-auth-storage',
    }
  )
);
```

---

### ✅ Step 2: Handle OAuth Callback

Add callback handling to your main App component:

```typescript
// client/src/App.tsx
import { useEffect } from 'react';
import { useNotionAuth } from './hooks/useNotionAuth';

function App() {
  const { setAuth } = useNotionAuth();

  useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const credentials = urlParams.get('credentials');

    if (credentials) {
      try {
        // Decode base64 credentials from OAuth callback
        const decoded = JSON.parse(atob(credentials));

        // Store in state
        setAuth({
          accessToken: decoded.accessToken,
          databaseId: decoded.databaseId,
          workspaceName: decoded.workspaceName,
        });

        // Show success toast
        console.log('✅ Connected to Notion successfully!');

        // Clean up URL
        window.history.replaceState({}, '', '/');
      } catch (error) {
        console.error('Failed to parse Notion credentials:', error);
      }
    }
  }, [setAuth]);

  return (
    // Your app JSX
  );
}
```

---

### ✅ Step 3: Add "Connect with Notion" Button

```typescript
// client/src/components/NotionConnectButton.tsx
import { useNotionAuth } from '../hooks/useNotionAuth';
import { Button } from './ui/button';

export function NotionConnectButton() {
  const { isConnected, workspaceName, clearAuth } = useNotionAuth();

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/auth/notion';
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect from Notion? Your local data will remain safe.')) {
      clearAuth();
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600">✓</span>
          <span>Connected to {workspaceName || 'Notion'}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} className="gap-2">
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Notion icon */}
        <path d="M4 4v16h16V4H4z" fill="currentColor" />
      </svg>
      Connect with Notion
    </Button>
  );
}
```

---

### ✅ Step 4: Update API Client to Include Notion Headers

```typescript
// client/src/lib/api.ts
import { useNotionAuth } from '../hooks/useNotionAuth';

export async function createCoffeeEntry(data: any) {
  const { accessToken, databaseId } = useNotionAuth.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Notion credentials if connected
  if (accessToken && databaseId) {
    headers['X-Notion-Access-Token'] = accessToken;
    headers['X-Notion-Database-Id'] = databaseId;
  }

  const response = await fetch('/api/coffee-entries', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create coffee entry');
  }

  return response.json();
}

export async function updateCoffeeEntry(id: string, data: any) {
  const { accessToken, databaseId } = useNotionAuth.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Notion credentials if connected
  if (accessToken && databaseId) {
    headers['X-Notion-Access-Token'] = accessToken;
    headers['X-Notion-Database-Id'] = databaseId;
  }

  const response = await fetch(`/api/coffee-entries/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update coffee entry');
  }

  return response.json();
}
```

---

### ✅ Step 5: Update AddCoffeeForm

Modify your form submission to use the new API client:

```typescript
// client/src/components/AddCoffeeForm.tsx
import { createCoffeeEntry } from '../lib/api';
import { useNotionAuth } from '../hooks/useNotionAuth';

export function AddCoffeeForm() {
  const { isConnected } = useNotionAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (data: CoffeeEntryData) => {
    setIsSaving(true);

    try {
      // This will automatically sync to Notion if connected
      await createCoffeeEntry(data);

      // Show success message
      if (isConnected) {
        toast.success('Coffee saved and synced to Notion! ✨');
      } else {
        toast.success('Coffee saved! Connect Notion to sync automatically.');
      }

      // Close form or navigate
      onSuccess();
    } catch (error) {
      toast.error('Failed to save coffee entry');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}

      <Button type="submit" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving{isConnected && ' & syncing'}...
          </>
        ) : (
          'Save Entry'
        )}
      </Button>

      {isConnected && (
        <p className="text-sm text-muted-foreground mt-2">
          Will automatically sync to Notion ✨
        </p>
      )}
    </form>
  );
}
```

---

### ✅ Step 6: Add Sync Status Indicator

```typescript
// client/src/components/SyncStatus.tsx
import { useNotionAuth } from '../hooks/useNotionAuth';

export function SyncStatus() {
  const { isConnected, workspaceName } = useNotionAuth();

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span>Not syncing</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600">
      <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
      <span>Syncing to {workspaceName || 'Notion'}</span>
    </div>
  );
}
```

---

### ✅ Step 7: Add to Dashboard/Settings

```typescript
// client/src/pages/Dashboard.tsx
import { NotionConnectButton } from '../components/NotionConnectButton';
import { SyncStatus } from '../components/SyncStatus';

export function Dashboard() {
  return (
    <div>
      <header className="flex justify-between items-center p-4">
        <h1>The Bean Keeper</h1>

        <div className="flex items-center gap-4">
          <SyncStatus />
          <NotionConnectButton />
        </div>
      </header>

      {/* Rest of your dashboard */}
    </div>
  );
}
```

---

## 🎨 UI/UX Enhancements

### Loading States

```typescript
// Show sync status while saving
<Button disabled={isSaving}>
  {isSaving ? (
    <>
      <Loader2 className="animate-spin mr-2" />
      {isNotionConnected ? 'Saving & syncing...' : 'Saving...'}
    </>
  ) : (
    'Save Entry'
  )}
</Button>
```

### Success Feedback

```typescript
// Different messages based on sync status
if (isNotionConnected) {
  toast.success(
    <div>
      <p className="font-semibold">Saved & synced! ✨</p>
      <p className="text-sm">Entry added to Notion</p>
    </div>
  );
} else {
  toast.success('Saved! Connect Notion for automatic sync.');
}
```

### Error Handling

```typescript
try {
  await createCoffeeEntry(data);
} catch (error) {
  // Show helpful error messages
  if (error.message.includes('Notion')) {
    toast.error(
      <div>
        <p>Saved locally, but Notion sync failed</p>
        <button onClick={() => retrySync()}>Retry sync</button>
      </div>
    );
  } else {
    toast.error('Failed to save coffee entry');
  }
}
```

---

## 🔄 Offline Support (Optional)

```typescript
// Detect online/offline
useEffect(() => {
  const handleOnline = () => {
    // Trigger background sync of pending entries
    syncPendingEntries();
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, []);
```

---

## 📱 Mobile Considerations

### Camera Access

```typescript
// Use native camera on mobile
<input
  type="file"
  accept="image/*"
  capture="environment"  // Use back camera
  onChange={handlePhotoCapture}
/>
```

### Responsive Sync Indicators

```typescript
// Show compact sync status on mobile
<div className="hidden md:flex">
  <SyncStatus />
</div>

<div className="md:hidden">
  {isConnected ? '✓' : '○'}
</div>
```

---

## 🧪 Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Credentials saved in localStorage
- [ ] "Connect with Notion" button shows correct state
- [ ] Save entry triggers automatic sync
- [ ] Success message shows sync status
- [ ] Offline mode saves locally
- [ ] Online mode syncs automatically
- [ ] Disconnect clears credentials
- [ ] Headers sent correctly with API requests
- [ ] Error handling works for sync failures

---

## 🚀 Complete Example: AddCoffeeForm

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createCoffeeEntry } from '../lib/api';
import { useNotionAuth } from '../hooks/useNotionAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

export function AddCoffeeForm({ onSuccess }: { onSuccess: () => void }) {
  const { isConnected, workspaceName } = useNotionAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setIsSaving(true);

    try {
      // This automatically syncs to Notion if connected!
      const entry = await createCoffeeEntry(data);

      // Show success with sync status
      toast.success(
        isConnected
          ? `✨ Saved & synced to ${workspaceName}!`
          : '✓ Saved! Connect Notion for automatic sync.'
      );

      onSuccess();
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save coffee entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register('roasterName')} placeholder="Roaster Name" />
      <Input {...register('origin')} placeholder="Origin" />
      {/* More fields... */}

      <div className="flex items-center justify-between">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isConnected ? 'Saving & syncing...' : 'Saving...'}
            </>
          ) : (
            'Save Entry'
          )}
        </Button>

        {isConnected && (
          <span className="text-sm text-green-600">
            ✓ Will sync to Notion
          </span>
        )}
      </div>
    </form>
  );
}
```

---

## 📦 Required Packages

```bash
npm install zustand                    # State management
npm install sonner                     # Toast notifications
npm install @tanstack/react-query      # Already installed
```

---

## 🎯 Key Takeaways

1. **No manual sync buttons** - Everything happens automatically
2. **Store credentials in zustand** - Persisted to localStorage
3. **Add headers to API calls** - X-Notion-Access-Token, X-Notion-Database-Id
4. **Backend handles sync** - Frontend just makes normal API calls
5. **Show sync status** - Users know when connected
6. **Graceful failures** - Entry saved locally even if Notion fails

---

**With this implementation, users never think about syncing - it just works! ✨**
