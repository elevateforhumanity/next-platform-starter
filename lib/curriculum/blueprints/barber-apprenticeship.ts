/* Barber Apprenticeship Blueprint CANONICAL SOURCE OF TRUTH — DO NOT DUPLICATE This file is the single authoritative definition of the Indiana Barber Apprenticeship curriculum. All module names, lesson slugs, lesson counts, domain keys, lesson content, and video references live here and nowhere else. Seeding path (canonical): pnpm tsx scripts seed-course-from-blueprint.ts \ --blueprint barber-apprenticeship-v1 --program <programId> DEPRECATED scripts (do NOT run for this course): scripts seed-barber-program-complete.ts — old SCORM Milady 4-module structure scripts seed-barber-program.ts — old Milady 10-module structure scripts generate-barber-course.ts — conflicting slug→topic assignments Slug numbering convention (intentional — do not "fix"): Each module contains 5–6 lessons + 1 checkpoint. Lessons are numbered sequentially across modules (1–6, 8–13, 15–20, …). The 7th slot of each module (7, 14, 21, 28, …) is reserved for the checkpoint, which uses a named slug (barber-module-N-checkpoint) instead of barber-lesson-N. These gaps are load-bearing — progress tracking and unlock logic depend on them. Never renumber existing slugs. Add new lessons at the next available number. Module → lesson slug map (matches the `title` fields in this file exactly): Module 1 (Infection Control & Safety): lessons 1–6, checkpoint slot 7 Module 2 (Hair Science & Scalp Analysis): lessons 8–13, checkpoint slot 14 Module 3 (Tools, Equipment & Ergonomics): lessons 15–20, checkpoint slot 21 Module 4 (Haircutting Techniques): lessons 22–27, checkpoint slot 28 Module 5 (Shaving & Beard Services): lessons 29–33, checkpoint slot 34 Module 6 (Chemical Services): lessons 35–38, checkpoint slot 39 Module 7 (Professional & Business Skills): lessons 40–44, checkpoint slot 45 Module 8 (State Board Exam Preparation): lessons 46–49, final exam Lesson counts (current): 42 content lessons + 7 checkpoints + 1 final exam = 50 concrete lesson slugs expectedLessonCount is intentionally set to 50 and must match these concrete lesson entries exactly for blueprint validation and seeding integrity. */
import type { CredentialBlueprint, BlueprintVideoConfig } from './types';

const BARBER_VIDEO_CONFIG: BlueprintVideoConfig = {
  videoGenerator: 'runway',
  template: 'elevate-slide',
  instructorName: 'Brandon Williams',
  instructorTitle: 'Master Barber · 12 yrs',
  instructorImagePath: '/images/team/instructors/instructor-barber.jpg',
  topBarColor: '#ea580c',
  accentColor: '#0f172a',
  backgroundColor: '#ffffff',
  ttsVoice: 'onyx',
  ttsSpeed: 0.88,
  slideCount: 5,
  segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
  generateDalleImage: true,
  dalleImageStyle: 'natural',
};

