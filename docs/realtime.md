# Implementing Real-time Features with Supabase + Remix

This guide provides a pattern for implementing real-time functionality in a Remix application using Supabase's real-time features.

## Goals
- Enable real-time updates for specific database tables
- Maintain secure access control through RLS policies
- Handle real-time events efficiently in the client
- Manage subscriptions properly to prevent memory leaks

## Step-by-Step Implementation

### 1. Enable Real-time in Database
First, enable real-time for your table in a migration:

```sql
-- Enable real-time for your table
CREATE PUBLICATION supabase_realtime FOR TABLE your_table_name;
ALTER TABLE your_table_name REPLICA IDENTITY FULL;

-- Add RLS policy for real-time security
CREATE POLICY "Define who can receive real-time updates"
  ON your_table_name
  FOR SELECT
  USING (
    -- Example: User must have access to the related workspace
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = your_table_name.workspace_id
      AND w.id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

### 2. Set Up Client Context
Create a layout component that provides the Supabase client:

```typescript
export default function AppLayout() {
  const { env } = useLoaderData<typeof loader>();
  const [supabase] = useState(() => 
    createBrowserClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY
    )
  );

  return (
    <div>
      <Outlet context={{ supabase }} />
    </div>
  );
}
```

### 3. Create a Real-time Hook
Create a reusable hook for real-time subscriptions:

```typescript
interface RealtimeSubscriptionOptions<T> {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE';
  initialData: T[];
}

function useRealtimeSubscription<T>({
  table,
  filter,
  event = 'INSERT',
  initialData
}: RealtimeSubscriptionOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const { supabase } = useOutletContext<{ supabase: SupabaseClient }>();

  useEffect(() => {
    if (!table || !supabase) return;

    const channel = supabase
      .channel(`changes:${table}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter })
        },
        (payload) => {
          setData((current) => {
            // Handle different event types
            switch (event) {
              case 'INSERT':
                return [...current, payload.new as T];
              case 'UPDATE':
                return current.map(item => 
                  (item as any).id === payload.new.id ? payload.new : item
                );
              case 'DELETE':
                return current.filter(item => 
                  (item as any).id !== payload.old.id
                );
              default:
                return current;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.channel(`changes:${table}`).unsubscribe();
    };
  }, [table, filter, event, supabase]);

  return data;
}
```

### 4. Implement in a Route
Use the hook in your route component:

```typescript
export default function RealtimeComponent() {
  const { initialData } = useLoaderData<typeof loader>();
  
  const liveData = useRealtimeSubscription({
    table: 'your_table_name',
    filter: 'workspace_id=eq.123', // Optional
    initialData
  });

  return (
    <div>
      {liveData.map(item => (
        <div key={item.id}>{/* Render your item */}</div>
      ))}
    </div>
  );
}
```

## Authentication Best Practices

1. **User Authentication**
   - Always use `supabase.auth.getUser()` instead of `getSession()` for secure user verification
   - `getSession()` reads from storage (cookies) which could be manipulated
   - `getUser()` validates the session with the Supabase Auth server

2. **Session Handling**
   ```typescript
   // In your loader/action
   const { data: { user }, error } = await supabase.auth.getUser();
   if (!user || error) {
     return redirect("/login");
   }
   ```

3. **Real-time Security**
   - Always implement RLS policies for real-time tables
   - Use `auth.uid()` in policies to restrict access
   - Combine with application-level checks (e.g., workspace membership)

## Common Patterns

1. **Optimistic Updates**
```typescript
// After inserting data
const { data, error } = await supabase.from('table').insert(newItem);
// Real-time will handle the update, but you can also update locally
setData(current => [...current, newItem]);
```

2. **Error Handling**
```typescript
// In your subscription
.on('postgres_changes',
  { /* ... */ },
  (payload) => {
    try {
      // Handle the update
    } catch (error) {
      console.error('Error processing real-time update:', error);
      // Optionally refresh data from server
    }
  }
)
```

3. **Cleanup**
```typescript
// Always clean up subscriptions
useEffect(() => {
  const channel = supabase.channel(/* ... */);
  return () => {
    channel.unsubscribe();
  };
}, []);
```

## Troubleshooting

1. **No Updates Received**
   - Verify RLS policies allow access
   - Check if real-time is enabled for the table
   - Confirm subscription filter matches data

2. **Performance Issues**
   - Use specific filters to limit subscription scope
   - Implement pagination for initial data load
   - Consider debouncing frequent updates

3. **Security Concerns**
   - Review RLS policies regularly
   - Test policies with different user roles
   - Monitor real-time usage in Supabase dashboard 