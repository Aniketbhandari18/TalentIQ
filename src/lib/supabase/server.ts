import "server-only";

import { createClient } from "@supabase/supabase-js";

// Server-side client initialized with the SECRET key
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);
