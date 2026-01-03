-- Migration: Add neurodivergent-focused features
-- Adds check_ins and environment_suggestions tables
-- Extends data_type_enum for new sync data types

-- Add new values to data_type_enum for localStorage sync
-- Note: We use a safe approach that checks if values exist first
DO $$
BEGIN
    -- Check if 'anchorPoints' exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'data_type_enum'::regtype
        AND enumlabel = 'anchorPoints'
    ) THEN
        ALTER TYPE data_type_enum ADD VALUE IF NOT EXISTS 'anchorPoints';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'data_type_enum'::regtype
        AND enumlabel = 'routineVariants'
    ) THEN
        ALTER TYPE data_type_enum ADD VALUE IF NOT EXISTS 'routineVariants';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'data_type_enum'::regtype
        AND enumlabel = 'ndOnboarding'
    ) THEN
        ALTER TYPE data_type_enum ADD VALUE IF NOT EXISTS 'ndOnboarding';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'data_type_enum'::regtype
        AND enumlabel = 'patternInsights'
    ) THEN
        ALTER TYPE data_type_enum ADD VALUE IF NOT EXISTS 'patternInsights';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'data_type_enum'::regtype
        AND enumlabel = 'aiPersonality'
    ) THEN
        ALTER TYPE data_type_enum ADD VALUE IF NOT EXISTS 'aiPersonality';
    END IF;
END$$;

-- Create check_ins table for pattern analysis
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'ad-hoc')),
    scheduled_for TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_insights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create environment_suggestions table
CREATE TABLE IF NOT EXISTS public.environment_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('physical', 'digital', 'social')),
    suggestion TEXT NOT NULL,
    linked_routine_id UUID,
    linked_transition TEXT,
    status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'trying', 'kept', 'rejected')),
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add ai_personality column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'ai_personality'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN ai_personality TEXT DEFAULT 'warm'
        CHECK (ai_personality IN ('warm', 'direct', 'playful'));
    END IF;
END$$;

-- Add nd_onboarding_completed column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'nd_onboarding_completed'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN nd_onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END$$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_type ON public.check_ins(type);
CREATE INDEX IF NOT EXISTS idx_check_ins_completed_at ON public.check_ins(completed_at);
CREATE INDEX IF NOT EXISTS idx_environment_suggestions_user_id ON public.environment_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_environment_suggestions_status ON public.environment_suggestions(status);

-- Enable RLS on new tables
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for check_ins
CREATE POLICY "Users can view own check-ins"
    ON public.check_ins
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
    ON public.check_ins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
    ON public.check_ins
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins"
    ON public.check_ins
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS policies for environment_suggestions
CREATE POLICY "Users can view own environment suggestions"
    ON public.environment_suggestions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own environment suggestions"
    ON public.environment_suggestions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own environment suggestions"
    ON public.environment_suggestions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own environment suggestions"
    ON public.environment_suggestions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_check_ins_updated_at ON public.check_ins;
CREATE TRIGGER update_check_ins_updated_at
    BEFORE UPDATE ON public.check_ins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_environment_suggestions_updated_at ON public.environment_suggestions;
CREATE TRIGGER update_environment_suggestions_updated_at
    BEFORE UPDATE ON public.environment_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
