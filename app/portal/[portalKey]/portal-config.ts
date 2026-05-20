import {
  Heart,
  Monitor,
  Wrench,
  Briefcase,
  Scissors,
  Users,
  BookOpen,
  Award,
  FileText,
  Clock,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';
import type { PortalKey } from '@/lib/portal/router';

export interface PortalConfig {
  label: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  metaTitle: string;
  metaDescription: string;
  quickLinks: { name: string; href: string; icon: React.ElementType; description: string }[];
  availablePrograms: { title: string; slug: string; credential: string }[];
}

const SHARED_LINKS = [
  { name: 'My Courses', href: '/lms/courses', icon: BookOpen, description: 'Continue your coursework' },
  { name: 'Certificates', href: '/lms/certificates', icon: Award, description: 'View earned credentials' },
  { name: 'Schedule', href: '/lms/calendar', icon: Clock, description: 'Upcoming classes & labs' },
  { name: 'Documents', href: '/learner/dashboard', icon: FileText, description: 'Upload required documents' },
  { name: 'Grades', href: '/lms/grades', icon: TrendingUp, description: 'View quiz & exam scores' },
];

export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  healthcare: {
    label: 'Healthcare',
    icon: Heart,
    accentColor: 'text-rose-600',
    accentBg: 'bg-rose-600',
    metaTitle: 'Healthcare Portal — Elevate for Humanity',
    metaDescription: 'Your healthcare training portal. Track CNA, Medical Assistant, Phlebotomy, and other healthcare program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'Exam preparation resources' },
    ],
    availablePrograms: [
      { title: 'Certified Nursing Assistant (CNA)', slug: 'cna', credential: 'Indiana ISDH CNA' },
      { title: 'Medical Assistant', slug: 'medical-assistant', credential: 'NHA CCMA' },
      { title: 'Phlebotomy Technician', slug: 'phlebotomy', credential: 'NHA CPT' },
      { title: 'Pharmacy Technician', slug: 'pharmacy-technician', credential: 'PTCB CPhT' },
    ],
  },
  technology: {
    label: 'Technology',
    icon: Monitor,
    accentColor: 'text-indigo-600',
    accentBg: 'bg-indigo-600',
    metaTitle: 'Technology Portal — Elevate for Humanity',
    metaDescription: 'Your technology training portal. Track IT, Cybersecurity, Web Development, and other tech program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'CompTIA / vendor exam prep' },
    ],
    availablePrograms: [
      { title: 'IT Help Desk', slug: 'it-help-desk', credential: 'CompTIA A+' },
      { title: 'Cybersecurity Analyst', slug: 'cybersecurity', credential: 'CompTIA Security+' },
      { title: 'Network Administration', slug: 'network-admin', credential: 'CompTIA Network+' },
      { title: 'Web Development', slug: 'web-development', credential: 'Portfolio + Certificate' },
    ],
  },
  trades: {
    label: 'Skilled Trades',
    icon: Wrench,
    accentColor: 'text-amber-600',
    accentBg: 'bg-amber-600',
    metaTitle: 'Skilled Trades Portal — Elevate for Humanity',
    metaDescription: 'Your skilled trades training portal. Track HVAC, CDL, Welding, Electrical, and other trades program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'EPA 608, OSHA, and industry exam prep' },
    ],
    availablePrograms: [
      { title: 'HVAC Technician', slug: 'hvac-technician', credential: 'EPA Section 608' },
      { title: 'CDL Training', slug: 'cdl-training', credential: 'Commercial Driver License' },
      { title: 'Welding', slug: 'welding', credential: 'AWS Certification' },
      { title: 'Construction Trades', slug: 'construction-trades', credential: 'NCCER / OSHA' },
    ],
  },
  business: {
    label: 'Business & Office',
    icon: Briefcase,
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-600',
    metaTitle: 'Business Portal — Elevate for Humanity',
    metaDescription: 'Your business & office training portal. Track Office Administration, Bookkeeping, and other business program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'MOS, QuickBooks, and industry exams' },
    ],
    availablePrograms: [
      { title: 'Office Administration', slug: 'office-administration', credential: 'MOS Certification' },
      { title: 'Bookkeeping', slug: 'bookkeeping', credential: 'QuickBooks / NACPB' },
      { title: 'Tax Preparation', slug: 'tax-preparation', credential: 'IRS AFSP / PTIN' },
      { title: 'Project Management', slug: 'project-management', credential: 'CAPM Pathway' },
    ],
  },
  beauty: {
    label: 'Beauty & Barber',
    icon: Scissors,
    accentColor: 'text-pink-600',
    accentBg: 'bg-pink-600',
    metaTitle: 'Beauty & Barber Portal — Elevate for Humanity',
    metaDescription: 'Your beauty & barber training portal. Track cosmetology, barber, and esthetics program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'State Board Prep', href: '/apprentice/state-board', icon: GraduationCap, description: 'Indiana state board exam prep' },
    ],
    availablePrograms: [
      { title: 'Barber Apprenticeship', slug: 'barber-apprenticeship', credential: 'Indiana Barber License' },
      { title: 'Cosmetology Apprenticeship', slug: 'cosmetology-apprenticeship', credential: 'Indiana Cosmetology License' },
      { title: 'Esthetics Apprenticeship', slug: 'esthetician-apprenticeship', credential: 'Indiana Esthetician License' },
      { title: 'Nail Technology', slug: 'nail-technology', credential: 'Indiana Nail Tech License' },
    ],
  },
  'social-services': {
    label: 'Social Services',
    icon: Users,
    accentColor: 'text-teal-600',
    accentBg: 'bg-teal-600',
    metaTitle: 'Social Services Portal — Elevate for Humanity',
    metaDescription: 'Your social services training portal. Track Peer Recovery, DSP, and human services program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'CPRC and credential exam prep' },
    ],
    availablePrograms: [
      { title: 'Peer Recovery Specialist', slug: 'peer-recovery-specialist', credential: 'CPRC Pathway' },
      { title: 'Direct Support Professional', slug: 'direct-support-professional', credential: 'DSP Credential' },
      { title: 'Home Health Aide', slug: 'home-health-aide', credential: 'Indiana HHA' },
    ],
  },
};

export const VALID_PORTAL_KEYS = Object.keys(PORTAL_CONFIGS);