export const barberApprenticeshipBlueprint: CredentialBlueprint = {
  id: 'barber-apprenticeship-v1',
  version: '1.0.0',
  credentialSlug: 'indiana-barber-license',
  credentialTitle: 'Indiana Registered Barber License',
  state: 'IN',
  programSlug: 'barber-apprenticeship',
  credentialCode: 'IN-BARBER',
  trackVariants: ['apprenticeship'],
  status: 'active',

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 72,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 8,
  expectedLessonCount: 50,

  modules: [
    // ── Module 1 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-1',
      title: 'Module 1: Infection Control & Safety',
      orderIndex: 1,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'infection_control',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'sanitation_standards', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'disinfection_protocols', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'osha_compliance', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'bloodborne_pathogens', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-1',
          title: 'Introduction to Barbering',
          order: 1,
          domainKey: 'infection_control',
          objective:
            'Describe the history and legal framework of barbering in Indiana, explain the DOL apprenticeship structure, and identify the scope of practice for licensed barbers.',
          durationMinutes: 25,
          videoFile: '/videos/barber-course-intro-with-voice.mp4',
          content: `<h2>Overview</h2><p>Barbering in Indiana is regulated under the Indiana Department of Labor (DOL) and requires apprentices to complete a structured, competency-based program combining classroom instruction with supervised practical experience. This lesson introduces the legal framework governing barber licensure, the apprenticeship pathway structure, and the defined scope of practice that licensed barbers must operate within. Understanding these foundational elements ensures compliance with state regulations and prepares apprentices for professional responsibilities.</p><h2>Tools Required</h2><ul><li>Straight razor with leather strop</li><li>Safety razor or clipper with multiple guard sizes</li><li>Scissors and thinning shears</li><li>Comb (wide-tooth and fine-tooth)</li><li>Disinfectant solution (EPA-registered barbicide or equivalent)</li><li>Sterilization pouches and autoclave equipment</li><li>Personal protective equipment (gloves, mask, apron)</li></ul><h2>Decision Tree for Client Variation</h2><ul><li><strong>IF</strong> client has coarse, curly hair and sensitive scalp, <strong>THEN</strong> use wider clipper guard, apply pre-shave oil, and select chemical-free aftershave to prevent irritation.</li><li><strong>IF</strong> client presents with visible skin abrasions or lesions, <strong>THEN</strong> DO NOT proceed with service; refer to healthcare provider and document in client file per DOL requirements.</li><li><strong>IF</strong> client has fine, thin hair and prone to ingrown hairs, <strong>THEN</strong> use smaller clipper guard, employ exfoliating pre-shave preparation, and recommend post-service beard oil application.</li></ul><h2>Sanitation and Disinfection</h2><p>All tools must be sanitized before each client service. Immerse implements in EPA-registered disinfectant (such as Barbicide) for the manufacturer-specified duration, typically 10-15 minutes. Rinse thoroughly with clean water, then dry with a lint-free towel. Tools contacting blood or open wounds require high-level disinfection or sterilization via autoclave at 250°F for 15-30 minutes. Single-use items (razors, applicators) must be discarded immediately after use. Reusable towels and capes are laundered at 160°F minimum.</p><h2>Critical Contraindication</h2><p><strong>DO NOT cut, trim, or style the hair of any client presenting with active contagious scalp or skin infection (ringworm, impetigo, head lice, severe dermatitis). Performing services on infected clients violates Indiana barber law, exposes the barber to liability, contaminates the barbershop environment, and spreads disease to subsequent clients. Politely decline service, document the refusal with client consent, and recommend medical evaluation before rescheduling.</strong></p><h2>Failure Mode and Recovery</h2><p>Failure Mode: Disinfectant solution becomes contaminated or expires before use. Cause: Tools were immersed in old solution, solution was left uncovered, or expiration date was not monitored. Recovery: (1) Immediately discard contaminated solution; (2) Visually inspect all tools for residue and rinse under running water; (3) Prepare fresh disinfectant per manufacturer instructions and note preparation date; (4) Re-immerse all tools for full recommended contact time; (5) Review tool sanitation log to prevent future lapses; (6) Document the incident and corrective action in the shop maintenance record.</p><h2>Visual Execution Cues</h2><p>Position yourself at a 45-degree angle to the client, maintaining clear sight lines to both ears and the nape. The client's head should be upright and neutral, not tilted or rotated. Observe the natural hairline and growth pattern—note any cowlicks, waves, or asymmetries. Work from the sides inward, maintaining consistent clipper or scissor angles relative to the contour of the head. The finished cut should appear symmetrical, with smooth transitions between sections, clean edges at the nape and sideburns, and appropriate fade or taper blending. Run your comb through the final cut; no stray hairs should catch or pull.</p><h2>Procedure</h2><ol><li>Greet client, confirm service requested, and review any allergies, skin conditions, or previous reactions documented in client record.</li><li>Perform hand hygiene: wash hands with soap and warm water for 20 seconds, then apply hand sanitizer and don clean gloves.</li><li>Sanitize all tools by immersing in EPA-registered disinfectant solution for the required contact time, then rinse and dry thoroughly.</li><li>Drape client with clean cape and neck strip, ensuring no skin contact with contaminated surfaces, and position client upright at neutral head angle.</li><li>Analyze hair type, texture, density, and scalp condition; assess any contraindications that would prevent safe service delivery.</li><li>Consult Indiana barber scope-of-practice guidelines to confirm the requested service falls within your licensure authority and apprenticeship level.</li><li>Perform the barbering service (cut, shave, or style) using proper technique, sanitation, and safety protocols throughout the entire process.</li><li>Inspect completed work for symmetry, clean lines, and appropriate finishing; make final corrections as needed to meet professional standards.</li><li>Remove cape and brush away all clippings; allow client to inspect final result and address any concerns or adjustments.</li><li>Document service rendered, any observations (skin conditions, product recommendations), and client satisfaction in the shop record system.</li></ol><h2>Safety</h2><p>Maintain current knowledge of Indiana Department of Labor barbering regulations and apprenticeship requirements. All services must comply with the defined scope of practice—barbers are licensed to cut, trim, style, and shave hair and provide scalp massage. Barbers are NOT licensed to diagnose scalp or skin conditions, prescribe treatments, or perform chemical services (permanent waves, relaxers) unless separately credentialed. Follow bloodborne pathogens protocols per OSHA standards. Always use single-use instruments for open wounds; never reuse razors or lancets. Report any needlestick injuries or blood exposure immediately to your supervising journeyman and the shop owner. Maintain confidentiality of client health information and follow all state privacy regulations.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-1-q1",
                              "question": "What is the minimum contact time for tools immersed in EPA-registered barbicide?",
                              "options": [
                                        "A. 5 minutes",
                                        "B. 10-15 minutes",
                                        "C. 20-25 minutes",
                                        "D. 30 minutes"
                              ],
                              "correctAnswer": 1,
                              "explanation": "EPA-registered disinfectants like Barbicide typically require 10-15 minutes of contact time to ensure proper sanitation of barber tools. Always follow the manufacturer's specific instructions."
                    },
                    {
                              "id": "barber-lesson-1-q2",
                              "question": "Which of the following services falls OUTSIDE the scope of practice for an Indiana licensed barber?",
                              "options": [
                                        "A. Hair cutting and styling",
                                        "B. Straight razor shaving and trimming",
                                        "C. Scalp massage",
                                        "D. Chemical hair relaxing treatments"
                              ],
                              "correctAnswer": 3,
                              "explanation": "Barbers in Indiana are licensed to cut, trim, style, and shave hair and provide scalp massage. Chemical services like permanent waves or relaxers require separate licensure and credentials beyond basic barber licensing."
                    },
                    {
                              "id": "barber-lesson-1-q3",
                              "question": "What is the required water temperature for laundering reusable barbershop towels and capes?",
                              "options": [
                                        "A. 120°F minimum",
                                        "B. 140°F minimum",
                                        "C. 160°F minimum",
                                        "D. 180°F minimum"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Reusable towels, capes, and linens must be laundered at 160°F minimum to achieve adequate sanitation and eliminate potential pathogens."
                    },
                    {
                              "id": "barber-lesson-1-q4",
                              "question": "SCENARIO: A client arrives with visible ringworm on the scalp. What is the correct action?",
                              "options": [
                                        "A. Proceed with the haircut using extra disinfectant on tools",
                                        "B. Politely decline service, document the refusal, and recommend medical evaluation before rescheduling",
                                        "C. Perform the service but charge a higher fee for the extra sanitation required",
                                        "D. Use a barrier cream to isolate the affected area and proceed with service"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Active contagious scalp infections are absolute contraindications. Performing services on an infected client violates Indiana barber law, exposes the barber to liability, and spreads disease. Always decline, document, and refer to healthcare provider."
                    },
                    {
                              "id": "barber-lesson-1-q5",
                              "question": "SCENARIO: During tool preparation, you notice the disinfectant solution smells foul and appears cloudy. What is the correct response?",
                              "options": [
                                        "A. Add fresh disinfectant to the container and proceed with tool immersion",
                                        "B. Immediately discard contaminated solution, prepare fresh disinfectant per manufacturer instructions, and re-immerse tools for full contact time",
                                        "C. Strain the solution through a filter and reuse it",
                                        "D. Proceed with service using only surface-wiped tools"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Contaminated or expired disinfectant cannot protect clients or prevent disease transmission. Discard immediately, prepare fresh solution, and document the incident. This ensures full compliance with Indiana health and safety regulations."
                    }
          ],
        },
        {
          slug: 'barber-lesson-2',
          title: 'Professional Conduct & Ethics',
          order: 2,
          domainKey: 'infection_control',
          objective:
            'Apply professional standards of conduct, ethics, and client communication in a barbershop setting.',
          durationMinutes: 20,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Professional Conduct & Ethics</h2><p>Welcome to Module 1: Infection Control & Safety, Lesson 2: Professional Conduct & Ethics. In this lesson, we will cover the importance of professional standards of conduct, ethics, and client communication in a barbershop setting.</p><h3>Introduction to Professional Conduct</h3><p>As a barber, it is essential to maintain a professional demeanor at all times. This includes being respectful, courteous, and attentive to clients. Professional conduct also involves maintaining a clean and organized workspace, adhering to sanitation and disinfection protocols, and using proper equipment and tools.</p><p>The following tools, equipment, and materials are required for this lesson:</p><ul><li>Barber chair</li><li>Sanitation and disinfection solutions</li><li>Equipment (scissors, clippers, razors)</li><li>Client gowns and capes</li><li>Sanitation and disinfection checklists</li></ul><h3>Client Communication and Ethics</h3><p>Effective client communication is crucial in a barbershop setting. Barbers must be able to listen attentively to clients, understand their needs and preferences, and provide clear and concise instructions. Ethics play a significant role in client communication, as barbers must maintain confidentiality, respect client boundaries, and avoid making false or misleading claims.</p><p>When dealing with clients, it is essential to consider hair type variation, skin condition variation, and client situation variation. For example:</p><p>IF a client has sensitive skin, THEN you should use gentle products and avoid using harsh chemicals. IF a client has a skin condition such as eczema or psoriasis, THEN you should take extra precautions to avoid irritating the condition. IF a client is experiencing stress or anxiety, THEN you should provide a calming and relaxing environment.</p><h3>Sanitation and Disinfection</h3><p>Sanitation and disinfection are critical components of professional conduct and ethics in a barbershop setting. Barbers must adhere to strict sanitation and disinfection protocols to prevent the spread of infections and maintain a clean and safe environment for clients.</p><p>DO NOT touch your face, eyes, or mouth while working with clients, as this can spread infection. DO NOT share equipment or tools with other barbers, as this can also spread infection.</p><h3>Failure Mode and Recovery</h3><p>A failure mode that can occur in a barbershop setting is failing to properly sanitize and disinfect equipment and tools. This can lead to the spread of infections and compromise client safety.</p><p>To recover from this failure mode, barbers should immediately stop working and properly sanitize and disinfect all equipment and tools. They should also inform their supervisor or manager of the incident and take steps to prevent it from happening again in the future.</p><p>Correct execution of sanitation and disinfection protocols involves visually inspecting equipment and tools for any signs of contamination, using the correct sanitation and disinfection solutions, and following the manufacturer's instructions for use. Barbers should also maintain a clean and organized workspace, with all equipment and tools properly stored and labeled.</p><h3>Visual Cues</h3><p>When performing sanitation and disinfection protocols, barbers should look for the following visual cues:</p><ul><li>Equipment and tools should be free of visible debris and contamination</li><li>Sanitation and disinfection solutions should be used according to the manufacturer's instructions</li><li>The workspace should be clean and organized, with all equipment and tools properly stored and labeled</li></ul>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-2-q1",
                              "question": "A client presents with a skin condition that requires extra precautions to avoid irritation. What do you do?",
                              "options": [
                                        "Use harsh chemicals to treat the condition",
                                        "Take extra precautions to avoid irritating the condition",
                                        "Ignore the condition and proceed with the service",
                                        "Refer the client to a doctor"
                              ],
                              "correctAnswer": 1,
                              "explanation": "As a barber, it is essential to take extra precautions to avoid irritating a client's skin condition. This includes using gentle products, avoiding harsh chemicals, and providing a clean and safe environment for the client."
                    },
                    {
                              "id": "barber-lesson-2-q2",
                              "question": "What is the correct way to sanitize and disinfect equipment and tools in a barbershop setting?",
                              "options": [
                                        "Use soap and water only",
                                        "Use a combination of sanitation and disinfection solutions",
                                        "Use harsh chemicals only",
                                        "Do not sanitize and disinfect equipment and tools"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct way to sanitize and disinfect equipment and tools in a barbershop setting is to use a combination of sanitation and disinfection solutions, following the manufacturer's instructions for use."
                    },
                    {
                              "id": "barber-lesson-2-q3",
                              "question": "A client is experiencing stress and anxiety during a service. What do you do?",
                              "options": [
                                        "Provide a calming and relaxing environment",
                                        "Ignore the client's feelings and proceed with the service",
                                        "Refer the client to a doctor",
                                        "Use harsh chemicals to calm the client"
                              ],
                              "correctAnswer": 0,
                              "explanation": "As a barber, it is essential to provide a calming and relaxing environment for clients who are experiencing stress and anxiety. This includes using soothing music, dimming the lights, and providing a comfortable and supportive atmosphere."
                    },
                    {
                              "id": "barber-lesson-2-q4",
                              "question": "What is a contraindication for sharing equipment and tools with other barbers?",
                              "options": [
                                        "It is allowed as long as the equipment and tools are cleaned",
                                        "It is allowed as long as the client consents",
                                        "It can spread infection and compromise client safety",
                                        "It is required by law"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Sharing equipment and tools with other barbers can spread infection and compromise client safety. As a barber, it is essential to use your own equipment and tools and to properly sanitize and disinfect them after each use."
                    },
                    {
                              "id": "barber-lesson-2-q5",
                              "question": "What is the correct way to visually inspect equipment and tools for signs of contamination?",
                              "options": [
                                        "Look for visible debris and contamination",
                                        "Use a microscope to inspect the equipment and tools",
                                        "Ignore the equipment and tools and proceed with the service",
                                        "Use harsh chemicals to clean the equipment and tools"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The correct way to visually inspect equipment and tools for signs of contamination is to look for visible debris and contamination. This includes checking for any signs of dirt, dust, or other substances that could compromise client safety."
                    }
          ],
        },
        {
          slug: 'barber-lesson-3',
          title: 'Tools & Equipment',
          order: 3,
          domainKey: 'infection_control',
          objective:
            'Identify, name, and describe the correct use of essential barbering tools and equipment.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Tools & Equipment</h2><p><strong>Lesson Slug:</strong> barber-lesson-3<br><strong>Module:</strong> Module 1: Infection Control & Safety<br><strong>Estimated Duration:</strong> 25 minutes</p><h3>Learning Objective</h3><p>By the end of this lesson, you will be able to identify, name, and describe the correct use of essential barbering tools and equipment, understand proper sanitation protocols for each tool, and recognize safety contraindications.</p><h3>Introduction</h3><p>The foundation of professional barbering rests on understanding and properly using your tools. In Indiana's regulated barbering environment, every tool serves a specific purpose, and improper use or sanitation can compromise both client safety and the quality of your work. This lesson covers the essential tools you will use daily, how to identify them, their proper applications, sanitation requirements, and critical safety rules.</p><h3>Essential Barbering Tools & Equipment</h3><h4>Cutting Tools</h4><ul><li><strong>Straight Razor:</strong> A folding blade with a handle, typically 5/8 inch wide, used for precise cutting, outlining, and close shaving. The blade must be stropped before each use and honed regularly. Straight razors require meticulous sanitation—they must be cleaned with a brush and soap, disinfected in an EPA-registered disinfectant for a minimum of 10 minutes, and stored in a clean, dry location. <strong>DO NOT</strong> use a straight razor that shows signs of rust, chips, or dullness.</li><li><strong>Clipper:</strong> A motorized tool with oscillating or rotating blades for cutting hair to various lengths. Clipper guards (numbered 0.5 to 4) determine cutting length. Clippers must be cleaned of hair and debris after each client, lubricated with clipper oil, and disinfected by wiping with an EPA-registered disinfectant or placing in a sanitizing container. Blade guards must be disinfected separately.</li><li><strong>Scissors (Shears):</strong> Used for detailed work, blending, and styling. Available in various blade configurations (straight, curved, texturizing). Scissors must be sanitized between clients by wiping with disinfectant and stored with blades closed. Dull scissors produce ragged cuts and require sharpening by a professional.</li><li><strong>Thinning Shears:</strong> Specialized scissors with teeth on one blade, used for removing bulk and creating texture while maintaining length. Sanitization protocols match standard scissors.</li></ul><h4>Styling & Finishing Tools</h4><ul><li><strong>Comb:</strong> Essential for sectioning, detangling, and guiding the blade. Metal combs withstand disinfection better than plastic. Combs must be cleaned of hair and disinfected in an EPA-registered solution for 10 minutes between each client.</li><li><strong>Brush:</strong> Used for applying lather and removing loose hair. Brushes accumulate bacteria and must be thoroughly cleaned daily and disinfected. Replace brushes regularly—typically every 3-6 months depending on usage.</li><li><strong>Blow Dryer:</strong> For drying and styling finished haircuts. The external surface must be wiped with disinfectant between clients; the nozzle should be cleaned of lint regularly.</li><li><strong>Clipper Trimmer/Edger:</strong> Precision tool for detailing around ears, neckline, and sideburns. Sanitization and maintenance match clippers.</li></ul><h4>Preparation & Sanitation Equipment</h4><ul><li><strong>Disinfectant Container:</strong> An EPA-registered disinfectant solution in which tools are soaked. Solution must be changed daily and concentration verified according to product instructions.</li><li><strong>Towels and Neck Strips:</strong> Single-use or laundered between clients. Must be clean and stored in a sanitary manner.</li><li><strong>Lather/Shaving Cream:</strong> Applied with a brush or hands. Do not double-dip brushes into shared containers—dispense a fresh application for each client or use single-use packets.</li><li><strong>Styptic Powder or Liquid:</strong> Applied to minor cuts to stop bleeding. Keep container sealed and store safely.</li></ul><h3>Proper Use & Positioning</h3><h4>Clipper Use</h4><p>Hold the clipper at a 45-degree angle against the scalp in the direction of hair growth. The blade should glide smoothly without resistance. Correct execution shows even, parallel lines with no missed patches or visible blade marks. Move in smooth strokes from lower to upper areas, overlapping slightly for even coverage. The clipper should produce a soft humming sound—a grinding or stuttering noise indicates dull blades or improper technique.</p><h4>Straight Razor Use</h4><p>Position the straight razor at a 30-45 degree angle relative to the skin. The spine of the blade (not the edge) guides the cut, with the edge meeting the skin at the correct angle. Proper execution produces a smooth outline with no razor burn, nicks, or uneven edges. The cut line should be clean and precise, following natural facial contours. Incorrect angle or excessive pressure causes razor burn, skin irritation, or cuts.</p><h4>Scissors/Shears Use</h4><p>Hold scissors with the thumb in the lower loop, fingers in the upper loop, and the pinky finger supporting the ring. The hand holding the comb guides the blade. Correct execution produces even, clean cut lines without chewing or fraying. The scissors should open and close smoothly—resistance or grinding indicates blade misalignment or dullness requiring professional sharpening.</p><h3>Decision Block: Tool Selection Based on Hair & Client Variation</h3><p><strong>IF</strong> a client presents with <strong>very coarse, thick facial hair</strong> requiring a close shave, <strong>THEN</strong> use a straight razor rather than electric clippers, as the straight razor cuts closer to the skin and produces a smoother finish. However, ensure the client has no open cuts, razor sensitivity, or bleeding disorders. Perform a patch test on a small area first.</p><p><strong>IF</strong> a client has <strong>sensitive skin or a history of razor burn</strong>, <strong>THEN</strong> use a clipper with appropriate guard length or electric shaver rather than a straight razor. Apply pre-shave oil or balm to reduce friction and irritation. Monitor skin response throughout the service.</p><p><strong>IF</strong> a client requests <strong>precise detailing or blending between fade lengths</strong>, <strong>THEN</strong> use thinning shears or texturizing shears after clipper work to soften harsh lines. This requires scissors skill and cannot be achieved with clippers alone.</p><h3>Failure Mode: Dull Clipper Blades</h3><p><strong>What goes wrong:</strong> Dull clipper blades pull and chew hair rather than cutting cleanly, leaving a ragged appearance, causing discomfort to the client, and producing visible stubble within hours.</p><p><strong>Why it happens:</strong> Blades dull from regular use, exposure to moisture, or lack of lubrication. Cutting over dirt or debris accelerates dulling.</p><p><strong>How to recover:</strong> Stop the service immediately. Explain the issue to the client professionally. Replace the blade guard with a fresh one if available, or use an alternate clipper. If neither option exists, reschedule the client at no charge and provide a discount on a future visit as service recovery. Document the equipment failure and send blades for professional sharpening or replacement. Between services, always test clippers on a sample of hair before beginning—dull clippers require noticeably more pressure to cut.</p><h3>Critical Safety Contraindications</h3><ul><li><strong>DO NOT</strong> use a straight razor on a client with active bleeding, open wounds, or cuts on the face or neck. Wait until skin has healed.</li><li><strong>DO NOT</strong> use clippers or razors that show visible damage, rust, or misalignment. This violates Indiana barber regulations and risks client injury.</li><li><strong>DO NOT</strong> reuse disinfectant solution beyond the recommended time frame or concentrate. Weak disinfectant fails to eliminate pathogens. Change solution daily.</li><li><strong>DO NOT</strong> place disinfected tools on an unclean surface. Store them in a designated clean holder or on a disinfected towel.</li><li><strong>DO NOT</strong> allow a second client to use the same towel, neck strip, or brush without disinfection. Cross-contamination spreads infection.</li><li><strong>DO NOT</strong> touch your face or other surfaces with unclean tools during a service.</li></ul><h3>Sanitation & Infection Control Summary</h3><p>Every tool that contacts skin or blood must be cleaned and disinfected according to Indiana Health Department regulations. The standard protocol is: (1) Remove visible debris with soap and water or a cleaning brush. (2) Immerse in EPA-registered disinfectant for the time specified on the product label (typically 10 minutes minimum). (3) Rinse with clean water or allow to air dry. (4) Store in a clean, dry container. Tools that contact mucous membranes or blood require enhanced disinfection. Never assume a tool is clean—treat every tool as potentially contaminated after each use.</p><h3>Visual Reference: Correct Execution Indicators</h3><ul><li><strong>Well-executed clipper cut:</strong> Uniform length, parallel lines, smooth fade transitions, no missed spots, sharp blade sound, skin is not irritated.</li><li><strong>Well-executed straight razor outline:</strong> Clean, precise line following natural contours, no razor burn (redness), even pressure marks, skin is smooth and not nicked.</li><li><strong>Well-executed scissor work:</strong> Clean edges without fraying, blended transitions, no visible chop marks, hair lays naturally, skin is not irritated.</li><li><strong>Clean, sanitized tools:</strong> No visible hair, debris, or discoloration; tools feel smooth and operate without grinding or resistance; tools stored in a designated, clean location.</li></ul><h3>Conclusion</h3><p>Mastery of barbering tools is not simply about technique—it is about understanding each tool's purpose, maintaining it to professional standards, and prioritizing client safety and infection control. Throughout your apprenticeship, you will develop muscle memory with these tools, but your foundation must be respect for their power and commitment to sanitation. Regular inspection, proper maintenance, and adherence to infection control protocols protect your clients and your professional reputation.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-3-q1",
                              "question": "Which of the following is the minimum time a straight razor must remain in an EPA-registered disinfectant solution?",
                              "options": [
                                        "A. 5 minutes",
                                        "B. 10 minutes",
                                        "C. 15 minutes",
                                        "D. 20 minutes"
                              ],
                              "correctAnswer": 1,
                              "explanation": "According to Indiana barber regulations and industry standards, tools that contact skin must be immersed in EPA-registered disinfectant for a minimum of 10 minutes. Five minutes is insufficient to eliminate pathogens. Fifteen and twenty minutes are acceptable but exceed the minimum requirement."
                    },
                    {
                              "id": "barber-lesson-3-q2",
                              "question": "A client arrives for a haircut but mentions they had a small razor cut on their neck from a prior service at another barbershop three days ago. The area appears mostly healed but is still slightly pink. What should you do?",
                              "options": [
                                        "A. Proceed with a straight razor shave since the cut is mostly healed and the client consents",
                                        "B. Postpone straight razor work, use clippers or electric shaver instead, and monitor the area closely for any irritation during the service",
                                        "C. Perform a full straight razor shave but apply extra lather to protect the area",
                                        "D. Use a straight razor only on the unaffected areas and avoid the healing wound entirely"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A healing wound on the face or neck is a contraindication for straight razor use. Even if mostly healed, the skin is still vulnerable to infection and irritation. Using clippers or an electric shaver avoids direct blade contact with the sensitive area while still delivering quality service. Monitoring the client's skin response demonstrates professional care and protects both the client and your liability."
                    },
                    {
                              "id": "barber-lesson-3-q3",
                              "question": "During a haircut using clippers, you notice the blade is making a grinding sound rather than its normal humming sound, and it requires more pressure to cut. What is the most likely issue and what should you do?",
                              "options": [
                                        "A. The blade is dull; stop the service, replace the blade or clipper, and resume the cut",
                                        "B. The clipper needs more oil; apply clipper oil and continue cutting",
                                        "C. The blade is too tight; loosen the tension screw and continue",
                                        "D. This is normal; continue the service as the blade will warm up"
                              ],
                              "correctAnswer": 0,
                              "explanation": "A grinding sound and increased cutting pressure are classic signs of dull clipper blades. Continuing with dull blades produces a ragged cut, discomforts the client, and violates service standards. Immediately stop the service, replace the blade guard or use a fresh clipper, and resume. Clipper oil addresses lubrication issues but will not fix a dull blade. The sound and pressure will not improve with continued use."
                    },
                    {
                              "id": "barber-lesson-3-q4",
                              "question": "Which tool should be used when a client requests precise blending between two different clipper fade lengths to create a smooth transition?",
                              "options": [
                                        "A. Straight razor",
                                        "B. Thinning shears or texturizing shears",
                                        "C. Comb only",
                                        "D. A second pass with the same clipper guard"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Thinning or texturizing shears soften harsh lines between clipper lengths and create smooth blending. A straight razor is for outlining and shaving, not blending. A comb alone cannot cut hair. A second pass with the same guard will not create a transition between different lengths. Scissors blending is a critical skill in barbering."
                    },
                    {
                              "id": "barber-lesson-3-q5",
                              "question": "You finish disinfecting a set of scissors in an EPA-registered solution. You remove the scissors, rinse them with clean water, and set them on your workstation counter to air dry. What is the infection control concern with this approach?",
                              "options": [
                                        "A. The rinsing step removes the disinfectant and re-contaminates the tool",
                                        "B. Air drying is slower than towel drying and allows bacterial growth",
                                        "C. The workstation counter may not be clean, potentially re-contaminating the disinfected tool",
                                        "D. Disinfected scissors should never touch any surface until used on the next client"
                              ],
                              "correctAnswer": 2,
                              "explanation": "After disinfection, a tool must be stored on a clean surface—a dirty or unclean workstation counter risks re-contamination, negating the disinfection process. Disinfected tools should be placed on a designated clean holder, disinfected towel, or in a sealed storage container. Rinsing is appropriate (removes residual disinfectant), and air drying is acceptable. The critical error is the storage surface itself."
                    }
          ],
        },
        {
          slug: 'barber-lesson-4',
          title: 'Infection Control & Safety',
          order: 4,
          domainKey: 'infection_control',
          objective:
            'Differentiate between cleaning, disinfecting, and sterilization; identify types of microorganisms and how they spread; apply OSHA infection control standards; execute blood exposure protocol; maintain a state board-compliant workstation.',
          durationMinutes: 35,
          // Locked to the semantically-mapped infection control video (alloy 0.88x, 20 segments)
          videoFile: '/videos/barber-lessons/barber-infection-control.mp4',
          learningObjectives: [
            'Define sanitation, disinfection, and sterilization and state the difference between all three',
            'Identify EPA-registered disinfectants and explain proper usage and contact time',
            'Demonstrate correct Barbicide immersion protocol — full submersion, 10-minute minimum',
            'Distinguish between single-use and multi-use tools and explain why the distinction matters',
            'Explain proper razor blade disposal procedure and sharps container compliance',
            'Apply client protection procedures — neck strip placement, cape handling, daily laundering',
            'Recognize cross-contamination risks and describe prevention methods for each',
          ],
          competencyChecks: [
            {
              key: 'barbicide_immersion',
              label: 'Barbicide Immersion Protocol',
              description:
                'Student submerges tools completely in Barbicide solution and waits the full 10-minute contact time before removing.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
            {
              key: 'razor_blade_change',
              label: 'Razor Blade Replacement',
              description:
                'Student removes a used blade safely, disposes of it in a sharps container, and inserts a fresh blade correctly.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
            {
              key: 'neck_strip_application',
              label: 'Neck Strip & Cape Application',
              description:
                "Student applies a clean neck strip before placing the cape so the cape does not contact the client's skin.",
              isCritical: false,
              requiresInstructorSignoff: true,
            },
          ],
          instructorNotes: `Verify all three competency checks in person before marking this lesson complete.
Barbicide check: watch the student submerge tools — partial submersion is a fail.
Razor check: confirm the used blade goes directly into the sharps container — not the trash.
Neck strip check: cape must not touch skin before the strip is placed.
Indiana State Board inspectors check disinfection logs — remind students to document every session.`,
          content: `<h2>Sanitation & Infection Control</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to: differentiate between cleaning, disinfecting, and sterilization; identify types of microorganisms and how they spread in a barbering environment; apply proper infection control procedures in compliance with OSHA standards; execute blood exposure protocol correctly; maintain a sanitary workstation that meets state board requirements.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Pathogens</strong> — bacteria, viruses, fungi, parasites</li>
  <li><strong>Modes of transmission</strong> — direct contact, indirect contact (contaminated tools), airborne/droplet</li>
  <li><strong>Levels of decontamination</strong> — cleaning, disinfecting, sterilization</li>
  <li><strong>EPA-registered disinfectants</strong> — required by Indiana state board for all tools</li>
  <li><strong>Contact time</strong> — disinfectant must remain wet for the full manufacturer-specified duration</li>
  <li><strong>Bloodborne pathogens</strong> — hepatitis B, hepatitis C, HIV</li>
  <li><strong>Cross-contamination</strong> — transferring pathogens from one surface or person to another via tools, hands, or linens</li>
  <li><strong>Universal Precautions</strong> — treat every client as potentially infectious, every service</li>
</ul>

<h3>Explanation</h3>

<h4>1. Types of Microorganisms — What You Are Actually Fighting</h4>
<p>You are not "cleaning tools." You are interrupting biological transmission chains. Understanding what you are fighting determines how you fight it.</p>
<ul>
  <li><strong>Bacteria</strong> — single-celled organisms. Some are harmless; some are pathogenic. <em>Staphylococcus aureus</em> causes skin infections and folliculitis — spread by contaminated clippers and combs. Bacteria are destroyed by EPA-registered disinfectants.</li>
  <li><strong>Viruses</strong> — require a living host to survive and reproduce. Examples: hepatitis B (survives on dry surfaces up to 7 days), hepatitis C, HIV. HIV is fragile outside the body; hepatitis B is not. Both are inactivated by proper disinfection.</li>
  <li><strong>Fungi</strong> — cause conditions like ringworm (tinea capitis). Ringworm is not a worm — it is a fungal infection presenting as a circular, scaly patch on the scalp. Highly contagious through contaminated clippers, combs, and hats. A client with active ringworm is a contraindication — do not perform services.</li>
  <li><strong>Parasites</strong> — live on or in a host. Head lice (pediculosis capitis) are the most common barbershop parasite. Spread by direct contact and shared tools. A client with visible lice is a contraindication — refer out immediately.</li>
</ul>

<h4>2. How Infection Spreads in a Barbershop</h4>
<p>Your tools are the primary infection vehicle — not the client's hands or breath.</p>
<table style="width:100%; border-collapse:collapse; margin:1rem 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Route</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">How It Happens</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Barbershop Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Direct contact</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Skin-to-skin or blood-to-skin</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Barber touches client's open wound without gloves</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Indirect contact</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Contaminated object touches skin</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Undisinfected clipper used on next client — most common route</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Droplet/Airborne</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Respiratory droplets</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Client coughs or sneezes during service</td>
    </tr>
  </tbody>
</table>

<h4>3. Levels of Decontamination — Heavily Tested on State Board</h4>
<table style="width:100%; border-collapse:collapse; margin:1rem 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Level</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">What It Does</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">Required For</th>
      <th style="padding:8px; border:1px solid #d1d5db; text-align:left;">State Board Rule</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Cleaning</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Removes visible debris with soap/detergent. Does NOT kill pathogens.</td>
      <td style="padding:8px; border:1px solid #d1d5db;">First step before disinfection</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Never sufficient alone for tools</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Disinfecting</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Kills most microorganisms using EPA-approved chemical agents</td>
      <td style="padding:8px; border:1px solid #d1d5db;">All tools between every client</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Minimum required standard in Indiana</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #d1d5db;"><strong>Sterilization</strong></td>
      <td style="padding:8px; border:1px solid #d1d5db;">Destroys ALL microorganisms including spores. Typically via autoclave.</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Invasive instruments with blood exposure risk</td>
      <td style="padding:8px; border:1px solid #d1d5db;">Not required for standard barbering tools</td>
    </tr>
  </tbody>
</table>
<p><strong>State board trap:</strong> If a tool has blood exposure risk, cleaning alone is never enough. The answer is always disinfection at minimum.</p>

<h4>4. Bloodborne Pathogens & OSHA Compliance</h4>
<p>OSHA Standard 29 CFR 1910.1030 requires all barbershops to have a written Exposure Control Plan. High-risk scenarios in barbering:</p>
<ul>
  <li>Nicks from straight razors or clippers</li>
  <li>Cuts from scissors</li>
  <li>Skin abrasions from aggressive technique</li>
</ul>
<p>Universal Precautions means you treat every client as potentially infectious — every service, every time. You do not ask. You do not assume. You protect.</p>

<h4>5. Blood Exposure Protocol — Memorize This</h4>
<p>This is tested on the Indiana state board written exam. Missing any step is a fail risk.</p>
<ol>
  <li><strong>Stop the service immediately</strong></li>
  <li><strong>Put on gloves</strong> before touching the wound or any blood</li>
  <li><strong>Clean the wound</strong> with soap and water</li>
  <li><strong>Apply antiseptic</strong> to the wound</li>
  <li><strong>Cover with a sterile bandage</strong></li>
  <li><strong>Dispose of contaminated materials</strong> — double-bag in biohazard bags</li>
  <li><strong>Disinfect all tools and surfaces</strong> that contacted blood</li>
  <li><strong>Wash hands thoroughly</strong> with soap and water</li>
</ol>
<p>Document the incident: date, time, what happened, actions taken. If your skin was exposed to the client's blood, report to your supervisor and seek medical evaluation immediately.</p>

<h4>6. Tool & Workstation Sanitation Standards</h4>
<p><strong>The most common mistake barbers make:</strong> spraying disinfectant and wiping immediately. That is not disinfection. That is cleaning. Disinfection requires full contact time — the surface must remain wet for the manufacturer's specified duration (typically 10 minutes for most barbershop disinfectants).</p>
<p><strong>Minimum standards:</strong></p>
<ul>
  <li>Disinfect all tools after every client — no exceptions</li>
  <li>Use a fresh towel and neck strip for every client</li>
  <li>Clean and disinfect the workstation between every client</li>
  <li>Store disinfected tools in a clean, closed container — not back in the disinfectant jar</li>
  <li>Change disinfectant solution daily or when visibly contaminated</li>
  <li>Maintain a disinfection log — Indiana inspectors will ask for it</li>
</ul>

<h3>Real-World Application</h3>
<p>A barber finishes a fade, brushes hair off the clippers, sprays them with disinfectant, and immediately picks them up to use on the next client. The spray contact time is 10 minutes.</p>
<p><strong>What went wrong:</strong> No cleaning step (hair debris still on blades). No contact time (wiped immediately). High risk of cross-contamination — any pathogen from the previous client is still on those blades.</p>
<p><strong>Correct procedure:</strong> Remove all debris. Clean with soap and water. Apply EPA-registered disinfectant. Wait the full contact time. Store in a clean container. Only then use on the next client. On a busy Saturday, this means having multiple sets of blades rotating through the disinfection process — not rushing one set.</p>

<h3>Summary</h3>
<ul>
  <li>Infection control is about breaking transmission chains — not just "cleaning"</li>
  <li>Your tools are the highest-risk infection vector in barbering — not the client's hands</li>
  <li>Disinfection is the minimum professional standard; cleaning alone is never enough for tools</li>
  <li>Contact time is non-negotiable — spraying and wiping immediately is not disinfection</li>
  <li>Blood exposure requires an 8-step protocol — memorize it for state board</li>
  <li>Universal Precautions: treat every client as potentially infectious, every time</li>
</ul>

<h4>State Board Alignment</h4>
<ul>
  <li>Indiana State Board — Infection Control & Safety Standards</li>
  <li>OSHA Standard 29 CFR 1910.1030 — Bloodborne Pathogens</li>
  <li>EPA Disinfectant Registration Requirements</li>
</ul>`,
          quizQuestions: [
            {
              id: 'mod1-l4-q1',
              question:
                'What type of microorganism requires a living host to survive and reproduce?',
              options: ['Bacteria', 'Virus', 'Fungus', 'Parasite'],
              correctAnswer: 1,
              explanation:
                'Viruses cannot reproduce without a host cell. Examples relevant to barbering: hepatitis B, hepatitis C, HIV.',
            },
            {
              id: 'mod1-l4-q2',
              question:
                'What is the minimum required level of decontamination for barber tools between clients in Indiana?',
              options: [
                'Cleaning',
                'Disinfecting',
                'Sterilization',
                'Sanitizing with alcohol wipes',
              ],
              correctAnswer: 1,
              explanation:
                'Disinfection with an EPA-registered product is the minimum standard required by Indiana state board for all tools between clients.',
            },
            {
              id: 'mod1-l4-q3',
              question:
                'A barber reuses a towel on a second client after shaking the hair out. What risk is present?',
              options: [
                'No risk — the hair was removed',
                'Cross-contamination — pathogens from the first client remain on the towel',
                'Only a risk if the first client had visible skin conditions',
                'Risk only if the towel is wet',
              ],
              correctAnswer: 1,
              explanation:
                'Shaking hair out does not remove pathogens. Reusing towels transfers microorganisms from one client to another — cross-contamination.',
            },
            {
              id: 'mod1-l4-q4',
              question:
                'A clipper is sprayed with disinfectant and immediately picked up for the next client. What step was skipped?',
              options: [
                'Removing the blade guard',
                'Oiling the blades',
                'Allowing the full contact time for the disinfectant to work',
                'Rinsing with water first',
              ],
              correctAnswer: 2,
              explanation:
                'Spraying and wiping immediately is cleaning, not disinfection. The disinfectant must remain wet for the full manufacturer-specified contact time.',
            },
            {
              id: 'mod1-l4-q5',
              question: 'Which method destroys ALL microorganisms, including bacterial spores?',
              options: [
                'Disinfection with EPA-registered solution',
                'Sanitizing with 70% isopropyl alcohol',
                'Sterilization via autoclave',
                'Cleaning with soap and water',
              ],
              correctAnswer: 2,
              explanation:
                'Sterilization (typically via autoclave) is the only method that destroys all microorganisms including spores. Disinfection does not destroy spores.',
            },
            {
              id: 'mod1-l4-q6',
              question: 'What is the FIRST step after a client begins bleeding during a service?',
              options: [
                'Apply antiseptic to the wound',
                'Stop the service immediately',
                'Put on gloves',
                'Ask the client if they want to continue',
              ],
              correctAnswer: 1,
              explanation:
                'Step 1 of the blood exposure protocol is to stop the service immediately. Gloves come second — before touching the wound.',
            },
            {
              id: 'mod1-l4-q7',
              question: 'Why is contact time critical in disinfection?',
              options: [
                'Longer contact time makes tools smell cleaner',
                'The disinfectant must remain wet on the surface long enough to chemically destroy pathogens',
                'Contact time only matters for sterilization, not disinfection',
                'It prevents the disinfectant from damaging metal tools',
              ],
              correctAnswer: 1,
              explanation:
                'Disinfectants work through a chemical reaction that requires time. Removing tools before the contact time is complete means the process failed — pathogens may still be present.',
            },
            {
              id: 'mod1-l4-q8',
              question: 'What is the minimum time tools must remain submerged in Barbicide?',
              options: ['2 minutes', '5 minutes', '10 minutes', '15 minutes'],
              correctAnswer: 2,
              explanation:
                'Barbicide requires a minimum 10-minute full submersion to achieve proper disinfection. Partial soaking or early removal does not meet the standard.',
            },
            {
              id: 'mod1-l4-q9',
              question:
                'What level of decontamination is primarily used in barbering between clients?',
              options: ['Sanitation', 'Disinfection', 'Sterilization', 'Dehydration'],
              correctAnswer: 1,
              explanation:
                'Disinfection with an EPA-registered product is the primary standard in barbering. Sterilization is not required for standard barbering tools.',
            },
            {
              id: 'mod1-l4-q10',
              question: 'Razor blades are classified as:',
              options: [
                'Reusable if cleaned with alcohol',
                'Single-use only — replaced for every client',
                'Optional replacement based on sharpness',
                'Reusable if sterilized in an autoclave',
              ],
              correctAnswer: 1,
              explanation:
                'Razor blades are single-use. A fresh blade must be used for every client and the used blade disposed of immediately in a sharps container.',
            },
            {
              id: 'mod1-l4-q11',
              question: "What item prevents the cape from directly touching the client's skin?",
              options: ['A clean towel', 'A neck strip', 'Gloves', 'An apron'],
              correctAnswer: 1,
              explanation:
                "A clean neck strip is applied before the cape to create a barrier between the cape and the client's skin. This is a client protection requirement.",
            },
            {
              id: 'mod1-l4-q12',
              question: 'Cross-contamination in a barbershop most commonly occurs through:',
              options: [
                'Mixing disinfectant chemicals',
                'Using tools on multiple clients without disinfecting between uses',
                'Drying tools with a clean towel',
                'Wearing gloves during chemical services',
              ],
              correctAnswer: 1,
              explanation:
                'Cross-contamination is the transfer of pathogens from one client to another via contaminated tools, hands, or surfaces. Disinfecting between every client is the primary prevention.',
            },
            {
              id: 'mod1-l4-q13',
              question:
                'A client presents with a circular, scaly patch on the scalp. What is the correct action?',
              options: [
                'Proceed with the service using gloves',
                'Apply antifungal spray before the service',
                'Decline the service — this is a contraindication',
                'Use a fresh blade and proceed normally',
              ],
              correctAnswer: 2,
              explanation:
                'A circular scaly patch is a sign of ringworm (tinea capitis), a highly contagious fungal infection. Active ringworm is a contraindication — do not perform services and refer the client to a physician.',
            },
            {
              id: 'mod1-l4-q14',
              question: 'How often should Barbicide solution be changed?',
              options: [
                'Once a week',
                'Every three days',
                'Daily or when visibly contaminated',
                'Only when it changes color',
              ],
              correctAnswer: 2,
              explanation:
                'Barbicide solution must be changed daily or whenever it becomes visibly contaminated. Using old or dirty solution does not meet disinfection standards.',
            },
            {
              id: 'mod1-l4-q15',
              question: 'Universal Precautions means:',
              options: [
                'Wearing gloves only when a client has a known infection',
                'Treating every client as potentially infectious on every service',
                'Asking clients about their health history before each service',
                'Using sterilization instead of disinfection for all tools',
              ],
              correctAnswer: 1,
              explanation:
                'Universal Precautions require treating every client as potentially infectious on every service — not just clients who appear sick or disclose a condition. This is the OSHA standard.',
            },
          ],
        },

        {
          slug: 'barber-lesson-5',
          title: 'Workplace Safety',
          order: 5,
          domainKey: 'infection_control',
          objective:
            'Apply OSHA workplace safety standards and identify hazards specific to barbershop environments.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-sanitation.mp4',
          learningObjectives: [
            'Identify OSHA workplace safety standards applicable to barbershops',
            'Recognize chemical, electrical, and ergonomic hazards in a barbershop environment',
            'Demonstrate proper chemical storage and labeling procedures',
            'Explain the purpose of a Safety Data Sheet (SDS) and locate one for a common barbershop chemical',
            'Apply correct fire safety and emergency exit procedures',
          ],
          competencyChecks: [
            {
              key: 'chemical_storage',
              label: 'Chemical Storage & SDS',
              description:
                'Student correctly stores chemicals, labels containers, and locates the SDS for at least one product.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
            {
              key: 'hazard_identification',
              label: 'Hazard Identification Walk-Through',
              description:
                'Student identifies at least 3 potential hazards in the shop and states the correct prevention for each.',
              isCritical: false,
              requiresInstructorSignoff: true,
            },
          ],
          instructorNotes: `Chemical storage check: confirm all products are in original or labeled containers, stored away from heat sources. SDS check: student must locate and read the SDS for at least one product without assistance. Hazard walk-through: conduct in the actual shop, not from memory.`,
          content: `<h2>Workplace Safety</h2><p>As a barber, it is essential to maintain a safe working environment for yourself and your clients. This includes following OSHA workplace safety standards and identifying hazards specific to barbershop environments. In this lesson, we will cover the tools, equipment, and materials required to ensure a safe workplace, as well as the importance of sanitation, disinfection, and infection control.</p><h3>Tools, Equipment, and Materials</h3><p>The following tools, equipment, and materials are required for a safe barbershop environment:</p><ul><li>Sanitizing solutions and disinfectants</li><li>Gloves and other personal protective equipment (PPE)</li><li>First aid kit</li><li>Fire extinguisher</li><li>Slip-resistant flooring</li><li>Proper lighting</li></ul><h3>Safety Procedures</h3><p>To ensure a safe workplace, the following procedures must be followed:</p><ol><li>Sanitize and disinfect all equipment and surfaces after each use</li><li>Wear gloves and other PPE when necessary</li><li>Use caution when handling sharp objects and chemicals</li><li>Keep the floor clear of clutter and tripping hazards</li><li>Ensure proper ventilation</li></ol><h3>IF/THEN Decision Block</h3><p>When dealing with clients, it is essential to consider their individual needs and circumstances. For example:</p><p>IF a client presents with a skin condition, such as eczema or psoriasis, THEN you should take extra precautions to avoid irritating the condition. This may include using gentle products and avoiding certain techniques that may exacerbate the condition.</p><h3>Contraindications and Safety Rules</h3><p>There are certain contraindications and safety rules that must be followed in a barbershop environment. For example:</p><p>DO NOT use sharp objects or chemicals near open flames or sparks</p><p>DO NOT touch clients' faces or bodies without proper sanitation and disinfection procedures</p><h3>Failure Mode and Recovery</h3><p>A failure mode that can occur in a barbershop environment is a slip or fall due to wet or slippery floors. This can happen when a client spills water or a barber drops a wet towel on the floor. To recover from this failure mode, the barber should immediately clean up the spill and dry the floor to prevent further accidents.</p><h3>Correct Execution</h3><p>Correct execution of workplace safety procedures can be observed visually by looking for the following cues:</p><ul><li>Barbers wearing gloves and other PPE when necessary</li><li>Equipment and surfaces being sanitized and disinfected after each use</li><li>A clean and clutter-free floor</li><li>Proper lighting and ventilation</li></ul><h3>Sanitation, Disinfection, and Infection Control</h3><p>Sanitation, disinfection, and infection control are crucial in a barbershop environment. This includes sanitizing and disinfecting all equipment and surfaces, washing hands frequently, and using proper techniques to prevent the spread of infection.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-5-q1",
                              "question": "What should you do if a client presents with a skin condition, such as eczema or psoriasis?",
                              "options": [
                                        "Use a gentle product and avoid certain techniques",
                                        "Use a harsh product to try to cure the condition",
                                        "Touch the affected area without proper sanitation and disinfection",
                                        "Refuse to serve the client"
                              ],
                              "correctAnswer": 0,
                              "explanation": "When dealing with clients who have skin conditions, it is essential to take extra precautions to avoid irritating the condition. This includes using gentle products and avoiding certain techniques that may exacerbate the condition."
                    },
                    {
                              "id": "barber-lesson-5-q2",
                              "question": "What is the correct procedure for handling a slip or fall due to a wet or slippery floor?",
                              "options": [
                                        "Clean up the spill and dry the floor immediately",
                                        "Leave the spill and continue working",
                                        "Call for emergency assistance",
                                        "Blame the client for the accident"
                              ],
                              "correctAnswer": 0,
                              "explanation": "A slip or fall due to a wet or slippery floor can be a serious accident. To recover from this failure mode, the barber should immediately clean up the spill and dry the floor to prevent further accidents."
                    },
                    {
                              "id": "barber-lesson-5-q3",
                              "question": "What is a contraindication in a barbershop environment?",
                              "options": [
                                        "Using sharp objects or chemicals near open flames or sparks",
                                        "Wearing gloves and other PPE when necessary",
                                        "Sanitizing and disinfecting all equipment and surfaces",
                                        "Touching clients' faces or bodies without proper sanitation and disinfection"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Using sharp objects or chemicals near open flames or sparks is a contraindication in a barbershop environment, as it can cause serious injury or start a fire."
                    },
                    {
                              "id": "barber-lesson-5-q4",
                              "question": "A client presents with a highly contagious infection, such as ringworm. What do you do?",
                              "options": [
                                        "Refuse to serve the client",
                                        "Use proper sanitation and disinfection procedures to prevent the spread of infection",
                                        "Touch the affected area without proper sanitation and disinfection",
                                        "Use a harsh product to try to cure the infection"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When dealing with clients who have contagious infections, it is essential to use proper sanitation and disinfection procedures to prevent the spread of infection."
                    },
                    {
                              "id": "barber-lesson-5-q5",
                              "question": "What is an example of correct execution of workplace safety procedures?",
                              "options": [
                                        "A cluttered and dirty floor",
                                        "A barber not wearing gloves or other PPE when necessary",
                                        "A client being touched without proper sanitation and disinfection",
                                        "A clean and clutter-free floor, with barbers wearing gloves and other PPE when necessary"
                              ],
                              "correctAnswer": 3,
                              "explanation": "Correct execution of workplace safety procedures can be observed visually by looking for cues such as a clean and clutter-free floor, barbers wearing gloves and other PPE when necessary, and proper lighting and ventilation."
                    }
          ],
        },
        {
          slug: 'barber-lesson-6',
          title: 'Client Consultation',
          order: 6,
          domainKey: 'infection_control',
          objective:
            'Conduct a complete client consultation that identifies needs, contraindications, and service goals before beginning any service.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          learningObjectives: [
            'Conduct a complete client consultation using open-ended questions',
            'Identify contraindications that require service refusal or modification',
            'Document client service goals and preferences accurately',
            'Recognize scalp and skin conditions that affect service decisions',
            'Explain the consultation process to a client professionally',
          ],
          competencyChecks: [
            {
              key: 'consultation_live',
              label: 'Live Client Consultation',
              description:
                'Student conducts a full consultation on a real or practice client — covers goals, contraindications, and service plan.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
          ],
          instructorNotes: `Observe the full consultation — student must ask about scalp conditions, allergies, and service history. Refusal criteria must be stated correctly if a contraindication is present.`,
          content: `<h2>Client Consultation</h2>

<h3>Objective</h3>
<p>By the end of this lesson, you will be able to conduct a structured client consultation, identify contraindications that prevent service, and document client preferences for future visits.</p>

<h3>Key Concepts</h3>
<ul>
  <li>Consultation happens before every service — not just the first visit</li>
  <li>Contraindications — conditions that prevent you from performing a service safely</li>
  <li>Client history — medications, allergies, and scalp conditions affect service outcomes</li>
  <li>Managing expectations — be honest about what is achievable with the client's hair type</li>
  <li>Client record cards — document preferences, products used, and any reactions</li>
</ul>

<h3>Explanation</h3>
<p><strong>The consultation process:</strong></p>
<ol>
  <li><strong>Greet and seat</strong> — welcome the client, apply neck strip and cape</li>
  <li><strong>Ask open-ended questions</strong> — "What are we doing today?" not "Same as last time?"</li>
  <li><strong>Assess the hair and scalp</strong> — look for conditions before touching</li>
  <li><strong>Identify contraindications</strong> — scalp infections, open wounds, contagious conditions</li>
  <li><strong>Confirm the service</strong> — repeat back what you will do before starting</li>
  <li><strong>Document</strong> — record the service, products used, and any client notes</li>
</ol>
<p><strong>Contraindications that require referral:</strong> Active scalp infections (ringworm, impetigo), open wounds or sores, contagious skin conditions, severe scalp inflammation. Do not perform services on these clients — refer them to a physician.</p>
<p><strong>Managing expectations:</strong> If a client shows you a photo of a style that will not work with their hair type, be honest. Explain what is achievable and offer an alternative. A client who gets a realistic result they were prepared for is more loyal than one who got a surprise.</p>

<h3>Real-World Application</h3>
<p>A new client sits down and asks for a skin fade. During your scalp assessment, you notice a circular, scaly patch near the crown — a classic sign of ringworm (tinea capitis). You must decline the service, explain that you noticed a scalp condition that requires a doctor's evaluation, and refer them out. Do not name the condition as a diagnosis — you are not a physician. Simply say you cannot safely perform the service and recommend they see a doctor before their next visit.</p>

<h3>Summary</h3>
<ul>
  <li>Consult before every service — conditions change between visits</li>
  <li>Assess the scalp visually before touching</li>
  <li>Contraindications require referral, not service</li>
  <li>Confirm the service plan before starting — eliminate surprises</li>
  <li>Document every service on a client record card</li>
</ul>`,
          quizQuestions: [
            {
              id: 'mod1-l6-q1',
              question:
                "During a scalp assessment, you notice a circular, scaly patch on a new client's scalp. What should you do?",
              options: [
                'Proceed — it is probably just dry skin',
                'Apply a medicated shampoo and continue',
                'Decline the service and refer the client to a physician',
                'Disinfect the area and proceed with gloves',
              ],
              correctAnswer: 2,
              explanation:
                'Circular, scaly patches may indicate ringworm — a contraindication. Decline and refer. Do not diagnose.',
            },
            {
              id: 'mod1-l6-q2',
              question:
                'A client shows you a photo of a style. You know it will not work with their hair type. You should:',
              options: [
                'Attempt it anyway — the client knows what they want',
                'Be honest, explain what is achievable, and offer an alternative',
                'Do the style and let the client decide if they like it',
                'Refuse the service',
              ],
              correctAnswer: 1,
              explanation:
                'Managing expectations honestly builds trust and loyalty. Surprises — even well-intentioned ones — damage the relationship.',
            },
            {
              id: 'mod1-l6-q3',
              question: 'Which question is better for a client consultation?',
              options: [
                '"Same as last time?"',
                '"Short or long?"',
                '"What are we doing today?"',
                '"Do you want a fade?"',
              ],
              correctAnswer: 2,
              explanation:
                'Open-ended questions give the client space to describe what they want rather than confirming assumptions.',
            },
            {
              id: 'mod1-l6-q4',
              question: 'Why should you document each client service on a record card?',
              options: [
                'It is required by Indiana law for all services',
                'To track products used, preferences, and any reactions for future visits',
                "To calculate the client's total spend",
                'To share with other barbers in the shop',
              ],
              correctAnswer: 1,
              explanation:
                'Client records allow you to replicate successful services and avoid repeating mistakes.',
            },
            {
              id: 'mod1-l6-q5',
              question:
                'At what point in the service should you confirm the service plan with the client?',
              options: [
                'After the first cut',
                'At the end of the service',
                'Before starting — after the consultation',
                'Only if the client asks',
              ],
              correctAnswer: 2,
              explanation:
                'Confirming before you start eliminates misunderstandings and protects both you and the client.',
            },
          ],
        },
        {
          slug: 'barber-module-1-checkpoint',
          title: 'Module 1 Checkpoint — Foundations & Safety',
          order: 7,
          domainKey: 'infection_control',
          objective:
            'Demonstrate mastery of professional conduct, tools, sanitation, workplace safety, and client consultation.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 1 Checkpoint — Foundations & Safety</h2>
<p>This checkpoint covers all six lessons in Module 1: Introduction to Barbering, Professional Conduct & Ethics, Tools & Equipment, Sanitation & Infection Control, Workplace Safety, and Client Consultation.</p>
<p>You must score <strong>70% or higher</strong> to unlock Module 2. Review your lesson notes before starting.</p>`,
          quizQuestions: [
            {
              id: 'cp1-q1',
              question:
                'A walk-in asks you to cut their hair. You are a registered apprentice, not yet licensed. What is the correct action?',
              options: [
                'Perform the cut — apprentices can work independently',
                'Decline and get your supervising licensed barber',
                'Do a dry cut only since that does not require a license',
                'Ask the client to sign a waiver',
              ],
              correctAnswer: 1,
              explanation:
                'Apprentices must work under licensed supervision at all times. Independent practice violates Indiana law.',
            },
            {
              id: 'cp1-q2',
              question:
                'Your clipper cord has a crack in the insulation. A client is waiting. You should:',
              options: [
                'Use it carefully for this one client',
                'Wrap the crack with electrical tape and proceed',
                'Not use it — report it and use a backup',
                'Finish the client, then report it',
              ],
              correctAnswer: 2,
              explanation:
                'Damaged electrical equipment is an electrocution risk. Never use it regardless of client wait time.',
            },
            {
              id: 'cp1-q3',
              question:
                'What level of decontamination is required for barbering tools between clients in Indiana?',
              options: ['Sanitation', 'Disinfection', 'Sterilization', 'Hot water rinse'],
              correctAnswer: 1,
              explanation:
                'Indiana requires EPA-registered disinfection of all tools between every client.',
            },
            {
              id: 'cp1-q4',
              question:
                'During a scalp assessment, you notice a circular scaly patch on a new client. You should:',
              options: [
                'Proceed — it is probably dandruff',
                'Apply medicated shampoo and continue',
                'Decline the service and refer the client to a physician',
                'Disinfect the area and proceed with gloves',
              ],
              correctAnswer: 2,
              explanation:
                'Circular scaly patches may indicate ringworm — a contraindication. Decline and refer without diagnosing.',
            },
            {
              id: 'cp1-q5',
              question:
                'Mid-haircut, your blade nicks a client and draws blood. Your FIRST action is:',
              options: [
                'Apply a styptic pencil immediately',
                'Stop the service and put on gloves before touching the area',
                'Finish the cut quickly, then address the nick',
                'Ask the client if they want you to continue',
              ],
              correctAnswer: 1,
              explanation:
                'Universal Precautions: gloves before any blood contact. Stop the service first.',
            },
            {
              id: 'cp1-q6',
              question: 'When using shears, which finger should be the only one that moves?',
              options: ['Index finger', 'Ring finger', 'Thumb', 'Pinky'],
              correctAnswer: 2,
              explanation:
                'Only the thumb moves when cutting with shears. The bottom blade stays stationary.',
            },
            {
              id: 'cp1-q7',
              question:
                'A client shares personal information in the chair. Another client later asks about them. You should:',
              options: [
                'Share only general information',
                'Say nothing — client conversations are confidential',
                'Tell them to ask the person directly',
                'Share if the information is not sensitive',
              ],
              correctAnswer: 1,
              explanation:
                'Client confidentiality is an ethical obligation. All personal information stays private.',
            },
            {
              id: 'cp1-q8',
              question:
                'What document is required on file for every chemical product in a barbershop?',
              options: [
                'Product receipt',
                'Safety Data Sheet (SDS)',
                'Manufacturer warranty',
                'OSHA inspection report',
              ],
              correctAnswer: 1,
              explanation:
                'OSHA requires a Safety Data Sheet (SDS) for every chemical product, accessible to all employees.',
            },
            {
              id: 'cp1-q9',
              question:
                'Which consultation question is most effective for understanding what a client wants?',
              options: [
                '"Same as last time?"',
                '"Short or long?"',
                '"What are we doing today?"',
                '"Do you want a fade?"',
              ],
              correctAnswer: 2,
              explanation:
                'Open-ended questions give clients space to describe their needs rather than confirming assumptions.',
            },
            {
              id: 'cp1-q10',
              question: 'How often must disinfectant solution be changed?',
              options: [
                'Once a week',
                'Once a month',
                'Daily or when visibly contaminated',
                'Only when it changes color',
              ],
              correctAnswer: 2,
              explanation:
                'Disinfectant loses effectiveness when contaminated. Indiana requires daily changes at minimum.',
            },
          ],
        },
      ],
    },

    // ── Module 2 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-2',
      title: 'Module 2: Hair Science & Scalp Analysis',
      orderIndex: 2,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'hair_science',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hair_structure', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'hair_growth_cycle', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'scalp_conditions', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'hair_texture', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-8',
          title: 'Structure of the Hair and Scalp',
          order: 1,
          domainKey: 'hair_science',
          objective: 'Identify the layers of the hair shaft and scalp anatomy.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          learningObjectives: [
            'Identify the three layers of the hair shaft: cuticle, cortex, and medulla',
            'Describe the structure of the hair follicle and its role in hair growth',
            'Explain how scalp anatomy affects service decisions',
            'Distinguish between the five layers of the scalp',
          ],
          content: `<h2>Introduction to Hair and Scalp Structure</h2><p>In this lesson, we will explore the layers of the hair shaft and scalp anatomy, which are essential for barbers to understand in order to provide effective and safe services. As a barber, it is crucial to have a thorough knowledge of the hair and scalp structure to identify potential issues and provide personalized advice to clients.</p><h3>Layers of the Hair Shaft</h3><p>The hair shaft is composed of three main layers: the medulla, cortex, and cuticle. The medulla is the innermost layer, but it is not always present in all hair types. The cortex is the middle layer, making up the majority of the hair shaft, and is responsible for the hair's strength, elasticity, and texture. The cuticle is the outermost layer, providing a protective barrier against external factors.</p><h3>Scalp Anatomy</h3><p>The scalp is composed of five layers: the epidermis, dermis, hypodermis, galea aponeurotica, and periosteum. The epidermis is the outermost layer, providing a barrier against external factors. The dermis is the layer beneath the epidermis, containing blood vessels, nerve endings, and hair follicles. The hypodermis is the subcutaneous layer, attaching the scalp to the skull. The galea aponeurotica is a fibrous layer, providing a protective covering for the scalp. The periosteum is the innermost layer, covering the skull bone.</p><h3>Tools and Equipment</h3><p>The following tools and equipment are required for this lesson:</p><ul><li>Magnifying glass or microscope</li><li>Hair samples (different types and textures)</li><li>Scalp models or diagrams</li><li>Sanitizing solutions and equipment</li></ul><h3>Sanitation and Infection Control</h3><p>It is essential to maintain a clean and sanitized environment when working with clients. This includes sanitizing equipment and tools, washing hands regularly, and using disposable gloves when necessary. Failure to follow proper sanitation and infection control procedures can lead to the spread of infections and diseases.</p><h3>Decision Block: Hair Type Variation</h3><p>IF a client has curly hair, THEN it is essential to use a wide-tooth comb or a detangling brush to minimize breakage and prevent damage. IF a client has straight hair, THEN a regular comb or brush can be used. However, IF a client has damaged or fragile hair, THEN it is recommended to use a gentle, sulfate-free shampoo and a wide-tooth comb or a detangling brush to minimize further damage.</p><h3>Contraindication: Do NOT Use Excessive Heat</h3><p>Do NOT use excessive heat when styling hair, as it can cause damage to the hair shaft and scalp. Excessive heat can lead to dryness, brittleness, and breakage, especially for clients with damaged or fragile hair.</p><h3>Failure Mode: Incorrect Angle</h3><p>What goes wrong: Using an incorrect angle when cutting or styling hair can lead to unevenness, choppy ends, and damage to the hair shaft. Why: This is often due to a lack of understanding of the hair and scalp structure, as well as poor technique. How to recover: To recover from this failure mode, it is essential to re-evaluate the client's hair and scalp, and adjust the angle and technique accordingly. This may involve using a different tool or equipment, or seeking guidance from a more experienced barber.</p><h3>Correct Execution</h3><p>Correct execution looks like this: the barber is standing at a 45-degree angle to the client, with the client's head positioned at a comfortable height. The barber is using a comb or brush to section the hair, and is cutting or styling the hair at a slight angle to prevent choppy ends. The barber is also maintaining a clean and sanitized environment, and is using proper sanitation and infection control procedures.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-8-q1",
                              "question": "What is the outermost layer of the hair shaft?",
                              "options": [
                                        "Medulla",
                                        "Cortex",
                                        "Cuticle",
                                        "Dermis"
                              ],
                              "correctAnswer": 2,
                              "explanation": "The cuticle is the outermost layer of the hair shaft, providing a protective barrier against external factors."
                    },
                    {
                              "id": "barber-lesson-8-q2",
                              "question": "A client presents with curly hair and asks for a haircut. What do you do?",
                              "options": [
                                        "Use a regular comb and cut the hair straight",
                                        "Use a wide-tooth comb and cut the hair at an angle",
                                        "Use a detangling brush and cut the hair in small sections",
                                        "Use a razor and cut the hair close to the scalp"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When working with curly hair, it is essential to use a wide-tooth comb or a detangling brush to minimize breakage and prevent damage. Cutting the hair at an angle also helps to prevent choppy ends and unevenness."
                    },
                    {
                              "id": "barber-lesson-8-q3",
                              "question": "What is the layer of the scalp that attaches the scalp to the skull?",
                              "options": [
                                        "Epidermis",
                                        "Dermis",
                                        "Hypodermis",
                                        "Galea aponeurotica"
                              ],
                              "correctAnswer": 2,
                              "explanation": "The hypodermis is the subcutaneous layer that attaches the scalp to the skull, providing a protective covering for the scalp."
                    },
                    {
                              "id": "barber-lesson-8-q4",
                              "question": "A client has damaged and fragile hair. What do you recommend?",
                              "options": [
                                        "Use a sulfate-based shampoo and a regular comb",
                                        "Use a gentle, sulfate-free shampoo and a wide-tooth comb",
                                        "Use a heat styling tool to add volume and texture",
                                        "Use a razor to cut the hair close to the scalp"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When working with damaged and fragile hair, it is essential to use a gentle, sulfate-free shampoo and a wide-tooth comb or a detangling brush to minimize further damage and prevent breakage."
                    },
                    {
                              "id": "barber-lesson-8-q5",
                              "question": "What is the consequence of using excessive heat when styling hair?",
                              "options": [
                                        "It adds volume and texture to the hair",
                                        "It causes damage to the hair shaft and scalp",
                                        "It prevents breakage and split ends",
                                        "It makes the hair more manageable and easy to style"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Using excessive heat when styling hair can cause damage to the hair shaft and scalp, leading to dryness, brittleness, and breakage, especially for clients with damaged or fragile hair."
                    }
          ],
        },
        {
          slug: 'barber-lesson-9',
          title: 'Hair Growth Cycle',
          order: 2,
          domainKey: 'hair_science',
          objective: 'Explain the three phases of the hair growth cycle.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>The Hair Growth Cycle</h2>
<p>Hair grows in a continuous cycle with three distinct phases:</p>
<h3>Anagen (Growth Phase)</h3>
<p>Active growth phase lasting 2–7 years. About 85% of scalp hairs are in anagen at any time. Hair grows approximately 1/2 inch per month.</p>
<h3>Catagen (Transition Phase)</h3>
<p>A short transitional phase lasting 2–3 weeks. The follicle shrinks and detaches from the dermal papilla.</p>
<h3>Telogen (Resting Phase)</h3>
<p>The resting phase lasting 3–4 months. The old hair is shed and a new anagen hair begins to grow. Losing 50–100 hairs per day is normal.</p>
<h3>Why This Matters for Barbers</h3>
<p>Understanding the growth cycle helps explain why haircuts grow out at different rates and why some clients experience thinning.</p>`,
        },
        {
          slug: 'barber-lesson-10',
          title: 'Hair Texture, Density & Porosity',
          order: 3,
          domainKey: 'hair_science',
          objective: 'Assess hair texture, density, and porosity to select appropriate techniques.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>Lesson Overview</h2><p>This lesson covers the fundamentals of hair texture, density, and porosity, and how to assess these factors to select appropriate techniques for clients. By the end of this lesson, you will be able to identify and analyze hair texture, density, and porosity, and apply this knowledge to provide effective hair care services.</p><h2>Tools and Equipment</h2><p>The following tools and equipment are required for this lesson:</p><ul><li>Hair analysis tools (e.g. hair texture analyzer, density gauge)</li><li>Sanitizing solutions (e.g. Barbicide)</li><li>Disinfectant wipes</li><li>Gloves</li><li>Hair samples (various textures and densities)</li></ul><h2>Assessing Hair Texture, Density, and Porosity</h2><p>Hair texture refers to the natural curl pattern or straightness of the hair. Density refers to the amount of hair on the scalp, while porosity refers to the hair's ability to absorb moisture. To assess these factors, follow these steps:</p><ol><li>Wash and towel-dry the hair to remove any product or impurities.</li><li>Use a hair analysis tool to determine the hair texture and density.</li><li>Perform a porosity test by applying a small amount of water to a strand of hair and observing how quickly it absorbs.</li></ol><h2>Decision Making</h2><p>When assessing hair texture, density, and porosity, consider the following IF/THEN decision block:</p><p>IF the client has fine, fragile hair, THEN use gentle techniques and avoid excessive heat or chemical processing.</p><p>IF the client has coarse, curly hair, THEN use more intense techniques and consider using a moisturizing treatment to enhance manageability.</p><h2>Sanitation and Infection Control</h2><p>It is essential to maintain proper sanitation and infection control when working with clients. Always:</p><ul><li>Wear gloves when handling hair or scalp.</li><li>Use sanitizing solutions to clean and disinfect equipment and tools.</li><li>Disinfect the work area and chair between clients.</li></ul><p>DO NOT touch your face or eyes while working with clients, as this can spread infection.</p><h2>Contraindications and Safety Rules</h2><p>When working with clients, be aware of the following contraindications and safety rules:</p><ul><li>DO NOT use excessive heat or chemical processing on damaged or fragile hair.</li><li>DO NOT perform services on clients with certain skin conditions (e.g. open sores, eczema) without proper precautions and consent.</li></ul><h2>Failure Modes and Recovery</h2><p>Failure to properly assess hair texture, density, and porosity can result in:</p><ul><li>Over- or under-processing of hair, leading to damage or unwanted results.</li><li>Inadequate sanitation and infection control, leading to the spread of infection.</li></ul><p>To recover from these failure modes, re-assess the hair and adjust techniques accordingly, and always prioritize sanitation and infection control.</p><h2>Correct Execution</h2><p>Correct execution of hair texture, density, and porosity assessment involves:</p><ul><li>Using the correct angles and positioning when analyzing hair (e.g. holding the hair at a 45-degree angle to assess texture).</li><li>Observing the hair's appearance cues (e.g. shine, elasticity) to determine its condition and porosity.</li></ul>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-10-q1",
                              "question": "What is the primary factor that determines hair texture?",
                              "options": [
                                        "Genetics",
                                        "Hair care routine",
                                        "Scalp condition",
                                        "Environmental factors"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Hair texture is primarily determined by genetics, although it can be influenced by other factors such as hair care routine and environmental factors."
                    },
                    {
                              "id": "barber-lesson-10-q2",
                              "question": "A client presents with fine, fragile hair. What do you do?",
                              "options": [
                                        "Use intense heat styling tools",
                                        "Apply a moisturizing treatment",
                                        "Use a gentle, sulfate-free shampoo",
                                        "Perform a chemical processing treatment"
                              ],
                              "correctAnswer": 2,
                              "explanation": "When working with fine, fragile hair, it is essential to use gentle techniques and avoid excessive heat or chemical processing. Using a gentle, sulfate-free shampoo is the best option to minimize damage and preserve the hair's natural moisture."
                    },
                    {
                              "id": "barber-lesson-10-q3",
                              "question": "What is the purpose of performing a porosity test on a client's hair?",
                              "options": [
                                        "To determine hair texture",
                                        "To assess hair density",
                                        "To evaluate the hair's ability to absorb moisture",
                                        "To diagnose scalp conditions"
                              ],
                              "correctAnswer": 2,
                              "explanation": "A porosity test is used to evaluate the hair's ability to absorb moisture, which can help determine the best course of treatment for the client's hair."
                    },
                    {
                              "id": "barber-lesson-10-q4",
                              "question": "A client has a skin condition that requires special precautions when performing hair services. What do you do?",
                              "options": [
                                        "Perform the service as usual",
                                        "Use gloves and sanitize equipment",
                                        "Refer the client to a dermatologist",
                                        "Decline to perform the service"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When working with clients who have skin conditions, it is essential to take special precautions to prevent the spread of infection. Using gloves and sanitizing equipment is the best option to minimize the risk of infection."
                    },
                    {
                              "id": "barber-lesson-10-q5",
                              "question": "What is a common failure mode when assessing hair texture, density, and porosity, and how can it be recovered?",
                              "options": [
                                        "Over-processing of hair, which can be recovered by re-assessing the hair and adjusting techniques",
                                        "Under-processing of hair, which can be recovered by using more intense techniques",
                                        "Inadequate sanitation and infection control, which can be recovered by re-sanitizing equipment and tools",
                                        "All of the above"
                              ],
                              "correctAnswer": 3,
                              "explanation": "All of the above options are common failure modes when assessing hair texture, density, and porosity. Over-processing of hair can be recovered by re-assessing the hair and adjusting techniques, under-processing of hair can be recovered by using more intense techniques, and inadequate sanitation and infection control can be recovered by re-sanitizing equipment and tools."
                    }
          ],
        },
        {
          slug: 'barber-lesson-11',
          title: 'Scalp Conditions & Disorders',
          order: 4,
          domainKey: 'hair_science',
          objective: 'Identify common scalp conditions and determine when to refer clients.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Common Scalp Conditions</h2>
<h3>Dandruff (Pityriasis)</h3>
<p>Excessive shedding of dead scalp cells. Can be treated with medicated shampoos. Not contagious.</p>
<h3>Seborrheic Dermatitis</h3>
<p>Inflammatory condition causing red, flaky, greasy patches. More severe than dandruff. Refer to a dermatologist for persistent cases.</p>
<h3>Tinea Capitis (Ringworm)</h3>
<p>A fungal infection of the scalp. Highly contagious. Do NOT perform services — refer to a physician immediately.</p>
<h3>Alopecia</h3>
<p>Hair loss that can be caused by genetics, stress, hormones, or autoimmune conditions. Androgenetic alopecia (male pattern baldness) is the most common type.</p>
<h3>Psoriasis</h3>
<p>Autoimmune condition causing thick, silvery scales. Not contagious. Services can be performed if skin is not broken.</p>`,
        },
        {
          slug: 'barber-lesson-12',
          title: 'Client Consultation',
          order: 5,
          domainKey: 'hair_science',
          objective:
            'Conduct a professional client consultation to assess needs and set expectations.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>The Client Consultation</h2>
<p>Every service begins with a consultation. This protects you legally and ensures client satisfaction.</p>
<h3>What to Assess</h3>
<ul>
<li>Hair type, texture, density, and porosity</li>
<li>Scalp condition — any contraindications?</li>
<li>Client's desired style and lifestyle</li>
<li>Previous chemical services</li>
<li>Allergies or sensitivities</li>
</ul>
<h3>Communication Skills</h3>
<p>Use open-ended questions: "What are you looking for today?" and "How do you style your hair at home?" Listen more than you talk.</p>
<h3>Managing Expectations</h3>
<p>If a client's desired style is not achievable with their hair type, explain why and offer realistic alternatives. Never promise results you cannot deliver.</p>`,
        },
        {
          slug: 'barber-lesson-13',
          title: 'Shampoo & Scalp Massage',
          order: 6,
          domainKey: 'hair_science',
          objective: 'Perform a professional shampoo service and scalp massage.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Shampoo Service</h2>
<h3>Selecting the Right Shampoo</h3>
<ul>
<li>Normal hair — balanced pH shampoo</li>
<li>Oily scalp — clarifying shampoo</li>
<li>Dry or damaged hair — moisturizing shampoo</li>
<li>Color-treated hair — sulfate-free shampoo</li>
</ul>
<h3>Shampoo Procedure</h3>
<ol>
<li>Drape client with towel and cape</li>
<li>Adjust water temperature — test on your wrist first</li>
<li>Wet hair thoroughly</li>
<li>Apply shampoo and work into a lather</li>
<li>Massage scalp using rotary movements with fingertips (not nails)</li>
<li>Rinse thoroughly — no residue</li>
<li>Apply conditioner if needed, rinse</li>
<li>Towel dry gently</li>
</ol>`,
        },
        {
          slug: 'barber-module-2-checkpoint',
          title: 'Hair Science Checkpoint',
          order: 7,
          domainKey: 'hair_science',
          objective: 'Demonstrate mastery of hair science and scalp analysis.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 2 Review — Hair Science & Scalp Analysis</h2><p>Review before taking this checkpoint: hair shaft layers (cuticle, cortex, medulla), the three growth phases (anagen, catagen, telogen), hair texture/density/porosity, common scalp conditions and contraindications, client consultation, and shampoo procedure. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'hs-q1',
              question: 'Which layer of the hair shaft contains melanin and determines hair color?',
              options: ['Cuticle', 'Cortex', 'Medulla', 'Follicle'],
              correctAnswer: 1,
              explanation: 'The cortex contains melanin granules that give hair its color.',
            },
            {
              id: 'hs-q2',
              question: 'During which phase of the hair growth cycle is hair actively growing?',
              options: ['Telogen', 'Catagen', 'Anagen', 'Exogen'],
              correctAnswer: 2,
              explanation: 'Anagen is the active growth phase, lasting 2-7 years.',
            },
            {
              id: 'hs-q3',
              question: 'A client has tinea capitis. What should you do?',
              options: [
                'Proceed with extra sanitation precautions',
                'Perform a dry cut only',
                'Decline service and refer to a physician',
                'Use medicated shampoo and proceed',
              ],
              correctAnswer: 2,
              explanation:
                'Tinea capitis is a contagious fungal infection — no services should be performed.',
            },
            {
              id: 'hs-q4',
              question: 'Hair that absorbs moisture quickly but loses it fast has:',
              options: ['Low porosity', 'Normal porosity', 'High porosity', 'No porosity'],
              correctAnswer: 2,
              explanation: 'High porosity hair has a damaged cuticle that cannot retain moisture.',
            },
            {
              id: 'hs-q5',
              question: 'What is the correct water temperature check before shampooing a client?',
              options: [
                'Test on the back of your hand',
                'Test on your wrist',
                'Ask the client to test it',
                'Use cold water always',
              ],
              correctAnswer: 1,
              explanation:
                'Testing on your wrist gives a more accurate temperature reading than the hand.',
            },
            {
              id: 'hs-q6',
              question: 'Approximately how much hair does a person normally shed per day?',
              options: ['5-10 hairs', '50-100 hairs', '200-300 hairs', '500+ hairs'],
              correctAnswer: 1,
              explanation: 'Losing 50-100 hairs per day is normal as part of the telogen phase.',
            },
          ],
        },
      ],
    },

    // ── Module 3 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-3',
      title: 'Module 3: Tools, Equipment & Ergonomics',
      orderIndex: 3,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'tools_equipment',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'clipper_operation', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'scissor_technique', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'razor_safety', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'tool_maintenance', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-15',
          title: 'Clippers & Trimmers — Types and Guards',
          order: 1,
          domainKey: 'tools_equipment',
          objective: 'Identify clipper types, guard sizes, and their uses.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          learningObjectives: [
            'Identify the difference between clippers and trimmers and when to use each',
            'Match guard sizes to their corresponding hair lengths',
            'Demonstrate correct clipper blade alignment and tension adjustment',
            'Explain proper clipper maintenance: oiling, cleaning, and blade replacement',
          ],
          competencyChecks: [
            {
              key: 'clipper_maintenance',
              label: 'Clipper Maintenance Demonstration',
              description:
                'Student oils, cleans, and correctly adjusts blade tension on a clipper in front of the instructor.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
          ],
          instructorNotes: `Blade tension check: student must demonstrate both too-loose and correct tension settings. Oil application must be on the correct points — not flooded. Blade must be removed and cleaned, not just sprayed.`,
          content: `<h2>Clippers and Trimmers</h2>
<h3>Types of Clippers</h3>
<ul>
<li><strong>Corded clippers</strong> — consistent power, best for heavy-duty cutting</li>
<li><strong>Cordless clippers</strong> — freedom of movement, requires charging</li>
<li><strong>Detachable blade clippers</strong> — blades swap out for different lengths</li>
</ul>
<h3>Guard Sizes</h3>
<p>Guards (also called attachments) control cutting length:</p>
<ul>
<li>#0 (no guard) — closest cut, skin fade</li>
<li>#1 — 1/8 inch</li>
<li>#2 — 1/4 inch</li>
<li>#3 — 3/8 inch</li>
<li>#4 — 1/2 inch</li>
<li>#7 and #8 — longer lengths for bulk removal</li>
</ul>
<h3>Trimmers</h3>
<p>Trimmers (T-liners) are used for edging, lining, and detail work. They have a narrower blade than clippers.</p>`,
        },
        {
          slug: 'barber-lesson-16',
          title: 'Scissors & Shears',
          order: 2,
          domainKey: 'tools_equipment',
          objective: 'Select and use the correct scissors for different cutting techniques.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          content: `<h2>Introduction to Scissors & Shears</h2><p>In this lesson, we will cover the selection and use of the correct scissors for different cutting techniques. As a barber, it is essential to understand the various types of scissors and shears available and how to use them safely and effectively.</p><h3>Tools and Equipment Required</h3><ul><li>Thinning scissors</li><li>Curved scissors</li><li>Texturizing shears</li><li>Sanitizing solution</li><li>Disinfectant spray</li></ul><h3>Selection and Use of Scissors</h3><p>When selecting scissors, consider the hair type and cutting technique. For example, thinning scissors are ideal for cutting fine or damaged hair, while curved scissors are better suited for cutting curly or wavy hair.</p><p>IF the client has dry or damaged hair, THEN use thinning scissors to minimize further damage. IF the client has curly or wavy hair, THEN use curved scissors to enhance the natural texture.</p><h3>Sanitation and Infection Control</h3><p>It is crucial to maintain sanitation and infection control when using scissors and shears. Always sanitize the scissors and shears with a sanitizing solution before and after each use. Disinfect the scissors and shears with a disinfectant spray at the end of each day.</p><p>DO NOT share scissors or shears with other barbers or clients, as this can spread infection and disease.</p><h3>Failure Mode and Recovery</h3><p>A common failure mode when using scissors is cutting the hair too short or unevenly. This can happen when the barber is not paying attention to the length or angle of the cut. To recover from this failure mode, the barber can use texturizing shears to blend the layers and create a more natural look.</p><h3>Correct Execution</h3><p>Correct execution of scissors and shears techniques involves holding the scissors at a 45-degree angle, with the blades facing the direction of the cut. The scissors should be opened and closed smoothly, with a gentle snipping motion. The hair should be cut in small, even sections, with the scissors gliding through the hair with ease.</p><h3>Visual Cues</h3><p>When using scissors and shears, look for the following visual cues: the hair should be cut evenly, with no visible lines or layers. The scissors should be moving smoothly, with no hesitation or snagging. The client's hair should be looking healthy and natural, with no visible damage or split ends.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-16-q1",
                              "question": "What type of scissors is ideal for cutting fine or damaged hair?",
                              "options": [
                                        "Thinning scissors",
                                        "Curved scissors",
                                        "Texturizing shears",
                                        "Regular scissors"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Thinning scissors are designed to minimize further damage to fine or damaged hair."
                    },
                    {
                              "id": "barber-lesson-16-q2",
                              "question": "A client presents with curly hair and wants a trim. What type of scissors should you use?",
                              "options": [
                                        "Thinning scissors",
                                        "Curved scissors",
                                        "Texturizing shears",
                                        "Regular scissors"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Curved scissors are better suited for cutting curly or wavy hair, as they enhance the natural texture."
                    },
                    {
                              "id": "barber-lesson-16-q3",
                              "question": "What is the correct angle to hold the scissors when cutting hair?",
                              "options": [
                                        "30 degrees",
                                        "45 degrees",
                                        "60 degrees",
                                        "90 degrees"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct angle to hold the scissors is 45 degrees, with the blades facing the direction of the cut."
                    },
                    {
                              "id": "barber-lesson-16-q4",
                              "question": "A client has dry and damaged hair, and you accidentally cut it too short. What can you do to recover from this failure mode?",
                              "options": [
                                        "Use thinning scissors to cut more hair",
                                        "Use texturizing shears to blend the layers",
                                        "Use a hair mask to moisturize the hair",
                                        "Start over with a new haircut"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Using texturizing shears to blend the layers can help recover from cutting the hair too short, as it creates a more natural look."
                    },
                    {
                              "id": "barber-lesson-16-q5",
                              "question": "What is a contraindication when using scissors and shears?",
                              "options": [
                                        "Sharing scissors with other barbers",
                                        "Sanitizing scissors before each use",
                                        "Using scissors with dull blades",
                                        "Cutting hair with the scissors at a 45-degree angle"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Sharing scissors with other barbers is a contraindication, as it can spread infection and disease."
                    }
          ],
        },
        {
          slug: 'barber-lesson-17',
          title: 'Straight Razor & Safety Razor',
          order: 3,
          domainKey: 'tools_equipment',
          objective: 'Safely handle, use, and maintain straight and safety razors.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          learningObjectives: [
            'Demonstrate safe straight razor handling — correct grip, angle, and stroke direction',
            'Replace a safety razor blade correctly and dispose of the used blade in a sharps container',
            'Explain the difference between a straight razor and a shavette',
            'Identify when a razor is too dull for safe use',
            'Apply correct strop technique to maintain a straight razor edge',
          ],
          competencyChecks: [
            {
              key: 'razor_blade_change',
              label: 'Safety Razor Blade Change',
              description:
                'Student removes used blade safely, places it in sharps container, and inserts a fresh blade correctly.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
            {
              key: 'straight_razor_grip',
              label: 'Straight Razor Grip & Angle',
              description:
                'Student demonstrates correct grip, 30-degree blade angle, and with-the-grain first pass on a practice surface.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
          ],
          instructorNotes: `Blade change: used blade must go directly into sharps container — not the trash, not the counter. Straight razor grip: check thumb placement and blade angle before any live client work. Student must not proceed to live shaving until both checks are signed off.`,
          content: `<h2>Razors in Barbering</h2>
<h3>Straight Razor (Cut-Throat Razor)</h3>
<p>The traditional barber's razor. Requires skill and practice. Used for shaving, edging, and razor cutting techniques.</p>
<ul>
<li>Must be stropped before each use to align the blade edge</li>
<li>Honed periodically to restore sharpness</li>
<li>Never used on a client with skin infections or open wounds</li>
</ul>
<h3>Shavette (Disposable Blade Straight Razor)</h3>
<p>Uses replaceable blades — the professional standard for sanitation. Each blade is used once and disposed of in a sharps container.</p>
<h3>Safety Razor</h3>
<p>Double-edge safety razor with a guard bar. Less aggressive than a straight razor. Good for beginners learning shaving technique.</p>
<h3>Razor Safety Rules</h3>
<ul>
<li>Always cut with the grain on the first pass</li>
<li>Keep the skin taut with your free hand</li>
<li>Never leave a razor open and unattended</li>
<li>Dispose of blades immediately after use</li>
</ul>`,
        },
        {
          slug: 'barber-lesson-18',
          title: 'Clipper Maintenance & Blade Care',
          order: 4,
          domainKey: 'tools_equipment',
          objective:
            'Perform routine clipper maintenance to extend tool life and ensure performance.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Clipper Maintenance</h2>
<h3>Daily Maintenance</h3>
<ol>
<li>Brush hair from blades after every client</li>
<li>Apply 2–3 drops of clipper oil to the blade while running</li>
<li>Wipe excess oil with a clean cloth</li>
<li>Spray blades with disinfectant spray between clients</li>
</ol>
<h3>Blade Alignment</h3>
<p>If clippers are pulling or cutting unevenly, the blades may need alignment. The top blade should sit slightly behind the bottom blade — never extend past it.</p>
<h3>Blade Sharpening</h3>
<p>Dull blades pull hair instead of cutting cleanly. Have blades professionally sharpened or replaced every 3–6 months depending on use.</p>
<h3>Motor Care</h3>
<p>Never submerge clippers in liquid. Keep vents clear of hair buildup. Store in a dry location.</p>`,
        },
        {
          slug: 'barber-lesson-19',
          title: 'Ergonomics & Body Mechanics',
          order: 5,
          domainKey: 'tools_equipment',
          objective: 'Apply ergonomic principles to prevent injury during barbering services.',
          durationMinutes: 15,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Ergonomics for Barbers</h2>
<p>Barbering is physically demanding. Poor posture and repetitive motion cause chronic injuries that end careers.</p>
<h3>Posture</h3>
<ul>
<li>Stand with feet shoulder-width apart</li>
<li>Keep your back straight — do not hunch over the client</li>
<li>Adjust the chair height so you work at elbow level</li>
<li>Shift weight between feet — do not lock your knees</li>
</ul>
<h3>Wrist and Hand Health</h3>
<ul>
<li>Keep wrists in a neutral position when cutting</li>
<li>Do not grip tools too tightly</li>
<li>Stretch hands and wrists between clients</li>
<li>Carpal tunnel syndrome is common in barbers — address early symptoms immediately</li>
</ul>
<h3>Breaks</h3>
<p>Take a 5-minute break every 2 hours. Sit down, stretch, and rest your hands.</p>`,
        },
        {
          slug: 'barber-lesson-20',
          title: 'Draping & Client Preparation',
          order: 6,
          domainKey: 'tools_equipment',
          objective: 'Properly drape a client for haircut and shaving services.',
          durationMinutes: 10,
          videoFile: '/videos/course-barber-consultation.mp4',
          content: `<h2>Draping the Client</h2>
<h3>Haircut Draping</h3>
<ol>
<li>Place a clean neck strip around the client's neck</li>
<li>Drape the cutting cape over the client</li>
<li>Secure the cape — snug but not tight</li>
<li>Tuck the neck strip over the cape collar to prevent hair from falling inside</li>
</ol>
<h3>Shave Draping</h3>
<ol>
<li>Recline the chair to a comfortable shaving position</li>
<li>Place a clean towel across the client's chest</li>
<li>Tuck a neck strip or towel around the collar</li>
</ol>
<h3>Why Draping Matters</h3>
<p>Proper draping protects the client's clothing, prevents hair from irritating the skin, and presents a professional image.</p>`,
        },
        {
          slug: 'barber-module-3-checkpoint',
          title: 'Tools & Equipment Checkpoint',
          order: 7,
          domainKey: 'tools_equipment',
          objective: 'Demonstrate mastery of barbering tools and equipment.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Introduction to Tools & Equipment Checkpoint</h2><p>In this lesson, we will review the essential tools and equipment required for barbering services. As a barber, it is crucial to demonstrate mastery of these tools to provide safe and effective services to clients.</p><h3>Required Tools and Equipment</h3><ul><li>Clippers</li><li>Scissors</li><li>Razors</li><li>Combs</li><li>Brushes</li><li>Sanitizing solutions</li><li>Disinfectant sprays</li></ul><h3>Sanitation and Disinfection</h3><p>Sanitation and disinfection are critical components of barbering services. All tools and equipment must be sanitized and disinfected after each use to prevent the spread of infections. The following steps must be taken:</p><ol><li>Wash hands with soap and water</li><li>Sanitize tools and equipment with a sanitizing solution</li><li>Disinfect tools and equipment with a disinfectant spray</li></ol><h3>Client Variations and Tool Selection</h3><p>When working with clients, it is essential to consider their hair type, skin condition, and personal preferences. The following decision block can be used to determine the best tools and equipment for each client:</p><p>IF the client has curly hair, THEN use a wide-tooth comb or a detangling brush to minimize breakage and tangles.</p><p>IF the client has sensitive skin, THEN use a razor with a protective guard to prevent nicks and cuts.</p><p>IF the client has a skin condition such as eczema or psoriasis, THEN avoid using harsh chemicals or abrasive tools that may exacerbate the condition.</p><h3>Contraindications and Safety Rules</h3><p>There are several contraindications and safety rules to consider when using barbering tools and equipment. The following are some examples:</p><ul><li>Do NOT use clippers or razors near open wounds or sensitive areas.</li><li>Do NOT use harsh chemicals or abrasive tools on clients with sensitive skin or skin conditions.</li><li>Do NOT share tools or equipment between clients to prevent the spread of infections.</li></ul><h3>Failure Modes and Recovery</h3><p>Failure modes can occur when using barbering tools and equipment. The following is an example of a failure mode and how to recover:</p><p>Failure mode: Using dull clippers can result in uneven cutting and damage to the client's hair.</p><p>Why: Dull clippers can cause the hair to split or break, leading to uneven cutting and damage.</p><p>Recovery: To recover from this failure mode, replace the dull clippers with sharp ones and re-cut the client's hair using the correct technique.</p><h3>Correct Execution</h3><p>Correct execution of barbering tools and equipment can be observed visually. The following are some examples:</p><ul><li>Clippers should be held at a 45-degree angle to the client's head, with the blade facing the direction of hair growth.</li><li>Scissors should be held with the blades facing the direction of hair growth, and the handles should be held firmly but not too tightly.</li><li>Razors should be held at a 20-degree angle to the client's skin, with the blade facing the direction of hair growth.</li></ul>`,
          quizQuestions: [
                    {
                              "id": "barber-module-3-checkpoint-q1",
                              "question": "A client presents with curly hair and sensitive skin. What tools and equipment would you use to minimize breakage and tangles, and prevent nicks and cuts?",
                              "options": [
                                        "A) Wide-tooth comb and razor with protective guard",
                                        "B) Fine-tooth comb and clippers",
                                        "C) Detangling brush and scissors",
                                        "D) Regular comb and straight razor"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The correct answer is A) Wide-tooth comb and razor with protective guard. The wide-tooth comb will help to minimize breakage and tangles, while the razor with protective guard will help to prevent nicks and cuts on the client's sensitive skin."
                    },
                    {
                              "id": "barber-module-3-checkpoint-q2",
                              "question": "What is the correct angle to hold clippers when cutting a client's hair?",
                              "options": [
                                        "A) 20 degrees",
                                        "B) 45 degrees",
                                        "C) 60 degrees",
                                        "D) 90 degrees"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct answer is B) 45 degrees. Holding clippers at a 45-degree angle to the client's head, with the blade facing the direction of hair growth, will help to achieve an even cut and prevent damage to the hair."
                    },
                    {
                              "id": "barber-module-3-checkpoint-q3",
                              "question": "A client has a skin condition such as eczema or psoriasis. What should you avoid using on this client?",
                              "options": [
                                        "A) Harsh chemicals or abrasive tools",
                                        "B) Sanitizing solutions or disinfectant sprays",
                                        "C) Clippers or razors",
                                        "D) Combs or brushes"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The correct answer is A) Harsh chemicals or abrasive tools. These can exacerbate the client's skin condition and cause further irritation or damage."
                    },
                    {
                              "id": "barber-module-3-checkpoint-q4",
                              "question": "What is the consequence of using dull clippers on a client's hair?",
                              "options": [
                                        "A) Even cutting and no damage",
                                        "B) Uneven cutting and damage to the hair",
                                        "C) Increased risk of infection",
                                        "D) Improved sanitation and disinfection"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct answer is B) Uneven cutting and damage to the hair. Using dull clippers can cause the hair to split or break, leading to uneven cutting and damage."
                    },
                    {
                              "id": "barber-module-3-checkpoint-q5",
                              "question": "A client presents with a open wound on their scalp. What should you do?",
                              "options": [
                                        "A) Use clippers or razors to cut the client's hair",
                                        "B) Use scissors to trim the client's hair",
                                        "C) Reschedule the appointment for a later date",
                                        "D) Use a sanitizing solution or disinfectant spray on the wound"
                              ],
                              "correctAnswer": 2,
                              "explanation": "The correct answer is C) Reschedule the appointment for a later date. Using clippers or razors near an open wound can cause further injury or infection, and it is best to reschedule the appointment for a later date when the wound has healed."
                    }
          ],
        },
      ],
    },

    // ── Module 4 ─────────────────────────────────────────────────────────────

    {
      slug: 'barber-module-4',
      title: 'Module 4: Haircutting Techniques',
      orderIndex: 4,
      minLessons: 8,
      maxLessons: 10,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'haircutting',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 5 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'fade_technique', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'clipper_over_comb', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'scissor_over_comb', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'lineup_edging', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'head_shape_analysis', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-22',
          title: 'Head Shape & Sectioning',
          order: 1,
          domainKey: 'haircutting',
          objective: 'Identify the sections of the head and use them to guide haircut structure.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          learningObjectives: [
            'Identify the seven sections of the head and their boundaries',
            'Use sectioning to guide haircut structure and ensure symmetry',
            'Demonstrate correct parting technique for each head section',
            'Explain how head shape affects sectioning decisions',
          ],
          content: `<h2>Head Shape and Sectioning</h2>
<h3>Sections of the Head</h3>
<ul>
<li><strong>Top</strong> — crown to front hairline</li>
<li><strong>Sides</strong> — temples to behind the ears</li>
<li><strong>Back</strong> — occipital bone to nape</li>
<li><strong>Nape</strong> — hairline at the back of the neck</li>
</ul>
<h3>Reference Points</h3>
<ul>
<li><strong>Occipital bone</strong> — the bony protrusion at the back of the skull; key reference for fade lines</li>
<li><strong>Parietal ridge</strong> — widest part of the head; determines where the fade transitions</li>
<li><strong>Temporal recession</strong> — natural recession at the temples</li>
</ul>
<h3>Why Sectioning Matters</h3>
<p>Consistent sectioning ensures even weight distribution and a balanced haircut. Always establish your guide line before cutting.</p>

<h3>Sanitation — Required Before Service</h3>
<p>Apply universal precautions before every service. These are non-negotiable under NIC and state board standards.</p>
<ol>
<li>Wash or sanitize hands.</li>
<li>Pre-clean all tools — remove hair and debris before applying disinfectant. This lesson uses combs and sectioning clips; apply EPA-registered disinfectant and maintain full contact time per label.</li>
<li>Apply EPA-registered disinfectant and maintain full contact time per label (typically 10 minutes). Do not wipe off early.</li>
<li>Discard all single-use items after use. Do not reuse porous items — they cannot be disinfected.</li>
</ol>

<h3>Stop Conditions</h3>
<p>Stop the service immediately if you observe:</p>
<ul>
<li>Open cuts, abrasions, or broken skin on the scalp</li>
<li>Signs of scalp infection, rash, or inflammation</li>
<li>Client reports pain or discomfort</li>
<li>Tool malfunction</li>
</ul>

<h3>Blood Exposure Protocol</h3>
<ol>
<li>Stop service immediately.</li>
<li>Put on gloves before touching the affected area.</li>
<li>Apply antiseptic to the client's skin.</li>
<li>Dispose of all contaminated single-use materials in a sealed bag.</li>
<li>Clean and disinfect any blood-contaminated tools with EPA-registered disinfectant.</li>
<li>Double-bag contaminated waste before disposal.</li>
<li>Wash hands thoroughly after removing gloves.</li>
</ol>`,
          competencyChecks: [
            'Identifies all head sections and reference points correctly',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-23',
          title: 'The Fade — Low, Mid & High',
          order: 2,
          domainKey: 'haircutting',
          objective: 'Execute low, mid, and high fade techniques with smooth transitions.',
          durationMinutes: 30,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          learningObjectives: [
            'Execute a low fade with a smooth transition from skin to length',
            'Execute a mid fade with correct blending at the temple',
            'Execute a high fade that maintains clean lines above the ear',
            'Blend between guard sizes without visible lines or steps',
            'Identify the correct starting point for each fade type',
          ],
          content: `<h2>Introduction to The Fade</h2><p>The fade is a fundamental haircutting technique that involves cutting the hair close to the head, with a gradual decrease in length as you move up the scalp. In this lesson, we will cover the low, mid, and high fade techniques, and provide guidance on how to execute them with smooth transitions.</p><h3>Tools and Equipment Required</h3><ul><li>Clippers with adjustable blade lengths</li><li>Trimmers</li><li>Scissors</li><li>Comb</li><li>Cape or towel</li><li>Sanitizer or disinfectant</li></ul><h3>Sanitation and Infection Control</h3><p>Before starting the haircut, ensure that all equipment is sanitized and disinfected. This includes clippers, trimmers, scissors, and combs. Use a sanitizer or disinfectant specifically designed for barber equipment, and follow the manufacturer's instructions for use.</p><h3>Executing the Fade</h3><p>To execute a fade, follow these steps:</p><ol><li>Start by sectioning the hair into three parts: the back, the sides, and the top.</li><li>Use clippers with an adjustable blade length to cut the hair close to the head, starting at the bottom of the back section.</li><li>Gradually decrease the length of the hair as you move up the scalp, using a combination of clippers and trimmers.</li><li>Use scissors to blend the layers and create a smooth transition.</li></ol><h3>IF/THEN Decision Block</h3><p>IF the client has curly or wavy hair, THEN use a slower blade speed and a more gradual decrease in length to avoid creating uneven layers.</p><p>IF the client has sensitive skin, THEN use a clipper with a guard attachment to avoid direct contact with the skin.</p><h3>Contraindications and Safety Rules</h3><p>DO NOT use clippers without a guard attachment on sensitive skin, as this can cause irritation and ingrown hairs.</p><p>DO NOT use scissors to cut the hair close to the head, as this can cause uneven layers and ingrown hairs.</p><h3>Failure Mode and Recovery</h3><p>Failure mode: uneven layers and ingrown hairs.</p><p>Cause: using the wrong blade length or not gradually decreasing the length of the hair.</p><p>Recovery: use a trimmer to even out the layers, and use a pair of thinning scissors to blend the layers and create a smooth transition.</p><h3>Correct Execution</h3><p>Correct execution of the fade involves creating a smooth transition from the hairline to the scalp, with no visible lines or layers. The hair should be cut close to the head, with a gradual decrease in length as you move up the scalp.</p><p>Visually, the correct execution of the fade should look like a seamless blend of hair and scalp, with no visible edges or lines. The angles of the cut should be smooth and even, with no uneven layers or ingrown hairs.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-23-q1",
                              "question": "What is the primary tool used to execute a fade?",
                              "options": [
                                        "Clippers",
                                        "Trimmers",
                                        "Scissors",
                                        "Comb"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Clippers are the primary tool used to execute a fade, as they allow for a close cut and a gradual decrease in length."
                    },
                    {
                              "id": "barber-lesson-23-q2",
                              "question": "A client presents with sensitive skin and requests a high fade. What do you do?",
                              "options": [
                                        "Use clippers without a guard attachment",
                                        "Use a clipper with a guard attachment",
                                        "Use scissors to cut the hair close to the head",
                                        "Use a trimmer to even out the layers"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Using a clipper with a guard attachment will help to avoid direct contact with the skin and prevent irritation and ingrown hairs."
                    },
                    {
                              "id": "barber-lesson-23-q3",
                              "question": "What is the purpose of using a comb during a fade?",
                              "options": [
                                        "To cut the hair close to the head",
                                        "To blend the layers and create a smooth transition",
                                        "To section the hair into three parts",
                                        "To sanitize the equipment"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The comb is used to blend the layers and create a smooth transition, helping to create a seamless blend of hair and scalp."
                    },
                    {
                              "id": "barber-lesson-23-q4",
                              "question": "A client presents with curly hair and requests a low fade. What do you do?",
                              "options": [
                                        "Use a faster blade speed and a more gradual decrease in length",
                                        "Use a slower blade speed and a more gradual decrease in length",
                                        "Use scissors to cut the hair close to the head",
                                        "Use a trimmer to even out the layers"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Using a slower blade speed and a more gradual decrease in length will help to avoid creating uneven layers and ingrown hairs, and will result in a smoother transition."
                    },
                    {
                              "id": "barber-lesson-23-q5",
                              "question": "What is a common failure mode when executing a fade, and how can it be recovered?",
                              "options": [
                                        "Uneven layers and ingrown hairs, recovered by using a trimmer to even out the layers and thinning scissors to blend the layers",
                                        "Even layers and no ingrown hairs, recovered by using clippers to cut the hair close to the head",
                                        "Uneven layers and ingrown hairs, recovered by using scissors to cut the hair close to the head",
                                        "Even layers and no ingrown hairs, recovered by using a comb to blend the layers"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Uneven layers and ingrown hairs are a common failure mode when executing a fade, and can be recovered by using a trimmer to even out the layers and thinning scissors to blend the layers and create a smooth transition."
                    }
          ],
          competencyChecks: [
            'Executes low, mid, and high fade with smooth transitions',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-24',
          title: 'Clipper Over Comb',
          order: 3,
          domainKey: 'haircutting',
          objective: 'Use the clipper-over-comb technique to cut and blend hair.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          learningObjectives: [
            'Use clipper-over-comb to cut and blend hair on the sides and back',
            'Maintain consistent comb angle to produce even length',
            'Blend clipper-over-comb work into scissor-cut top sections',
            'Identify when clipper-over-comb is preferred over guard cutting',
          ],
          content: `<h2>Clipper Over Comb</h2>
<p>Clipper over comb is used to cut hair that is too long for guards but needs clipper precision. It is essential for blending and tapering.</p>
<h3>Technique</h3>
<ol>
<li>Hold the comb flat against the head at the desired angle</li>
<li>Lift the comb slightly to expose the hair to be cut</li>
<li>Run the clipper along the top of the comb in a smooth, continuous motion</li>
<li>Work in sections, overlapping each pass slightly</li>
</ol>
<h3>Common Mistakes</h3>
<ul>
<li>Holding the comb too far from the head — creates uneven results</li>
<li>Moving too slowly — causes clipper lines</li>
<li>Not following the head's curve — creates flat spots</li>
</ul>

<h3>Sanitation — Required Before Service</h3>
<p>Apply universal precautions before every service.</p>
<ol>
<li>Wash or sanitize hands.</li>
<li>Pre-clean all tools — remove hair and debris before applying disinfectant.</li>
<li>Apply EPA-registered disinfectant. Use clipper disinfectant spray on blades and maintain full contact time per label.</li>
<li>Discard all single-use items after use. Do not reuse porous items — they cannot be disinfected.</li>
<li>Disinfect workstation and chair after each client.</li>
</ol>

<h3>Stop Conditions</h3>
<p>Stop the service immediately if you observe:</p>
<ul>
<li>Open cuts or broken skin on the scalp</li>
<li>Signs of scalp infection or inflammation</li>
<li>Client reports pain or discomfort</li>
<li>Clipper overheating or malfunction</li>
</ul>

<h3>Blood Exposure Protocol</h3>
<ol>
<li>Stop service immediately.</li>
<li>Put on gloves before touching the affected area.</li>
<li>Apply antiseptic to the client's skin.</li>
<li>Dispose of all contaminated single-use materials in a sealed bag.</li>
<li>Clean and disinfect blood-contaminated tools with EPA-registered disinfectant.</li>
<li>Double-bag contaminated waste before disposal.</li>
<li>Wash hands thoroughly after removing gloves.</li>
</ol>`,
          competencyChecks: [
            'Executes clipper-over-comb with consistent angle and smooth motion',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-25',
          title: 'Scissor Over Comb',
          order: 4,
          domainKey: 'haircutting',
          objective: 'Use scissor-over-comb to cut and blend the top and sides.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors.mp4',
          learningObjectives: [
            'Use scissor-over-comb to cut and blend the top and sides',
            'Maintain consistent comb angle and scissor position throughout',
            'Blend scissor-over-comb work seamlessly into clipper sections',
            'Control length removal to avoid over-cutting',
          ],
          content: `<h2>Scissor Over Comb</h2><p>In this lesson, you will learn how to use the scissor-over-comb technique to cut and blend the top and sides of a client's hair. This technique is essential for achieving a seamless blend between the different layers of hair.</p><h3>Tools and Equipment</h3><p>The following tools and equipment are required for this lesson:</p><ul><li>Scissors</li><li>Comb</li><li>Clipper</li><li>Cape or towel</li><li>Sanitizer or disinfectant</li></ul><h3>Sanitation and Infection Control</h3><p>Before starting the haircut, make sure to sanitize your tools and equipment with a disinfectant. This will help prevent the spread of infections and maintain a clean and safe environment for your clients.</p><h3>Technique</h3><p>To use the scissor-over-comb technique, follow these steps:</p><ol><li>Section the hair into small subsections, depending on the length and thickness of the hair.</li><li>Place the comb at the desired length, with the teeth of the comb facing the ends of the hair.</li><li>Place the scissors over the comb, with the blades facing the ends of the hair.</li><li>Slowly cut the hair, using a smooth and even motion.</li><li>Repeat the process for each subsection of hair, working your way around the head.</li></ol><h3>Variations and Considerations</h3><p>When using the scissor-over-comb technique, you may need to consider the following variations and considerations:</p><p>IF the client has very curly or kinky hair, THEN you may need to use a different technique, such as the clipper-over-comb method, to achieve a more even cut.</p><p>IF the client has a skin condition, such as eczema or psoriasis, THEN you may need to take extra precautions to avoid irritating the skin, such as using a gentle shampoo and avoiding harsh chemicals.</p><p>IF the client is experiencing hair loss or thinning, THEN you may need to use a more gentle technique, such as the scissor-over-comb method, to avoid causing further damage to the hair.</p><h3>Contraindications and Safety Rules</h3><p>Do NOT use the scissor-over-comb technique on clients with certain medical conditions, such as hemophilia or bleeding disorders, as it may cause excessive bleeding.</p><h3>Failure Modes and Recovery</h3><p>One common failure mode when using the scissor-over-comb technique is cutting the hair too short. This can happen if the comb is placed too close to the scalp or if the scissors are not positioned correctly.</p><p>To recover from this failure mode, you can try using a razor or trimmer to blend the layers and create a more natural-looking edge.</p><h3>Correct Execution</h3><p>Correct execution of the scissor-over-comb technique involves placing the comb at the correct angle and positioning the scissors over the comb with the blades facing the ends of the hair. The scissors should be moved in a smooth and even motion, with the blades gliding over the comb to cut the hair.</p><p>Visually, correct execution should result in a seamless blend between the different layers of hair, with no visible lines or edges. The hair should look natural and healthy, with a smooth and even texture.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-25-q1",
                              "question": "What is the primary tool used in the scissor-over-comb technique?",
                              "options": [
                                        "Scissors",
                                        "Comb",
                                        "Clipper",
                                        "Razor"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The primary tool used in the scissor-over-comb technique is the scissors, which are used to cut the hair over the comb."
                    },
                    {
                              "id": "barber-lesson-25-q2",
                              "question": "A client presents with very curly hair and asks for a haircut using the scissor-over-comb technique. What do you do?",
                              "options": [
                                        "Use the scissor-over-comb technique as usual",
                                        "Use a different technique, such as the clipper-over-comb method",
                                        "Refuse to cut the client's hair",
                                        "Use a relaxer to straighten the hair before cutting"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When working with very curly or kinky hair, it's often best to use a different technique, such as the clipper-over-comb method, to achieve a more even cut."
                    },
                    {
                              "id": "barber-lesson-25-q3",
                              "question": "What is a contraindication for using the scissor-over-comb technique?",
                              "options": [
                                        "Client has a skin condition",
                                        "Client has very curly hair",
                                        "Client has a medical condition such as hemophilia",
                                        "Client is experiencing hair loss"
                              ],
                              "correctAnswer": 2,
                              "explanation": "One contraindication for using the scissor-over-comb technique is a medical condition such as hemophilia or bleeding disorders, as it may cause excessive bleeding."
                    },
                    {
                              "id": "barber-lesson-25-q4",
                              "question": "A client asks for a haircut using the scissor-over-comb technique, but you notice that the client has a skin condition on their scalp. What do you do?",
                              "options": [
                                        "Use the scissor-over-comb technique as usual",
                                        "Use a different technique to avoid irritating the skin",
                                        "Refuse to cut the client's hair",
                                        "Use a medicated shampoo to treat the skin condition before cutting"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When working with a client who has a skin condition, it's best to use a different technique to avoid irritating the skin, such as using a gentle shampoo and avoiding harsh chemicals."
                    },
                    {
                              "id": "barber-lesson-25-q5",
                              "question": "What is a common failure mode when using the scissor-over-comb technique, and how can it be recovered from?",
                              "options": [
                                        "Cutting the hair too short, which can be recovered from by using a razor or trimmer to blend the layers",
                                        "Cutting the hair too long, which can be recovered from by using scissors to trim the hair",
                                        "Damaging the hair with the scissors, which can be recovered from by using a hair mask or deep conditioning treatment",
                                        "Causing irritation to the skin, which can be recovered from by using a medicated shampoo or cream"
                              ],
                              "correctAnswer": 0,
                              "explanation": "One common failure mode when using the scissor-over-comb technique is cutting the hair too short, which can be recovered from by using a razor or trimmer to blend the layers and create a more natural-looking edge."
                    }
          ],
          competencyChecks: [
            'Executes scissor-over-comb with consistent angle and soft finish',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
            'Disinfects shears and combs with EPA-registered disinfectant before service',
          ],
        },
        {
          slug: 'barber-lesson-26',
          title: 'Lineup & Edging',
          order: 5,
          domainKey: 'haircutting',
          objective:
            'Create clean, sharp lines at the hairline, temples, around the ears, sideburns, and nape while preserving the natural hairline, protecting the skin, maintaining sanitation, and choosing shapes that suit the client and grow out cleanly.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-lineup-narrated.mp4',
          learningObjectives: [
            'Create a clean, sharp hairline lineup using a trimmer',
            'Edge the temples, sideburns, around the ears, and nape correctly',
            'Preserve the natural hairline — no artificial hairline recession',
            'Choose a lineup shape that suits the client face shape and grows out cleanly',
            'Protect the skin from nicks during edging',
          ],
          content: `<h2>Lesson 26: Lineup &amp; Edging</h2>

<h3>Why this skill matters</h3>
<p>A lineup is a <strong>finishing service</strong>, not a haircut correction tool. Its job is to make the haircut look clean and intentional by sharpening the <strong>front hairline, temples, sideburn edges, around the ears, and nape</strong>. Good edging makes the haircut look polished. Bad edging removes too much hair, creates uneven corners, irritates skin, and can permanently push the hairline back over time.</p>
<p>The barber's rule is simple: <strong>define what is already there; do not invent a new hairline unless the service plan clearly calls for it and the client understands the maintenance.</strong></p>

<h3>Tools and setup</h3>
<p>Use only clean, disinfected tools and a stable setup.</p>
<h4>Required tools</h4>
<ul>
<li>T-liner, outliner, or detailer trimmer</li>
<li>Straight razor or shavette, if appropriate</li>
<li>Barber comb</li>
<li>Hand mirror</li>
<li>Neck strip and cape</li>
<li>Towels or disposable wipes</li>
<li>Shaving gel or lather</li>
<li>Antiseptic or astringent as allowed by shop policy</li>
<li>EPA-registered disinfectant</li>
<li>Gloves if required by service condition or shop policy</li>
</ul>
<h4>Pre-service preparation</h4>
<ol>
<li>Wash or sanitize hands before service.</li>
<li>Clean and disinfect all tools with an EPA-registered disinfectant.</li>
<li>Prepare a clean workstation to avoid cross-contamination.</li>
<li>Drape the client with a neck strip and cape so the cape does not touch bare skin.</li>
<li>Seat the client upright with the head in a natural position so the line is not created on a tilted angle.</li>
<li>Inspect lighting and mirror position before beginning.</li>
</ol>

<h3>Client consultation</h3>
<ul>
<li>Ask whether the client wants a natural lineup or a sharper, more defined finish.</li>
<li>Confirm temple shape, sideburn shape, and nape preference: tapered, rounded, or square.</li>
<li>Ask about recent irritation, razor sensitivity, acne breakout, ingrown hairs, or cuts.</li>
<li>Explain that razor detailing will not be performed on broken or irritated skin.</li>
<li>Confirm that the goal is a clean edge without pushing the hairline back.</li>
</ul>

<h3>Contraindications and razor safety</h3>
<p>Do <strong>not</strong> use a razor over:</p>
<ul>
<li>Cuts, abrasions, or open skin</li>
<li>Active acne</li>
<li>Inflamed bumps</li>
<li>Rash or infection</li>
<li>Skin that is already irritated</li>
<li>Areas prone to keloid scarring if razor use may trigger trauma</li>
</ul>
<p>Use extra caution or modify the service on clients with razor bumps, ingrown hairs, or highly irritated skin.</p>
<p>If the skin condition makes edging unsafe, stop and refer to the instructor or follow shop procedure.</p>
<p><strong>Non-negotiable rule:</strong> trimmer defines first, razor refines second. Never use the razor to guess the shape.</p>

<h3>Service order</h3>
<p>Front hairline → temples → around ears → sideburns → nape → symmetry check → razor detailing if appropriate</p>

<h3>Procedure</h3>
<ol>
<li><strong>Establish the front hairline</strong>
<ul>
<li>Stand directly in front of the client.</li>
<li>Identify the natural front hairline before cutting.</li>
<li>Start at the center and work outward to keep both sides balanced.</li>
<li>Use the trimmer with light pressure and short, controlled motions.</li>
<li>Remove only the overgrowth outside the line. Do not push the line back.</li>
</ul>
</li>
<li><strong>Refine the front edge</strong>
<ul>
<li>Use small anchor strokes instead of one long pass.</li>
<li>Keep the blade steady and let the corners of the trimmer help create detail.</li>
<li>Check the line from the front and slightly above eye level to catch uneven corners.</li>
</ul>
</li>
<li><strong>Shape the temples</strong>
<ul>
<li>Decide whether the temple should be squared or softly tapered based on the haircut, growth pattern, and client preference.</li>
<li>Follow the natural temple area instead of cutting above it.</li>
<li>Match both sides by checking height, width, and angle before deepening the line.</li>
</ul>
</li>
<li><strong>Outline around the ears</strong>
<ul>
<li>Fold the ear gently only as needed for visibility and safety.</li>
<li>Use the trimmer in short controlled movements around the ear curve.</li>
<li>Keep the outline clean without cutting into the skin.</li>
</ul>
</li>
<li><strong>Balance the sideburns</strong>
<ul>
<li>Comb the sideburn area down.</li>
<li>Check both sideburns from the front, not only from the side.</li>
<li>Match length, width, and bottom line before finalizing.</li>
</ul>
</li>
<li><strong>Create the nape outline</strong>
<ul>
<li>Ask whether the client wants a tapered, rounded, or square nape.</li>
<li>Use the trimmer to outline the chosen shape.</li>
<li>Keep the nape centered and symmetrical with the spine and head position.</li>
</ul>
</li>
<li><strong>Check symmetry before detailing</strong>
<ul>
<li>Step back and inspect the entire outline.</li>
<li>Use the mirror to compare both sides.</li>
<li>Correct only the area that is uneven. Do not keep cutting both sides higher trying to chase perfection.</li>
</ul>
</li>
<li><strong>Razor detailing if the skin is healthy</strong>
<ul>
<li>Apply lather or shaving gel if used in your service procedure.</li>
<li>Stretch the skin firmly before using the razor.</li>
<li>Hold the razor at a low angle with light pressure.</li>
<li>Use short, controlled strokes to sharpen the edge.</li>
<li>Wipe the blade safely as required by shop procedure.</li>
<li>Do not go over broken, raised, or irritated skin.</li>
</ul>
</li>
</ol>

<h3>Safety &amp; Infection Control</h3>
<p>Follow this sequence in order. NIC practical exams test sequence, not just knowledge.</p>
<h4>Before service</h4>
<ol>
<li>Wash or sanitize hands before touching tools or the client.</li>
<li><strong>Pre-clean all tools</strong> — remove all hair and debris before applying disinfectant. Debris blocks disinfectant effectiveness and makes the step invalid.</li>
<li>Apply EPA-registered disinfectant and allow full contact time per the product label — typically 10 minutes for full disinfection. Do not wipe off early.</li>
<li>For clipper and trimmer blades: use a clipper disinfectant spray and keep blades visibly wet for the full required contact time.</li>
</ol>
<h4>During service</h4>
<ul>
<li>Use only clean implements on the client.</li>
<li>Avoid cross-contamination by keeping soiled items separate from disinfected tools.</li>
<li>Do not perform razor work on irritated or broken skin.</li>
<li>Maintain proper draping and client protection throughout the service.</li>
<li><strong>Single-use items</strong> (razor blades, neck strips, disposable wipes) must be discarded immediately after use. Do not reuse.</li>
<li><strong>Porous items</strong> (wooden sticks, foam, emery boards) cannot be disinfected — treat as single-use and discard.</li>
</ul>
<h4>After service</h4>
<ol>
<li>Pre-clean tools again — remove debris.</li>
<li>Apply disinfectant and allow full contact time before storing.</li>
<li>Disinfect workstation surfaces and chair between every client.</li>
<li>Dispose of all single-use materials properly.</li>
<li>Replace disinfectant solution if it is visibly cloudy or dirty. Change at minimum every 24 hours.</li>
</ol>

<h3>Correct vs. Incorrect Lineup Logic</h3>
<h4>Correct</h4>
<ul>
<li>Follows the natural hairline</li>
<li>Looks even from the front</li>
<li>Matches the haircut design</li>
<li>Keeps temple height appropriate</li>
<li>Preserves density at weak corners</li>
<li>Sharpens without irritating the skin</li>
</ul>
<h4>Incorrect</h4>
<ul>
<li>Pushed back to make it look "extra clean"</li>
<li>One temple cut higher than the other</li>
<li>Jagged line from long uncontrolled strokes</li>
<li>Sideburns different in length or width</li>
<li>Nape off-center</li>
<li>Razor used over broken or inflamed skin</li>
</ul>

<h3>Hair type and growth-pattern decision rules</h3>
<h4>IF the client has coarse or curly hair</h4>
<p>Use a lighter touch and take less hair per pass. Follow the natural edge more closely. Avoid over-defining the front line. Expect the line to appear strong with less cutting. <em>Why: coarse or curly hair creates visual density fast. Too much pressure or carving makes the line look harsh and unnatural.</em></p>
<h4>IF the client has fine or straight hair</h4>
<p>Use extra caution because mistakes show immediately. Keep corners soft unless the haircut design clearly supports a harder edge. Do not widen the line trying to make it look darker. <em>Why: fine hair gives less visual forgiveness. Once pushed back, the edge can look thin and weak.</em></p>
<h4>IF the client has a receding hairline</h4>
<p>Do not force a low straight line across recessed corners. Clean the natural outline and preserve what exists. Explain that a conservative line will look better and grow out cleaner.</p>
<h4>IF the hairline is naturally uneven</h4>
<p>Improve the appearance without overcutting both sides. Remove obvious strays first. Decide what difference is natural and acceptable before cutting. Symmetry means <strong>balanced appearance</strong>, not always identical biology.</p>
<h4>IF there are cowlicks at the temple or nape</h4>
<p>Follow the growth pattern. Use smaller strokes. Avoid making the area shorter just to overpower the growth.</p>
<h4>IF the skin is sensitive</h4>
<p>Limit razor passes. Use gentle tension and clean strokes. Stop if redness or irritation develops.</p>

<h3>Razor refinement</h3>
<p>Only refine after the trimmer shape is correct.</p>
<ol>
<li>Apply appropriate prep according to shop protocol.</li>
<li>Stretch the skin firmly.</li>
<li>Use short, controlled razor strokes.</li>
<li>Shave only the hair outside the established trimmer line.</li>
<li>Wipe and inspect the skin often.</li>
<li>Stop immediately if irritation appears.</li>
</ol>
<p>The razor is a refinement tool, not the primary design tool.</p>

<h3>Common Failure Modes and Corrections</h3>
<h4>Crooked front line</h4>
<p><strong>Cause:</strong> started from one side instead of establishing the center.<br/><strong>Correction:</strong> recheck the center point, compare both corners, and make only minimal balancing adjustments.</p>
<h4>Temple cut too high</h4>
<p><strong>Cause:</strong> chasing sharpness instead of respecting the natural temple.<br/><strong>Correction:</strong> stop raising the opposite side; preserve what remains and let the area grow back rather than compounding the error.</p>
<h4>Jagged edge</h4>
<p><strong>Cause:</strong> heavy pressure or fast dragging motion.<br/><strong>Correction:</strong> use shorter anchor strokes with lighter pressure.</p>
<h4>Uneven sideburns</h4>
<p><strong>Cause:</strong> checked from side view only.<br/><strong>Correction:</strong> face the client head-on and compare both bottom lines visually.</p>
<h4>Razor irritation or razor burn</h4>
<p><strong>Cause:</strong> too many passes, poor skin tension, or working over compromised skin.<br/><strong>Correction:</strong> reduce passes, improve tension, and skip razor work where the skin is unsafe.</p>

<h3>Sanitation and compliance</h3>
<ul>
<li>Clean and disinfect tools before service</li>
<li>Remove cut hair from tools as needed during service</li>
<li>Avoid cross-contaminating zones if skin becomes irritated</li>
<li>Replace blades according to shop and safety protocol</li>
<li>Dispose of single-use razor blades correctly</li>
<li>Maintain clean draping and workstation control</li>
</ul>
<p>For state board readiness: proper draping, clean and disinfected implements, safe handling of sharp tools, protection of the client's skin, sanitary disposal of waste.</p>

<h3>Quick service checklist</h3>
<ul>
<li>Front line is balanced</li>
<li>Temple points are intentional</li>
<li>Around-ear edge is clean</li>
<li>Sideburns match from the front</li>
<li>Nape matches requested shape</li>
<li>No zone has been pushed back unnecessarily</li>
<li>Skin is clean and not overworked</li>
<li>Client has seen the result in the mirror</li>
</ul>

<h3>Summary</h3>
<p>Lineup and edging require restraint, not aggression. Use the trimmer to establish shape, skin tension to protect precision, and the razor only when appropriate. Preserve the natural hairline whenever possible, adapt to hair type and growth pattern, and check symmetry from the client's front view before calling the service complete.</p>

<h3>Result</h3>
<ul>
<li>Hairline is clean, even, and appropriate for the client.</li>
<li>Temples, sideburns, and nape are balanced and symmetrical.</li>
<li>The finish is sharp without obvious pushback of the natural line.</li>
<li>The skin remains free from cuts, razor burn, and unnecessary irritation.</li>
</ul>

<h3>Advanced barber insight</h3>
<p>A lineup should look intentional on day one and still grow out cleanly. A sharp line is not automatically a good line. The best lineup respects the client's natural growth pattern, face shape, density, and weak points in the hairline.</p>

<h3>Technique notes</h3>
<ul>
<li>Anchor strokes create better control than a single sweeping pass.</li>
<li>Skin tension is mandatory for razor detailing and helpful for cleaner trimmer work in loose skin areas.</li>
<li>The corners of the trimmer are for detail; the full blade is for longer straight segments.</li>
<li>Always judge the line with the client's head in a natural upright position.</li>
</ul>

<h3>Post-service procedure</h3>
<ol>
<li>Remove loose hair from the neck, face, and cape.</li>
<li>Apply soothing product if appropriate and allowed by service protocol.</li>
<li>Dispose of single-use items properly.</li>
<li>Clean and disinfect tools and workstation.</li>
<li>Reset the station for the next client.</li>
</ol>`,
          quizQuestions: [
            {
              id: 'l26-q1',
              question:
                'A client has slight recession in both front corners and asks for a perfectly straight, boxed hairline. What is the best professional response?',
              options: [
                'Cut a straight line higher to create a stronger look',
                'Follow the natural hairline and create the sharpest realistic shape without pushing the corners back',
                'Ignore the recession and cut both corners square at any cost',
                'Refuse to line the front hairline at all',
              ],
              correctAnswer: 1,
              explanation:
                'A professional lineup improves neatness without creating an artificial line that removes too much natural hair or grows out poorly.',
            },
            {
              id: 'l26-q2',
              question: 'What is the safest reason to stretch the skin before razor detailing?',
              options: [
                'It makes the haircut take less time',
                'It helps the razor glide on a flatter surface and reduces the risk of cuts',
                'It removes more hair with each pass',
                'It darkens the lineup visually',
              ],
              correctAnswer: 1,
              explanation:
                'Skin tension creates a flatter working surface so the razor moves more safely and precisely.',
            },
            {
              id: 'l26-q3',
              question:
                'While detailing the temples, you notice one temple naturally sits slightly higher. What should you do?',
              options: [
                'Cut the lower temple higher to force both sides to match exactly',
                'Ignore both temples and focus only on the nape',
                'Respect the natural pattern and improve visual balance without unnecessarily raising either side',
                'Round both temples to hide the difference',
              ],
              correctAnswer: 2,
              explanation:
                'The goal is visual balance, not destruction of the natural hairline. Chasing exact sameness often makes the result worse.',
            },
            {
              id: 'l26-q4',
              question:
                'A student creates a jagged front line with the trimmer. What is the most likely cause?',
              options: [
                'Using short controlled anchor strokes',
                'Holding the head upright',
                'Using heavy pressure or dragging the trimmer in one uncontrolled pass',
                'Checking the line in the mirror',
              ],
              correctAnswer: 2,
              explanation:
                'Jagged edges usually come from poor control, excessive pressure, or trying to create the line in one long pass.',
            },
            {
              id: 'l26-q5',
              question: 'After finishing the lineup, what should happen before the client leaves?',
              options: [
                'Only brush the client off and move to the next service',
                'Remove loose hair, apply product if appropriate, then clean and disinfect tools and workstation',
                'Leave used tools aside until the end of the day',
                'Have the client inspect the cut while the station remains soiled',
              ],
              correctAnswer: 1,
              explanation:
                'State board standards require proper client cleanup plus cleaning and disinfection of tools and the workstation after service.',
            },
          ],
          instructorNotes: [
            'Demonstrate front-view checking, not mirror-only side checking.',
            'Emphasize that razor use is optional and contraindication-dependent.',
            'Correct students who try to create a new hairline instead of cleaning the existing one.',
            'Require named skin tension and short anchor strokes during practical evaluation.',
          ],
          competencyChecks: [
            'Demonstrates proper hand sanitation, draping, and workstation preparation',
            'Identifies contraindications before service',
            'Maintains skin tension during edging',
            'Preserves natural hairline unless redesign is intentionally planned',
            'Uses short controlled strokes instead of one long sweep',
            'Checks symmetry from the front view',
            'Selects correct nape shape based on client preference',
            'Avoids razor use on contraindicated skin',
            'Completes post-service cleanup and disinfection properly',
          ],
        },
        {
          slug: 'barber-lesson-27',
          title: 'Flat Top & Classic Cuts',
          order: 6,
          domainKey: 'haircutting',
          objective: 'Execute a flat top and classic taper haircut.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          learningObjectives: [
            'Execute a flat top with a level, even surface using a comb and clipper',
            'Cut a classic taper with smooth graduation from short to long',
            'Blend the flat top sides into the taper without visible lines',
            'Identify the correct guard progression for a classic taper',
          ],
          content: `<h2>Classic Barbering Cuts</h2>
<h3>The Flat Top</h3>
<p>The flat top requires a perfectly level surface on top of the head. It is one of the most technically demanding cuts in barbering.</p>
<ol>
<li>Establish the height on top with a pick and clipper</li>
<li>Use a level comb or flat top comb to guide the cut</li>
<li>Work from front to back, maintaining a flat plane</li>
<li>Fade or taper the sides</li>
</ol>
<h3>The Classic Taper</h3>
<p>The taper is the foundation of barbering. Hair gradually decreases in length from top to nape.</p>
<ul>
<li>Start with the longest guard on top</li>
<li>Work down with progressively shorter guards</li>
<li>Blend each transition smoothly</li>
<li>Finish with a clean lineup</li>
</ul>

<h3>Sanitation — Required Before Service</h3>
<p>Apply universal precautions before every service.</p>
<ol>
<li>Wash or sanitize hands.</li>
<li>Pre-clean all tools — remove hair and debris before applying disinfectant.</li>
<li>Apply EPA-registered disinfectant. Use clipper disinfectant spray on blades and maintain full contact time per label.</li>
<li>Discard all single-use items after use. Do not reuse porous items — they cannot be disinfected.</li>
<li>Disinfect workstation and chair after each client.</li>
</ol>

<h3>Stop Conditions</h3>
<p>Stop the service immediately if you observe:</p>
<ul>
<li>Open cuts or broken skin on the scalp</li>
<li>Signs of scalp infection or inflammation</li>
<li>Client reports pain or discomfort</li>
<li>Tool malfunction or overheating</li>
</ul>

<h3>Blood Exposure Protocol</h3>
<ol>
<li>Stop service immediately.</li>
<li>Put on gloves before touching the affected area.</li>
<li>Apply antiseptic to the client's skin.</li>
<li>Dispose of all contaminated single-use materials in a sealed bag.</li>
<li>Clean and disinfect blood-contaminated tools with EPA-registered disinfectant.</li>
<li>Double-bag contaminated waste before disposal.</li>
<li>Wash hands thoroughly after removing gloves.</li>
</ol>`,
          competencyChecks: [
            'Executes flat top with level, even surface across the top',
            'Executes classic taper with smooth transitions from top to nape',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-module-4-checkpoint',
          title: 'Haircutting Checkpoint',
          order: 7,
          domainKey: 'haircutting',
          objective: 'Demonstrate mastery of haircutting techniques.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 4 Review — Haircutting Techniques</h2><p>Review before taking this checkpoint: head sections and reference points, low/mid/high fade technique, clipper over comb, scissor over comb, lineup and edging, and classic cuts. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'hc-q1',
              question: 'A mid fade starts at which reference point?',
              options: ['The nape', 'The occipital bone', 'The temple', 'The parietal ridge'],
              correctAnswer: 2,
              explanation: 'A mid fade starts at the temple area, between the low and high fade.',
            },
            {
              id: 'hc-q2',
              question: 'Which technique produces a softer result than clipper over comb?',
              options: ['Skin fade', 'Scissor over comb', 'Razor cutting', 'Clipper flicking'],
              correctAnswer: 1,
              explanation:
                'Scissor over comb produces a softer, more natural finish than clipper over comb.',
            },
            {
              id: 'hc-q3',
              question: 'What is the parietal ridge?',
              options: [
                'The hairline at the nape',
                'The bony protrusion at the back of the skull',
                'The widest part of the head',
                'The front hairline',
              ],
              correctAnswer: 2,
              explanation:
                'The parietal ridge is the widest part of the head and a key reference for high fades.',
            },
            {
              id: 'hc-q4',
              question: 'Point cutting is used to:',
              options: [
                'Create a blunt, heavy line',
                'Remove weight and add texture',
                'Create a skin fade',
                'Establish the guide line',
              ],
              correctAnswer: 1,
              explanation:
                'Point cutting removes weight from the ends and adds texture and movement.',
            },
            {
              id: 'hc-q5',
              question: 'When performing a lineup, you should never:',
              options: [
                'Use a razor',
                'Cut above the natural temple hairline',
                'Square the nape',
                'Use a trimmer',
              ],
              correctAnswer: 1,
              explanation:
                'Cutting above the natural temple hairline creates an unnatural appearance.',
            },
            {
              id: 'hc-q6',
              question: 'The flat top is considered technically demanding because it requires:',
              options: [
                'The most guards',
                'A perfectly level surface on top',
                'The longest cutting time',
                'Special clippers',
              ],
              correctAnswer: 1,
              explanation:
                'Maintaining a perfectly flat, level plane on top of the head requires precision and skill.',
            },
          ],
        },
      ],
    },

    // ── Module 5 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-5',
      title: 'Module 5: Shaving & Beard Services',
      orderIndex: 5,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'shaving',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'shave_preparation', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'razor_technique', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'beard_design', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'skin_care', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-29',
          title: 'Shave Preparation & Hot Towel Service',
          order: 1,
          domainKey: 'shaving',
          objective:
            'Prepare the skin for a professional shave using hot towel and pre-shave products.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          content: `<h2>Shave Preparation</h2>
<h3>Why Preparation Matters</h3>
<p>Proper preparation softens the beard, opens the pores, and reduces razor drag — preventing irritation and ingrown hairs.</p>
<h3>Hot Towel Application</h3>
<ol>
<li>Soak a clean towel in hot water (test temperature on your wrist)</li>
<li>Wring out excess water</li>
<li>Apply to the face for 2–3 minutes</li>
<li>Remove and apply pre-shave oil or cream</li>
</ol>
<h3>Pre-Shave Products</h3>
<ul>
<li><strong>Pre-shave oil</strong> — lubricates and protects the skin</li>
<li><strong>Shaving cream</strong> — creates a protective lather</li>
<li><strong>Shaving soap</strong> — traditional, requires a brush to lather</li>
</ul>`,
          quizQuestions: [
            {
              id: 'l29-q1',
              question: 'How long should a hot towel be applied to the face before shaving?',
              options: ['30 seconds', '2–3 minutes', '10 minutes', '15 minutes'],
              correctAnswer: 1,
              explanation:
                '2–3 minutes softens the beard and opens the pores without overheating the skin.',
            },
            {
              id: 'l29-q2',
              question:
                'Why should you test the hot towel temperature on your wrist before applying it to a client?',
              options: [
                'To check if it is dry enough',
                'To prevent burning the client',
                'To measure softening time',
                'To confirm it is disinfected',
              ],
              correctAnswer: 1,
              explanation:
                "Testing on your own wrist prevents accidental burns — the client's facial skin is sensitive.",
            },
            {
              id: 'l29-q3',
              question: 'What is the primary purpose of pre-shave oil?',
              options: [
                'Removes beard hair',
                'Lubricates and protects the skin',
                'Disinfects the face',
                'Thickens the lather',
              ],
              correctAnswer: 1,
              explanation:
                'Pre-shave oil creates a protective layer between the razor and skin, reducing drag and irritation.',
            },
            {
              id: 'l29-q4',
              question: 'Which pre-shave product requires a brush to build lather?',
              options: ['Shaving cream', 'Pre-shave oil', 'Shaving soap', 'Aftershave balm'],
              correctAnswer: 2,
              explanation:
                'Traditional shaving soap must be worked with a brush — it does not lather from direct hand application.',
            },
            {
              id: 'l29-q5',
              question: 'Proper shave preparation primarily reduces which of the following?',
              options: [
                'Product cost',
                'Razor drag and ingrown hairs',
                'Draping time',
                'Chemical exposure',
              ],
              correctAnswer: 1,
              explanation:
                'Softening the beard and opening the pores reduces razor drag and the risk of ingrown hairs.',
            },
          ],
        },
        {
          slug: 'barber-lesson-30',
          title: 'Straight Razor Shaving Technique',
          order: 2,
          domainKey: 'shaving',
          objective: 'Execute a professional straight razor shave with correct angle and stroke.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          content: `<h2>Introduction to Straight Razor Shaving Technique</h2><p>The straight razor shave is a classic technique that requires skill, precision, and attention to detail. As a barber, it is essential to master this technique to provide a professional and safe service to your clients. In this lesson, we will cover the tools, equipment, and materials required, as well as the correct angle and stroke to execute a professional straight razor shave.</p><h3>Tools, Equipment, and Materials Required</h3><ul><li>Straight razor</li><li>Shaving cream or soap</li><li>Hot towel</li><li>Cold towel</li><li>Aftershave</li><li>Sanitizer or disinfectant</li></ul><h3>Sanitation, Disinfection, and Infection Control</h3><p>Before starting the shave, it is crucial to sanitize and disinfect the straight razor and any other equipment that will come into contact with the client's skin. This will prevent the spread of infections and ensure a safe service. Always wash your hands before and after the service, and use a clean towel for each client.</p><h3>Executing the Straight Razor Shave</h3><p>To execute a professional straight razor shave, follow these steps:</p><ol><li>Prepare the client's skin by washing and exfoliating the area to be shaved.</li><li>Apply a hot towel to the area to soften the hair and open up the pores.</li><li>Apply shaving cream or soap and work it into a lather.</li><li>Hold the straight razor at a 20-30 degree angle, with the blade facing the direction of hair growth.</li><li>Start shaving in smooth, even strokes, following the direction of hair growth.</li><li>Rinse the razor and repeat the process until the area is smooth and hair-free.</li><li>Apply a cold towel to close the pores and reduce inflammation.</li><li>Apply aftershave to soothe and moisturize the skin.</li></ol><h3>IF/THEN Decision Block</h3><p>IF the client has sensitive skin, THEN use a gentle shaving cream or soap and avoid applying too much pressure with the straight razor. IF the client has coarse or curly hair, THEN use a sharper razor and take smaller strokes to avoid pulling or tugging on the hair.</p><h3>Contraindications and Safety Rules</h3><p>DO NOT shave over open wounds, cuts, or irritated skin. DO NOT use a straight razor that is dull or damaged, as this can cause nicks and cuts. Always use a clean and sanitized razor, and never share razors between clients.</p><h3>Failure Mode and Recovery</h3><p>Failure mode: The client experiences nicks or cuts during the shave. Why: The razor is dull or damaged, or the barber is applying too much pressure. Recovery: Stop the service immediately and apply pressure to the affected area to stop the bleeding. Clean and disinfect the area, and apply a cold compress to reduce swelling. Offer the client a complimentary service or discount on their next visit.</p><h3>Correct Execution</h3><p>Correct execution of the straight razor shave looks like this: the barber holds the razor at a 20-30 degree angle, with the blade facing the direction of hair growth. The strokes are smooth and even, following the direction of hair growth. The skin is smooth and hair-free, with no nicks or cuts. The client's skin is relaxed and comfortable, with no signs of irritation or discomfort.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-30-q1",
                              "question": "What is the correct angle to hold the straight razor during a shave?",
                              "options": [
                                        "10-20 degrees",
                                        "20-30 degrees",
                                        "30-40 degrees",
                                        "40-50 degrees"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct angle to hold the straight razor is between 20-30 degrees, with the blade facing the direction of hair growth."
                    },
                    {
                              "id": "barber-lesson-30-q2",
                              "question": "A client presents with sensitive skin. What do you do?",
                              "options": [
                                        "Use a regular shaving cream or soap",
                                        "Use a gentle shaving cream or soap",
                                        "Apply more pressure with the straight razor",
                                        "Avoid shaving the area altogether"
                              ],
                              "correctAnswer": 1,
                              "explanation": "If the client has sensitive skin, you should use a gentle shaving cream or soap to avoid irritating the skin further."
                    },
                    {
                              "id": "barber-lesson-30-q3",
                              "question": "What is the purpose of applying a hot towel to the area to be shaved?",
                              "options": [
                                        "To soften the hair and open up the pores",
                                        "To close the pores and reduce inflammation",
                                        "To sanitize the skin",
                                        "To apply aftershave"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The purpose of applying a hot towel is to soften the hair and open up the pores, making it easier to shave the area."
                    },
                    {
                              "id": "barber-lesson-30-q4",
                              "question": "A client experiences nicks or cuts during the shave. What do you do?",
                              "options": [
                                        "Continue with the service as usual",
                                        "Stop the service and apply pressure to the affected area",
                                        "Apply aftershave to the affected area",
                                        "Use a dull razor to finish the service"
                              ],
                              "correctAnswer": 1,
                              "explanation": "If the client experiences nicks or cuts, you should stop the service immediately and apply pressure to the affected area to stop the bleeding."
                    },
                    {
                              "id": "barber-lesson-30-q5",
                              "question": "What is a contraindication for using a straight razor?",
                              "options": [
                                        "Sensitive skin",
                                        "Coarse or curly hair",
                                        "Open wounds or cuts",
                                        "All of the above"
                              ],
                              "correctAnswer": 2,
                              "explanation": "A contraindication for using a straight razor is open wounds or cuts, as this can lead to further irritation and infection."
                    }
          ],
        },
        {
          slug: 'barber-lesson-31',
          title: 'Beard Design & Shaping',
          order: 3,
          domainKey: 'shaving',
          objective: "Design and shape a beard to complement the client's face shape.",
          durationMinutes: 20,
          videoFile: '/videos/course-barber-beard-narrated.mp4',
          content: `<h2>Beard Design</h2>
<h3>Face Shapes</h3>
<ul>
<li><strong>Oval</strong> — most beard styles work; maintain natural proportions</li>
<li><strong>Round</strong> — add length on the chin; keep sides tight</li>
<li><strong>Square</strong> — round the corners; fuller on the chin</li>
<li><strong>Oblong</strong> — keep sides full; minimize chin length</li>
</ul>
<h3>Beard Lines</h3>
<ul>
<li><strong>Cheek line</strong> — natural or defined; never too low</li>
<li><strong>Neckline</strong> — two finger-widths above the Adam's apple; the most common mistake is setting it too high</li>
<li><strong>Mustache line</strong> — follow the natural lip line</li>
</ul>
<h3>Trimming Technique</h3>
<ol>
<li>Comb beard downward to its natural fall</li>
<li>Trim to desired length with guards</li>
<li>Define lines with trimmer and razor</li>
<li>Apply beard oil to finish</li>
</ol>`,
          quizQuestions: [
            {
              id: 'l31-q1',
              question: 'For a client with a round face, where should beard length be added?',
              options: ['The sides', 'The chin', 'The cheeks', 'All around evenly'],
              correctAnswer: 1,
              explanation:
                'Adding length at the chin elongates a round face and creates better proportion.',
            },
            {
              id: 'l31-q2',
              question: 'Where is the standard neckline set when shaping a beard?',
              options: [
                'At the jawline',
                "At the Adam's apple",
                "Two finger-widths above the Adam's apple",
                'Below the chin',
              ],
              correctAnswer: 2,
              explanation:
                "Two finger-widths above the Adam's apple is the industry standard neckline position.",
            },
            {
              id: 'l31-q3',
              question: 'The most common mistake when setting a beard neckline is:',
              options: [
                'Setting it too low',
                'Setting it too high',
                'Not using a razor',
                'Skipping beard oil',
              ],
              correctAnswer: 1,
              explanation:
                'Setting the neckline too high shortens the neck visually and looks unnatural.',
            },
            {
              id: 'l31-q4',
              question: 'What is the first step in the beard trimming technique?',
              options: [
                'Define the neckline',
                'Apply beard oil',
                'Comb beard downward to its natural fall',
                'Trim with scissors',
              ],
              correctAnswer: 2,
              explanation:
                'Combing the beard down first reveals its natural fall and helps ensure an even trim.',
            },
            {
              id: 'l31-q5',
              question: 'An oblong face shape benefits from a beard style that:',
              options: [
                'Adds chin length and keeps sides tight',
                'Keeps sides full and minimizes chin length',
                'Rounds all corners',
                'Uses the highest neckline',
              ],
              correctAnswer: 1,
              explanation:
                'An oblong face is already long — full sides add width while a shorter chin avoids elongating further.',
            },
          ],
        },
        {
          slug: 'barber-lesson-32',
          title: 'Post-Shave Care & Skin Treatment',
          order: 4,
          domainKey: 'shaving',
          objective: 'Apply correct post-shave products and handle common skin reactions.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-beard-narrated.mp4',
          content: `<h2>Post-Shave Care & Skin Treatment</h2><p>In this lesson, we will cover the importance of post-shave care and skin treatment, including the application of correct products and handling common skin reactions. As a barber, it is essential to understand the different skin types and conditions to provide the best possible service to your clients.</p><h3>Tools, Equipment, and Materials Required</h3><ul><li>Aftershave balms and lotions</li><li>Antiseptic wipes</li><li>Cooling gels or creams</li><li>Sanitizing solutions</li><li>Disposable towels</li></ul><h3>Sanitation, Disinfection, and Infection Control</h3><p>Before starting any post-shave care or skin treatment, it is crucial to sanitize and disinfect all equipment and tools. This includes washing your hands thoroughly and using sanitizing solutions on all surfaces and tools. Infection control is vital in a barber shop, and it is your responsibility to ensure that all clients receive a safe and clean service.</p><h3>Applying Post-Shave Products</h3><p>When applying post-shave products, it is essential to consider the client's skin type and condition. For example, if the client has sensitive skin, you may need to use a gentle aftershave balm or lotion. IF the client has dry skin, THEN you should use a moisturizing aftershave product to help hydrate the skin. IF the client has oily skin, THEN you should use a lightweight aftershave product that won't clog the pores.</p><p>When applying post-shave products, make sure to follow these steps:</p><ol><li>Apply a small amount of product to the affected area</li><li>Gently massage the product into the skin</li><li>Allow the product to absorb fully before applying any additional products</li></ol><h3>Handling Common Skin Reactions</h3><p>Common skin reactions after a shave can include razor burn, ingrown hairs, and skin irritation. To handle these reactions, you should:</p><ul><li>Apply a cool compress to the affected area to reduce inflammation</li><li>Use an antiseptic wipe to clean the area and prevent infection</li><li>Apply a soothing aftershave product to help calm the skin</li></ul><p>DO NOT apply harsh or abrasive products to the affected area, as this can exacerbate the condition.</p><h3>Failure Mode: Incorrect Product Application</h3><p>If you apply the wrong post-shave product to a client's skin, it can lead to adverse reactions, such as skin irritation or allergic reactions. To recover from this failure mode, you should:</p><ul><li>Immediately stop the service and assess the situation</li><li>Apologize to the client and explain the situation</li><li>Offer to re-apply a different product or provide a refund</li></ul><h3>Correct Execution</h3><p>Correct execution of post-shave care and skin treatment involves applying the correct products in a gentle and soothing manner. The client's skin should appear calm and hydrated, with no signs of irritation or inflammation. The barber should maintain a clean and sanitary environment throughout the service, using disposable towels and sanitizing solutions as needed.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-32-q1",
                              "question": "What is the first step in applying post-shave products?",
                              "options": [
                                        "Apply a large amount of product to the affected area",
                                        "Gently massage the product into the skin",
                                        "Apply a small amount of product to the affected area",
                                        "Allow the product to absorb fully before applying any additional products"
                              ],
                              "correctAnswer": 2,
                              "explanation": "The first step in applying post-shave products is to apply a small amount of product to the affected area."
                    },
                    {
                              "id": "barber-lesson-32-q2",
                              "question": "A client presents with sensitive skin and is experiencing razor burn after a shave. What do you do?",
                              "options": [
                                        "Apply a harsh aftershave product to the affected area",
                                        "Use a gentle aftershave balm or lotion to help soothe the skin",
                                        "Apply a large amount of product to the affected area",
                                        "Stop the service and refer the client to a doctor"
                              ],
                              "correctAnswer": 1,
                              "explanation": "If a client presents with sensitive skin and is experiencing razor burn, you should use a gentle aftershave balm or lotion to help soothe the skin."
                    },
                    {
                              "id": "barber-lesson-32-q3",
                              "question": "What is the purpose of using antiseptic wipes in post-shave care?",
                              "options": [
                                        "To clean the barber's equipment",
                                        "To sanitize the client's skin",
                                        "To apply post-shave products",
                                        "To moisturize the client's skin"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The purpose of using antiseptic wipes in post-shave care is to sanitize the client's skin and prevent infection."
                    },
                    {
                              "id": "barber-lesson-32-q4",
                              "question": "A client has dry skin and is experiencing skin irritation after a shave. What type of post-shave product should you use?",
                              "options": [
                                        "A lightweight aftershave product",
                                        "A moisturizing aftershave product",
                                        "A harsh aftershave product",
                                        "A cooling gel or cream"
                              ],
                              "correctAnswer": 1,
                              "explanation": "If a client has dry skin and is experiencing skin irritation, you should use a moisturizing aftershave product to help hydrate the skin."
                    },
                    {
                              "id": "barber-lesson-32-q5",
                              "question": "What is a contraindication for applying post-shave products?",
                              "options": [
                                        "Applying a small amount of product to the affected area",
                                        "Using a gentle aftershave balm or lotion",
                                        "Applying harsh or abrasive products to the affected area",
                                        "Allowing the product to absorb fully before applying any additional products"
                              ],
                              "correctAnswer": 2,
                              "explanation": "A contraindication for applying post-shave products is applying harsh or abrasive products to the affected area, as this can exacerbate skin conditions."
                    }
          ],
        },
        {
          slug: 'barber-lesson-33',
          title: 'Mustache Trimming & Styling',
          order: 5,
          domainKey: 'shaving',
          objective: "Trim and style a mustache to complement the client's features.",
          durationMinutes: 15,
          videoFile: '/videos/course-barber-beard.mp4',
          content: `<h2>Mustache Services</h2>
<h3>Mustache Styles</h3>
<ul>
<li><strong>Natural</strong> — trimmed to follow the lip line</li>
<li><strong>Chevron</strong> — full, thick, trimmed straight across</li>
<li><strong>Handlebar</strong> — long ends styled upward with wax</li>
<li><strong>Pencil</strong> — thin line above the lip</li>
</ul>
<h3>Trimming Procedure</h3>
<ol>
<li>Comb mustache downward</li>
<li>Trim bulk with scissors or guards</li>
<li>Define the lip line with a trimmer</li>
<li>Clean up the philtrum (area between nose and lip)</li>
<li>Apply mustache wax if styling</li>
</ol>`,
          quizQuestions: [
            {
              id: 'l33-q1',
              question: 'Which mustache style features long ends that are styled upward?',
              options: ['Chevron', 'Natural', 'Handlebar', 'Pencil'],
              correctAnswer: 2,
              explanation:
                'The handlebar mustache has long ends that are styled upward and outward, often with wax.',
            },
            {
              id: 'l33-q2',
              question: 'The philtrum is the area:',
              options: [
                'Below the lower lip',
                'Between the nose and upper lip',
                'Along the cheek line',
                'At the chin',
              ],
              correctAnswer: 1,
              explanation:
                'The philtrum is the vertical groove between the nose and the upper lip — it is cleaned up after trimming.',
            },
            {
              id: 'l33-q3',
              question: 'What is the first step in trimming a mustache?',
              options: [
                'Define the lip line with a trimmer',
                'Apply wax',
                'Comb the mustache downward',
                'Clean the philtrum',
              ],
              correctAnswer: 2,
              explanation:
                'Combing the mustache down reveals its natural fall and ensures an even trim of the bulk.',
            },
            {
              id: 'l33-q4',
              question: 'Which mustache style is a thin line just above the upper lip?',
              options: ['Handlebar', 'Chevron', 'Natural', 'Pencil'],
              correctAnswer: 3,
              explanation:
                'The pencil mustache is a very thin, precise line directly above the lip.',
            },
            {
              id: 'l33-q5',
              question: 'What product is applied when finishing a handlebar mustache?',
              options: ['Beard oil', 'Pomade', 'Mustache wax', 'Aftershave balm'],
              correctAnswer: 2,
              explanation:
                "Mustache wax provides hold and allows shaping of the handlebar's upward curled ends.",
            },
          ],
        },
        {
          slug: 'barber-module-5-checkpoint',
          title: 'Shaving & Beard Checkpoint',
          order: 6,
          domainKey: 'shaving',
          objective: 'Demonstrate mastery of shaving and beard services.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Shaving & Beard Checkpoint</h2><p>This lesson is designed to assess your mastery of shaving and beard services. As a barber, it is essential to demonstrate proficiency in these skills to provide high-quality services to your clients.</p><h3>Tools, Equipment, and Materials</h3><p>The following tools, equipment, and materials are required for shaving and beard services:</p><ul><li>Straight razor or shavette</li><li>Shaving cream or gel</li><li>Aftershave lotion or balm</li><li>Beard trimmer or clippers</li><li>Comb or brush</li><li>Sanitizing solution</li><li>Disinfectant spray</li></ul><h3>Sanitation, Disinfection, and Infection Control</h3><p>Sanitation, disinfection, and infection control are crucial in shaving and beard services. Always sanitize your tools and equipment before and after use, and disinfect any surfaces that come into contact with the client's skin.</p><p>IF the client has a skin condition such as acne or eczema, THEN you should take extra precautions to avoid irritating the skin further. Use a gentle shaving cream or gel, and avoid using hot water or harsh exfoliants.</p><h3>Contraindications and Safety Rules</h3><p>DO NOT shave a client with a skin condition such as impetigo or ringworm, as this can spread the infection. Also, DO NOT use a straight razor on a client with a bleeding disorder or taking anticoagulant medication.</p><h3>Failure Mode and Recovery</h3><p>A common failure mode in shaving and beard services is cutting the client's skin. This can happen if the razor is not properly sanitized or if the client's skin is not properly prepared. To recover from this failure mode, stop the service immediately and apply pressure to the cut to stop the bleeding. Then, clean and disinfect the area, and apply an antiseptic ointment to prevent infection.</p><h3>Correct Execution</h3><p>Correct execution of shaving and beard services involves using the right tools and techniques for the client's hair type and skin condition. For example, if the client has coarse hair, you may need to use a more aggressive shaving cream or gel. If the client has sensitive skin, you may need to use a gentler shaving cream or gel and avoid using hot water or harsh exfoliants.</p><p>Visually, correct execution involves holding the razor at a 20-30 degree angle, with the blade facing the direction of hair growth. The client's skin should be smooth and even, with no visible cuts or irritation.</p><h3>Angles, Positioning, and Appearance Cues</h3><p>When shaving, the razor should be held at a 20-30 degree angle, with the blade facing the direction of hair growth. The client's head should be positioned at a 45-degree angle, with the chin lifted and the neck stretched.</p><p>Appearance cues include a smooth, even skin tone, with no visible cuts or irritation. The client's hair should be evenly trimmed, with no visible stray hairs or uneven edges.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-5-checkpoint-q1",
                              "question": "A client presents with a skin condition such as acne or eczema. What do you do?",
                              "options": [
                                        "Use a gentle shaving cream or gel and avoid using hot water or harsh exfoliants",
                                        "Use a medicated shaving cream or gel and apply a topical antibiotic ointment",
                                        "Avoid shaving the affected area and recommend a different service",
                                        "Use a regular shaving cream or gel and proceed with the service as usual"
                              ],
                              "correctAnswer": 0,
                              "explanation": "When a client presents with a skin condition such as acne or eczema, it is essential to take extra precautions to avoid irritating the skin further. Using a gentle shaving cream or gel and avoiding hot water or harsh exfoliants can help to minimize irritation and prevent further inflammation."
                    },
                    {
                              "id": "barber-module-5-checkpoint-q2",
                              "question": "What is the correct angle to hold the razor when shaving?",
                              "options": [
                                        "10-20 degrees",
                                        "20-30 degrees",
                                        "30-40 degrees",
                                        "40-50 degrees"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct angle to hold the razor when shaving is 20-30 degrees, with the blade facing the direction of hair growth. This angle helps to prevent cuts and irritation, and ensures a smooth, even shave."
                    },
                    {
                              "id": "barber-module-5-checkpoint-q3",
                              "question": "A client has a bleeding disorder and is taking anticoagulant medication. What do you do?",
                              "options": [
                                        "Use a straight razor and proceed with the service as usual",
                                        "Use a safety razor and take extra precautions to avoid cutting the client",
                                        "Avoid using a razor altogether and recommend a different service",
                                        "Use a razor with a guard and apply pressure to the skin to minimize bleeding"
                              ],
                              "correctAnswer": 2,
                              "explanation": "When a client has a bleeding disorder and is taking anticoagulant medication, it is essential to avoid using a razor altogether. This is because the client's blood may not be able to clot properly, and using a razor could lead to excessive bleeding and potentially serious complications."
                    },
                    {
                              "id": "barber-module-5-checkpoint-q4",
                              "question": "What is the purpose of sanitizing and disinfecting tools and equipment?",
                              "options": [
                                        "To prevent the spread of infection and maintain a clean and hygienic environment",
                                        "To improve the appearance of the tools and equipment",
                                        "To increase the lifespan of the tools and equipment",
                                        "To reduce the cost of maintaining the tools and equipment"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Sanitizing and disinfecting tools and equipment is essential to prevent the spread of infection and maintain a clean and hygienic environment. This helps to protect both the client and the barber from the risk of infection, and ensures that the service is provided in a safe and healthy manner."
                    },
                    {
                              "id": "barber-module-5-checkpoint-q5",
                              "question": "A client presents with a skin condition such as impetigo or ringworm. What do you do?",
                              "options": [
                                        "Use a medicated shaving cream or gel and apply a topical antibiotic ointment",
                                        "Avoid shaving the affected area and recommend a different service",
                                        "Use a regular shaving cream or gel and proceed with the service as usual",
                                        "Refer the client to a doctor or dermatologist for treatment"
                              ],
                              "correctAnswer": 3,
                              "explanation": "When a client presents with a skin condition such as impetigo or ringworm, it is essential to refer them to a doctor or dermatologist for treatment. These conditions are highly contagious and can spread easily, and using a razor or other tools on the affected area could exacerbate the condition and put others at risk."
                    }
          ],
        },
      ],
    },

    // ── Module 6 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-6',
      title: 'Module 6: Chemical Services',
      orderIndex: 6,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'chemical_services',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hair_color_theory', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'relaxer_services', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'chemical_safety', isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-35',
          title: 'Hair Color Theory',
          order: 1,
          domainKey: 'chemical_services',
          objective: 'Explain the color wheel and how it applies to hair color services.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Hair Color Theory</h2>
<h3>The Color Wheel</h3>
<p>Primary colors: red, yellow, blue. Secondary colors are made by mixing two primaries. Complementary colors cancel each other out — used to neutralize unwanted tones.</p>
<h3>Hair Color Levels</h3>
<p>Hair color is measured on a scale of 1 (black) to 10 (lightest blonde). Lifting hair requires removing existing pigment with developer.</p>
<h3>Types of Hair Color</h3>
<ul>
<li><strong>Temporary</strong> — coats the cuticle; washes out in 1-2 shampoos</li>
<li><strong>Semi-permanent</strong> — no developer; lasts 4-6 weeks</li>
<li><strong>Demi-permanent</strong> — low-volume developer; lasts 6-8 weeks</li>
<li><strong>Permanent</strong> — opens cuticle with developer; permanent change</li>
</ul>`,
          quizQuestions: [
            {
              id: 'l35-q1',
              question: 'What are the three primary colors?',
              options: [
                'Red, green, blue',
                'Red, yellow, blue',
                'Orange, purple, green',
                'Black, white, gray',
              ],
              correctAnswer: 1,
              explanation:
                'Red, yellow, and blue are the three primary colors. All other colors are made by mixing them.',
            },
            {
              id: 'l35-q2',
              question: 'On the hair color level scale, level 1 represents:',
              options: ['Lightest blonde', 'Medium brown', 'Dark brown', 'Black'],
              correctAnswer: 3,
              explanation: 'Level 1 is the darkest (black). Level 10 is the lightest blonde.',
            },
            {
              id: 'l35-q3',
              question: 'Which type of hair color deposits tone WITHOUT lifting the natural color?',
              options: ['Permanent', 'Semi-permanent', 'Bleach', 'High-lift tint'],
              correctAnswer: 1,
              explanation:
                'Semi-permanent color deposits tone without using developer, so it cannot lift the natural color.',
            },
            {
              id: 'l35-q4',
              question: 'Complementary colors are used in hair color to:',
              options: [
                'Brighten the color',
                'Neutralize and cancel out unwanted tones',
                'Increase lift',
                'Create highlights',
              ],
              correctAnswer: 1,
              explanation:
                'Complementary colors sit opposite each other on the color wheel and cancel each other — e.g., violet neutralizes yellow.',
            },
            {
              id: 'l35-q5',
              question: 'Permanent hair color requires a developer because it needs to:',
              options: [
                'Seal the cuticle',
                'Open the cuticle to deposit color',
                'Remove melanin only',
                'Neutralize the scalp',
              ],
              correctAnswer: 1,
              explanation:
                'Developer (hydrogen peroxide) swells and opens the cuticle so permanent color can enter the cortex.',
            },
          ],
        },
        {
          slug: 'barber-lesson-36',
          title: 'Chemical Safety & Patch Testing',
          order: 2,
          domainKey: 'chemical_services',
          objective: 'Perform a patch test and identify chemical service contraindications.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-sanitation-narrated.mp4',
          content: `<h2>Chemical Safety</h2>
<h3>Patch Test</h3>
<p>A patch test must be performed 24-48 hours before any chemical service. Apply a small amount of product behind the ear or inside the elbow. If redness, swelling, or itching occurs — do not proceed.</p>
<h3>PPE for Chemical Services</h3>
<ul>
<li>Nitrile gloves — always</li>
<li>Protective apron</li>
<li>Eye protection when mixing</li>
<li>Ensure adequate ventilation</li>
</ul>
<h3>Contraindications</h3>
<p>Do not perform chemical services on clients with: scalp abrasions, recent chemical services, known allergies to ingredients, or compromised scalp health.</p>`,
          quizQuestions: [
            {
              id: 'l36-q1',
              question: 'When must a patch test be performed before a chemical service?',
              options: ['1 hour before', '6 hours before', '24–48 hours before', '1 week before'],
              correctAnswer: 2,
              explanation:
                'A patch test needs 24–48 hours to reveal any allergic reaction before the full service.',
            },
            {
              id: 'l36-q2',
              question: 'What PPE is ALWAYS required when performing chemical services?',
              options: [
                'Safety glasses only',
                'Nitrile gloves',
                'Latex gloves and face shield',
                'Steel-toed boots',
              ],
              correctAnswer: 1,
              explanation:
                'Nitrile gloves are always required to protect the barber from chemical burns and allergic reactions.',
            },
            {
              id: 'l36-q3',
              question: 'A client with scalp abrasions should:',
              options: [
                'Receive the service with gloves',
                'Receive a patch test first',
                'Not receive chemical services',
                'Have the abrasion treated and return',
              ],
              correctAnswer: 2,
              explanation:
                'Scalp abrasions are a contraindication — chemicals applied to broken skin can cause severe burns.',
            },
            {
              id: 'l36-q4',
              question: 'Where is a patch test typically applied?',
              options: [
                'On the scalp',
                'Behind the ear or inside the elbow',
                'On the forearm only',
                'On the neck',
              ],
              correctAnswer: 1,
              explanation:
                'Behind the ear or inside the elbow are standard patch test locations — sensitive but discreet.',
            },
            {
              id: 'l36-q5',
              question: 'Signs of a positive (adverse) reaction to a patch test include:',
              options: [
                'No change',
                'Slight dryness',
                'Redness, swelling, or itching',
                'Increased moisture',
              ],
              correctAnswer: 2,
              explanation:
                'Redness, swelling, or itching at the patch test site indicate an allergic reaction — do not proceed.',
            },
          ],
        },
        {
          slug: 'barber-lesson-37',
          title: 'Relaxers & Texturizers',
          order: 3,
          domainKey: 'chemical_services',
          objective: 'Understand relaxer chemistry and application safety.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Relaxers & Texturizers</h2><p>In this lesson, we will cover the chemistry and application safety of relaxers and texturizers. Relaxers are used to break down the hair's curl pattern, while texturizers are used to add texture and definition to the hair.</p><h3>Tools and Equipment</h3><ul><li>Relaxer kit</li><li>Texturizer kit</li><li>Gloves</li><li>Cape or towel</li><li>Shampoo and conditioner</li><li>Towel for drying</li></ul><h3>Understanding Relaxer Chemistry</h3><p>Relaxers work by breaking down the disulfide bonds in the hair shaft. This is done through a chemical reaction that involves the use of alkaline substances such as sodium hydroxide or lithium hydroxide. The relaxer is applied to the hair and left on for a specified amount of time, depending on the type of hair and the desired level of relaxation.</p><h3>Application Safety</h3><p>When applying relaxers, it is essential to follow the instructions carefully and take necessary safety precautions. This includes wearing gloves, using a cape or towel to protect the client's clothing, and ensuring the client's skin is protected from the relaxer.</p><h3>IF/THEN Decision Block</h3><p>IF the client has sensitive skin, THEN you should perform a patch test before applying the relaxer. IF the client has damaged or over-processed hair, THEN you should use a gentler relaxer or consider an alternative treatment.</p><h3>Sanitation and Infection Control</h3><p>It is crucial to maintain a clean and sanitary environment when applying relaxers. This includes disinfecting all equipment and tools, washing your hands thoroughly, and ensuring the client's hair is clean and free of any debris.</p><h3>Contraindications and Safety Rules</h3><p>DO NOT apply relaxers to clients with open sores or wounds on the scalp. DO NOT apply relaxers to clients who have used hair color or other chemical treatments in the past 2 weeks.</p><h3>Failure Mode and Recovery</h3><p>One common failure mode when applying relaxers is over-processing the hair. This can cause the hair to become brittle, dry, and prone to breakage. To recover from this, you can try using a deep conditioning treatment to restore moisture to the hair.</p><h3>Correct Execution</h3><p>Correct execution of a relaxer application involves applying the relaxer to the hair in a smooth, even layer, using a gentle, sweeping motion. The relaxer should be left on for the recommended amount of time, and then rinsed out thoroughly with warm water. The hair should be shampooed and conditioned after the relaxer is applied.</p><h3>Visual Cues</h3><p>When applying a relaxer, you should look for visual cues such as the hair starting to relax and lose its curl pattern. The hair should feel smooth and silky to the touch, and have a uniform texture.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-37-q1",
                              "question": "What is the primary function of a relaxer?",
                              "options": [
                                        "To add texture and definition to the hair",
                                        "To break down the hair's curl pattern",
                                        "To add moisture to the hair",
                                        "To remove hair color"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Relaxers work by breaking down the disulfide bonds in the hair shaft, which helps to break down the hair's curl pattern."
                    },
                    {
                              "id": "barber-lesson-37-q2",
                              "question": "A client presents with sensitive skin and wants to get a relaxer. What do you do?",
                              "options": [
                                        "Apply the relaxer as usual",
                                        "Perform a patch test before applying the relaxer",
                                        "Use a gentler relaxer",
                                        "Refuse to apply the relaxer"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When working with clients who have sensitive skin, it's essential to perform a patch test before applying the relaxer to ensure the client doesn't have any adverse reactions."
                    },
                    {
                              "id": "barber-lesson-37-q3",
                              "question": "What is a common failure mode when applying relaxers?",
                              "options": [
                                        "Under-processing the hair",
                                        "Over-processing the hair",
                                        "Not using gloves",
                                        "Not shampooing the hair after the relaxer is applied"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Over-processing the hair is a common failure mode when applying relaxers, as it can cause the hair to become brittle, dry, and prone to breakage."
                    },
                    {
                              "id": "barber-lesson-37-q4",
                              "question": "A client has damaged or over-processed hair and wants to get a relaxer. What do you do?",
                              "options": [
                                        "Apply the relaxer as usual",
                                        "Use a gentler relaxer",
                                        "Refuse to apply the relaxer",
                                        "Recommend a different treatment"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When working with clients who have damaged or over-processed hair, it's essential to use a gentler relaxer or consider an alternative treatment to avoid further damage to the hair."
                    },
                    {
                              "id": "barber-lesson-37-q5",
                              "question": "What is an essential step in maintaining a clean and sanitary environment when applying relaxers?",
                              "options": [
                                        "Disinfecting all equipment and tools",
                                        "Washing your hands thoroughly",
                                        "Using a cape or towel to protect the client's clothing",
                                        "All of the above"
                              ],
                              "correctAnswer": 3,
                              "explanation": "Maintaining a clean and sanitary environment when applying relaxers is crucial, and this includes disinfecting all equipment and tools, washing your hands thoroughly, and using a cape or towel to protect the client's clothing."
                    }
          ],
        },
        {
          slug: 'barber-lesson-38',
          title: 'Scalp Treatments',
          order: 4,
          domainKey: 'chemical_services',
          objective: 'Select and apply appropriate scalp treatments for common conditions.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Scalp Treatments</h2>
<h3>Types of Treatments</h3>
<ul>
<li><strong>Moisturizing treatment</strong> — for dry, flaky scalp</li>
<li><strong>Clarifying treatment</strong> — removes product buildup</li>
<li><strong>Anti-dandruff treatment</strong> — contains zinc pyrithione or selenium sulfide</li>
<li><strong>Stimulating treatment</strong> — increases circulation; contains menthol or peppermint</li>
</ul>
<h3>Application</h3>
<ol>
<li>Shampoo hair first</li>
<li>Apply treatment directly to scalp in sections</li>
<li>Massage in with fingertips</li>
<li>Process per manufacturer instructions</li>
<li>Rinse thoroughly</li>
</ol>`,
          quizQuestions: [
            {
              id: 'l38-q1',
              question: 'Which scalp treatment is used to remove product buildup?',
              options: [
                'Moisturizing treatment',
                'Clarifying treatment',
                'Anti-dandruff treatment',
                'Stimulating treatment',
              ],
              correctAnswer: 1,
              explanation:
                'A clarifying treatment uses chelating agents to remove mineral and product buildup from the scalp and hair.',
            },
            {
              id: 'l38-q2',
              question: 'Anti-dandruff shampoos and treatments contain which active ingredient?',
              options: [
                'Menthol',
                'Petroleum jelly',
                'Zinc pyrithione or selenium sulfide',
                'Sodium hydroxide',
              ],
              correctAnswer: 2,
              explanation:
                'Zinc pyrithione and selenium sulfide are antifungal agents that control the Malassezia yeast causing dandruff.',
            },
            {
              id: 'l38-q3',
              question: 'What is the FIRST step before applying a scalp treatment?',
              options: [
                'Apply the treatment directly',
                'Shampoo the hair first',
                'Apply a hot towel',
                'Perform a patch test',
              ],
              correctAnswer: 1,
              explanation:
                'Shampooing first removes oils and buildup so the treatment can penetrate the scalp effectively.',
            },
            {
              id: 'l38-q4',
              question: 'The tingling sensation in stimulating scalp treatments comes from:',
              options: [
                'Zinc pyrithione',
                'Petroleum jelly',
                'Menthol or peppermint',
                'Selenium sulfide',
              ],
              correctAnswer: 2,
              explanation:
                'Menthol and peppermint oil create a cooling/tingling sensation that also promotes circulation.',
            },
            {
              id: 'l38-q5',
              question: 'Where should a scalp treatment be applied?',
              options: [
                'Only to the ends',
                'In sections, directly to the scalp',
                'Mixed with shampoo and applied all over',
                'Only to the hairline',
              ],
              correctAnswer: 1,
              explanation:
                'Section-by-section application to the scalp ensures even coverage and direct contact with the target area.',
            },
          ],
        },
        {
          slug: 'barber-module-6-checkpoint',
          title: 'Chemical Services Checkpoint',
          order: 5,
          domainKey: 'chemical_services',
          objective: 'Demonstrate mastery of chemical service knowledge.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 6 Review — Chemical Services</h2><p>Review before taking this checkpoint: color wheel and hair color levels, types of hair color, patch testing, chemical safety PPE, relaxer chemistry and application rules, and scalp treatments. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'cs-q1',
              question: 'How long before a chemical service should a patch test be performed?',
              options: ['1 hour', '6 hours', '24-48 hours', '1 week'],
              correctAnswer: 2,
              explanation: 'A patch test needs 24-48 hours to reveal any allergic reaction.',
            },
            {
              id: 'cs-q2',
              question: 'Which type of hair color requires a developer to open the cuticle?',
              options: ['Temporary', 'Semi-permanent', 'Permanent', 'Rinse'],
              correctAnswer: 2,
              explanation:
                'Permanent color uses developer (hydrogen peroxide) to open the cuticle and deposit color.',
            },
            {
              id: 'cs-q3',
              question: 'What stops the chemical process during a relaxer service?',
              options: ['Shampoo', 'Conditioner', 'Neutralizer', 'Water rinse'],
              correctAnswer: 2,
              explanation:
                "The neutralizer restores the hair's pH and stops the relaxer from processing.",
            },
            {
              id: 'cs-q4',
              question: 'Hair color level 1 represents:',
              options: ['Lightest blonde', 'Medium brown', 'Dark brown', 'Black'],
              correctAnswer: 3,
              explanation: 'Level 1 is the darkest — black. Level 10 is the lightest blonde.',
            },
            {
              id: 'cs-q5',
              question: 'Before applying a relaxer, the scalp should be:',
              options: [
                'Scratched to open pores',
                'Wet with water',
                'Based with petroleum jelly',
                'Treated with alcohol',
              ],
              correctAnswer: 2,
              explanation:
                'Petroleum jelly protects the scalp from chemical burns during relaxer application.',
            },
          ],
        },
      ],
    },

    // ── Module 7 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-7',
      title: 'Module 7: Professional & Business Skills',
      orderIndex: 7,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'professional_skills',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'client_retention', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'shop_management', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'professional_image', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-40',
          title: 'Building Your Clientele',
          order: 1,
          domainKey: 'professional_skills',
          objective: 'Apply strategies to attract and retain clients.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation.mp4',
          content: `<h2>Building Your Clientele</h2>
<h3>First Impressions</h3>
<p>Clients decide within the first 30 seconds whether they will return. Be on time, be clean, be professional.</p>
<h3>Retention Strategies</h3>
<ul>
<li>Remember client names and preferences</li>
<li>Keep a client card with notes on their style, products used, and last visit</li>
<li>Follow up after new clients — a simple text goes a long way</li>
<li>Recommend rebooking before they leave the chair</li>
</ul>
<h3>Social Media</h3>
<p>Post your work consistently. Before-and-after photos with client permission are the most effective content. Use local hashtags and tag your shop location.</p>`,
          quizQuestions: [
            {
              id: 'l40-q1',
              question:
                'Within how many seconds do clients typically decide whether they will return?',
              options: ['10 seconds', '30 seconds', '2 minutes', '5 minutes'],
              correctAnswer: 1,
              explanation:
                'Clients form a first impression within the first 30 seconds — punctuality, cleanliness, and professionalism matter immediately.',
            },
            {
              id: 'l40-q2',
              question: 'What is a client card used for?',
              options: [
                'Recording payment history only',
                'Storing notes on style, products used, and last visit',
                'Tracking appointment scheduling only',
                'Filing tax records',
              ],
              correctAnswer: 1,
              explanation:
                "A client card holds notes on the client's style preferences, products used, and past visits — essential for building rapport.",
            },
            {
              id: 'l40-q3',
              question: 'When is the best time to recommend rebooking to a client?',
              options: [
                'Via text the next day',
                'Before they leave the chair',
                'After they pay',
                'One week later',
              ],
              correctAnswer: 1,
              explanation:
                'Recommending the next appointment before the client leaves is the most effective retention strategy.',
            },
            {
              id: 'l40-q4',
              question: 'The most effective social media content for barbers is:',
              options: [
                'Motivational quotes',
                'Before-and-after photos of client work',
                'Product advertisements',
                'Shop interior photos',
              ],
              correctAnswer: 1,
              explanation:
                'Before-and-after photos directly showcase your skill and are the most compelling content for attracting new clients.',
            },
            {
              id: 'l40-q5',
              question: 'How should a new client be followed up with after their first visit?',
              options: [
                'No follow-up is necessary',
                'A simple text or call goes a long way',
                'Send a formal letter',
                'Wait for them to book again on their own',
              ],
              correctAnswer: 1,
              explanation:
                'A brief follow-up after the first visit shows care and significantly increases the chance of return.',
            },
          ],
        },
        {
          slug: 'barber-lesson-41',
          title: 'Booth Rental vs. Commission vs. Ownership',
          order: 2,
          domainKey: 'professional_skills',
          objective: 'Compare barbershop business models and their financial implications.',
          durationMinutes: 20,
          videoFile: '/videos/barber-shop-culture.mp4',
          content: `<h2>Barbershop Business Models</h2>
<h3>Commission</h3>
<p>You work for the shop owner and receive a percentage of your service revenue (typically 40-60%). The shop provides clients, supplies, and equipment. Good for new barbers building skills.</p>
<h3>Booth Rental</h3>
<p>You pay the shop owner a weekly or monthly fee to use a chair. You keep 100% of your service revenue. You are self-employed — responsible for your own taxes, supplies, and clients.</p>
<h3>Shop Ownership</h3>
<p>You own the business. Maximum income potential but maximum responsibility. Requires business license, shop license, and significant startup capital.</p>
<h3>Which is Right for You?</h3>
<p>Most barbers start on commission, move to booth rental as they build clientele, and consider ownership after 5+ years of experience.</p>`,
          quizQuestions: [
            {
              id: 'l41-q1',
              question:
                'In a commission arrangement, the barber typically receives what percentage of service revenue?',
              options: ['10–20%', '40–60%', '80–90%', '100%'],
              correctAnswer: 1,
              explanation:
                'Commission barbers typically receive 40–60% of service revenue; the shop provides clients, supplies, and equipment.',
            },
            {
              id: 'l41-q2',
              question:
                'In a booth rental arrangement, who is responsible for paying their own taxes?',
              options: [
                'The shop owner',
                'The barber (self-employed)',
                'The state board',
                'A shared accountant',
              ],
              correctAnswer: 1,
              explanation:
                'Booth renters are independent contractors — they are self-employed and responsible for all their own taxes.',
            },
            {
              id: 'l41-q3',
              question: 'Which business model offers the maximum income potential?',
              options: ['Commission', 'Booth rental', 'Shop ownership', 'Franchise employment'],
              correctAnswer: 2,
              explanation:
                'Shop ownership has the highest income ceiling but also carries the most financial risk and responsibility.',
            },
            {
              id: 'l41-q4',
              question: 'Which model is most recommended for a new barber just starting out?',
              options: [
                'Booth rental',
                'Commission',
                'Shop ownership',
                'Independent contractor with no shop',
              ],
              correctAnswer: 1,
              explanation:
                'Commission is best for beginners — the shop provides clients and support while the barber builds skills and clientele.',
            },
            {
              id: 'l41-q5',
              question: 'A booth renter pays the shop owner:',
              options: [
                'A percentage of their earnings',
                'A fixed weekly or monthly booth fee',
                'Nothing — they are fully independent',
                'A commission on each service',
              ],
              correctAnswer: 1,
              explanation:
                'Booth renters pay a fixed fee (weekly or monthly) for the use of their chair — not a percentage of earnings.',
            },
          ],
        },
        {
          slug: 'barber-lesson-42',
          title: 'Pricing, Tipping & Financial Basics',
          order: 3,
          domainKey: 'professional_skills',
          objective: 'Set competitive prices and manage basic barbershop finances.',
          durationMinutes: 20,
          videoFile: '/videos/barber-shop-culture.mp4',
          content: `<h2>Pricing and Finances</h2>
<h3>Setting Your Prices</h3>
<ul>
<li>Research local market rates</li>
<li>Factor in your experience level</li>
<li>Price for the service, not the time</li>
<li>Raise prices as your clientele grows — do not undervalue your work</li>
</ul>
<h3>Tipping</h3>
<p>The standard tip for barbering is 15-20%. Never expect a tip but always appreciate one. Make it easy — have a tip jar or use a payment system that prompts for tips.</p>
<h3>Taxes as a Self-Employed Barber</h3>
<ul>
<li>Track all income — cash and card</li>
<li>Set aside 25-30% for taxes</li>
<li>Keep receipts for all business expenses (supplies, tools, education)</li>
<li>Pay quarterly estimated taxes to avoid penalties</li>
</ul>`,
          quizQuestions: [
            {
              id: 'l42-q1',
              question:
                'What percentage of income should a self-employed barber set aside for taxes?',
              options: ['5–10%', '10–15%', '25–30%', '50%'],
              correctAnswer: 2,
              explanation:
                'Self-employed barbers pay both income tax and self-employment tax (Social Security + Medicare), totaling 25–30%.',
            },
            {
              id: 'l42-q2',
              question: 'The standard tip for barbering services is:',
              options: ['5–10%', '15–20%', '25–30%', 'Tips are not standard for barbers'],
              correctAnswer: 1,
              explanation:
                '15–20% is the industry standard tip for personal service professionals including barbers.',
            },
            {
              id: 'l42-q3',
              question: 'Why should a barber pay quarterly estimated taxes?',
              options: [
                'It reduces the total tax owed',
                'It is required by Indiana state law',
                'To avoid IRS underpayment penalties',
                'To qualify for business deductions',
              ],
              correctAnswer: 2,
              explanation:
                'Self-employed individuals must pay estimated taxes quarterly or face underpayment penalties at tax filing time.',
            },
            {
              id: 'l42-q4',
              question: 'Which of the following is a deductible business expense for a barber?',
              options: [
                'Personal groceries',
                'Professional tools and supplies',
                'Personal clothing',
                'Home entertainment',
              ],
              correctAnswer: 1,
              explanation:
                'Professional tools, supplies, education, and booth rental fees are all legitimate deductible business expenses.',
            },
            {
              id: 'l42-q5',
              question: 'How should prices be set as a new barber?',
              options: [
                'As high as possible immediately',
                'Based on local market rates and experience level',
                'Always lower than every competitor',
                'Set once and never change',
              ],
              correctAnswer: 1,
              explanation:
                'Research local market rates and factor in your experience level — raise prices as your clientele and skills grow.',
            },
          ],
        },
        {
          slug: 'barber-lesson-43',
          title: 'Professionalism & Ethics',
          order: 4,
          domainKey: 'professional_skills',
          objective: 'Apply professional and ethical standards in the barbershop.',
          durationMinutes: 15,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Professionalism and Ethics</h2>
<h3>The Barber's Code</h3>
<ul>
<li>Never speak negatively about other barbers or shops</li>
<li>Respect client confidentiality — what happens in the chair stays in the chair</li>
<li>Do not perform services outside your scope of practice</li>
<li>Be honest about what you can and cannot achieve</li>
</ul>
<h3>Handling Difficult Clients</h3>
<p>Stay calm. Listen. Offer to fix the issue at no charge if it is your error. If a client is abusive, you have the right to refuse service.</p>
<h3>Continuing Education</h3>
<p>The barbering industry evolves constantly. Attend trade shows, watch tutorials, and practice new techniques. Indiana requires continuing education for license renewal.</p>`,
          quizQuestions: [
            {
              id: 'l43-q1',
              question: "The barber's code says you should never:",
              options: [
                'Raise your prices',
                'Speak negatively about other barbers or shops',
                'Rebook clients',
                'Use social media',
              ],
              correctAnswer: 1,
              explanation:
                "Speaking negatively about competitors is unprofessional, harms the industry's reputation, and reflects poorly on you.",
            },
            {
              id: 'l43-q2',
              question: 'If a client complains that their haircut is wrong, you should:',
              options: [
                'Argue that the cut is correct',
                'Offer to fix it at no charge if it is your error',
                'Charge double for the correction',
                'Ask them to return another day',
              ],
              correctAnswer: 1,
              explanation:
                'Taking ownership of mistakes and offering a free correction maintains client trust and professionalism.',
            },
            {
              id: 'l43-q3',
              question: 'Client information shared during a service should be:',
              options: [
                'Posted on social media',
                'Kept strictly confidential',
                'Shared with other barbers at the shop',
                'Recorded in a public log',
              ],
              correctAnswer: 1,
              explanation:
                'Client confidentiality is a professional obligation — what is shared in the chair stays in the chair.',
            },
            {
              id: 'l43-q4',
              question: 'Indiana requires what for barber license renewal?',
              options: [
                'A new written exam',
                'Continuing education hours',
                'A new practical exam',
                'Re-registration of your apprenticeship',
              ],
              correctAnswer: 1,
              explanation:
                'Indiana mandates continuing education as a condition of renewing a barber license every two years.',
            },
            {
              id: 'l43-q5',
              question: 'If a client becomes verbally abusive, a barber:',
              options: [
                'Must continue the service regardless',
                'Has the right to refuse service',
                'Should call the state board immediately',
                'Must refund all previous charges',
              ],
              correctAnswer: 1,
              explanation:
                'Barbers have the right to refuse service to abusive or disruptive clients to maintain a safe workplace.',
            },
          ],
        },
        {
          slug: 'barber-lesson-44',
          title: 'Styling Products & Finishing',
          order: 5,
          domainKey: 'professional_skills',
          objective: 'Select and apply appropriate styling products for different hair types.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Styling Products</h2>
<h3>Product Types</h3>
<ul>
<li><strong>Pomade</strong> — medium to high hold, medium to high shine; classic barbershop finish</li>
<li><strong>Clay</strong> — medium to high hold, matte finish; modern styles</li>
<li><strong>Cream</strong> — light hold, natural finish; good for textured hair</li>
<li><strong>Gel</strong> — strong hold, high shine; waves and slick styles</li>
<li><strong>Wax</strong> — flexible hold; mustaches and detailed styling</li>
</ul>
<h3>Application</h3>
<ol>
<li>Start with a small amount — you can always add more</li>
<li>Warm product between palms</li>
<li>Work through hair evenly</li>
<li>Style with comb or fingers</li>
</ol>`,
          quizQuestions: [
            {
              id: 'l44-q1',
              question: 'Which styling product provides high hold with a MATTE finish?',
              options: ['Pomade', 'Gel', 'Clay', 'Cream'],
              correctAnswer: 2,
              explanation:
                'Clay provides medium-to-high hold with a natural matte finish — popular for modern textured styles.',
            },
            {
              id: 'l44-q2',
              question: 'Pomade is best described as providing:',
              options: [
                'Light hold with a matte finish',
                'Medium-to-high hold with high shine',
                'Flexible hold for mustaches',
                'Light hold with a natural finish',
              ],
              correctAnswer: 1,
              explanation:
                'Pomade provides medium-to-high hold with a glossy, high-shine finish — classic for barbershop styles.',
            },
            {
              id: 'l44-q3',
              question: 'Gel is the best choice for:',
              options: [
                'Textured crops',
                'Waves and slick styles',
                'Handlebar mustaches',
                'Natural soft styles',
              ],
              correctAnswer: 1,
              explanation:
                'Gel provides strong hold and high shine, making it ideal for 360 waves and slick-back styles.',
            },
            {
              id: 'l44-q4',
              question: 'How much product should you start with when styling?',
              options: [
                'A large amount for maximum hold',
                'A small amount — you can always add more',
                'Enough to coat all the hair at once',
                'The same amount for every client regardless of hair type',
              ],
              correctAnswer: 1,
              explanation:
                'Always start small — over-application is difficult to correct and can make hair look greasy.',
            },
            {
              id: 'l44-q5',
              question: 'Wax is most appropriate for styling:',
              options: [
                'Fades and skin cuts',
                'Mustaches and detailed styling',
                'Wet-look slick backs',
                'Textured afros',
              ],
              correctAnswer: 1,
              explanation:
                'Wax provides flexible hold ideal for mustache styling, spit curls, and other detail work.',
            },
          ],
        },
        {
          slug: 'barber-module-7-checkpoint',
          title: 'Professional Skills Checkpoint',
          order: 6,
          domainKey: 'professional_skills',
          objective: 'Demonstrate mastery of professional and business skills.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Module 7 Review — Professional & Business Skills</h2><p>Review before taking this checkpoint: client retention strategies, booth rental vs. commission vs. ownership, pricing and taxes, professional ethics, and styling products. Score 70% or higher to advance.</p>`,
          quizQuestions: [
            {
              id: 'ps-q1',
              question: 'In a booth rental arrangement, who keeps 100% of service revenue?',
              options: ['The shop owner', 'The barber', 'They split it 50/50', 'The landlord'],
              correctAnswer: 1,
              explanation:
                'Booth renters are self-employed and keep all service revenue after paying their booth fee.',
            },
            {
              id: 'ps-q2',
              question:
                'What percentage of income should a self-employed barber set aside for taxes?',
              options: ['5-10%', '10-15%', '25-30%', '50%'],
              correctAnswer: 2,
              explanation:
                'Self-employed individuals pay both income tax and self-employment tax, totaling 25-30%.',
            },
            {
              id: 'ps-q3',
              question: 'Which styling product provides high hold with a matte finish?',
              options: ['Pomade', 'Gel', 'Clay', 'Cream'],
              correctAnswer: 2,
              explanation:
                'Clay provides medium to high hold with a matte finish, popular for modern styles.',
            },
            {
              id: 'ps-q4',
              question: 'The standard tip for barbering services is:',
              options: ['5-10%', '15-20%', '25-30%', 'Tips are not expected'],
              correctAnswer: 1,
              explanation:
                '15-20% is the standard tip for personal service professionals including barbers.',
            },
            {
              id: 'ps-q5',
              question: 'What is the most effective social media content for barbers?',
              options: [
                'Motivational quotes',
                'Before-and-after photos of client work',
                'Product advertisements',
                'Shop interior photos',
              ],
              correctAnswer: 1,
              explanation:
                'Before-and-after photos showcase your skill directly and attract new clients.',
            },
          ],
        },
      ],
    },

    // ── Module 8 ─────────────────────────────────────────────────────────────
    {
      slug: 'barber-module-8',
      title: 'Module 8: State Board Exam Preparation',
      orderIndex: 8,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'exam_prep',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'exam', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'written_exam_prep', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'practical_exam_prep', isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-46',
          title: 'Indiana State Board Exam Overview',
          order: 1,
          domainKey: 'exam_prep',
          objective:
            'Understand the format and requirements of the Indiana barber state board exam.',
          durationMinutes: 20,
          videoFile: '/videos/barber-course-intro-with-voice.mp4',
          content: `<h2>Indiana State Board Exam</h2>
<h3>Exam Components</h3>
<ul>
<li><strong>Written exam</strong> — 100 multiple choice questions; 75% passing score required</li>
<li><strong>Practical exam</strong> — performed on a mannequin or live model; graded by state board examiners</li>
</ul>
<h3>Written Exam Topics</h3>
<ul>
<li>Infection control and sanitation (25%)</li>
<li>Hair science and scalp analysis (20%)</li>
<li>Haircutting and styling (25%)</li>
<li>Chemical services (15%)</li>
<li>Indiana laws and regulations (15%)</li>
</ul>
<h3>Practical Exam Skills</h3>
<ul>
<li>Haircut with fade</li>
<li>Shave service</li>
<li>Sanitation procedures</li>
<li>Client draping and preparation</li>
</ul>`,
          quizQuestions: [
            {
              id: 'l46-q1',
              question: 'How many questions are on the Indiana barber written exam?',
              options: ['50', '75', '100', '150'],
              correctAnswer: 2,
              explanation:
                'The Indiana barber written exam consists of 100 multiple-choice questions.',
            },
            {
              id: 'l46-q2',
              question: 'What passing score is required on the Indiana barber written exam?',
              options: ['60%', '70%', '75%', '80%'],
              correctAnswer: 2,
              explanation:
                'Indiana requires a 75% passing score on the written state board examination.',
            },
            {
              id: 'l46-q3',
              question: 'The Indiana barber practical exam is performed on:',
              options: [
                'A computer simulation',
                'A mannequin or live model',
                'The state board examiner',
                'A classmate only',
              ],
              correctAnswer: 1,
              explanation:
                'The practical exam is evaluated by state board examiners on either a mannequin or live model.',
            },
            {
              id: 'l46-q4',
              question:
                'What percentage of the Indiana written exam covers infection control and sanitation?',
              options: ['10%', '15%', '20%', '25%'],
              correctAnswer: 3,
              explanation:
                'Infection control and sanitation is the largest single category, making up 25% of the written exam.',
            },
            {
              id: 'l46-q5',
              question:
                'Indiana laws and regulations account for what percentage of the written exam?',
              options: ['5%', '10%', '15%', '25%'],
              correctAnswer: 2,
              explanation:
                'Indiana laws and regulations comprise 15% of the written exam — the same as chemical services.',
            },
          ],
        },
        {
          slug: 'barber-lesson-47',
          title: 'Written Exam Review — Sanitation & Science',
          order: 2,
          domainKey: 'exam_prep',
          objective: 'Review key concepts in sanitation and hair science for the written exam.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-sanitation-narrated.mp4',
          content: `<h2>Written Exam Review: Sanitation & Science</h2>
<h3>Key Sanitation Facts</h3>
<ul>
<li>Disinfection is required between every client — not sterilization</li>
<li>EPA-registered disinfectants must be used</li>
<li>Sharps go in puncture-resistant containers</li>
<li>Disinfectant solution changed daily or when contaminated</li>
<li>Tinea capitis = no service, refer to physician</li>
</ul>
<h3>Key Hair Science Facts</h3>
<ul>
<li>Cortex contains melanin</li>
<li>Anagen = growth phase (2-7 years)</li>
<li>Normal hair loss = 50-100 hairs/day</li>
<li>High porosity = damaged cuticle</li>
<li>Patch test = 24-48 hours before chemical services</li>
</ul>`,
          quizQuestions: [
            {
              id: 'l47-q1',
              question: 'When is disinfection required in an Indiana barbershop?',
              options: [
                'Once a day',
                'Once per week',
                'Between every client',
                'Only when visibly soiled',
              ],
              correctAnswer: 2,
              explanation:
                'EPA-registered disinfection of all tools is required between every client under Indiana state board rules.',
            },
            {
              id: 'l47-q2',
              question: 'Which layer of the hair shaft contains melanin?',
              options: ['Cuticle', 'Cortex', 'Medulla', 'Follicle'],
              correctAnswer: 1,
              explanation:
                'The cortex is the middle layer of the hair shaft and contains melanin granules that determine hair color.',
            },
            {
              id: 'l47-q3',
              question: 'What is the normal range of daily hair loss for a healthy adult?',
              options: ['10–25 hairs', '50–100 hairs', '150–200 hairs', '300+ hairs'],
              correctAnswer: 1,
              explanation:
                'Losing 50–100 hairs per day is considered within the normal range for healthy hair cycling.',
            },
            {
              id: 'l47-q4',
              question: 'High hair porosity indicates:',
              options: [
                'Healthy, undamaged cuticle',
                'A damaged or raised cuticle',
                'Low moisture content only',
                'Excessive melanin',
              ],
              correctAnswer: 1,
              explanation:
                'High porosity results from a damaged or raised cuticle that absorbs moisture quickly but cannot retain it.',
            },
            {
              id: 'l47-q5',
              question: 'The anagen phase of the hair growth cycle lasts approximately:',
              options: ['A few weeks', '3–6 months', '2–7 years', '10+ years'],
              correctAnswer: 2,
              explanation:
                'Anagen is the active growth phase, lasting 2–7 years — its length determines maximum hair length.',
            },
          ],
        },
        {
          slug: 'barber-lesson-48',
          title: 'Written Exam Review — Techniques & Laws',
          order: 3,
          domainKey: 'exam_prep',
          objective: 'Review haircutting techniques and Indiana laws for the written exam.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          content: `<h2>Written Exam Review: Techniques & Laws</h2>
<h3>Key Technique Facts</h3>
<ul>
<li>Parietal ridge = widest part of head = high fade reference</li>
<li>Occipital bone = back of skull = low/mid fade reference</li>
<li>Razor angle = 30 degrees</li>
<li>Neckline = 2 finger-widths above Adam's apple</li>
<li>First shave pass = with the grain</li>
<li>Thinning shears = remove bulk, not length</li>
</ul>
<h3>Key Indiana Law Facts</h3>
<ul>
<li>Apprenticeship path = 2,000 OJT hours</li>
<li>School path = 1,500 hours</li>
<li>Written exam passing score = 75%</li>
<li>License renewal = every 2 years</li>
<li>License must be displayed at workstation</li>
<li>Governed by Indiana Code Title 25, Article 8</li>
</ul>`,
          quizQuestions: [
            {
              id: 'l48-q1',
              question: 'How many hours does the Indiana barber school path require?',
              options: ['1,000 hours', '1,500 hours', '2,000 hours', '2,500 hours'],
              correctAnswer: 1,
              explanation: 'The cosmetology/barber school path requires 1,500 hours in Indiana.',
            },
            {
              id: 'l48-q2',
              question: 'How many OJT hours does the Indiana apprenticeship path require?',
              options: ['1,000 hours', '1,500 hours', '2,000 hours', '2,500 hours'],
              correctAnswer: 2,
              explanation:
                'The DOL-registered apprenticeship path requires 2,000 on-the-job training hours.',
            },
            {
              id: 'l48-q3',
              question: 'The Indiana Barber Act is governed by which section of state law?',
              options: [
                'Indiana Code Title 16, Article 4',
                'Indiana Code Title 25, Article 8',
                'Indiana Code Title 22, Article 5',
                'Indiana Code Title 12, Article 7',
              ],
              correctAnswer: 1,
              explanation:
                'Indiana Code Title 25, Article 8 governs the licensing and practice of barbering in Indiana.',
            },
            {
              id: 'l48-q4',
              question: 'Indiana barber licenses must be renewed every:',
              options: ['1 year', '2 years', '3 years', '5 years'],
              correctAnswer: 1,
              explanation: 'Indiana requires barber license renewal every two years.',
            },
            {
              id: 'l48-q5',
              question: 'The parietal ridge is the reference point for which type of fade?',
              options: ['Low fade', 'Mid fade', 'High fade', 'Skin fade only'],
              correctAnswer: 2,
              explanation:
                'The parietal ridge — the widest part of the head — is the reference point for starting a high fade.',
            },
          ],
        },
        {
          slug: 'barber-lesson-49',
          title: 'Practical Exam Preparation',
          order: 4,
          domainKey: 'exam_prep',
          objective: 'Prepare for the practical exam with a structured practice checklist.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          content: `<h2>Practical Exam Preparation</h2>
<h3>What Examiners Look For</h3>
<ul>
<li>Proper draping and client preparation</li>
<li>Sanitation procedures performed correctly</li>
<li>Clean, even fade with smooth transitions</li>
<li>Sharp lineup</li>
<li>Proper razor technique and safety</li>
<li>Professional demeanor throughout</li>
</ul>
<h3>Practice Checklist</h3>
<ol>
<li>Drape client correctly with neck strip and cape</li>
<li>Disinfect all tools before beginning</li>
<li>Establish fade line and work upward</li>
<li>Blend all transitions — no lines</li>
<li>Execute clean lineup at hairline, temples, and nape</li>
<li>Perform shave with correct angle and grain direction</li>
<li>Apply post-shave care</li>
<li>Clean and disinfect station after service</li>
</ol>`,
          quizQuestions: [
            {
              id: 'l49-q1',
              question: "What is placed around the client's neck BEFORE the cutting cape?",
              options: [
                'A towel',
                'A neck strip',
                'A paper collar',
                'Nothing — the cape goes directly on skin',
              ],
              correctAnswer: 1,
              explanation:
                "A neck strip (or paper neck strip) prevents the cape from directly touching and irritating the client's skin.",
            },
            {
              id: 'l49-q2',
              question:
                'During the practical exam, examiners look for which of the following FIRST?',
              options: [
                'Speed of the haircut',
                'Proper draping and sanitation procedures',
                'Styling product application',
                'Client consultation only',
              ],
              correctAnswer: 1,
              explanation:
                'State board examiners evaluate proper draping and sanitation procedures as the first and foundational element of the practical exam.',
            },
            {
              id: 'l49-q3',
              question:
                'What must be done immediately after finishing a service during the practical exam?',
              options: [
                'Leave tools for the next candidate',
                'Clean and disinfect tools and workstation',
                "Style the client's hair with product",
                'Remove the cape and dismiss the client',
              ],
              correctAnswer: 1,
              explanation:
                'Post-service cleanup and disinfection of tools and workstation is a scored element of the practical exam.',
            },
            {
              id: 'l49-q4',
              question: 'The razor angle for the shave portion of the practical exam is:',
              options: ['15 degrees', '30 degrees', '45 degrees', '60 degrees'],
              correctAnswer: 1,
              explanation:
                'A 30-degree razor angle is the standard taught and evaluated on the Indiana state board practical exam.',
            },
            {
              id: 'l49-q5',
              question: 'During the practical exam, which fade is most commonly tested?',
              options: [
                'Skin fade only',
                'Haircut with fade — any type executed cleanly',
                'High fade specifically',
                'No fade — scissors only',
              ],
              correctAnswer: 1,
              explanation:
                'The practical exam typically requires a haircut with a fade, and examiners evaluate the quality and blending regardless of fade type.',
            },
          ],
        },
        {
          slug: 'barber-indiana-state-board-exam',
          title: 'Program Final Exam',
          order: 5,
          domainKey: 'exam_prep',
          objective: 'Demonstrate comprehensive mastery of the barber apprenticeship curriculum.',
          durationMinutes: 30,
          passingScore: 70,
          content: `<h2>Program Final Exam</h2><p>This comprehensive final exam covers all modules of the Indiana Barber Apprenticeship program. Topics include infection control and sanitation, hair science, tools and equipment, haircutting techniques, shaving and beard services, chemical services, professional skills, anatomy and physiology, skin science, shampooing and conditioning, thermal styling, advanced color, Indiana laws, and career development. Score 70% or higher to complete the program and be eligible for the Indiana state board exams.</p>`,
          quizQuestions: [
            // ── INFECTION CONTROL & SANITATION ───────────────────────────────
            {
              id: 'ep-q1',
              question: 'What type of disinfectant is required in Indiana barbershops?',
              options: [
                'Any hospital-grade cleaner',
                'EPA-registered disinfectant',
                'Bleach and water only',
                'Isopropyl alcohol only',
              ],
              correctAnswer: 1,
              explanation:
                'Indiana requires EPA-registered disinfectants — these meet federal efficacy standards for killing pathogens on tools.',
            },
            {
              id: 'ep-q2',
              question: 'Disinfectant solution in a wet sanitizer should be changed:',
              options: [
                'Once a week',
                'Daily or when contaminated/visibly soiled',
                'Once a month',
                'Only when it smells bad',
              ],
              correctAnswer: 1,
              explanation:
                'Disinfectant solution must be changed daily or whenever it becomes contaminated or visibly soiled.',
            },
            {
              id: 'ep-q3',
              question: 'A client has tinea capitis. You should:',
              options: [
                'Proceed with gloves',
                'Perform a dry cut only',
                'Decline service and refer to a physician',
                'Use medicated shampoo first',
              ],
              correctAnswer: 2,
              explanation:
                'Tinea capitis (ringworm of the scalp) is a contagious fungal infection — no services may be performed.',
            },
            {
              id: 'ep-q4',
              question: 'Shavette blades must be disposed of in:',
              options: [
                'The regular trash',
                'A sealed plastic bag',
                'A sharps (puncture-resistant) container',
                'The recycling bin',
              ],
              correctAnswer: 2,
              explanation:
                'Single-use sharps are biohazardous and must always go into a puncture-resistant sharps container.',
            },
            {
              id: 'ep-q5',
              question: 'When blood exposure occurs during a service, what is the FIRST action?',
              options: [
                'Continue the service with gloves',
                'Stop the service immediately',
                "Apply antiseptic to the barber's hands",
                'Change tools and continue',
              ],
              correctAnswer: 1,
              explanation:
                'Stopping the service immediately is the first step in the blood exposure protocol — client safety comes first.',
            },
            // ── HAIR SCIENCE ─────────────────────────────────────────────────
            {
              id: 'ep-q6',
              question: 'Which layer of the hair shaft contains melanin?',
              options: ['Cuticle', 'Cortex', 'Medulla', 'Follicle sheath'],
              correctAnswer: 1,
              explanation:
                'The cortex is the middle layer of the hair shaft and contains the melanin granules that determine hair color.',
            },
            {
              id: 'ep-q7',
              question: 'The active hair growth phase is called:',
              options: ['Telogen', 'Catagen', 'Anagen', 'Kenogen'],
              correctAnswer: 2,
              explanation:
                'Anagen is the active growth phase, lasting 2–7 years and determining the potential length of the hair.',
            },
            {
              id: 'ep-q8',
              question: 'Normal daily hair loss for a healthy adult is approximately:',
              options: ['10–25 hairs', '50–100 hairs', '150–200 hairs', '300+ hairs'],
              correctAnswer: 1,
              explanation:
                'Losing 50–100 hairs per day is within the normal range for the hair growth cycle.',
            },
            {
              id: 'ep-q9',
              question: 'High porosity hair indicates:',
              options: [
                'A healthy, compact cuticle',
                'A damaged or raised cuticle',
                'Excess melanin',
                'Underactive sebaceous glands',
              ],
              correctAnswer: 1,
              explanation:
                'High porosity results from a damaged or raised cuticle that absorbs moisture quickly but cannot retain it.',
            },
            {
              id: 'ep-q10',
              question: 'The healthy pH range for hair and scalp is:',
              options: ['1.0–2.0', '4.5–5.5', '7.0–8.0', '9.0–10.0'],
              correctAnswer: 1,
              explanation:
                'Hair and scalp are slightly acidic at pH 4.5–5.5. Products outside this range can disrupt the moisture balance.',
            },
            // ── TOOLS & EQUIPMENT ────────────────────────────────────────────
            {
              id: 'ep-q11',
              question: "What is placed around the client's neck before the cutting cape?",
              options: ['A towel', 'A neck strip', 'A paper collar', 'Nothing is required'],
              correctAnswer: 1,
              explanation:
                "A neck strip (paper neck strip) prevents the cape from directly touching and irritating the client's skin.",
            },
            {
              id: 'ep-q12',
              question:
                'How many drops of oil should be applied to clipper blades during maintenance?',
              options: ['10–15 drops', '5–8 drops', '2–3 drops', 'Soak the blades'],
              correctAnswer: 2,
              explanation:
                '2–3 drops while the clipper is running is sufficient — excess oil attracts hair debris.',
            },
            {
              id: 'ep-q13',
              question: 'The #0 clipper guard (no guard attached) produces:',
              options: ['1/8 inch', '1/4 inch', 'Skin-level (closest to skin)', '3/8 inch'],
              correctAnswer: 2,
              explanation:
                'Removing the guard entirely (or using #0) produces the closest possible clipper cut — used for skin fades.',
            },
            {
              id: 'ep-q14',
              question: 'Thinning shears are used to:',
              options: [
                'Create blunt lines',
                'Remove bulk without changing overall length',
                'Create a skin fade',
                'Texturize and point-cut simultaneously',
              ],
              correctAnswer: 1,
              explanation:
                'Thinning shears have one serrated blade and are designed to remove bulk while maintaining length.',
            },
            {
              id: 'ep-q15',
              question:
                'The correct chair height for ergonomic barbering positions the barber to work at:',
              options: [
                'Eye level with the client',
                'Elbow level',
                'Shoulder level',
                'Waist level',
              ],
              correctAnswer: 1,
              explanation:
                'Working at elbow level keeps the back straight, prevents hunching, and reduces repetitive strain.',
            },
            // ── HAIRCUTTING TECHNIQUES ────────────────────────────────────────
            {
              id: 'ep-q16',
              question: 'The neckline is set at:',
              options: [
                'The jawline',
                "The Adam's apple",
                "Two finger-widths above the Adam's apple",
                'The occipital bone',
              ],
              correctAnswer: 2,
              explanation:
                "Two finger-widths above the Adam's apple is the standard neckline position taught in state board preparation.",
            },
            {
              id: 'ep-q17',
              question: 'A mid fade starts at which reference point?',
              options: ['The nape', 'The occipital bone', 'The temple', 'The parietal ridge'],
              correctAnswer: 2,
              explanation:
                'A mid fade begins at the temple area — between the low fade (near occipital) and high fade (parietal ridge).',
            },
            {
              id: 'ep-q18',
              question: 'The parietal ridge is the reference point for:',
              options: ['Low fade', 'Mid fade', 'High fade', 'Neckline placement'],
              correctAnswer: 2,
              explanation:
                'The parietal ridge — the widest part of the head — is the starting point for a high fade.',
            },
            {
              id: 'ep-q19',
              question: 'Point cutting is used to:',
              options: [
                'Create a blunt, heavy line',
                'Remove weight and add texture',
                'Execute a skin fade',
                'Establish the guide line',
              ],
              correctAnswer: 1,
              explanation:
                'Point cutting removes weight from the ends and adds texture and movement to the hair.',
            },
            {
              id: 'ep-q20',
              question: 'Scissor over comb produces a result that is:',
              options: [
                'Identical to clipper over comb',
                'Softer and more natural than clipper over comb',
                'Always shorter than clipper over comb',
                'Used only for fades',
              ],
              correctAnswer: 1,
              explanation:
                'Scissor over comb produces a softer, more natural finish, often preferred for textured or ethnic hair.',
            },
            // ── SHAVING & BEARD ───────────────────────────────────────────────
            {
              id: 'ep-q21',
              question: 'The first pass in a three-pass straight razor shave goes:',
              options: [
                'Against the grain',
                'Across the grain',
                'With the grain',
                'In circular motions',
              ],
              correctAnswer: 2,
              explanation:
                'The first pass (WTG — with the grain) safely removes the bulk of the beard before closer passes.',
            },
            {
              id: 'ep-q22',
              question: 'The straight razor should be held at what angle to the skin?',
              options: ['15 degrees', '30 degrees', '45 degrees', '60 degrees'],
              correctAnswer: 1,
              explanation:
                'A 30-degree angle provides optimal closeness while minimizing the risk of cuts.',
            },
            {
              id: 'ep-q23',
              question: 'Razor bumps (pseudofolliculitis barbae) are most common in clients with:',
              options: ['Straight hair', 'Fine hair', 'Curly hair', 'Thick hair'],
              correctAnswer: 2,
              explanation:
                'Curly hair tends to re-enter the skin after shaving, causing ingrown hairs and razor bumps.',
            },
            {
              id: 'ep-q24',
              question: 'Which product is applied to a razor nick to stop minor bleeding?',
              options: ['Pre-shave oil', 'Aftershave balm', 'Alum block', 'Witch hazel'],
              correctAnswer: 2,
              explanation:
                'An alum block is an antiseptic astringent that constricts blood vessels to stop minor bleeding from nicks.',
            },
            {
              id: 'ep-q25',
              question: 'The standard neckline position for beard design is:',
              options: [
                'At the jawline',
                "At the Adam's apple",
                "Two finger-widths above the Adam's apple",
                'Below the chin',
              ],
              correctAnswer: 2,
              explanation:
                "Two finger-widths above the Adam's apple is the industry standard for beard necklines.",
            },
            // ── CHEMICAL SERVICES ─────────────────────────────────────────────
            {
              id: 'ep-q26',
              question: 'A patch test must be performed how long before a chemical service?',
              options: ['1 hour', '6 hours', '24–48 hours', '1 week'],
              correctAnswer: 2,
              explanation:
                'A 24–48 hour window is required to detect any allergic reaction before performing the service.',
            },
            {
              id: 'ep-q27',
              question: 'Relaxers break which bonds in the hair to straighten it?',
              options: [
                'Hydrogen bonds',
                'Disulfide bonds in the cortex',
                'Melanin bonds',
                'Cuticle bonds',
              ],
              correctAnswer: 1,
              explanation:
                'Chemical relaxers break the disulfide bonds in the hair cortex — the bonds that create the curl pattern.',
            },
            {
              id: 'ep-q28',
              question: 'What stops the relaxer chemical process?',
              options: ['Shampoo', 'Water rinse', 'Neutralizer', 'Conditioner'],
              correctAnswer: 2,
              explanation:
                "The neutralizer restores the hair's pH and halts the relaxer from processing further.",
            },
            {
              id: 'ep-q29',
              question: 'Hair color level 1 represents:',
              options: ['Lightest blonde', 'Medium brown', 'Dark brown', 'Black'],
              correctAnswer: 3,
              explanation:
                'Level 1 is the darkest (black). Level 10 is the lightest (pale blonde). The scale goes darkest to lightest.',
            },
            {
              id: 'ep-q30',
              question: 'Before applying a relaxer, the scalp should be protected with:',
              options: ['Pre-shave oil', 'Petroleum jelly (base)', 'Aloe vera gel', 'Conditioner'],
              correctAnswer: 1,
              explanation:
                'Petroleum jelly (base) is applied to the scalp to protect it from chemical burns during relaxer application.',
            },
            // ── PROFESSIONAL SKILLS ───────────────────────────────────────────
            {
              id: 'ep-q31',
              question: 'Indiana barber licenses must be renewed every:',
              options: ['1 year', '2 years', '3 years', '5 years'],
              correctAnswer: 1,
              explanation: 'Indiana requires barber license renewal every two years.',
            },
            {
              id: 'ep-q32',
              question:
                'In a booth rental arrangement, the barber keeps what percentage of service revenue?',
              options: ['40–60%', '70–80%', '90–95%', '100%'],
              correctAnswer: 3,
              explanation:
                'Booth renters are self-employed — they keep 100% of service revenue after paying their fixed booth fee.',
            },
            {
              id: 'ep-q33',
              question: 'What is the standard tip for barbering services?',
              options: ['5–10%', '15–20%', '25–30%', 'Tips are not standard'],
              correctAnswer: 1,
              explanation:
                '15–20% is the industry standard tip for personal service professionals including barbers.',
            },
            {
              id: 'ep-q34',
              question:
                'Self-employed barbers should set aside what percentage of income for taxes?',
              options: ['5–10%', '15–20%', '25–30%', '40–50%'],
              correctAnswer: 2,
              explanation:
                'Self-employed individuals pay income tax plus self-employment tax (Social Security + Medicare), totaling 25–30%.',
            },
            {
              id: 'ep-q35',
              question: 'Which styling product provides medium-to-high hold with a MATTE finish?',
              options: ['Pomade', 'Gel', 'Clay', 'Cream'],
              correctAnswer: 2,
              explanation:
                'Clay provides medium-to-high hold with a natural matte finish — popular for modern textured styles.',
            },
            // ── INDIANA LAWS & REGULATIONS ────────────────────────────────────
            {
              id: 'ep-q36',
              question: 'The Indiana Barber Act is located in:',
              options: [
                'Indiana Code Title 16, Article 4',
                'Indiana Code Title 25, Article 8',
                'Indiana Code Title 22, Article 3',
                'Indiana Code Title 12, Article 7',
              ],
              correctAnswer: 1,
              explanation:
                'Indiana Code Title 25, Article 8 governs all licensed barbers and barbershops in Indiana.',
            },
            {
              id: 'ep-q37',
              question: 'Barbershop licenses in Indiana are issued by:',
              options: [
                'The Indiana Department of Health',
                'The Indiana Professional Licensing Agency (IPLA)',
                'The Indiana State Board of Education',
                'The U.S. Department of Labor',
              ],
              correctAnswer: 1,
              explanation:
                'The Indiana Professional Licensing Agency (IPLA) administers all barber and barbershop licenses in the state.',
            },
            {
              id: 'ep-q38',
              question: 'Indiana barber licenses must be displayed:',
              options: [
                'At the shop entrance',
                "At each barber's individual workstation",
                "In the shop owner's office only",
                'Online only',
              ],
              correctAnswer: 1,
              explanation:
                "Each licensed barber's license must be displayed at their workstation — this is an inspectable requirement.",
            },
            {
              id: 'ep-q39',
              question: 'The passing score for the Indiana barber written state board exam is:',
              options: ['60%', '70%', '75%', '80%'],
              correctAnswer: 2,
              explanation:
                'Indiana requires a 75% passing score on the written portion of the state board examination.',
            },
            {
              id: 'ep-q40',
              question:
                'The DOL-registered apprenticeship path to a barber license in Indiana requires:',
              options: ['1,000 OJT hours', '1,500 OJT hours', '2,000 OJT hours', '2,500 OJT hours'],
              correctAnswer: 2,
              explanation:
                'The Department of Labor registered apprenticeship path requires 2,000 on-the-job training hours.',
            },
            // ── ANATOMY & PHYSIOLOGY ──────────────────────────────────────────
            {
              id: 'ep-q41',
              question: 'The human skull has how many cranial bones?',
              options: ['6', '7', '8', '10'],
              correctAnswer: 2,
              explanation:
                'There are 8 cranial bones: frontal, 2 parietal, 2 temporal, occipital, ethmoid, and sphenoid.',
            },
            {
              id: 'ep-q42',
              question: 'The largest movable bone in the face is the:',
              options: ['Frontal bone', 'Zygomatic bone', 'Maxilla', 'Mandible'],
              correctAnswer: 3,
              explanation:
                'The mandible (lower jaw) is the only movable bone of the face — it hinges at the temporomandibular joint.',
            },
            {
              id: 'ep-q43',
              question: 'The muscle primarily responsible for chewing is the:',
              options: ['Frontalis', 'Masseter', 'Trapezius', 'Orbicularis oris'],
              correctAnswer: 1,
              explanation:
                'The masseter muscle closes the jaw and is the primary muscle of mastication (chewing).',
            },
            {
              id: 'ep-q44',
              question: 'The trigeminal nerve is cranial nerve number:',
              options: ['III', 'IV', 'V', 'VII'],
              correctAnswer: 2,
              explanation:
                'Cranial nerve V (the trigeminal) provides sensation to the face and scalp and is key to facial massage knowledge.',
            },
            {
              id: 'ep-q45',
              question: 'Sebum is produced by:',
              options: ['Sweat glands', 'Sebaceous glands', 'The dermis layer', 'The hair medulla'],
              correctAnswer: 1,
              explanation:
                'Sebaceous (oil) glands produce sebum, which lubricates the hair and skin and is part of the acid mantle.',
            },
            // ── SKIN SCIENCE & FACIALS ────────────────────────────────────────
            {
              id: 'ep-q46',
              question: 'Hair follicles and sebaceous glands are located in the:',
              options: ['Epidermis', 'Dermis', 'Subcutaneous layer', 'Stratum corneum'],
              correctAnswer: 1,
              explanation:
                'The dermis (middle layer of the skin) contains hair follicles, sebaceous glands, sweat glands, and blood vessels.',
            },
            {
              id: 'ep-q47',
              question: 'Oily skin is characterized by:',
              options: [
                'Small tight pores and a matte finish',
                'Enlarged pores and a shiny appearance',
                'Flaking and tightness',
                'Redness and easy irritation',
              ],
              correctAnswer: 1,
              explanation:
                'Oily skin results from overactive sebaceous glands — enlarged pores and shininess are the telltale signs.',
            },
            {
              id: 'ep-q48',
              question: 'The opening and closing stroke used in facial massage is called:',
              options: ['Petrissage', 'Tapotement', 'Effleurage', 'Friction'],
              correctAnswer: 2,
              explanation:
                'Effleurage is the light, stroking movement used to open and close a facial massage — it relaxes and prepares the skin.',
            },
            // ── ADVANCED COLOR ────────────────────────────────────────────────
            {
              id: 'ep-q49',
              question: '20-volume developer lifts hair approximately:',
              options: ['0–1 level', '1–2 levels', '3–4 levels', '5+ levels'],
              correctAnswer: 1,
              explanation:
                '20-volume developer provides 1–2 levels of lift — the most common developer for permanent color services.',
            },
            {
              id: 'ep-q50',
              question: 'Purple toner is used to neutralize which unwanted hair tone?',
              options: ['Orange', 'Red', 'Yellow/brassy', 'Green'],
              correctAnswer: 2,
              explanation:
                'Purple and yellow are complementary colors — purple toner cancels out yellow/brassy tones in lightened hair.',
            },
          ],
        },
      ],
    },
  ],

  videoConfig: BARBER_VIDEO_CONFIG,

  assessmentRules: [
    {
      assessmentType: 'module',
      scope: 'all',
      minQuestions: 5,
      maxQuestions: 10,
      passingThreshold: 0.7,
    },
    {
      assessmentType: 'final',
      scope: 'all',
      minQuestions: 25,
      maxQuestions: 50,
      passingThreshold: 0.7,
    },
  ],
};
