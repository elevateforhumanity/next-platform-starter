import { Composition } from 'remotion';
import { ElevateLesson, type ElevateLessonProps } from './compositions/ElevateLesson';

// Default props for Remotion Studio preview
const defaultProps: ElevateLessonProps = {
  title: 'What Is Peer Recovery Support?',
  moduleTitle: 'Foundations of Peer Recovery',
  objective: 'Define peer recovery support and explain the role of a Peer Recovery Specialist.',
  keyPoints: [
    'Peer support is rooted in shared lived experience and mutual respect.',
    'A PRS uses their own recovery journey to support others.',
    'Recovery looks different for everyone — your role is to support their chosen path.',
    'The four dimensions of recovery: Health, Home, Purpose, Community.',
    'Confidentiality is the cornerstone of trust in peer support.',
  ],
  example: 'Marcus had been in recovery for two years when he met James, who had just been discharged from treatment. Instead of giving advice, Marcus simply said: "I\'ve been where you are. What do you need right now?" That question changed everything.',
  summary: 'Peer recovery support is a powerful, evidence-based practice built on lived experience, mutual respect, and the belief that recovery is possible for everyone.',
  quizTeaser: 'Ready to test your knowledge? Complete the checkpoint quiz to continue.',
  audioSrc: 'https://example.com/audio.mp3', // replaced at render time
  backgroundImageSrc: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
  instructorName: 'Marcus Johnson',
  instructorTitle: 'Workforce Development Specialist',
  instructorImageSrc: '/images/instructors/marcus-johnson.jpg',
  topBarColor: '#f97316',
  accentColor: '#3b82f6',
  backgroundColor: '#0f172a',
  segmentFrames: [150, 180, 180, 150, 150], // 5s, 6s, 6s, 5s, 5s at 30fps
};

export function RemotionRoot() {
  const totalFrames = defaultProps.segmentFrames.reduce((a, b) => a + b, 0);

  return (
    <Composition
      id="ElevateLesson"
      component={ElevateLesson}
      durationInFrames={totalFrames}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
    />
  );
}
