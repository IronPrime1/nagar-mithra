-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'official');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'user',
  email TEXT NOT NULL,
  display_name TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create issues table
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  images TEXT[],
  location_lat FLOAT,
  location_lng FLOAT,
  location_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upvotes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create policies for issues
CREATE POLICY "Anyone can view issues" 
ON public.issues 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create issues" 
ON public.issues 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own issues" 
ON public.issues 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Officials can delete any issue" 
ON public.issues 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'official'
  )
);

-- Create issue_upvotes table
CREATE TABLE public.issue_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(issue_id, user_id)
);

-- Enable RLS
ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;

-- Create policies for upvotes
CREATE POLICY "Anyone can view upvotes" 
ON public.issue_upvotes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can upvote" 
ON public.issue_upvotes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvotes" 
ON public.issue_upvotes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create issue_comments table
CREATE TABLE public.issue_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Anyone can view comments" 
ON public.issue_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.issue_comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own comments" 
ON public.issue_comments 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own comments" 
ON public.issue_comments 
FOR DELETE 
USING (auth.uid() = created_by);

CREATE POLICY "Officials can delete any comment" 
ON public.issue_comments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'official'
  )
);

-- Create storage bucket for issue images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue-images', 'issue-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view issue images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'issue-images');

CREATE POLICY "Authenticated users can upload issue images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own issue images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own issue images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'issue-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update upvotes count
CREATE OR REPLACE FUNCTION public.update_issue_upvotes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.issues 
    SET upvotes_count = upvotes_count + 1 
    WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.issues 
    SET upvotes_count = upvotes_count - 1 
    WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for upvotes count
CREATE TRIGGER update_upvotes_count
  AFTER INSERT OR DELETE ON public.issue_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.update_issue_upvotes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_issue_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.issues 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.issues 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.issue_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for comments count
CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON public.issue_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_issue_comments_count();