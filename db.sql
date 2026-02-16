-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.diagnostic_exam_results (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  math_score integer CHECK (math_score >= 0 AND math_score <= 100),
  reading_score integer CHECK (reading_score >= 0 AND reading_score <= 100),
  science_score integer CHECK (science_score >= 0 AND science_score <= 100),
  humanities_score integer CHECK (humanities_score >= 0 AND humanities_score <= 100),
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  taken_at timestamp with time zone DEFAULT now(),
  CONSTRAINT diagnostic_exam_results_pkey PRIMARY KEY (id),
  CONSTRAINT diagnostic_exam_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  gender text CHECK (gender = ANY (ARRAY['masculino'::text, 'femenino'::text, 'no_binario'::text, 'prefiero_no_decir'::text])),
  state text NOT NULL,
  phone text,
  purchasing_power text CHECK (purchasing_power = ANY (ARRAY['bajo'::text, 'medio'::text, 'alto'::text])),
  desired_career text,
  socioeconomic_status text CHECK (socioeconomic_status = ANY (ARRAY['bajo'::text, 'medio'::text, 'alto'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.psychological_conversations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  role text CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  message text NOT NULL,
  emotional_tag text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT psychological_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT psychological_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.vocational_conversations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  role text CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vocational_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT vocational_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
