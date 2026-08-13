CREATE TABLE todo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    done_at TIMESTAMPTZ,
    user_id UUID NOT NULL,
    priority INT NOT NULL CHECK (priority IN (1, 2, 3)),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
