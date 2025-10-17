-- Fix recursive RLS on user_roles and allow admin policies via has_role()
-- Drop problematic recursive policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Admins can read all roles without recursion
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
