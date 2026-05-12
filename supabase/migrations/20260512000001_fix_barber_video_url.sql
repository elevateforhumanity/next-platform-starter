-- Fix: rename old orientation video path to canonical new path
-- Old generator output: /videos/barber-course-intro-with-voice.mp4 (file never existed)
-- New generator output: /videos/barber-lessons/barber-apprenticeship-intro.mp4
UPDATE public.curriculum_lessons
SET video_url = '/videos/barber-lessons/barber-apprenticeship-intro.mp4'
WHERE video_url = '/videos/barber-course-intro-with-voice.mp4';
