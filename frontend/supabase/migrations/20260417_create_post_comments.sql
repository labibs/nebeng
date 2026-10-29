-- Migration: Create post_comments table (FIXED v2)
-- Description: Table to store comments referencing clerk_id

-- 1. Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure users.clerk_id is unique before referencing it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_clerk_id_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_clerk_id_key UNIQUE (clerk_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Add Foreign Key to clerk_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'post_comments_user_id_fkey'
    ) THEN
        ALTER TABLE public.post_comments
        ADD CONSTRAINT post_comments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(clerk_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);

-- 5. Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- 6. Policies
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;

CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON public.post_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (true);
