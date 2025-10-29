/**
 * ==============================================================================
 * Supabase Server-Side Authentication Utilities
 * ==============================================================================
 * This file provides server-side Supabase client creation with cookie handling
 * for authentication in Next.js App Router.
 * ==============================================================================
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/**
 * Creates a Supabase client for Server Components
 * Reads cookies but doesn't modify them
 * Note: In Next.js 15+, use createClientAsync() for full compatibility
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // @ts-expect-error - Next.js 15+ compatibility
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Creates a Supabase client for Server Actions and Route Handlers
 * Can both read and write cookies
 */
export async function createActionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Handle the error in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Handle the error in middleware
          }
        },
      },
    }
  );
}

/**
 * Get the current authenticated user
 */
export async function getUser() {
  const supabase = createClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = createClient();

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
}
