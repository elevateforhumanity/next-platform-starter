import { Metadata } from 'next';
import TppSurveyClient from './TppSurveyClient';

export const metadata: Metadata = {
  title: 'FSSA SNAP E&T TPP Survey | Elevate for Humanity',
  description: 'Indiana FSSA Third Party Provider questionnaire for SNAP Employment & Training.',
};

// PUBLIC ROUTE: FSSA TPP survey — no login required
export default function TppSurveyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#0e3a7d] text-white px-4 py-8 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-blue-300 mb-2">
          Indiana FSSA · SNAP Employment &amp; Training
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Third Party Provider Questionnaire
        </h1>
        <p className="text-blue-200 text-sm max-w-lg mx-auto">
          Complete all sections and submit. Your responses go directly to Elevate for Humanity
          for FSSA TPP application submission.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border shadow-sm p-6 sm:p-8">
          <TppSurveyClient />
        </div>
      </div>
    </div>
  );
}
