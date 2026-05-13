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
          videoFile: '/videos/barber-lessons/barber-apprenticeship-intro.mp4',
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
          content: `<h2>Overview</h2><p>Infection control and safety form the foundation of professional barbering. This lesson distinguishes cleaning (physical removal of debris), disinfection (killing pathogens on surfaces), and sterilization (eliminating all microorganisms). Understanding bacteria, viruses, and fungi transmission routes—contact, airborne, and bloodborne—enables you to implement OSHA standards, execute proper exposure protocols, and maintain state board-compliant workstations that protect both you and your clients.</p><h2>Tools Required</h2><ul><li>EPA-registered disinfectant (quaternary ammonium or phenolic-based)</li><li>Autoclave or dry heat sterilizer for metal implements</li><li>Barbicide jar or disinfectant immersion container</li><li>Personal protective equipment (nitrile gloves, face mask, eye protection)</li><li>Sharps container for contaminated needles or lancets</li><li>Clean white towels and disposable cape liners</li><li>Bloodborne pathogen kit including gauze, antiseptic, and incident log</li></ul><h2>Procedure</h2><ol><li>Put on nitriles, mask, and eye protection; inspect workstation for visible debris, hair, or contamination before each client.</li><li>Clean all surfaces with soap and water, removing organic matter; use friction for 30 seconds on chairs, mirrors, and tools.</li><li>Spray EPA-registered disinfectant (contact time 10 minutes per product label) on all non-porous surfaces and allow to air dry completely.</li><li>Place single-use items (capes, neck strips, towels) in designated hamper; never reuse without laundering at 160°F minimum.</li><li>Immerse all metal cutting tools in Barbicide or approved disinfectant for minimum contact time specified by manufacturer (typically 15 minutes).</li><li>Remove implements with sanitized tongs, rinse under running water, and pat dry with clean towel before placing in sterile container.</li><li>If blood exposure occurs, immediately stop service, don fresh gloves, apply direct pressure with gauze, and clean wound with antiseptic soap.</li><li>Document incident with date, time, client, exposure type, and action taken; notify supervisor and follow OSHA recordkeeping requirements within 24 hours.</li></ol><h2>Safety</h2><p><strong>DO NOT reuse single-use items or skip disinfection steps.</strong> Consequence: cross-contamination spreads bloodborne pathogens (HIV, Hepatitis B/C), violates Indiana State Board rules, triggers OSHA penalties, and causes serious client illness or legal liability.</p><p><strong>Failure Mode & Recovery:</strong> You immerse tools but forget to air-dry the disinfectant, causing chemical residue on client skin. Recovery: (1) Stop immediately when chemical contact noticed; (2) rinse client area with cool water for 15 seconds; (3) dry thoroughly; (4) document on client intake form; (5) revise drying protocol by using lint-free towels and allowing 5-minute air-dry post-rinse; (6) discard contaminated tools and restart sterilization cycle properly.</p><p><strong>IF/THEN Decision Block—Client Variations:</strong> IF client has open cuts or lesions on scalp or neck, THEN defer service and require physician clearance; do not proceed. IF client reports recent hepatitis exposure, THEN use fresh gloves, avoid contact with any bleeding areas, and increase disinfection frequency on all touched surfaces. IF client has active ringworm or fungal infection, THEN refuse service per state law until treated and documented clear.</p><h2>Visual Cues</h2><p>Proper workstation appearance: mirror spotless and streak-free, chair upholstered surface free of hair or stains, all metal tools gleaming without water spots or dried disinfectant residue. Correct implement positioning: handles point outward in sterile container; no tools touching non-sterile surfaces. Your personal appearance shows rolled sleeves exposing clean forearms, clean-fitting shirt or uniform without visible debris, and properly fitted gloves creating seal at wrist without wrinkles or tears. Disinfectant contact is complete when surfaces appear wet for full duration specified on product label before air-drying to a clean, dry finish with no visible contamination.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-4-q1",
                              "question": "Which of the following correctly defines the difference between disinfection and sterilization?",
                              "options": [
                                        "A. Disinfection removes all microorganisms; sterilization kills only pathogens on surfaces.",
                                        "B. Sterilization eliminates all microorganisms including spores; disinfection kills most pathogens but not all.",
                                        "C. Both terms mean the same thing and can be used interchangeably in barbering.",
                                        "D. Disinfection is only used for tools; sterilization is only used for surfaces."
                              ],
                              "correctAnswer": 1,
                              "explanation": "Sterilization is the most rigorous process, eliminating all microorganisms including bacterial spores via autoclave or dry heat. Disinfection kills most pathogens using chemical agents but does not eliminate all resistant forms. Both are essential in barbering, but sterilization is required for metal implements that contact blood."
                    },
                    {
                              "id": "barber-lesson-4-q2",
                              "question": "According to OSHA and Indiana State Board standards, what is the minimum contact time for most EPA-registered disinfectants on barber workstation surfaces?",
                              "options": [
                                        "A. 5 minutes of wet contact time.",
                                        "B. 10 minutes of wet contact time as specified on the product label.",
                                        "C. 20 minutes regardless of product type.",
                                        "D. Contact time is not regulated; visual cleanliness is sufficient."
                              ],
                              "correctAnswer": 1,
                              "explanation": "EPA-registered disinfectants require a contact time (typically 10 minutes) that must be followed per the product label. Surfaces must remain visibly wet for the entire contact duration to ensure pathogen kill. Shorter times do not achieve adequate disinfection and violate state regulations."
                    },
                    {
                              "id": "barber-lesson-4-q3",
                              "question": "Which items in a barber shop MUST be discarded after each client rather than disinfected and reused?",
                              "options": [
                                        "A. Neck strips, single-use capes, and paper towels.",
                                        "B. All metal tools and combs.",
                                        "C. Only items that visibly touch blood.",
                                        "D. Chairs and mirrors after every service."
                              ],
                              "correctAnswer": 0,
                              "explanation": "Single-use items including neck strips, disposable capes, and paper towels must be discarded after each client to prevent cross-contamination. Metal tools are disinfected and sterilized for reuse. Reusing single-use items violates Indiana State Board rules and OSHA standards."
                    },
                    {
                              "id": "barber-lesson-4-q4",
                              "question": "SCENARIO: A client mentions they recently had a blood test at a medical clinic and has a small cut on their scalp. What is the correct action?",
                              "options": [
                                        "A. Proceed with the haircut using standard precautions and gloves.",
                                        "B. Ask if the test was related to infectious disease; if no recent exposure, use double gloves and proceed carefully.",
                                        "C. Refuse service until the client provides physician clearance or written documentation showing no bloodborne pathogen exposure.",
                                        "D. Use triple gloves and aggressive disinfection to proceed safely."
                              ],
                              "correctAnswer": 2,
                              "explanation": "Indiana State Board regulations require deferral of service for clients with recent potential bloodborne pathogen exposure or open lesions. A physician clearance letter documents safety and protects both you and the client. Using extra gloves does not eliminate transmission risk and does not comply with state law."
                    },
                    {
                              "id": "barber-lesson-4-q5",
                              "question": "SCENARIO: During a fade, you accidentally cut the client's ear, causing light bleeding. After applying pressure and stopping the bleed, what must you do next?",
                              "options": [
                                        "A. Continue the service immediately while wearing fresh gloves and monitoring the area.",
                                        "B. Stop service, document the incident with date/time/type of exposure, apply first aid, change gloves, and follow OSHA recordkeeping within 24 hours.",
                                        "C. Clean the area with disinfectant only and resume service without documentation.",
                                        "D. Refer the client to an emergency room regardless of bleed severity."
                              ],
                              "correctAnswer": 1,
                              "explanation": "OSHA bloodborne pathogen standard requires documentation of all exposure incidents including date, time, client, type of exposure, and actions taken. Incident logs must be maintained and reported within 24 hours. Proper first aid (pressure, antiseptic) and fresh PPE are applied, but documentation is mandatory for compliance and liability protection."
                    }
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
          content: `<h2>Overview</h2><p>Workplace safety in barbershops requires strict adherence to OSHA standards and identification of environmental hazards. This lesson covers essential safety protocols, hazard recognition, and proper response procedures to protect barbers, apprentices, and clients. Understanding bloodborne pathogens, chemical exposure, ergonomic risks, and emergency procedures ensures a safe, compliant barbershop environment.</p><h2>Tools Required</h2><ul><li>OSHA Bloodborne Pathogens Standard documentation</li><li>Safety Data Sheets (SDS) for all chemical products</li><li>First aid kit with biohazard sharps container</li><li>Personal protective equipment: gloves, masks, eye protection</li><li>Disinfectant solutions (EPA-registered hospital-grade or barbicide)</li><li>Fire extinguisher (Class B and C rated)</li><li>Spill kits and absorbent materials</li><li>Ergonomic footrest and anti-fatigue mat</li></ul><h2>Client Variation Decision Tree</h2><ul><li><strong>IF</strong> client has open cuts, sores, or bleeding skin condition, <strong>THEN</strong> refuse service, document reason, and refer to healthcare provider. Never proceed with service on compromised skin.</li><li><strong>IF</strong> client reports recent tattoo or piercing (less than 4 weeks), <strong>THEN</strong> avoid that area completely and use extra precautions; contact may introduce infection to healing tissue.</li><li><strong>IF</strong> client presents with visible fungal infection, rash, or unusual scalp lesions, <strong>THEN</strong> decline service, document observations, and recommend dermatological evaluation before returning.</li></ul><h2>Sanitation Protocol</h2><p>All non-porous tools must be immersed in EPA-registered hospital-grade disinfectant (such as Barbicide) for minimum 10 minutes at proper concentration per manufacturer instructions. Verify disinfectant solution is changed daily and chemical strength is tested with color-change strips. Reusable towels must be washed in hot water with high-heat drying cycle; single-use neck strips are preferred. Workspace surfaces, including chairs and mirrors, require spray disinfection between each client with hospital-grade surface cleaner.</p><h2>Critical Contraindication</h2><p><strong>DO NOT proceed with any service if you observe or suspect bloodborne pathogen exposure risk without proper PPE and engineering controls in place. Failure to implement infection control increases liability, violates OSHA regulations, and risks serious illness or legal consequences for yourself, your employer, and the establishment.</strong></p><h2>Failure Mode: Chemical Spill Response</h2><p><strong>Cause:</strong> Disinfectant bottle knocked over during cleaning, creating slip hazard and chemical exposure risk. <strong>Recovery Steps:</strong> (1) Alert nearby personnel and cordon off area with caution sign; (2) Don nitrile gloves and eye protection immediately; (3) Allow spill to evaporate or carefully absorb with absorbent material into biohazard waste container; (4) Spray affected area with appropriate neutralizing solution or disinfectant per SDS; (5) Wipe thoroughly with clean cloth and allow to air dry completely; (6) Document incident, notify supervisor, and verify no residual hazard exists before resuming operations.</p><h2>Visual Execution Cues</h2><p>When observing proper ergonomic positioning, barber's feet should be shoulder-width apart with weight distributed evenly; knees remain slightly bent, never locked. Shoulders stay relaxed and level, avoiding forward slouch toward client. Elbows maintain 90-degree angle with workstation. Client chair height adjusts so work area sits at barber's elbow level, eliminating excessive reaching or bending. All sharp tools are stored point-down in proper containers; scissors never left on work surface. Gloves show no tears, and fresh pair is donned before each new client. Clean workspace is organized, clutter-free, with all chemical bottles labeled and closed.</p><h2>Procedure</h2><ol><li>Review OSHA Bloodborne Pathogens Standard and barbershop-specific hazard assessment documentation before beginning any shift or new apprentice orientation.</li><li>Inspect all tools, equipment, and workstation for damage, contamination, or hazards; report unsafe conditions to supervisor immediately and do not use compromised items.</li><li>Don appropriate PPE including nitrile gloves, mask, and eye protection; verify fit and integrity before client interaction or tool handling.</li><li>Verify disinfectant solution concentration using color-change test strips; discard and replace solution if concentration is inadequate or solution is visibly contaminated.</li><li>Screen each client for contraindications: open wounds, recent piercings, skin infections, or communicable diseases; document refusals and provide referrals when appropriate.</li><li>Immerse all non-porous tools in hospital-grade disinfectant for full 10-minute contact time; remove with clean forceps and air-dry on clean towel before use.</li><li>Perform service using proper ergonomic positioning with shoulders relaxed, elbows at 90 degrees, and client chair adjusted to workstation height.</li><li>Handle all sharps with extreme care; place used blades immediately in designated sharps container; never recap, bend, or hand-pass sharp instruments to others.</li><li>Disinfect workspace, chair, and mirrors between clients using EPA-registered hospital-grade surface spray; allow adequate contact time per product instructions.</li><li>Document any incidents, exposures, or safety concerns in establishment incident log and report to supervisor or safety officer within 24 hours.</li></ol><h2>Safety Standards and Hazard Recognition</h2><p>OSHA requires barbershops to maintain bloodborne pathogen compliance, including exposure control plans, training documentation, and vaccination records. Chemical hazards include disinfectant inhalation, skin irritation, and eye exposure; all SDS must be accessible and reviewed. Sharps injuries are leading cause of occupational injury in barbershops; proper handling and disposal eliminates 95% of incidents. Ergonomic hazards develop over time; proper positioning prevents chronic back, neck, and shoulder injuries. Fire safety requires accessible extinguishers rated for electrical and chemical fires. Maintain incident log for all exposures or injuries; report to OSHA within 24 hours if serious injury occurs. Apprentices must receive documented training on all hazards before independent work and annually thereafter.</p><h2>Visual Cues</h2><p>Proper hand positioning shows wrists straight and fingers relaxed, avoiding excessive force or tension during tool manipulation. Safe tool storage displays all sharp instruments point-down in dedicated containers, never scattered on surfaces or handles-first in jars. Clean workspace organization keeps disinfectants away from client areas, chemical bottles capped and labeled clearly, and reusable items in covered containers. Correct PPE appearance includes intact gloves with no visible tears, mask fitting snugly across nose and mouth, and eye protection sitting securely. Client chair positioning appears comfortable and at optimal height where barber's elbows align naturally with work surface, eliminating visible reaching, bending, or slouching.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-5-q1",
                              "question": "According to OSHA Bloodborne Pathogens Standard, what is the minimum contact time for tools immersed in hospital-grade disinfectant?",
                              "options": [
                                        "A. 10 minutes",
                                        "B. 5 minutes",
                                        "C. 15 minutes",
                                        "D. 20 minutes"
                              ],
                              "correctAnswer": 0,
                              "explanation": "OSHA and barbershop infection control protocols require minimum 10-minute immersion time in EPA-registered hospital-grade disinfectant such as Barbicide. Shorter times do not ensure adequate pathogen elimination."
                    },
                    {
                              "id": "barber-lesson-5-q2",
                              "question": "Which of the following is NOT acceptable for storing reusable towels in a barbershop?",
                              "options": [
                                        "A. Hot water washing with high-heat drying cycle",
                                        "B. Leaving damp towels in closed container overnight",
                                        "C. Separate storage from contaminated items",
                                        "D. Single-use towels when available"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Damp towels left in closed containers overnight create ideal conditions for bacterial and fungal growth, violating OSHA sanitation standards. All reusable towels must be fully dried after hot-water washing."
                    },
                    {
                              "id": "barber-lesson-5-q3",
                              "question": "What is the correct ergonomic position for a barber's elbows while working?",
                              "options": [
                                        "A. 90-degree angle with workstation",
                                        "B. Fully extended straight",
                                        "C. Bent at 45 degrees",
                                        "D. Locked in fixed position"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Proper ergonomic positioning maintains elbows at 90-degree angle with the workstation, preventing strain, fatigue, and chronic injury to shoulders, arms, and back over time."
                    },
                    {
                              "id": "barber-lesson-5-q4",
                              "question": "SCENARIO: A client presents with a fresh tattoo on their neck from 2 weeks ago and visible redness around the site. What is the correct response?",
                              "options": [
                                        "A. Proceed with service but avoid the tattoo area completely",
                                        "B. Perform full service as normal; tattoo is healed after 2 weeks",
                                        "C. Decline service and recommend client wait 2 more weeks before returning",
                                        "D. Use extra disinfectant around the area to ensure safety"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fresh tattoos require 4-week minimum healing time. Visible redness indicates incomplete healing. Service refusal protects the client from infection risk and the barber from bloodborne pathogen exposure. Document the refusal and recommend client return after full healing."
                    },
                    {
                              "id": "barber-lesson-5-q5",
                              "question": "SCENARIO: During a haircut, you notice the disinfectant solution in the tool container appears cloudy and slightly discolored. What is the correct action?",
                              "options": [
                                        "A. Continue using the solution; it is still effective when discolored",
                                        "B. Immediately stop using the solution, change it with fresh disinfectant, and retest concentration with color-change strips",
                                        "C. Add more concentrated disinfectant to the existing solution to restore strength",
                                        "D. Use the solution only for non-critical tools and change it at end of shift"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Cloudy or discolored disinfectant indicates contamination or degraded effectiveness. OSHA standards require immediate replacement with fresh solution and verification of proper concentration using color-change test strips before resuming tool use."
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
          content: `<h2>Overview</h2><p>Client consultation is the foundation of every barbering service. Before cutting, shaving, or treating hair and skin, you must conduct a thorough consultation to identify the client's needs, assess for contraindications, and establish realistic service goals. This prevents service failures, protects client health, and builds trust and professional credibility. A complete consultation takes 5–10 minutes and involves questioning, visual assessment, and documentation.</p><h2>Tools Required</h2><ul><li>Consultation form or intake sheet (printed or digital)</li><li>Pen or stylus for recording notes</li><li>Hand mirror and overhead mirror for client viewing</li><li>Magnifying lamp or loupe to inspect scalp and skin condition</li><li>Color wheel or shade guide (if color services discussed)</li><li>Hair texture/type reference chart</li><li>Disinfectant wipes and clean towel for mirror and lamp surfaces</li></ul><h2>Procedure</h2><ol><li>Greet the client warmly, offer a seat in the consultation area, and confirm whether this is a first visit or returning client.</li><li>Ask open-ended questions: desired style, hair concerns, daily grooming routine, and any recent scalp or skin treatments or reactions.</li><li>Inspect the client's hair type, texture, density, and growth pattern; note curl pattern, damage, or thinning areas using the magnifying lamp.</li><li>Examine the scalp for signs of infection, irritation, lesions, dandruff, or contraindicated conditions; document all findings.</li><li>Assess skin condition on face and neck; ask about sensitivity, allergies, or recent shaving reactions before any service.</li><li>Review contraindications and determine if the service is safe to perform; if unsafe, explain professionally and suggest alternatives or referral.</li><li>Discuss service timeline, maintenance requirements, and aftercare instructions; clarify pricing and confirm the client's agreement.</li><li>Document all consultation findings, signed consent, and any service restrictions in the client file for future reference.</li></ol><h2>Decision Tree: Hair Type & Skin Variations</h2><p><strong>IF</strong> client has coarse, curly hair: THEN ask about curl definition goals, discuss fade or taper techniques that enhance texture, and recommend curl-defining products. <strong>IF</strong> client has fine or thinning hair: THEN assess for androgenetic alopecia, avoid aggressive techniques, and recommend gentle clipper work or scissor-over-comb methods. <strong>IF</strong> client has sensitive skin or reports razor burn history: THEN use single-use or freshly sterilized straight razors, apply pre-shave oil, and plan shorter contact time with the blade.</p><h2>Sanitation & Disinfection</h2><p>Before and after consultation, disinfect all contact surfaces with EPA-registered hospital-grade disinfectant (such as Barbicide or 10% bleach solution) using clean paper towels. Wipe mirrors, lamp handles, and armrests. Allow 10 seconds contact time. Use clean, lint-free towels to dry. If using a magnifying lamp with a client, place a disposable cover over the lens or disinfect the exterior lens with an alcohol wipe before client use. Never share consultation forms between clients; use individual, dated records.</p><h2>Contraindications & Do-NOT Statement</h2><p><strong>DO NOT perform any shaving or clipper service on a client with active bacterial, viral, or fungal scalp infection (such as impetigo, ringworm, or severe folliculitis), as doing so will spread the infection to other clients and contaminate your tools, resulting in license suspension, legal liability, and harm to public health. Always refer such clients to a dermatologist and document the referral.</strong></p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> You begin a service and the client suddenly reports a metal allergy or mentions a recent scalp treatment you missed during consultation. <strong>Recovery Step 1:</strong> Stop the service immediately and do not proceed. <strong>Step 2:</strong> Apologize and review the intake form to identify the missed information. <strong>Step 3:</strong> Ask clarifying questions about the allergy or treatment type and timing. <strong>Step 4:</strong> Assess whether the service remains safe; if unsafe, reschedule and refer as needed. <strong>Step 5:</strong> Update the client file with the new information and implement a checklist to prevent recurrence.</p><h2>Visual Execution Cues</h2><p>During consultation, position yourself at a 45-degree angle to the client so both of you can see the mirror clearly. Tilt the client's head slightly forward to inspect the crown and nape; tilt sideways to assess temple density and ear area hair growth. Use the magnifying lamp with the beam directed at the scalp at a 90-degree angle to reveal texture, shedding, and inflammation. Observe the client's posture and facial expression for signs of discomfort or hesitation, which may indicate unreported contraindications or anxiety about the service.</p><h2>Safety</h2><p>Client consultation prevents infection transmission, allergic reactions, and service failure. Always sanitize mirrors and lamps before each use. Never assume a returning client has no new health concerns—ask every time. If you observe signs of contagious scalp or skin disease, do not proceed; politely explain that a dermatologist clearance is required. Document all findings, contraindications, and client agreement in writing. Keep consultation records confidential and retain per Indiana State Board of Health regulations (minimum 1 year). If a client refuses to disclose health information or denies visible contraindicated conditions, you may decline the service to protect public health.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-6-q1",
                              "question": "What is the primary purpose of a client consultation before any barbering service?",
                              "options": [
                                        "A. To fill time and make the client comfortable waiting.",
                                        "B. To identify needs, assess contraindications, and establish realistic service goals while protecting client health.",
                                        "C. To sell additional products to increase revenue.",
                                        "D. To determine if the client can pay for the service."
                              ],
                              "correctAnswer": 1,
                              "explanation": "Client consultation is a clinical and professional step that identifies client needs, assesses for contraindications (conditions that make service unsafe), and sets service expectations. It protects both the client and the barber."
                    },
                    {
                              "id": "barber-lesson-6-q2",
                              "question": "When inspecting the client's scalp with a magnifying lamp, at what angle should the lamp beam be directed for optimal visibility?",
                              "options": [
                                        "A. At a 45-degree angle from the side.",
                                        "B. At a 90-degree angle (perpendicular) to the scalp surface.",
                                        "C. At a 30-degree angle from above.",
                                        "D. At any angle, as long as the client can see it."
                              ],
                              "correctAnswer": 1,
                              "explanation": "A 90-degree (perpendicular) beam angle reveals texture, shedding, inflammation, and contraindicated conditions most clearly without casting shadows."
                    },
                    {
                              "id": "barber-lesson-6-q3",
                              "question": "What should you do immediately after noticing signs of an active scalp infection during consultation?",
                              "options": [
                                        "A. Proceed with the service but use extra disinfectant afterward.",
                                        "B. Stop the service, do not proceed, and refer the client to a dermatologist while documenting the referral.",
                                        "C. Ask the client to return after treating it at home.",
                                        "D. Perform the service but charge a reduced rate."
                              ],
                              "correctAnswer": 1,
                              "explanation": "Active infections are contraindications. Proceeding spreads infection to other clients and equipment, risking your license and legal liability. Always refer and document."
                    },
                    {
                              "id": "barber-lesson-6-q4",
                              "question": "SCENARIO: A client presents with a history of severe razor burn from a previous barber and reports sensitive skin. What do you do?",
                              "options": [
                                        "A. Use the same technique the previous barber used to provide consistency.",
                                        "B. Decline the shaving service entirely and offer only clipper work.",
                                        "C. Document the sensitivity, use a freshly sterilized or single-use straight razor, apply pre-shave oil, and plan shorter blade contact time.",
                                        "D. Ask the client to apply numbing cream before the appointment."
                              ],
                              "correctAnswer": 2,
                              "explanation": "Sensitive skin and prior razor burn are managed through documentation, tool selection (fresh or single-use razor), protective measures (pre-shave oil), and modified technique (shorter contact), not avoidance."
                    },
                    {
                              "id": "barber-lesson-6-q5",
                              "question": "SCENARIO: After beginning a haircut, the client mentions a recent metal allergy and a scalp treatment from three days ago that you missed during consultation. What is the correct response?",
                              "options": [
                                        "A. Continue the service since you have already started; bring it up at the next visit.",
                                        "B. Stop immediately, apologize, review the missed information, assess safety, reschedule if unsafe, and update the client file with a checklist.",
                                        "C. Switch to a different tool and continue the service without stopping.",
                                        "D. Charge the client less because of the missed information."
                              ],
                              "correctAnswer": 1,
                              "explanation": "Stopping immediately prevents service failure and potential harm. Reviewing, assessing, and updating records ensures the error is corrected and prevents future recurrence."
                    }
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
          content: `<h2>Overview</h2><p>Module 1 Checkpoint assesses your mastery of infection control, safety protocols, tool sterilization, professional conduct, and client consultation. This checkpoint ensures you meet Indiana Department of Labor apprenticeship standards for barbering services. Successful completion demonstrates readiness for hands-on barbering procedures with live clients and mastery of foundational competencies required throughout your apprenticeship.</p><h2>Tools Required</h2><ul><li>Straight razors (sanitized and stropped)</li><li>Clipper sets with sanitized guards and blades</li><li>Scissors (shears) and thinning shears, sterilized</li><li>Combs, brushes, and sectioning clips</li><li>Autoclave sterilizer or EPA-registered liquid disinfectant (e.g., Barbicide or 10% bleach solution)</li><li>Towels, neck strips, and single-use cape liners</li><li>Barrier cream, aftershave balm, and professional grooming products</li></ul><h2>Client Consultation Decision Matrix</h2><ul><li>IF client has fine, thin hair THEN use longer clipper guards, reduce tension, and avoid aggressive texturizing to prevent scalp irritation and uneven weight distribution.</li><li>IF client presents with sensitive skin or razor bumps THEN apply pre-shave oil, use single-pass technique with straight razor, and recommend post-service aftercare to minimize inflammation.</li><li>IF client requests fade or undercut THEN establish baseline length preference, confirm blend zone, and verify client expectations through visual references before beginning service.</li></ul><h2>Sanitation &amp; Disinfection</h2><p>All multi-use tools must be sterilized via autoclave (15 minutes at 250°F) or submerged in EPA-registered disinfectant (e.g., Barbicide) for minimum contact time per manufacturer instructions—typically 10-15 minutes. Single-use items (razors, blades, neck strips) must be discarded immediately after use. Workstations must be cleaned with hospital-grade disinfectant between clients. Wash hands thoroughly with soap and warm water for minimum 20 seconds before and after client contact. Never reuse tools from one client on another without proper sterilization.</p><h2>Critical Contraindication</h2><p><strong>DO NOT perform any cutting, shaving, or chemical service on clients with open wounds, active infections, severe dermatitis, or contagious skin conditions. Proceeding violates sanitation codes, risks cross-contamination, and may cause serious skin damage, infection spread, and legal liability for the shop and apprentice.</strong></p><h2>Failure Mode &amp; Recovery</h2><p>Failure: Clipper blade becomes dull or pulls hair during fade service. Cause: Inadequate sterilization left residue dulling blade edge. Recovery: (1) Stop service immediately. (2) Remove blade and inspect for debris or buildup. (3) Soak blade in hot disinfectant for 15 minutes. (4) Use soft brush to gently clean grooves. (5) Rinse under warm water. (6) Dry completely. (7) Test on spare hair or practice pad. (8) If pulling persists, replace blade. (9) Apologize to client and explain maintenance issue. (10) Resume with fresh blade and adjusted technique.</p><h2>Visual Execution Cues</h2><p>Maintain 45-degree blade angle to scalp for clipper work; hold clipper body parallel to client's head during fades. Position clippers with grain for smooth cutting, against grain for closer cuts. Straight razor angle should be 15-30 degrees to skin surface with light pressure. Client should sit upright with neck relaxed, head tilted slightly forward for nape work. Scissor grip: thumb in one loop, ring and middle fingers in other loop, index finger stabilizing shears. Final appearance: clean lines, even blend zones, no visible clipper marks or scissor tracks, consistent fade progression, smooth skin feel without irritation.</p><h2>Step-by-Step Procedure</h2><ol><li>Greet client professionally, confirm service request, verify identity, and document any allergies or skin sensitivities on intake form before proceeding.</li><li>Perform visual and tactile scalp assessment; identify hair texture, density, growth patterns, and any contraindications requiring service modification or referral.</li><li>Sanitize hands with soap and warm water for 20 seconds; don fresh gloves and apply clean, sanitized cape with neck strip protecting client clothing.</li><li>Section hair using clean, sanitized clips; establish baseline guide length and confirm client preference using reference images or demonstration haircut.</li><li>Use sanitized clipper with appropriate guard, working systematically from sides to top, maintaining consistent blade angle and even pressure throughout fade area.</li><li>Refine blend zones using thinning shears or clipper-over-comb technique; verify symmetry by comparing both sides and adjusting as needed for balance.</li><li>Clean neck and ears with sanitized straight razor or trimmer, using light pressure and smooth, controlled strokes following hair growth direction.</li><li>Apply aftershave balm or conditioning product; remove cape carefully without dropping hair on client, and provide grooming and home-care recommendations.</li><li>Document service completion, product used, client feedback, and any concerns in apprenticeship logbook for supervisor review and quality assurance.</li></ol><h2>Safety &amp; Professional Standards</h2><p>Maintain universal precautions at all times: assume all clients may carry bloodborne pathogens. Never cut if you have open wounds on hands; cover with bandage and glove. Dispose of razors in sharps container only. Report any accidental cuts to supervisor immediately and follow bloodborne pathogen exposure protocol. Maintain professional posture to prevent back strain; take breaks and adjust chair height. Keep work area organized and clutter-free to prevent tripping hazards. Communicate clearly with client throughout service and address concerns immediately. Document all services, products, and client preferences in apprenticeship record for continuous improvement and legal compliance.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-1-checkpoint-q1",
                              "question": "Which of the following is the correct minimum sterilization time for tools submerged in Barbicide?",
                              "options": [
                                        "A. 5 minutes",
                                        "B. 10-15 minutes per manufacturer instructions",
                                        "C. 20 minutes",
                                        "D. 30 minutes"
                              ],
                              "correctAnswer": 1,
                              "explanation": "EPA-registered disinfectants like Barbicide require minimum contact time of 10-15 minutes per manufacturer specifications. Shorter times reduce effectiveness and violate sanitation standards."
                    },
                    {
                              "id": "barber-module-1-checkpoint-q2",
                              "question": "What is the recommended straight razor angle relative to the skin surface for safe, effective shaving?",
                              "options": [
                                        "A. 45-60 degrees",
                                        "B. 75-90 degrees",
                                        "C. 15-30 degrees",
                                        "D. 0-5 degrees (flat against skin)"
                              ],
                              "correctAnswer": 2,
                              "explanation": "A 15-30 degree angle ensures proper blade contact, minimizes nick risk, and provides smooth cutting. Angles exceeding 45 degrees reduce control and increase trauma to skin."
                    },
                    {
                              "id": "barber-module-1-checkpoint-q3",
                              "question": "Which single-use barbering item must be discarded immediately after use rather than sterilized?",
                              "options": [
                                        "A. Clipper guards",
                                        "B. Straight razor blades and neck strips",
                                        "C. Metal scissors",
                                        "D. Combs"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Single-use items like razor blades and neck strips must be discarded in appropriate waste containers to prevent cross-contamination. Reusable metal tools are sterilized via autoclave or disinfectant."
                    },
                    {
                              "id": "barber-module-1-checkpoint-q4",
                              "question": "SCENARIO: A client presents with visible razor bumps on the neck and mentions sensitive skin history. What is your correct response?",
                              "options": [
                                        "A. Proceed with standard shaving technique to build client tolerance",
                                        "B. Apply pre-shave oil, use single-pass straight razor technique, and recommend aftercare to minimize inflammation",
                                        "C. Substitute clippers for razors without discussing with client",
                                        "D. Decline service entirely and refuse to work with sensitive skin"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Professional modification ensures client safety and comfort. Pre-shave oil reduces friction, single-pass minimizes trauma, and aftercare recommendations prevent infection. Proceeding without modification risks complications."
                    },
                    {
                              "id": "barber-module-1-checkpoint-q5",
                              "question": "SCENARIO: During a fade, your clipper blade begins pulling and snagging hair instead of cutting cleanly. What is your first corrective action?",
                              "options": [
                                        "A. Switch to scissors to complete the service quickly",
                                        "B. Stop immediately, soak blade in hot disinfectant, inspect for debris, and test on practice pad before resuming",
                                        "C. Continue with increased pressure to compensate for blade dullness",
                                        "D. Replace the clipper entirely without investigating the cause"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Stopping immediately protects client comfort and prevents damage. Disinfection and inspection address the root cause (residue or dullness). Testing ensures blade readiness before resuming service."
                    }
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
          content: `<h2>Overview</h2><p>Understanding hair and scalp structure is foundational to barbering. The hair shaft consists of three layers—cuticle, cortex, and medulla—each with distinct properties affecting texture, strength, and appearance. The scalp is living skin with specialized glands and follicles. Mastering this anatomy enables accurate assessment, appropriate service selection, and client communication. This lesson covers microscopic and macroscopic anatomy essential for safe, effective barbering practices.</p><h2>Tools Required</h2><ul><li>Magnifying glass or lighted magnifier (10x minimum)</li><li>Hair strand samples: straight, wavy, curly, coily</li><li>Scalp assessment chart or diagram</li><li>Microscope slides and cover slips (optional)</li><li>Disinfectant solution (EPA-registered quaternary ammonium or phenolic)</li><li>Disposable gloves and applicator sticks</li><li>Anatomical chart or model of hair follicle cross-section</li></ul><h2>Procedure</h2><ol><li>Don gloves and inspect client scalp under magnification, noting follicle pattern, oil distribution, and visible irritation or lesions systematically.</li><li>Examine hair samples under magnifier, identifying cuticle layer characteristics: smooth (healthy), raised (damaged), or missing sections (severe damage).</li><li>Assess cortex layer density by gently bending hair strands, observing elasticity and resistance to breakage during slight tension application.</li><li>Evaluate medulla presence in coarse hair; note that fine or thin hair may lack visible medulla under standard magnification.</li><li>Document scalp condition: oily, dry, normal, or combination; correlate to sebaceous gland activity and client hygiene practices.</li><li>Identify follicle type and density; explain findings to client using anatomical chart to set service expectations and aftercare parameters.</li><li>Apply sanitation protocol: disinfect all tools and magnification equipment with EPA-registered solution per manufacturer contact time before and after examination.</li><li>Record observations on client consultation form, noting any contraindications requiring referral to dermatologist before proceeding with chemical services.</li></ol><h2>Safety</h2><p>Sanitization is critical: all magnification tools contact scalp surfaces and must be disinfected with EPA-registered quaternary ammonium (Barbicide, Lysol) or phenolic solution for minimum 10 minutes between clients. <strong>Do NOT proceed with chemical services (color, relaxer, perm) on scalp showing active lesions, severe flaking, or open wounds; consequences include chemical burns, infection spread, and client harm.</strong> If scalp contraindications exist, document findings and recommend dermatological evaluation before rescheduling chemical services. Failure mode: Client reports scalp burning during service due to undetected sensitivity. Recovery: (1) Stop service immediately; (2) Rinse scalp thoroughly with lukewarm water for 5+ minutes; (3) Apply soothing, non-irritant conditioner; (4) Contact supervising barber; (5) Document incident and client response; (6) Advise patch test 48 hours before rescheduling.</p><h2>Decision Logic</h2><ul><li>IF hair appears fine and straight with smooth cuticle, THEN use gentle handling, avoid over-processing, and recommend protein-based treatments to strengthen cortex.</li><li>IF scalp shows seborrheic buildup or flaking, THEN recommend medicated shampoo and lighter oil products; avoid heavy pomades that trap bacteria.</li><li>IF client reports previous color damage with raised cuticle, THEN assess cortex integrity and may recommend conditioning treatments or referral before additional chemical service.</li></ul><h2>Visual Cues</h2><p>Healthy hair cuticle appears smooth, flat, and reflective under magnification; raised or splintered cuticle indicates damage or over-processing. Cortex elasticity shows as hair stretching 20-30% when wet before returning to original length; excessive stretch or snapping indicates cortex weakness. Scalp should appear pink or tan with even follicle distribution; red, inflamed, or scaly areas signal inflammation or infection requiring referral. Follicle angles determine hair texture: straight follicles produce straight hair; curved follicles (90-180°) produce wavy, curly, or coily patterns. Observe client's head position at 45° angle to assess crown density and occipital contour during consultation.</p><h2>Client Variation Scenarios</h2><p>Coarse, curly hair: cortex is denser, medulla usually visible, cuticle layers thicker; requires stronger conditioning and careful heat application to prevent frizz and breakage. Fine, straight hair: thin cortex, minimal or absent medulla, delicate cuticle easily raised; use low-alkali products and avoid excessive tension during service. Oily scalp with dry ends: sebaceous glands overactive near roots while distal hair lacks moisture; address with clarifying shampoo at scalp only and moisture-rich treatments at mid-length and ends.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-8-q1",
                              "question": "Which layer of the hair shaft is primarily responsible for hair strength and elasticity?",
                              "options": [
                                        "A. Cuticle",
                                        "B. Cortex",
                                        "C. Medulla",
                                        "D. Sebaceous gland"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The cortex is the thickest layer containing protein chains (keratin) and melanin; it determines hair strength, elasticity, and color. The cuticle protects it; the medulla is the innermost core."
                    },
                    {
                              "id": "barber-lesson-8-q2",
                              "question": "Under magnification, what does a smooth, flat cuticle layer indicate?",
                              "options": [
                                        "A. Severe damage requiring cutting",
                                        "B. Healthy, undamaged hair",
                                        "C. Excess sebum buildup",
                                        "D. Medulla exposure"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A smooth, flat, reflective cuticle under magnification indicates the hair has not been over-processed and is in good condition. Raised or splintered cuticle indicates damage."
                    },
                    {
                              "id": "barber-lesson-8-q3",
                              "question": "What is the minimum magnification recommended for accurate scalp and hair examination?",
                              "options": [
                                        "A. 5x magnification",
                                        "B. 10x magnification or greater",
                                        "C. 3x magnification",
                                        "D. No magnification needed"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Professional practice requires at least 10x magnification to clearly observe cuticle condition, follicle pattern, scalp health, and potential contraindications before service."
                    },
                    {
                              "id": "barber-lesson-8-q4",
                              "question": "SCENARIO: A client presents with an active scalp lesion and requests a color service. What is the correct action?",
                              "options": [
                                        "A. Proceed with color and monitor closely",
                                        "B. Apply additional protective barrier and color",
                                        "C. Document the lesion and recommend dermatological evaluation before chemical service",
                                        "D. Use a gentler color formula to reduce irritation"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Chemical services on compromised scalp skin risk severe burns and infection. Document findings, recommend dermatologist referral, and reschedule the service after scalp heals."
                    },
                    {
                              "id": "barber-lesson-8-q5",
                              "question": "SCENARIO: During scalp examination, you notice the client's hair stretches excessively when wet and snaps without returning to original length. What does this indicate?",
                              "options": [
                                        "A. Normal elasticity; proceed with any service",
                                        "B. Cortex damage from over-processing; recommend conditioning and caution with chemical services",
                                        "C. Medulla exposure requiring immediate cutting",
                                        "D. Sebaceous gland dysfunction"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Excessive stretch with snapping indicates compromised cortex integrity from prior chemical damage or heat. Recommend protein treatments and avoid additional processing until cortex strength improves."
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
          content: `<h2>Overview</h2><p>The hair growth cycle consists of three distinct phases: anagen (growth), catagen (transition), and telogen (resting). Understanding these phases is essential for barbers to assess client scalp health, predict hair shedding patterns, and recommend appropriate treatments. Knowledge of the growth cycle informs cutting techniques, helps identify scalp conditions, and enables professionals to educate clients about normal hair loss and growth expectations.</p><h2>Tools Required</h2><ul><li>Magnifying glass or loupe (10x magnification)</li><li>Scalp probe or metal comb</li><li>Hair sample collection bag</li><li>Client intake form with hair history section</li><li>Disinfectant spray (EPA-approved, quaternary ammonium-based)</li><li>Disposable gloves and barrier tissues</li><li>Mirror or video scalp microscope for client education</li></ul><h2>Client Variation Decision Matrix</h2><ul><li><strong>IF</strong> client has fine, thin hair <strong>THEN</strong> expect shorter anagen phase (2-3 years) and more frequent shedding; recommend gentle handling and moisturizing treatments.</li><li><strong>IF</strong> client reports recent illness, medication change, or high stress <strong>THEN</strong> suspect telogen effluvium; observe increased shedding and advise dermatology referral if excessive.</li><li><strong>IF</strong> client has coarse, thick hair <strong>THEN</strong> expect longer anagen phase (5-7 years) and denser follicle population; cutting will appear fuller longer.</li></ul><h2>Sanitation Protocol</h2><p>Before examining any client's scalp, disinfect your magnifying glass and scalp probe using EPA-approved quaternary ammonium disinfectant spray. Allow 30 seconds contact time. Wear fresh disposable gloves for each client. Between clients, spray all tools with disinfectant and wipe with clean paper towel. Never reuse barrier tissues. This prevents cross-contamination and meets Indiana Board of Cosmetology sanitation standards.</p><h2>Critical Contraindication</h2><p><strong>DO NOT attempt to extract hair by force or aggressive pulling during scalp analysis.</strong> Forceful extraction can trigger premature catagen phase, damage follicles, and cause client pain and potential infection. This may result in temporary alopecia, client complaints, and liability issues.</p><h2>Failure Mode & Recovery</h2><p><strong>Scenario:</strong> During scalp assessment, you observe what appears to be dead (telogen) hairs but client reports sudden, excessive shedding beyond normal 50-100 hairs daily. <strong>Recovery:</strong> (1) Stop active pulling; (2) Document shedding pattern and duration in client notes; (3) Examine hair root bulb—if white, it is telogen; if black, client may have anagen effluvium; (4) Ask client about recent illness, weight loss, or medications; (5) Recommend dermatology consultation before proceeding with chemical services; (6) Schedule follow-up assessment in 4-6 weeks.</p><h2>Visual Execution Cues</h2><p>Position client under bright, natural or LED lighting. Part hair in four quadrants; examine each section systematically. Look for hair bulbs: white bulbs indicate telogen (resting), black bulbs indicate anagen (growing). Healthy scalp shows minimal visible sebum. Anagen hairs appear shiny and pigmented; telogen hairs appear matte and lighter. Observe hair angle perpendicular to scalp; anagen hairs emerge at 90 degrees, while telogen hairs may angle slightly outward.</p><h2>Procedure: Hair Growth Cycle Assessment</h2><ol><li>Cleanse hands and don fresh disposable gloves; disinfect magnifying glass and scalp probe with quaternary ammonium solution.</li><li>Seat client comfortably; explain the three-phase cycle and why you are assessing scalp health today.</li><li>Part hair into four sections (front-left, front-right, back-left, back-right) using tail comb; secure sections with clips.</li><li>Examine first section under magnification; gently (without pulling) observe 10-15 hairs, noting bulb color and root appearance.</li><li>Document bulb colors, shedding patterns, and scalp condition; repeat for remaining three sections.</li><li>Gently pluck 3-5 naturally shed hairs (client-offered) and place in sample bag; compare bulb characteristics to anagen/catagen/telogen references.</li><li>Release hair sections; educate client on findings using visual aids; explain normal shedding (50-100 daily) versus abnormal patterns.</li><li>Recommend appropriate treatment or referral based on observations; note assessment in client record for continuity of care.</li></ol><h2>Safety & Professional Standards</h2><p>Always maintain client confidentiality and document findings accurately. If scalp conditions appear infected, inflamed, or abnormal, refer client to a licensed dermatologist rather than proceeding with chemical services. Ensure proper hand hygiene, tool sanitation, and barrier precautions. Communicate clearly with clients about what you observe; avoid diagnosing medical conditions outside your scope of practice.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-9-q1",
                              "question": "During the anagen phase, which characteristic best describes the hair bulb?",
                              "options": [
                                        "A. White, club-shaped bulb indicating dormant follicle",
                                        "B. Black, pigmented bulb indicating active growth and division",
                                        "C. Elongated gray bulb indicating transition",
                                        "D. Hardened white bulb with no pigmentation"
                              ],
                              "correctAnswer": 1,
                              "explanation": "During anagen, the hair matrix actively produces new cells. The bulb appears black or dark because melanin is being incorporated into the growing hair shaft. White bulbs are telogen hairs."
                    },
                    {
                              "id": "barber-lesson-9-q2",
                              "question": "What is the typical daily hair shedding range considered normal for clients?",
                              "options": [
                                        "A. 10-25 hairs per day",
                                        "B. 50-100 hairs per day",
                                        "C. 150-200 hairs per day",
                                        "D. 250+ hairs per day"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Normal telogen shedding is 50-100 hairs daily. Hair in the resting phase naturally releases. Shedding exceeding 100 daily may indicate telogen effluvium or other conditions requiring dermatology referral."
                    },
                    {
                              "id": "barber-lesson-9-q3",
                              "question": "Which disinfectant method is required for scalp assessment tools between clients?",
                              "options": [
                                        "A. Rinse with warm water only",
                                        "B. Wipe with dry cloth",
                                        "C. Apply EPA-approved quaternary ammonium spray, allow 30 seconds contact time, then wipe clean",
                                        "D. Soak in alcohol for 5 minutes"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Indiana Board of Cosmetology standards require EPA-approved disinfectants with proper contact time. Quaternary ammonium solutions effectively kill pathogens on tools used for scalp assessment."
                    },
                    {
                              "id": "barber-lesson-9-q4",
                              "question": "SCENARIO: A client reports suddenly noticing significant hair shedding over the past two weeks, more than normal brushing out. Upon scalp examination, you observe mostly white bulbs on shed hairs. What should you do?",
                              "options": [
                                        "A. Proceed with all scheduled chemical services; shedding will resolve naturally",
                                        "B. Recommend the client see a dermatologist before proceeding; document findings and ask about recent illness or stress",
                                        "C. Immediately pluck more hairs to gather additional samples for diagnosis",
                                        "D. Prescribe a scalp treatment that will stop the shedding cycle"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Excessive shedding with white (telogen) bulbs may indicate telogen effluvium, often triggered by stress, illness, or medication changes. This requires professional medical evaluation. You should not proceed with chemical services until cleared by a dermatologist, and you cannot prescribe medical treatments."
                    },
                    {
                              "id": "barber-lesson-9-q5",
                              "question": "SCENARIO: While examining a client's scalp, you notice what appears to be an inflamed, weeping follicle with pustule formation in the occipital area. What is the correct professional response?",
                              "options": [
                                        "A. Continue with haircut and recommend the client use over-the-counter acne treatment",
                                        "B. Stop the service, do not touch the affected area, and refer the client to a dermatologist before proceeding with any chemical services",
                                        "C. Apply disinfectant directly to the area and continue with a modified service",
                                        "D. Document it as seborrheic dermatitis and recommend medicated shampoo"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Signs of infection, inflammation, or pustules indicate a scalp condition requiring medical evaluation. Barbers must not perform chemical services or aggressive manipulation on infected scalps. Professional referral protects client health and prevents service complications."
                    }
          ],
        },
        {
          slug: 'barber-lesson-10',
          title: 'Hair Texture, Density & Porosity',
          order: 3,
          domainKey: 'hair_science',
          objective: 'Assess hair texture, density, and porosity to select appropriate techniques.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>Overview</h2><p>Hair texture, density, and porosity are foundational properties that determine how hair responds to cutting, styling, and chemical services. Texture refers to the diameter of individual hair strands (fine, medium, coarse). Density describes the number of hair follicles per square inch of scalp. Porosity indicates the hair's ability to absorb and retain moisture, determined by the cuticle layer's condition. Mastering assessment of these properties enables barbers to select appropriate techniques, recommend suitable products, and deliver results that meet client expectations while maintaining scalp and hair health.</p><h2>Tools Required</h2><ul><li>Pull-out hair sample card (texture reference guide with fine, medium, coarse standards)</li><li>Magnifying glass or digital microscope for strand diameter examination</li><li>Sectioning clips (minimum 4) for organized scalp assessment</li><li>Fine-tooth comb for detangling and porosity testing</li><li>Spray bottle with distilled water for hydration assessment</li><li>Sectioning cape to isolate assessment areas and prevent cross-contamination</li><li>Client consultation worksheet with texture-density-porosity documentation fields</li></ul><h2>Procedure</h2><ol><li>Drape client securely with cape; ask about current hair care routine, chemical history, and environmental exposure to inform assessment accuracy.</li><li>Section hair into four quadrants using sectioning clips; begin assessment at crown, progressing to temporal and occipital regions systematically.</li><li>Remove single strand from each quadrant; compare strand diameter against pull-out reference card under consistent lighting to determine texture classification.</li><li>Assess density by observing scalp visibility: part hair and count approximate follicles per square inch; classify as sparse, normal, or dense.</li><li>Perform porosity test by spraying small hair section with distilled water; observe how quickly water absorbs and if hair appears dull or shiny after moisture contact.</li><li>Document all findings on consultation worksheet, noting any variations across scalp regions that may affect service planning or product selection decisions.</li><li>Discuss assessment results with client; explain how texture, density, and porosity influence service outcomes and maintenance requirements moving forward.</li><li>Recommend cutting angles and techniques aligned with identified properties; explain why specific approaches optimize results for their hair type.</li></ol><h2>Decision Factors</h2><ul><li><strong>IF</strong> client has fine texture AND high porosity: THEN use moisturizing shampoo, avoid aggressive detangling, select techniques that minimize breakage (e.g., blunt cuts rather than tapered fades on delicate strands).</li><li><strong>IF</strong> client has coarse texture AND low porosity: THEN recommend clarifying shampoo, use deeper conditioning treatments, employ techniques like texturizing or point-cutting to manage density and reduce bulk.</li><li><strong>IF</strong> density is sparse: THEN avoid clipper-over-comb techniques on short lengths; use scissor-over-comb for controlled, conservative removal to preserve fullness perception.</li></ul><h2>Sanitation</h2><p>All tools contacting scalp or hair must be disinfected before use. Immerse combs, sectioning clips, and reference cards in 10% bleach solution (or hospital-grade disinfectant per state board standards) for minimum 10 minutes, then rinse thoroughly with clean water and air-dry. Pull-out reference cards should be placed in clear plastic sleeves; replace sleeve weekly or when visibly soiled. Spray bottles must be filled with fresh distilled water daily; do not reuse water between clients. Hands must be washed with antimicrobial soap before and after each client assessment.</p><h2>Contraindications</h2><p><strong>Do NOT attempt chemical relaxer or permanent wave services on hair showing signs of severe damage, breakage, or extreme porosity without consulting a licensed cosmetologist or performing a patch test first. Failure to assess porosity can result in over-processing, chemical burns to scalp, hair breakage, and potential liability claims.</strong></p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> Misidentifying texture as coarse when it is actually fine, leading to aggressive cutting techniques that create unwanted taper or reduce perceived volume. <strong>Recovery:</strong> (1) Stop service and re-examine strand under magnifying glass alongside reference card. (2) Compare sample against multiple reference standards to confirm actual texture. (3) Adjust blade angle and cutting pressure immediately; shift to gentler scissor-over-comb or blunt-cut approach. (4) Communicate change to client transparently, explaining texture reassessment. (5) Document correct classification in service notes for future appointments. (6) Demonstrate adapted technique on inconspicuous section before continuing visible areas.</p><h2>Visual Cues</h2><p><strong>Texture Assessment:</strong> Fine hair appears almost transparent when isolated; medium hair displays visible diameter without magnification; coarse hair shows prominent, almost wire-like strand structure. <strong>Density Observation:</strong> Sparse density reveals scalp easily when hair is parted; normal density partially conceals scalp with slight visibility; dense hair completely obscures scalp when parted. <strong>Porosity Indicators:</strong> Low porosity hair repels water droplets, appearing shiny and tightly aligned; high porosity hair absorbs water rapidly, appearing dull and slightly raised from scalp. Healthy cuticles lay flat and smooth; damaged high-porosity hair shows lifted, rough cuticle appearance and may feel rough or cottony to touch.</p><h2>Safety</h2><p>Never force combs through tangled hair when assessing wet porosity; use detangling spray and gentle pressure to avoid scalp injury. Avoid prolonged magnifying glass use; position lighting to reduce eye strain. If client reports scalp sensitivity, itching, or irritation, discontinue assessment and refer to dermatologist before proceeding with chemical services. Always perform patch tests 48 hours before chemical applications on clients with unknown history or newly identified high porosity. Maintain proper posture during assessment to prevent repetitive strain injury; position client and magnification tools at ergonomic height.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-10-q1",
                              "question": "Which of the following best defines hair porosity in professional barber context?",
                              "options": [
                                        "A. The hair's ability to absorb and retain moisture, determined by cuticle layer condition",
                                        "B. The diameter measurement of individual hair strands from follicle to tip",
                                        "C. The number of hair follicles per square inch of scalp surface",
                                        "D. The natural color pigment concentration within the hair cortex"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Porosity specifically refers to moisture absorption capacity and cuticle condition. Texture (B) is strand diameter, density (C) is follicle count, and color (D) is unrelated to porosity assessment."
                    },
                    {
                              "id": "barber-lesson-10-q2",
                              "question": "When assessing a client with fine texture and high porosity, which service approach is MOST appropriate?",
                              "options": [
                                        "A. Aggressive clipper-over-comb fading to remove bulk quickly",
                                        "B. Use moisturizing shampoo and select blunt cuts to minimize breakage risk",
                                        "C. Apply clarifying shampoo and perform heavy texturizing techniques",
                                        "D. Recommend permanent wave service to add strength to delicate strands"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Fine + high porosity hair is delicate and susceptible to breakage. Moisturizing products and conservative blunt cuts protect the hair. Aggressive techniques (A), clarifying shampoo (C), and chemical services (D) would damage this hair type."
                    },
                    {
                              "id": "barber-lesson-10-q3",
                              "question": "Which tool is essential for comparing hair strand diameter during texture assessment?",
                              "options": [
                                        "A. Pull-out hair sample reference card with fine, medium, and coarse standards",
                                        "B. Digital pH meter to measure scalp acidity levels",
                                        "C. Spectrophotometer to analyze light reflection from hair surface",
                                        "D. Moisture meter to determine water content percentage"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Pull-out reference cards provide direct visual comparison for texture classification. pH meters (B), spectrophotometers (C), and moisture meters (D) measure other properties unrelated to texture diameter assessment."
                    },
                    {
                              "id": "barber-lesson-10-q4",
                              "question": "SCENARIO: A client presents with coarse hair texture, normal density, and low porosity. Upon questioning, they reveal past relaxer use and frequent heat styling. What is your appropriate response?",
                              "options": [
                                        "A. Proceed with clipper-over-comb fade immediately; low porosity means hair is resistant",
                                        "B. Recommend clarifying shampoo, use point-cutting to manage texture, and discuss heat protectant products for maintenance",
                                        "C. Schedule chemical relaxer service to further smooth the coarse texture",
                                        "D. Defer service to cosmetologist; barbers cannot cut heat-damaged coarse hair"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Coarse + low porosity benefits from clarifying treatment and texturizing techniques. Point-cutting manages bulk; heat protectant recommendations support maintenance. Clipper technique (A) ignores texture characteristics. Relaxer service (C) risks over-processing. Deferral (D) is unnecessary; barbers assess and cut all texture types."
                    },
                    {
                              "id": "barber-lesson-10-q5",
                              "question": "SCENARIO: During density assessment, you part the client's hair and observe scalp visibility throughout. Upon further examination with magnification, you realize you initially misidentified texture as medium when it is actually fine. What is the correct corrective action?",
                              "options": [
                                        "A. Continue service with original medium-texture cutting technique; admitting error reduces client confidence",
                                        "B. Stop service, re-examine strand against reference card, document correct classification, and adjust blade angle and pressure to gentler techniques before continuing",
                                        "C. Complete the cut using medium-texture approach, then recommend corrective service in two weeks",
                                        "D. Ask client if they prefer medium or fine haircut result; let them decide which technique to use"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Professional recovery requires immediate reassessment, transparent communication, and technique adjustment before continuing. Proceeding with wrong approach (A, C) risks damage. Client decisions on technique (D) are barber's responsibility. Correct identification protects hair integrity and service quality."
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
          content: `<h2>Overview</h2><p>Barbers must identify common scalp conditions and disorders to provide safe, effective services and recognize when professional medical referral is necessary. This lesson covers clinical assessment techniques, condition recognition, sanitation protocols, and appropriate boundaries of barber scope of practice. Proper scalp analysis protects client health and establishes professional credibility.</p><h2>Tools Required</h2><ul><li>Scalp magnifier or headband magnifying glass (10x magnification)</li><li>Sterilized metal scalp probe or applicator stick</li><li>Wood's lamp for fungal detection</li><li>Disposable gloves (nitrile, non-powdered)</li><li>Barrier spray or disinfectant (70% isopropyl alcohol or EPA-registered spray)</li><li>Client intake form with scalp condition checklist</li><li>Referral resource list (dermatologist, trichologist contacts)</li><li>Clean towels and headrest covers</li></ul><h2>Decision Scenarios</h2><ul><li><strong>IF</strong> client has oily scalp with visible flaking and mild odor, <strong>THEN</strong> assess for seborrheic dermatitis; observe distribution and severity; if confined to scalp and mild, proceed with gentle service; if spreading to face or severe, refer to dermatologist.</li><li><strong>IF</strong> client reports itching, burning, or scaling following a recent chemical service, <strong>THEN</strong> examine for contact dermatitis; check timing of onset relative to service date; if symptoms appeared within 24-48 hours post-service, document and refer; do not repeat similar chemical service without medical clearance.</li><li><strong>IF</strong> scalp shows pustules, crusting, or weeping areas, <strong>THEN</strong> suspect bacterial or fungal infection; do not proceed with cutting or chemical services; refer client to physician immediately; maintain sanitation barriers.</li></ul><h2>Sanitation Protocol</h2><p>Before and after every scalp assessment, sanitize all contact surfaces and tools. Use EPA-registered disinfectant spray on magnifying equipment and headrest covers between clients. Sterilize metal probes in a dry-heat sterilizer at 320°F for 15 minutes or autoclave at 250°F for 3 minutes. Always wear fresh nitrile gloves during assessment. If client has known fungal or parasitic infection, use disposable barrier cape and isolate all contaminated materials in sealed biohazard bag per Indiana health code requirements.</p><h2>Critical Contraindication</h2><p><strong>DO NOT cut, shave, treat, or apply any chemical service to a scalp displaying signs of active ringworm (tinea capitis), lice infestation, or bacterial infection.</strong> Continuing service spreads contagion to other clients, violates state board regulations, and exposes you to disciplinary action or license suspension. Immediate referral to physician is legally and ethically required.</p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> During scalp examination, you misidentify seborrheic dermatitis as simple dandruff and proceed with harsh scrubbing or medicated treatment. Client experiences increased inflammation, redness, and burning within hours. <strong>Recovery Steps:</strong> (1) Stop service immediately and explain findings. (2) Document what you observed and client's reaction. (3) Recommend client apply cool compress and avoid hot water. (4) Provide written referral to dermatologist with specific concern noted. (5) Follow up via phone within 24 hours. (6) Discuss with supervising barber or instructor to refine your assessment technique. (7) Review condition characteristics to prevent recurrence.</p><h2>Visual Execution Cues</h2><p>Position client upright in chair with neck supported on headrest. Part hair systematically using metal probe, working from center front scalp backward in 1-inch sections. Maintain magnifier at 2-3 inches from scalp surface. Look for: raised or flat red patches (erythema), white or yellow scaling (desquamation), pustules or crusts (exudation), areas of hair loss (alopecia), or threadlike objects on hair shafts (lice nits). Compare left and right sides; note symmetry or localization. Healthy scalp appears pale pink to tan with minimal visible scaling and no odor.</p><h2>Procedure</h2><ol><li>Review client intake form and ask targeted questions: recent itching, flaking, scaling, hair loss, or chemical exposure. Note any medications or allergies affecting scalp.</li><li>Don fresh nitrile gloves and inspect scalp under natural light first, observing overall color, texture, and visible lesions or patterns without touching.</li><li>Position magnifier 2-3 inches above scalp. Systematically part hair in 1-inch sections from front to crown, examining each area for inflammation, scaling, pustules, crusting, or foreign objects.</li><li>Use sterilized metal probe to gently separate hair and observe scalp surface; note distribution (localized vs. generalized) and severity of any abnormalities.</li><li>If fungal infection suspected, use Wood's lamp in dimmed room; tinea capitis shows blue-green fluorescence. Document findings and do not proceed with service.</li><li>Assess client sensation: ask if scalp is tender or painful. Extreme tenderness with visible lesions indicates infection or inflammatory condition requiring referral.</li><li>If condition is within barber scope (mild dandruff, seborrhea without active inflammation), document findings and recommend appropriate home care or gentle scalp massage service.</li><li>For any suspicious, severe, spreading, or unidentifiable condition, provide written referral to dermatologist or physician; do not attempt treatment or chemical service.</li><li>Document all findings on client card with date, description, and any referrals made; maintain confidentiality per HIPAA principles.</li><li>Dispose of all materials in appropriate waste containers; spray chair and headrest with disinfectant; remove and discard gloves in biohazard container.</li></ol><h2>Safety</h2><p><strong>Do NOT diagnose medical conditions.</strong> Your role is to identify signs and refer appropriately. Never apply medicated products, shampoos, or treatments to an undiagnosed scalp condition. Always use barrier protection and maintain strict sanitation to prevent cross-contamination of fungal or parasitic infections. Maintain confidentiality regarding any scalp conditions observed. If client refuses referral for a serious condition, document the conversation and your recommendation in writing. Understand Indiana barber scope of practice: you can assess, observe, and refer, but cannot treat medical conditions. Keep current contact information for local dermatologists and trichologists for client referrals.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-11-q1",
                              "question": "Which tool is most appropriate for systematically examining scalp sections during condition assessment?",
                              "options": [
                                        "A. Straight razor",
                                        "B. Sterilized metal scalp probe and magnifier",
                                        "C. Electric clipper",
                                        "D. Standard comb"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A sterilized metal probe allows gentle separation of hair to view scalp surface clearly, while a magnifier (10x) provides clinical detail. Razors, clippers, and combs are cutting/styling tools, not diagnostic instruments."
                    },
                    {
                              "id": "barber-lesson-11-q2",
                              "question": "What does blue-green fluorescence under a Wood's lamp indicate on the scalp?",
                              "options": [
                                        "A. Healthy scalp with normal bacteria",
                                        "B. Contact dermatitis or allergic reaction",
                                        "C. Suspected tinea capitis (ringworm)",
                                        "D. Seborrheic dermatitis or dandruff"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Wood's lamp produces characteristic blue-green fluorescence when tinea capitis fungal spores are present. This is a clinical diagnostic sign requiring immediate referral to a physician. Other conditions do not produce this fluorescence."
                    },
                    {
                              "id": "barber-lesson-11-q3",
                              "question": "Which scalp condition is WITHIN the barber scope of practice to address with a gentle service?",
                              "options": [
                                        "A. Mild seborrhea with flaking but no active inflammation",
                                        "B. Active ringworm with pustules and crusting",
                                        "C. Bacterial scalp infection with weeping lesions",
                                        "D. Lice infestation with visible nits"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Mild seborrhea without active inflammation (redness, pustules, crusting) is within scope; you can provide gentle scalp massage and recommend home care. Active infections, ringworm, and parasitic infestations require immediate physician referral and are contraindications to service."
                    },
                    {
                              "id": "barber-lesson-11-q4",
                              "question": "SCENARIO: A client presents with tender, localized pustules and crusting on the scalp. Yellow fluid is visible on the affected area. What is your correct response?",
                              "options": [
                                        "A. Proceed with haircut using careful technique around the affected area.",
                                        "B. Apply a medicated scalp treatment to address the infection.",
                                        "C. Stop service immediately, document findings, and provide written referral to physician. Do not proceed with any cutting or chemical service.",
                                        "D. Use the Wood's lamp to confirm the condition, then treat with antiseptic spray."
                              ],
                              "correctAnswer": 2,
                              "explanation": "Pustules, crusting, and exudate indicate active bacterial or fungal infection. This is a contraindication to all barber services. Immediate physician referral is legally and ethically required. Continuing service spreads infection and violates state regulations. Never attempt treatment of active infections."
                    },
                    {
                              "id": "barber-lesson-11-q5",
                              "question": "SCENARIO: During scalp examination, you misidentify mild seborrheic dermatitis as simple dandruff and perform harsh scalp scrubbing. Within two hours, the client reports increased burning and visible redness. What is your correct recovery step?",
                              "options": [
                                        "A. Recommend the client use ice and a gentle shampoo at home and schedule another service.",
                                        "B. Stop immediately, apologize, document the incident, apply cool compress guidance, and refer to dermatologist with written notes on your findings and the client's reaction.",
                                        "C. Explain that this is a normal reaction and the condition will improve in a few days.",
                                        "D. Apply soothing lotion to the scalp to reduce inflammation and reassure the client."
                              ],
                              "correctAnswer": 1,
                              "explanation": "When a client experiences adverse reaction to your service, you must immediately stop, document everything, provide comfort guidance, and refer to a medical professional. This protects the client, documents your professional response, and creates a record for your protection. Never minimize client symptoms or attempt further treatment."
                    }
          ],
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
          content: `<h2>Overview</h2><p>Client consultation is the foundation of every successful barber service. A professional consultation assesses the client's hair type, scalp condition, lifestyle, and expectations while establishing trust and setting realistic service outcomes. This lesson teaches apprentices how to conduct thorough consultations using systematic observation, targeted questioning, and clear communication to deliver customized barbering services that exceed client expectations.</p><h2>Tools Required</h2><ul><li>Consultation card or digital intake form</li><li>Hand mirror and wall-mounted mirror for client viewing</li><li>Scalp analysis light or magnifying glass</li><li>Color swatches or style reference photos</li><li>Disposable gloves for scalp examination</li><li>Disinfectant spray (EPA-approved, such as Barbicide or hospital-grade quaternary ammonium solution)</li><li>Clean towel for draping during assessment</li></ul><h2>Decision Matrix: Hair Type & Scalp Variations</h2><p><strong>IF</strong> client has fine, thin hair with visible scalp: <strong>THEN</strong> recommend shorter lengths, lighter products, and frequent trims to maintain shape and avoid matting. Avoid heavy conditioning treatments that weigh hair down.</p><p><strong>IF</strong> client presents with oily scalp but dry ends: <strong>THEN</strong> assess for buildup from product misuse, recommend clarifying wash monthly, lightweight pomade on ends only, and oil-controlling shampoo for scalp.</p><p><strong>IF</strong> client has textured or curly hair with visible dryness or flaking: <strong>THEN</strong> examine for fungal conditions versus simple dehydration, recommend moisture-rich products, and refer to dermatologist if scaling persists after two weeks.</p><h2>Sanitation Protocol</h2><p>Before and after each consultation, disinfect all tools and surfaces. Spray consultation mirrors, color swatches, and magnifying glasses with EPA-approved Barbicide spray or equivalent hospital-grade disinfectant. Allow 10-second contact time. Use fresh disposable gloves when examining scalp; remove gloves immediately after assessment and dispose in biohazard container. Wash hands with antimicrobial soap for 20 seconds. Never reuse consultation cards without sanitizing clipboard surfaces between clients.</p><h2>Critical Contraindication</h2><p><strong>Do NOT proceed with any scalp service if you observe signs of contagious conditions such as active ringworm, head lice, severe psoriasis with open lesions, or bacterial infection.</strong> Proceeding exposes you, other clients, and the barbershop to legal liability, regulatory violations, and license suspension. Always refer the client to a physician, document the observation in writing, and inform the shop owner immediately.</p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> Client states they want a specific style, but after consultation you realize their hair texture cannot achieve that look without chemical treatment or excessive damage. <strong>Recovery steps:</strong> (1) Acknowledge their desired outcome respectfully. (2) Explain the hair science limitation clearly using the mirror to show texture and growth patterns. (3) Show photos of similar styles achievable with their hair type. (4) Offer a modified version that approximates their goal while maintaining hair health. (5) Document the conversation and recommendation on their consultation card. (6) Follow up at next visit to confirm satisfaction and adjust expectations collaboratively.</p><h2>Visual Execution Cues</h2><p>Position the client upright in the chair with shoulders relaxed and head level with yours. Use cross-lighting (natural light from window plus overhead fixture) to observe scalp color, texture, and condition clearly. Part hair in three sections: center crown, left and right sides. Examine at 45-degree angles by lifting sections toward you. Healthy scalp appears light pink with no visible flaking, inflammation, or odor. Hair should feel smooth when stroked from root to tip, with consistent diameter and shine. Document any asymmetries, scars, moles, or unusual features that may affect cutting angles or safety.</p><h2>Step-by-Step Consultation Procedure</h2><ol><li>Greet client warmly, offer refreshment, and seat them comfortably. Drape shoulders with clean towel and position mirror for full-face and head visibility from both angles.</li><li>Begin conversation by asking about their occupation, hobbies, and hair maintenance routine to understand lifestyle demands and time available for grooming.</li><li>Ask about previous haircuts: what they liked, disliked, and why. Inquire about frequency of visits and current products they use at home.</li><li>Show reference photos or style examples and ask clarifying questions about length, fade depth, texture preference, and overall aesthetic direction they envision.</li><li>Don safety gloves and perform systematic scalp examination by parting hair in sections, observing color, texture, moisture level, and any signs of irritation or infection.</li><li>Assess hair density, diameter, and growth patterns by lifting sections and observing how hair falls naturally and resists or follows gravity and directional flow.</li><li>Discuss findings with client in simple, non-technical language. Explain any limitations or recommendations based on hair type, scalp health, and their stated lifestyle.</li><li>Document all information on consultation card including hair type, scalp condition, style preference, contraindications, and any special requests or allergies.</li><li>Set clear expectations by explaining the recommended service, timeframe, aftercare instructions, and maintenance frequency needed to sustain the style.</li><li>Confirm client understanding and gain their verbal agreement before beginning the actual service. Ask if they have questions or concerns.</li></ol><h2>Safety</h2><p>Always wear disposable gloves during scalp examination. Never use personal tools or equipment that has not been disinfected. Maintain professional distance and respect client comfort; ask permission before touching their hair. If client reports pain, tenderness, or discomfort during assessment, stop immediately and refer to medical provider. Document any observed skin conditions, allergies, or sensitivities. Keep consultation records confidential and secure. If you observe signs of abuse, neglect, or trafficking, follow mandatory reporting procedures outlined in your barbershop policy and Indiana law.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-2-q1",
                              "question": "What is the primary purpose of a professional client consultation in barbering?",
                              "options": [
                                        "A. To upsell additional products to the client",
                                        "B. To assess client needs, hair type, scalp condition, and set realistic expectations",
                                        "C. To determine how much to charge for the service",
                                        "D. To complete paperwork as quickly as possible"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A consultation assesses the client's hair characteristics, health, and expectations to deliver customized, safe services. While documentation and pricing occur, the primary purpose is understanding the client's needs and educating them on achievable outcomes."
                    },
                    {
                              "id": "barber-lesson-2-q2",
                              "question": "Which of the following is the correct disinfection procedure for consultation mirrors?",
                              "options": [
                                        "A. Wipe with dry cloth between clients",
                                        "B. Spray with EPA-approved disinfectant, allow 10-second contact time, then wipe clean",
                                        "C. Rinse with warm water only",
                                        "D. Soak in Barbicide overnight once per week"
                              ],
                              "correctAnswer": 1,
                              "explanation": "EPA-approved disinfectants like Barbicide require proper contact time (typically 10 seconds) to kill pathogens. Dry wiping and water rinses are insufficient. Overnight soaking may be part of maintenance but cannot replace between-client sanitation."
                    },
                    {
                              "id": "barber-lesson-2-q3",
                              "question": "What visual appearance indicates a healthy scalp during consultation?",
                              "options": [
                                        "A. Dark red or inflamed surface with visible flaking",
                                        "B. Light pink color with no flaking, inflammation, or odor, consistent throughout",
                                        "C. Yellow or greasy appearance with strong odor",
                                        "D. White or chalky patches indicating good exfoliation"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A healthy scalp is light pink, free from inflammation, flaking, and odor. Red, yellow, white patches, or strong odors indicate conditions requiring medical referral or product adjustment."
                    },
                    {
                              "id": "barber-lesson-2-q4",
                              "question": "SCENARIO: During consultation, you observe what appears to be active ringworm on the client's scalp with visible circular lesions and scaling. What is your correct response?",
                              "options": [
                                        "A. Proceed with the haircut but use extra disinfectant afterward",
                                        "B. Tell the client you can treat it with a special shampoo from your barber supply",
                                        "C. Stop immediately, do not touch the scalp further, refer to physician, document observation, inform shop owner, and reschedule after medical clearance",
                                        "D. Suggest the client come back after applying over-the-counter antifungal cream"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Ringworm is contagious and legally reportable. Proceeding creates liability, health risk, and potential regulatory violations. Medical referral is mandatory. Documentation protects you, the client, and the barbershop."
                    },
                    {
                              "id": "barber-lesson-2-q5",
                              "question": "SCENARIO: During consultation, the client requests a fade with very short sides and requests their hair be cut in a way that their visible scalp scar from previous surgery is concealed as much as possible. How should you respond?",
                              "options": [
                                        "A. Tell them the scar will always be visible and refuse to accommodate their request",
                                        "B. Acknowledge the scar, listen to their preference, show them styling options that work with their hair type and scalp shape, document their request, and explain how you'll position the fade to minimize visibility while maintaining style integrity",
                                        "C. Cut the hair exactly as requested without discussing the scar to avoid embarrassment",
                                        "D. Recommend they grow their hair longer instead to cover the scar"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Professional consultation requires acknowledging client concerns with sensitivity, offering practical solutions, and documenting preferences. Respecting the client's goals while using your technical expertise builds trust and ensures they feel heard and cared for."
                    }
          ],
        },
        {
          slug: 'barber-lesson-13',
          title: 'Shampoo & Scalp Massage',
          order: 6,
          domainKey: 'hair_science',
          objective: 'Perform a professional shampoo service and scalp massage.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Overview</h2><p>Professional shampoo and scalp massage are foundational barbering services that cleanse hair, stimulate blood circulation, and provide therapeutic relaxation. Mastering proper technique protects scalp health, enhances client comfort, and builds the trust essential to a thriving barbering practice. This lesson covers assessment, safe product selection, and execution standards for all hair and scalp types.</p><h2>Tools Required</h2><ul><li>Shampoo basin or sink with adjustable water temperature and pressure controls</li><li>Barbicide or EPA-registered disinfectant for tools and surfaces</li><li>Clean towels (minimum two: one neck protector, one head wrap)</li><li>pH-balanced shampoo appropriate for client hair type</li><li>Scalp massager or fingertips for therapeutic massage application</li><li>Water thermometer to verify safe temperature (95–110°F)</li><li>Comb or brush for gentle detangling post-shampoo</li></ul><h2>Client Assessment &amp; Variation</h2><p><strong>IF</strong> client has fine or thinning hair, <strong>THEN</strong> use gentle circular motions with light pressure and volumizing shampoo; avoid vigorous friction. <strong>IF</strong> client presents with oily scalp or dandruff, <strong>THEN</strong> apply clarifying or medicated shampoo and focus massage on scalp for 3–5 minutes to increase circulation. <strong>IF</strong> client reports scalp sensitivity or recent color treatment, <strong>THEN</strong> use sulfate-free, color-safe shampoo and reduce water temperature to 100°F maximum.</p><h2>Sanitation Protocol</h2><p>Before each service, sanitize the shampoo basin with Barbicide solution for 10 minutes or use EPA-approved spray disinfectant. Wash hands thoroughly with antimicrobial soap. Inspect towels for stains or odors; use only fresh, clean linens for each client. If using a scalp massager tool, submerge in Barbicide for the required contact time. Replace water in the basin between clients and check temperature with a thermometer to prevent scalding.</p><h2>Critical Contraindication</h2><p><strong>Do NOT proceed with shampooing if the client has open wounds, severe burns, or acute scalp infections (ringworm, impetigo, or oozing lesions).</strong> Performing a shampoo under these conditions risks spreading infection, increases client pain, causes cross-contamination, and violates Indiana barber licensing regulations. Always refer the client to a dermatologist and document the referral in writing.</p><h2>Failure Mode: Water Temperature Shock</h2><p><strong>Cause:</strong> Water suddenly becomes too hot, causing client discomfort or scalp burn. <strong>Recovery Step 1:</strong> Immediately reduce water temperature to lukewarm (below 100°F). <strong>Step 2:</strong> Pause the service and ask the client if they are okay. <strong>Step 3:</strong> Test water on your inner wrist before resuming. <strong>Step 4:</strong> Resume shampooing with gradual temperature increases, communicating each change to the client. <strong>Step 5:</strong> Document the incident and inform your instructor or supervisor.</p><h2>Visual Execution Cues</h2><p>Position the client's head at a 45-degree angle over the basin, with the nape resting securely on the rim. The client's shoulders should be covered with a towel and cape to prevent water drips. Fingers and thumbs work in rhythmic, overlapping circles across the scalp, moving from the hairline toward the crown and down the occipital area. The massage should appear fluid and synchronized; the client's scalp skin should move slightly beneath your fingers, indicating proper pressure—not so light as to tickle, not so deep as to cause tenderness.</p><h2>Step-by-Step Procedure</h2><ol><li>Greet client, review any scalp or hair concerns, and select appropriate shampoo product based on hair type and condition.</li><li>Drape client with clean neck towel and cape; adjust water temperature to 100–105°F and test on your wrist before wetting hair.</li><li>Wet hair thoroughly from hairline to nape, using gentle water pressure to avoid splashing; ensure scalp is saturated evenly.</li><li>Apply shampoo using one quarter-sized amount; distribute across scalp using fingertips in systematic circular motions, section by section.</li><li>Perform 3–5 minute scalp massage using alternating thumbs and fingers, working from temporal areas toward the center crown and down to the nape.</li><li>Rinse thoroughly with lukewarm water, ensuring no shampoo residue remains; repeat rinse until water runs clear.</li><li>Optional: Apply conditioner to ends for 1–2 minutes if hair type requires, then rinse completely with cool water to seal cuticles.</li><li>Gently squeeze excess water from hair; wrap head in clean towel and allow client to sit upright for 1–2 minutes before proceeding.</li></ol><h2>Safety &amp; Compliance</h2><p>Always maintain professional boundaries during scalp massage—keep contact to the scalp and neck area only. Monitor the client's comfort verbally and non-verbally throughout. Never use products not listed on the salon's approved inventory. Document any client reactions or scalp abnormalities observed during the service. Follow Indiana State Board of Cosmetology &amp; Barbers regulations regarding sanitation, water safety, and professional conduct.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-13-q1",
                              "question": "What is the recommended water temperature range for professional shampooing?",
                              "options": [
                                        "A. 110–120°F to ensure deep cleansing",
                                        "B. 95–110°F to prevent scalp irritation and burns",
                                        "C. 70–80°F for client comfort",
                                        "D. 120°F or higher for sanitization"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Water between 95–110°F is warm enough for effective cleansing and massage without causing scalp burns or discomfort. Temperatures above 110°F increase risk of thermal injury; below 95°F may feel uncomfortably cold and reduce product effectiveness."
                    },
                    {
                              "id": "barber-lesson-13-q2",
                              "question": "Which shampoo product selection is correct for a client with fine, thinning hair?",
                              "options": [
                                        "A. Heavy moisturizing shampoo with strong lather",
                                        "B. Clarifying shampoo with vigorous massage",
                                        "C. Gentle, volumizing shampoo with light pressure and minimal friction",
                                        "D. Medicated shampoo regardless of scalp condition"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine and thinning hair requires gentle handling to prevent breakage. Volumizing formulas add body without weight, and light pressure during massage protects delicate strands. Heavy moisturizers and vigorous friction would cause additional hair loss and damage."
                    },
                    {
                              "id": "barber-lesson-13-q3",
                              "question": "According to sanitation protocol, how should a shampoo basin be disinfected between clients?",
                              "options": [
                                        "A. Rinse with hot water only",
                                        "B. Submerge tools in Barbicide for 10 minutes or use EPA-approved spray disinfectant",
                                        "C. Wipe with a damp cloth",
                                        "D. Replace water without additional sanitization"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Barbicide immersion for 10 minutes or EPA-registered spray disinfectants are required by Indiana barber regulations to eliminate pathogens. Hot water alone and wiping are insufficient to meet state sanitation standards and protect against cross-contamination."
                    },
                    {
                              "id": "barber-lesson-13-q4",
                              "question": "SCENARIO: A client presents with an oozing scalp lesion and reports it appeared three days ago. What is your correct action?",
                              "options": [
                                        "A. Proceed with shampooing using medicated shampoo only",
                                        "B. Perform a brief scalp massage to stimulate healing",
                                        "C. Proceed with shampooing but use extra Barbicide afterward",
                                        "D. Decline the service, refer the client to a dermatologist, and document the referral in writing"
                              ],
                              "correctAnswer": 3,
                              "explanation": "Oozing lesions indicate a possible infection (ringworm, impetigo, etc.). Shampooing risks spreading infection, causes pain, and violates licensing regulations. Referral to a dermatologist is mandatory, and all barbering services must be declined until cleared by a healthcare provider."
                    },
                    {
                              "id": "barber-lesson-13-q5",
                              "question": "SCENARIO: During shampooing, the water suddenly becomes too hot and the client flinches. What is your immediate corrective response?",
                              "options": [
                                        "A. Continue at current temperature; the client will adjust",
                                        "B. Immediately reduce water temperature to lukewarm, pause the service, ask if the client is okay, then test water on your wrist before resuming",
                                        "C. Stop all water flow and proceed with dry shampoo instead",
                                        "D. Blame the water heater and apologize without taking action"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Immediate temperature reduction prevents scalp burns and demonstrates professional care. Pausing to check on the client shows attentiveness, testing water on your wrist prevents recurrence, and resuming with clear communication rebuilds client trust and safety."
                    }
          ],
        },
        {
          slug: 'barber-module-2-checkpoint',
          title: 'Hair Science Checkpoint',
          order: 7,
          domainKey: 'hair_science',
          objective: 'Demonstrate mastery of hair science and scalp analysis.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Overview</h2><p>Hair science and scalp analysis form the foundation of professional barbering. This checkpoint verifies your ability to identify hair types, scalp conditions, and appropriate service recommendations. Mastery ensures client safety, satisfaction, and proper service selection based on individual characteristics.</p><h2>Tools Required</h2><ul><li>Magnifying glass or lighted magnifier</li><li>Scalp analysis chart or reference guide</li><li>Hair type classification cards</li><li>Disinfectant spray (EPA-registered barbicide solution)</li><li>Clean towels and drapes</li><li>Sectioning clips and comb</li><li>Dermoscope or Wood's lamp (optional advanced tool)</li></ul><h2>Decision Matrix: Client Hair & Scalp Variations</h2><p><strong>IF</strong> client presents with fine, straight hair: THEN recommend conservative fade heights and avoid aggressive texturizing to prevent breakage. <strong>IF</strong> client has coily or textured hair: THEN select appropriate clipper guards and consider edge work techniques that complement curl pattern. <strong>IF</strong> client displays flaking or visible irritation on scalp: THEN assess for dandruff versus dermatitis and recommend professional scalp treatment before cutting service.</p><h2>Sanitation Protocol</h2><p>All tools must be cleaned and disinfected using EPA-registered barbicide solution per Indiana State Board guidelines. Immerse implements in solution for minimum 15 minutes. All combs, brushes, and clippers contact skin and must be disinfected between clients. Work surface and chair must be sprayed with disinfectant and wiped clean with disposable towel after each client.</p><h2>Critical Contraindication</h2><p><strong>DO NOT attempt to cut or treat hair showing signs of active fungal infection, severe dermatitis, or open sores on the scalp.</strong> Proceeding risks cross-contamination, client harm, regulatory violation, and potential license disciplinary action. Refer client to dermatologist and document refusal in client record.</p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> Misidentified scalp condition as non-contagious when client actually has tinea capitis (ringworm). <strong>Recovery Step 1:</strong> Stop service immediately upon recognition of circular patches with inflammation. Step 2: Disinfect all tools used. Step 3: Politely inform client condition requires medical evaluation before barbering services. Step 4: Recommend dermatologist referral. Step 5: Document incident and condition observation in client file. Step 6: Disinfect entire workstation and chair per protocol.</p><h2>Visual Execution Cues</h2><p>Position client facing mirror with good overhead lighting. Scalp should be visible in sections; part hair systematically from front hairline to nape in half-inch sections. Healthy scalp appears uniform color, free of flaking or inflammation. Hair shaft should lie flat when combed; cuticle should reflect light evenly. Assess hair diameter by comparison to reference fiber samples. Note any areas of excessive oiliness, dryness, or discoloration as indicators of condition type.</p><h2>Step-by-Step Procedure</h2><ol><li>Drape client properly and wash hands; don clean gloves if necessary for detailed scalp examination and analysis.</li><li>Part hair into five sections using clips; create vertical sections from center front to nape dividing crown area into quadrants.</li><li>Examine scalp under each section using magnifying glass, noting color, texture, flaking, redness, or unusual odor indicators.</li><li>Feel scalp texture with fingertips; note tightness, oiliness, or dryness; compare findings to scalp analysis chart provided.</li><li>Assess individual hair strand diameter, elasticity, and porosity by stretching single strands and observing recovery and moisture absorption.</li><li>Determine overall hair type classification using reference guide; document findings in client service record clearly.</li><li>Recommend appropriate service plan based on analysis; discuss maintenance and home care aligned with identified hair type.</li><li>Disinfect magnifying glass and all tools used during analysis with EPA-registered solution before next client service begins.</li></ol><h2>Safety & Compliance Notes</h2><p>Always maintain professional boundaries during scalp analysis. Refer clients with suspicious lesions, infections, or dermatological conditions to medical professionals. Document all findings and recommendations. Maintain client privacy and confidentiality regarding any scalp or hair condition observations. Follow Indiana State Board regulations regarding scope of practice; barbers diagnose conditions for service appropriateness only, not medical diagnosis.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-2-checkpoint-q1",
                              "question": "What is the minimum immersion time for tools in EPA-registered barbicide disinfectant solution?",
                              "options": [
                                        "A. 15 minutes",
                                        "B. 5 minutes",
                                        "C. 30 minutes",
                                        "D. 1 minute"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Indiana State Board regulations and EPA guidelines require minimum 15-minute immersion in registered barbicide solution for proper disinfection of implements that contact skin."
                    },
                    {
                              "id": "barber-module-2-checkpoint-q2",
                              "question": "When analyzing a client's hair type, which tool provides the most detailed magnified view of scalp condition?",
                              "options": [
                                        "A. Regular comb",
                                        "B. Magnifying glass or lighted magnifier",
                                        "C. Mirror only",
                                        "D. Visual inspection without tools"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A magnifying glass or lighted magnifier allows detailed visualization of scalp condition, hair shaft characteristics, and potential issues that are invisible to the naked eye."
                    },
                    {
                              "id": "barber-module-2-checkpoint-q3",
                              "question": "Which of the following is NOT an appropriate response to identifying a fungal scalp infection?",
                              "options": [
                                        "A. Stop service immediately and refer to dermatologist",
                                        "B. Proceed with service and apply medicated product",
                                        "C. Document findings in client record",
                                        "D. Disinfect all tools used"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Proceeding with service on a fungal infection risks cross-contamination, violates health regulations, and causes client harm. Immediate referral and service termination are required by law."
                    },
                    {
                              "id": "barber-module-2-checkpoint-q4",
                              "question": "SCENARIO: A client presents with visible flaking, redness on the scalp, and reports itching. You observe this during initial consultation. What do you do?",
                              "options": [
                                        "A. Begin cutting immediately; the condition is not your concern",
                                        "B. Apply conditioner to mask the appearance and proceed with service",
                                        "C. Assess whether this is dandruff or dermatitis; recommend professional scalp treatment before cutting service",
                                        "D. Tell the client to wash their hair more frequently"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Professional assessment distinguishes between treatable dandruff and conditions requiring medical referral. Proper diagnosis guides appropriate service recommendations and protects client health and regulatory compliance."
                    },
                    {
                              "id": "barber-module-2-checkpoint-q5",
                              "question": "SCENARIO: During scalp analysis, you notice circular patches with inflammation and suspect tinea capitis. Your correct recovery response is:",
                              "options": [
                                        "A. Continue service but use extra disinfectant on tools",
                                        "B. Stop service, disinfect tools, refer client to dermatologist, and document incident",
                                        "C. Recommend the client purchase antifungal shampoo and return next week",
                                        "D. Treat the area with store-bought fungal cream yourself"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Suspected fungal infections require immediate service termination, professional referral, complete disinfection of tools and workspace, and detailed documentation. Barbers cannot treat infections; medical professionals must evaluate and manage."
                    }
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
          content: `<h2>Overview</h2><p>Clippers and trimmers are fundamental tools for barbers, used to cut, blend, and detail hair efficiently. Understanding the differences between clipper types, guard sizes, and their specific applications ensures professional results and client satisfaction. Magnetic motor clippers provide power for bulk cutting, while rotary clippers offer quieter operation. Pivot motor trimmers excel at detailing and edging. Guards, measured in eighths of an inch, control cutting length from skin-close fades to longer textured cuts. Mastery of these tools allows barbers to execute diverse styles, from classic tapers to modern fades, while maintaining precision and consistency throughout every service.</p><h2>Tools Required</h2><ul><li>Magnetic motor clippers with detachable blade system</li><li>Rotary motor clippers for precision fading</li><li>Pivot motor trimmers for edging and detail work</li><li>Guard attachment set ranging from #0.5 to #8</li><li>Clipper blade oil and cleaning brush</li><li>Disinfectant spray specifically labeled for tools</li><li>Neck duster for removing loose hair</li><li>Blade coolant or cooling spray</li></ul><h2>Client Assessment</h2><p>IF the client has thick, coarse hair, THEN use magnetic motor clippers with guards #3 or higher for initial bulk removal, as these provide sufficient power without bogging down. IF the client has fine or thinning hair, THEN select rotary clippers with guards #1 to #2 and work with lighter pressure to avoid creating unintended bald spots or lines of demarcation that become visible as the hair lies flat against the scalp.</p><h2>Procedure</h2><ol><li>Inspect clippers and trimmers for blade alignment, ensuring cutting edges are even and free of rust, gaps, or visible damage before service.</li><li>Select appropriate guard size based on desired length, starting with larger guards for conservative length and working down as needed for precision.</li><li>Attach guard firmly to clipper, ensuring it clicks securely into place and sits flush against the blade to prevent uneven cutting.</li><li>Begin cutting with clippers held at proper angle, typically perpendicular to scalp for uniform length or angled for tapering and blending techniques.</li><li>Move clippers against hair growth direction using smooth, overlapping strokes to ensure complete coverage and eliminate missed patches or track marks.</li><li>Switch to smaller guards progressively when creating fades, blending each section seamlessly by using scooping or flicking motions at transition points.</li><li>Use trimmers without guards for detail work around ears, neckline, and sideburns, holding them at shallow angles for clean, precise lines.</li><li>Apply blade coolant if clippers become warm during extended use, then complete final inspection for symmetry and blending before concluding service.</li></ol><h2>Safety</h2><p>After each client, remove guards and spray all clipper and trimmer surfaces with EPA-registered hospital-grade disinfectant such as Barbicide spray or Clippercide, allowing appropriate contact time per manufacturer instructions. Brush away loose hair from between blade teeth, apply two drops of clipper oil, and run briefly to distribute lubricant.<strong>Do NOT use clippers with misaligned or damaged blades, as this causes skin irritation, painful pulling, and potential cuts or abrasions that create infection risk and liability.</strong>If clippers pull hair instead of cutting cleanly, this indicates dull blades requiring immediate replacement or sharpening, compromising service quality and client comfort significantly.</p><h2>Failure Recovery</h2><p>If you accidentally remove too much hair by using an incorrect guard size, causing a visible bald patch or line, immediately stop cutting. Assess the damage extent by combing surrounding hair over the area. Gradually blend the surrounding sections using the next smaller guard size, working in small increments. Use clipper-over-comb technique to feather edges. Apply texturizing or point-cutting scissors to soften harsh lines. Communicate honestly with the client about correction options, which may include adjusting the overall style shorter or creating a different look that incorporates the mistake into an intentional design element.</p><h2>Visual Cues</h2><p>Hold clippers perpendicular to the head for uniform all-over cuts, with the guard base flat against the scalp throughout the stroke. For fades and tapers, angle clippers progressively as you move upward, rotating from flat against the head to approximately forty-five degrees at transition zones. Observe the hair falling away from the clipper; it should release cleanly without bunching or pulling. Watch for track marks appearing as visible lines in the cut, indicating overlapping strokes are needed. Monitor blade temperature by periodically touching the housing; excessive heat signals need for coolant application or motor rest to prevent discomfort during service.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-15-q1",
                              "question": "What is the primary advantage of magnetic motor clippers over other clipper types?",
                              "options": [
                                        "A. They provide the most power for cutting thick, coarse hair and bulk removal",
                                        "B. They operate most quietly among all clipper motor types",
                                        "C. They are best suited exclusively for fine detail work around the ears",
                                        "D. They require no maintenance or blade oil between clients"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Magnetic motor clippers deliver the most cutting power, making them ideal for bulk removal and cutting through thick, coarse hair efficiently without bogging down during the service."
                    },
                    {
                              "id": "barber-lesson-15-q2",
                              "question": "Guard sizes on clipper attachments are typically measured in what increment?",
                              "options": [
                                        "A. Millimeters only, following metric standards",
                                        "B. Eighths of an inch for standard sizing",
                                        "C. Quarters of an inch for all manufacturers",
                                        "D. Centimeters according to international guidelines"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Clipper guards are measured in eighths of an inch, with each guard number representing that many eighths. For example, a #4 guard leaves 4/8 or 1/2 inch of hair length."
                    },
                    {
                              "id": "barber-lesson-15-q3",
                              "question": "Which tool is most appropriate for creating clean edge lines around the ears and neckline?",
                              "options": [
                                        "A. Pivot motor trimmers without guards for precision detailing",
                                        "B. Magnetic motor clippers with a #8 guard attached",
                                        "C. Rotary clippers with the longest guard available",
                                        "D. Thinning shears held at a forty-five degree angle"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Pivot motor trimmers used without guards provide the precision and maneuverability needed for clean, detailed edge work around ears, necklines, and sideburns where accuracy is essential."
                    },
                    {
                              "id": "barber-lesson-15-q4",
                              "question": "SCENARIO: A client with very fine, thinning hair requests a fade. What is the most appropriate approach?",
                              "options": [
                                        "A. Use magnetic motor clippers with heavy pressure to ensure complete coverage",
                                        "B. Apply the shortest guards first and work upward to longer lengths",
                                        "C. Select rotary clippers with guards #1 to #2 and use lighter pressure to avoid visible demarcation lines",
                                        "D. Recommend using only scissors throughout the entire service"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine, thinning hair requires rotary clippers with appropriate guards and lighter pressure to prevent creating harsh lines or bald spots that become highly visible when fine hair lies flat against the scalp."
                    },
                    {
                              "id": "barber-lesson-15-q5",
                              "question": "SCENARIO: During a clipper cut, you notice the hair is pulling rather than cutting cleanly. What is the correct response?",
                              "options": [
                                        "A. Increase pressure and speed to force the clippers through the hair",
                                        "B. Stop immediately, as this indicates dull blades that require replacement or sharpening before continuing",
                                        "C. Switch to a smaller guard size to reduce the amount of hair being cut",
                                        "D. Apply more blade oil while continuing to cut through the section"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Hair pulling indicates dull or damaged blades that compromise both service quality and client comfort. The barber must stop immediately and replace or sharpen the blades before continuing to prevent discomfort and poor results."
                    }
          ],
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
          content: `<h2>Overview</h2><p>Straight razors and safety razors are essential precision tools in professional barbering, requiring mastery of technique, maintenance, and safety protocols. This lesson covers proper handling, stropping, sanitizing, and execution of razor services. Understanding blade angles, skin tension, and client assessment ensures safe, comfortable shaves while preventing injury and infection. Mastery of these tools distinguishes professional barbers and enables traditional wet shaving services that clients value.</p><h2>Tools Required</h2><ul><li>Straight razor with changeable blade system or traditional fixed blade</li><li>Safety razor with guard and fresh double-edge blades</li><li>Leather strop and canvas strop for honing and maintenance</li><li>Pre-shave oil and quality shaving cream or soap</li><li>Hot towels and towel warmer for skin preparation</li><li>Styptic powder or alum block for minor nicks</li><li>EPA-registered hospital-grade disinfectant such as Barbicide or Marvicide</li></ul><h2>Client Assessment</h2><p>IF the client has coarse, curly hair prone to ingrown hairs, THEN shave with the grain only and use pre-shave oil to soften hair and reduce irritation. IF the client has sensitive skin or visible irritation, THEN reduce passes to a single with-grain pass and apply cool compresses between towel applications to minimize inflammation and discomfort.</p><h2>Procedure</h2><ol><li>Sanitize hands and inspect razor for damage or dullness. Ensure blade is properly seated and secure in the handle mechanism.</li><li>Apply hot towel to client's face for two to three minutes to soften hair and open pores, ensuring optimal cutting conditions.</li><li>Apply pre-shave oil and work quality lather into beard using circular motions, ensuring complete coverage and hydration of hair shafts.</li><li>Establish proper skin tension with non-dominant hand, stretching skin taut in direction opposite to razor stroke for optimal cutting surface.</li><li>Execute first pass with grain using 30-degree blade angle, employing short controlled strokes with consistent light pressure throughout coverage area.</li><li>Reapply lather and perform across-grain pass if needed, maintaining proper angle and tension while checking for missed areas or irregularities.</li><li>Apply cold towel to close pores, then aftershave or moisturizer. Clean and disinfect razor per manufacturer protocols immediately after service.</li></ol><h2>Safety</h2><p>Immerse razors completely in EPA-registered disinfectant solution such as Barbicide for ten minutes minimum contact time between clients, ensuring all blood-borne pathogen exposure risks are eliminated. Follow state board requirements for storage of disinfected tools in clean, covered containers.</p><p><strong>Do NOT perform razor services on clients with active skin infections, open wounds, or contagious skin conditions such as impetigo or herpes simplex, as this will spread infection, contaminate tools, and violate health codes, potentially resulting in license suspension and legal liability.</strong></p><p>If a nick or cut occurs during service, immediately apply firm pressure with clean gauze or cotton, followed by styptic powder application. Stop the service temporarily. Once bleeding stops completely, assess whether to continue based on severity. Document the incident. Clean contaminated surfaces with hospital-grade disinfectant. Replace blade immediately and place used blade in sharps container. Comfort the client and explain the recovery steps taken to ensure their safety and well-being.</p><h2>Visual Cues</h2><p>Maintain a 30-degree angle between blade edge and skin surface, visible as a shallow approach rather than perpendicular positioning. Properly stretched skin appears smooth, taut, and free of wrinkles in the stroke path. Observe the shaving cream removing cleanly in single strokes without multiple passes over the same area. The blade should glide smoothly without dragging, skipping, or pulling sensations. Watch for skin redness or irritation developing during service, indicating excessive pressure or improper angle. Completed areas should appear smooth, even-toned, and free from visible stubble or razor burn patterns.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-17-q1",
                              "question": "What is the correct blade angle for straight razor shaving?",
                              "options": [
                                        "A. 30 degrees between blade and skin surface",
                                        "B. 45 degrees between blade and skin surface",
                                        "C. 90 degrees perpendicular to skin surface",
                                        "D. 15 degrees nearly flat against skin"
                              ],
                              "correctAnswer": 0,
                              "explanation": "A 30-degree angle provides optimal cutting efficiency while minimizing irritation and risk of cuts. This angle allows the blade edge to slice through hair effectively without scraping or dragging on the skin surface."
                    },
                    {
                              "id": "barber-lesson-17-q2",
                              "question": "What is the minimum contact time required for disinfecting razors in EPA-registered solution?",
                              "options": [
                                        "A. Five minutes in solution",
                                        "B. Ten minutes in solution",
                                        "C. Fifteen minutes in solution",
                                        "D. Three minutes in solution"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Ten minutes minimum contact time in EPA-registered disinfectant like Barbicide ensures complete elimination of blood-borne pathogens and meets state board sanitation requirements for razor services."
                    },
                    {
                              "id": "barber-lesson-17-q3",
                              "question": "What is the primary purpose of applying hot towels before razor shaving?",
                              "options": [
                                        "A. Soften hair and open pores for optimal cutting conditions",
                                        "B. Remove all oils from the skin surface",
                                        "C. Disinfect the skin before service",
                                        "D. Test client tolerance for heat"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Hot towels soften hair shafts and open pores, making hair easier to cut and reducing drag on the blade. This preparation step is essential for comfortable, effective razor shaving and reduces irritation."
                    },
                    {
                              "id": "barber-lesson-17-q4",
                              "question": "SCENARIO: A client with coarse, curly hair prone to ingrown hairs requests a close shave. What do you do?",
                              "options": [
                                        "A. Perform multiple against-grain passes for maximum closeness",
                                        "B. Use a dull blade to avoid cutting too close",
                                        "C. Shave with the grain only and apply pre-shave oil to reduce irritation",
                                        "D. Refuse the service entirely"
                              ],
                              "correctAnswer": 2,
                              "explanation": "For clients prone to ingrown hairs, shaving with the grain only prevents hair from being cut too short below the skin surface. Pre-shave oil softens hair and reduces friction, minimizing the risk of ingrown hairs and irritation."
                    },
                    {
                              "id": "barber-lesson-17-q5",
                              "question": "SCENARIO: During the service you notice the blade is dragging and pulling rather than gliding smoothly. Correct response?",
                              "options": [
                                        "A. Apply more pressure to force the blade through",
                                        "B. Stop, assess blade sharpness, replace or strop as needed, and reapply lather",
                                        "C. Continue the service using faster strokes",
                                        "D. Switch to shaving against the grain"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Dragging indicates a dull blade or insufficient lubrication. Stopping to replace or strop the blade and reapply lather ensures client comfort and safety. Continuing with a dull blade causes irritation, cuts, and poor results."
                    }
          ],
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
          content: `<h2>Overview</h2><p>Proper clipper maintenance is essential for delivering consistent, professional haircuts and extending the life of your most important tools. Regular cleaning, oiling, and blade care prevent performance degradation, reduce client discomfort, and maintain hygiene standards. This lesson covers the fundamental maintenance procedures every barber apprentice must master, including daily cleaning protocols, blade alignment checks, and troubleshooting common issues. Understanding these techniques will save you money on premature replacement costs and ensure your clippers perform at peak efficiency throughout each service day.</p><h2>Tools Required</h2><ul><li>Clipper blade brush with stiff bristles</li><li>Clipper blade oil (manufacturer-recommended or professional-grade)</li><li>Barbicide or EPA-registered disinfectant solution</li><li>Clean, lint-free microfiber cloths</li><li>Small flathead screwdriver for blade adjustment</li><li>Blade coolant spray or cooling lubricant</li><li>Replacement blade set compatible with your clipper model</li><li>Compressed air canister or electric air blower</li></ul><h2>Client Variations</h2><p>IF the client has thick, coarse hair, THEN expect faster blade dulling and increased friction; apply blade coolant more frequently during the cut and inspect blades for wear after each service. IF the client has fine, thin hair, THEN less frequent oiling is needed during the service, but ensure blades remain sharp as dull blades snag delicate hair shafts more readily.</p><h2>Sanitation Protocol</h2><p>After each client service, remove loose hair with a brush, then spray blades thoroughly with Barbicide spray disinfectant or immerse detachable blades in Barbicide solution for ten minutes. Allow blades to air dry completely before reassembling to prevent rust formation. This hospital-grade disinfection kills bacteria, viruses, and fungi that accumulate during client contact, meeting Indiana State Board sanitation requirements.</p><h2>Safety</h2><p><strong>Do NOT operate clippers with misaligned blades</strong>, as this causes uneven cutting, painful skin pinching, and potential lacerations to the client's scalp. Misalignment also creates excessive heat buildup and motor strain, leading to premature clipper failure and costly repairs. Always verify proper blade alignment before beginning any service and stop immediately if you notice dragging or uneven cutting performance during use.</p><h2>Failure Mode</h2><p>If clippers suddenly stop cutting effectively mid-service despite running normally, the cause is typically hair and product buildup between blade teeth creating a barrier. To recover: First, turn off and unplug clippers immediately. Second, remove blade assembly using the screwdriver. Third, brush all visible debris from both blades. Fourth, use compressed air to remove packed material. Fifth, apply three drops of clipper oil across the blade. Sixth, reassemble, test on back of hand, then resume service with properly functioning tool.</p><h2>Visual Cues</h2><p>Properly maintained blades appear silver or steel-colored without brown oxidation spots or black carbon buildup between teeth. The cutting blade should move smoothly side-to-side with a quiet humming sound, not grinding or clicking noises. Blade teeth should align perfectly with no visible gaps when viewed straight-on at eye level. Oil should create a thin, even sheen across the blade surface without pooling or dripping. During operation, blades should remain cool enough to touch comfortably within thirty seconds of shutting off the clipper motor.</p><h2>Procedure</h2><ol><li>Turn off and unplug clippers completely. Remove loose hair using the blade brush, sweeping from base toward teeth in firm strokes.</li><li>Use compressed air to blow out packed debris from between blade teeth and inside the blade housing, holding nozzle at forty-five degrees.</li><li>Apply two to three drops of clipper oil evenly across the top blade while holding clipper horizontal with blades facing upward.</li><li>Turn on clippers briefly for five seconds to distribute oil across all contact surfaces, then wipe excess with clean cloth.</li><li>Inspect blade alignment by viewing straight-on; adjust screws if cutting blade extends beyond guide blade or gaps appear between teeth.</li><li>Spray blades with Barbicide disinfectant until fully saturated, ensuring solution contacts all blade surfaces. Allow ten-minute contact time before air drying.</li><li>Test clippers on back of your hand for smooth operation and proper cutting action before using on next client.</li><li>Store clippers in clean, dry location with blades protected from impact damage. Repeat full maintenance after every three to four clients.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-18-q1",
                              "question": "What is the primary reason for applying clipper oil during routine maintenance?",
                              "options": [
                                        "A. To reduce friction between blade surfaces and prevent overheating during operation",
                                        "B. To make the clippers appear more professional and shiny",
                                        "C. To disinfect the blades and kill bacteria between clients",
                                        "D. To sharpen the blade teeth and restore cutting performance"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Clipper oil reduces friction between moving blade surfaces, prevents overheating, and ensures smooth operation. It is not a disinfectant or sharpening agent, though it does protect against rust."
                    },
                    {
                              "id": "barber-lesson-18-q2",
                              "question": "How long should clipper blades remain in contact with Barbicide disinfectant solution?",
                              "options": [
                                        "A. Thirty seconds for quick sanitation",
                                        "B. Ten minutes for proper hospital-grade disinfection",
                                        "C. One hour to ensure complete sterilization",
                                        "D. Five minutes as a standard protocol"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Barbicide requires a ten-minute contact time to effectively kill bacteria, viruses, and fungi according to EPA registration and Indiana State Board requirements for proper disinfection."
                    },
                    {
                              "id": "barber-lesson-18-q3",
                              "question": "What visual indicator suggests clipper blades need immediate cleaning?",
                              "options": [
                                        "A. Black carbon buildup or brown oxidation visible between blade teeth",
                                        "B. A shiny, reflective surface across the entire blade",
                                        "C. Slight warmth felt on the blade housing",
                                        "D. Quiet humming sound during operation"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Black carbon buildup or brown oxidation between teeth indicates accumulated debris and potential rust, requiring immediate cleaning. A shiny surface and quiet operation indicate proper maintenance."
                    },
                    {
                              "id": "barber-lesson-18-q4",
                              "question": "SCENARIO: A client with extremely thick, coarse hair is scheduled for a full clipper cut. What maintenance adjustment should you make?",
                              "options": [
                                        "A. Use less oil than normal to prevent hair from sticking to blades",
                                        "B. Skip the pre-service blade inspection to save time",
                                        "C. Apply blade coolant more frequently and inspect for wear after the service",
                                        "D. Increase blade gap spacing to accommodate the hair thickness"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Thick, coarse hair creates more friction and heat, dulling blades faster. Applying coolant frequently prevents overheating, and post-service inspection catches accelerated wear before it affects future clients."
                    },
                    {
                              "id": "barber-lesson-18-q5",
                              "question": "SCENARIO: During a haircut, your clippers suddenly stop cutting effectively although the motor still runs. What is your correct first response?",
                              "options": [
                                        "A. Apply more pressure and continue cutting to push through the problem",
                                        "B. Turn off and unplug the clippers immediately, then disassemble for cleaning",
                                        "C. Spray the blades with oil while running to lubricate them",
                                        "D. Switch to a different clipper and continue without interruption"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When clippers stop cutting despite running, hair buildup is blocking the blades. Immediately turning off and unplugging ensures safety, and disassembly allows proper cleaning to restore function before resuming service."
                    }
          ],
        },
        {
          slug: 'barber-lesson-19',
          title: 'Ergonomics & Body Mechanics',
          order: 5,
          domainKey: 'tools_equipment',
          objective: 'Apply ergonomic principles to prevent injury during barbering services.',
          durationMinutes: 15,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Overview</h2><p>Ergonomics and proper body mechanics are essential for preventing chronic pain, fatigue, and career-ending injuries in barbering. This lesson teaches you to position your body, adjust equipment, and move efficiently during services. Applying these principles reduces strain on your back, neck, shoulders, and wrists while improving service quality and stamina. Understanding neutral postures, weight distribution, and workspace organization will extend your professional longevity. Client considerations such as height, mobility limitations, and service duration require adaptive ergonomic strategies to protect both barber and client throughout each appointment.</p><h2>Tools Required</h2><ul><li>Hydraulic barber chair with adjustable height and recline functions</li><li>Anti-fatigue mat with cushioned support for standing work</li><li>Adjustable work station or tool tray at elbow height</li><li>Ergonomic shears and clippers with balanced weight distribution</li><li>Footstool or step platform for reaching different angles</li><li>Full-length mirror for self-monitoring posture and positioning</li><li>Lumbar support cushion for seated client services</li></ul><h2>Client Variations</h2><p>IF the client is significantly taller or shorter than average, THEN adjust chair height so the working area is between your waist and chest level to avoid excessive bending or reaching. IF the client has limited mobility or cannot hold their head steady, THEN position yourself to support their head with your non-dominant hand while working, and take frequent breaks to reset your own posture and avoid compensatory strain.</p><h2>Procedure</h2><ol><li>Adjust the hydraulic chair height so the client's head aligns between your waist and mid-chest when standing in neutral posture with relaxed shoulders.</li><li>Position anti-fatigue mat beneath your work area and stand with feet shoulder-width apart, distributing weight evenly between both legs throughout service.</li><li>Arrange tools on adjustable tray at elbow height to minimize reaching and twisting; keep frequently used implements within forearm's length.</li><li>Maintain neutral spine alignment by engaging core muscles, keeping shoulders back and down, and avoiding forward head posture during detailed work.</li><li>Pivot your entire body by stepping around the chair rather than twisting at the waist; reposition your feet to face your work.</li><li>Hold tools with relaxed grip pressure, keeping wrists in neutral alignment and elbows close to your body at approximately ninety-degree angles.</li><li>Take micro-breaks every fifteen minutes to roll shoulders, stretch wrists, and reset posture; perform full stretching routine between clients.</li><li>Lower or recline chair for top-of-head work to avoid sustained overhead arm positions that cause shoulder fatigue and impingement.</li></ol><h2>Safety</h2><p>All equipment contact surfaces including chair upholstery, hydraulic controls, and anti-fatigue mats must be cleaned with EPA-registered disinfectant such as Barbicide or hospital-grade quaternary ammonium solution after each client to prevent cross-contamination. <strong>Do NOT lock your knees while standing during services, as this restricts circulation, increases lower back strain, and can cause fainting or venous pooling, leading to varicose veins and chronic leg pain over time.</strong> If you experience acute lower back spasm from improper lifting or sudden twisting, immediately stop work and apply this recovery protocol: first, sit or lie down to remove load from the spine; second, apply ice for fifteen minutes to reduce inflammation; third, perform gentle pelvic tilts and knee-to-chest stretches; fourth, avoid returning to work until pain subsides and normal range of motion returns; fifth, evaluate and correct the movement pattern that caused the injury.</p><h2>Visual Cues</h2><p>Observe your reflection to verify ear-shoulder-hip vertical alignment with natural spinal curves maintained, not flattened or exaggerated. Your elbows should bend at approximately ninety degrees with upper arms hanging naturally at your sides. Wrists remain straight in line with forearms, not flexed upward or downward during cutting motions. Knees stay soft with slight bend, never locked straight. The client's head should appear directly in your line of sight without requiring you to tilt your head forward or crane your neck. Your shoulders remain level and relaxed, not elevated toward your ears or rotated forward in a rounded position.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-19-q1",
                              "question": "What is the optimal height range for the client's head when adjusting the barber chair for ergonomic cutting?",
                              "options": [
                                        "A. Between the barber's waist and mid-chest level",
                                        "B. At the barber's shoulder height",
                                        "C. At the barber's eye level",
                                        "D. Below the barber's waist for easier access"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The client's head should be positioned between the barber's waist and mid-chest level to maintain neutral spine alignment, prevent excessive bending or reaching, and reduce strain on the back and shoulders during services."
                    },
                    {
                              "id": "barber-lesson-19-q2",
                              "question": "How frequently should barbers take micro-breaks to reset posture and prevent repetitive strain injuries?",
                              "options": [
                                        "A. Every thirty minutes",
                                        "B. Every fifteen minutes",
                                        "C. Every five minutes",
                                        "D. Only between clients"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Micro-breaks every fifteen minutes allow barbers to roll shoulders, stretch wrists, and reset posture, preventing the accumulation of muscular tension and reducing the risk of chronic repetitive strain injuries throughout the workday."
                    },
                    {
                              "id": "barber-lesson-19-q3",
                              "question": "What is the correct elbow angle when holding tools with proper ergonomic positioning?",
                              "options": [
                                        "A. Approximately ninety degrees with upper arms at sides",
                                        "B. Fully extended arms away from body",
                                        "C. Forty-five degrees with elbows behind the torso",
                                        "D. One hundred thirty-five degrees with raised shoulders"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Maintaining elbows at approximately ninety degrees with upper arms hanging naturally at the sides keeps the work within the optimal ergonomic zone, minimizing shoulder and arm fatigue while maximizing control and precision."
                    },
                    {
                              "id": "barber-lesson-19-q4",
                              "question": "SCENARIO: A client who is six feet four inches tall sits in your chair for a haircut. What do you do?",
                              "options": [
                                        "A. Leave the chair at standard height and bend forward to reach",
                                        "B. Ask the client to slouch down in the chair",
                                        "C. Raise the hydraulic chair so the client's head is between your waist and chest",
                                        "D. Stand on a footstool throughout the entire service"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Adjusting the chair height for taller clients ensures the working area remains in the ergonomic zone between waist and chest, maintaining neutral posture and preventing back strain from excessive bending or compensatory positions."
                    },
                    {
                              "id": "barber-lesson-19-q5",
                              "question": "SCENARIO: During a service you notice your shoulders are elevated toward your ears and your neck feels tense. Correct response?",
                              "options": [
                                        "A. Continue working and address it after the client leaves",
                                        "B. Stop briefly, roll your shoulders back and down, reset your posture, and adjust chair height if needed",
                                        "C. Shift your weight to one leg to compensate",
                                        "D. Grip your tools more tightly for better control"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Elevated shoulders and neck tension indicate poor ergonomics that will worsen without correction. Taking a micro-break to reset posture, adjust equipment, and restore neutral alignment prevents injury progression and maintains service quality."
                    }
          ],
        },
        {
          slug: 'barber-lesson-20',
          title: 'Draping & Client Preparation',
          order: 6,
          domainKey: 'tools_equipment',
          objective: 'Properly drape a client for haircut and shaving services.',
          durationMinutes: 10,
          videoFile: '/videos/course-barber-consultation.mp4',
          content: `<h2>Overview</h2><p>Proper draping and client preparation are essential foundational skills for every barber. Draping protects the client's clothing from hair clippings, water, and chemical products while maintaining professional sanitation standards. Effective draping techniques ensure client comfort, prevent cross-contamination, and establish trust. This lesson covers the proper selection and application of draping materials for both haircutting and shaving services. Mastering these techniques demonstrates professionalism and prepares you for all subsequent barbering procedures. Understanding client variations and adapting your approach ensures consistent quality across diverse clientele.</p><h2>Tools Required</h2><ul><li>Neck strip (disposable paper or tissue)</li><li>Cape or cloth (chemical-resistant for color services, standard waterproof for cutting)</li><li>Towels (clean, freshly laundered, at least two per client)</li><li>Spray bottle with clean water</li><li>Disinfected chair with adjustable headrest</li><li>Booster seat or cushion for children</li><li>Clips or clamps for securing cape</li></ul><h2>Decision Factors</h2><p>IF the client has extremely long hair extending below shoulders, THEN secure hair outside the cape initially and drape with extra coverage at the back, using two towels if necessary to prevent hair from falling inside clothing. IF the client is a child or has sensitive skin around the neck, THEN use two overlapping neck strips to create a softer barrier and prevent irritation from cape contact. IF performing a shaving service, THEN position towels for steam application and use a separate face draping technique with the cape lowered to shoulder level.</p><h2>Sanitation Protocol</h2><p>All capes must be laundered with hospital-grade detergent and dried at high temperature between each client. Neck strips are single-use disposable items and must never be reused. Towels require washing in hot water with EPA-registered laundry sanitizer such as quaternary ammonium compounds or bleach solution at proper dilution. The barber chair should be wiped down with EPA-registered disinfectant spray or wipes before seating each client, allowing proper contact time per manufacturer instructions.</p><h2>Safety</h2><p><strong>Do NOT secure the cape so tightly around the neck that it restricts breathing or causes discomfort.</strong> Excessive tightness can cause client anxiety, restrict blood flow, trigger claustrophobia, and create liability issues. Always maintain a two-finger clearance between the neck strip and the client's skin. Clients with respiratory conditions or anxiety disorders are particularly vulnerable to complications from overly tight draping.</p><h2>Failure Mode and Recovery</h2><p>If hair clippings fall inside the client's collar despite proper draping, this typically results from inadequate neck strip coverage or cape gaps at the shoulders. To recover: first, stop the service immediately. Second, carefully remove the cape without shaking it. Third, use a neck duster to remove visible hair from the client's neck and collar area. Fourth, offer the client a moment to shake out their shirt in a private area. Fifth, redrape properly with overlapping neck strip coverage. Sixth, apologize professionally and resume service with heightened attention to cape positioning throughout the remainder of the appointment.</p><h2>Visual Cues</h2><p>The neck strip should sit smoothly against the skin with no wrinkles or gaps, positioned approximately one inch above the collar line. The cape should drape evenly across both shoulders at matching heights, with the front closure centered on the client's chest. Observe that the cape falls straight down without twisting, covering all clothing completely to the client's lap. The client's head should remain vertical and comfortable, not tilted forward by cape tension. Check that shoulder seams of the client's clothing remain visible as reference points beneath the cape outline. For shaving services, towels should wrap snugly but comfortably around the neck with corners tucked securely.</p><h2>Procedure</h2><ol><li>Seat the client comfortably in the adjusted barber chair and secure any personal items away from the work area safely.</li><li>Wash and dry your hands thoroughly, then explain the draping process briefly to establish client comfort and trust.</li><li>Place the neck strip around the client's neck, overlapping ends in front, ensuring smooth contact without gaps or wrinkles.</li><li>Unfold the cape completely and drape it over the client from behind, bringing it forward evenly across both shoulders.</li><li>Secure the cape at the front using the closure mechanism, adjusting tension to allow two-finger clearance at the neckline.</li><li>Smooth the cape across the shoulders and lap, tucking edges inward to prevent hair from falling onto client's clothing.</li><li>Perform a final comfort check by asking the client if the draping feels secure but not restrictive or uncomfortable.</li><li>Position towels as needed for the specific service, either folded on the shoulder or prepared for shaving application.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-20-q1",
                              "question": "What is the primary purpose of using a disposable neck strip during draping?",
                              "options": [
                                        "A. To create a sanitary barrier between the client's skin and reusable cape",
                                        "B. To absorb excess water during shampooing procedures",
                                        "C. To provide additional warmth for client comfort",
                                        "D. To protect the barber chair from hair clippings"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The neck strip creates a sanitary single-use barrier between the client's skin and the cape, which is reused between clients. This prevents cross-contamination and maintains proper infection control standards."
                    },
                    {
                              "id": "barber-lesson-20-q2",
                              "question": "How much clearance should exist between the secured cape and the client's neck?",
                              "options": [
                                        "A. The cape should fit as tightly as possible to prevent hair entry",
                                        "B. Approximately two fingers should fit between the neck strip and skin",
                                        "C. At least four inches of space for unrestricted movement",
                                        "D. The cape should not contact the neck at all"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Two-finger clearance ensures the cape is secure enough to prevent hair from entering while avoiding excessive tightness that could restrict breathing, cause discomfort, or trigger anxiety in clients."
                    },
                    {
                              "id": "barber-lesson-20-q3",
                              "question": "What is the correct sanitation method for capes between clients?",
                              "options": [
                                        "A. Laundering with hospital-grade detergent at high temperature",
                                        "B. Wiping down with a dry towel to remove visible hair",
                                        "C. Spraying with air freshener and hanging to air out",
                                        "D. Shaking vigorously outdoors to remove clippings"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Capes must be laundered with hospital-grade detergent and dried at high temperature between each client to ensure proper disinfection and meet professional sanitation standards required by barber regulations."
                    },
                    {
                              "id": "barber-lesson-20-q4",
                              "question": "SCENARIO: A client with hair extending to the mid-back arrives for a haircut. What is your draping approach?",
                              "options": [
                                        "A. Use standard draping and tuck all hair inside the cape immediately",
                                        "B. Refuse service until the client pins up their hair themselves",
                                        "C. Secure hair outside the cape initially and use extra back coverage with additional towels",
                                        "D. Cut the cape shorter to accommodate the long hair length"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Long hair requires modified draping technique with hair initially secured outside the cape and extra coverage at the back using additional towels. This prevents hair from falling inside clothing while maintaining proper protection."
                    },
                    {
                              "id": "barber-lesson-20-q5",
                              "question": "SCENARIO: Midway through a haircut you notice hair clippings have fallen inside the client's collar. What is the correct response?",
                              "options": [
                                        "A. Continue the service and address the issue after completing the haircut",
                                        "B. Stop immediately, remove the cape carefully, use neck duster, allow client to shake out shirt, then redrape properly",
                                        "C. Brush the hair deeper into the shirt so it falls out when they undress later",
                                        "D. Apologize but explain that some hair entry is normal and unavoidable"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When hair enters the client's clothing, immediately stop service, carefully remove the cape without shaking, use a neck duster, offer the client privacy to shake out their shirt, then redrape properly with corrected technique. This demonstrates professionalism and prevents further contamination."
                    }
          ],
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
          content: `<h2>Overview</h2><p>Understanding head shape and sectioning is fundamental to executing precise, balanced haircuts. The human head contains reference points and sections that guide clipper and shear work, ensuring consistency and symmetry. Mastering these anatomical landmarks allows barbers to adapt techniques to individual head shapes, create reliable partings, and maintain control throughout the service. This lesson covers the four primary head sections, key reference points including apex, occipital bone, parietal ridge, and four corners, plus practical application methods for mapping the head before cutting.</p><h2>Tools Required</h2><ul><li>Tail comb for precise parting and sectioning</li><li>Sectioning clips to secure hair divisions</li><li>Spray bottle with clean water for dampening</li><li>Barber shears for cutting sectioned hair</li><li>Neck strip and cape for client draping</li><li>Mirror for visual verification of sections</li><li>Marking pencil or highlighter for training purposes</li></ul><h2>Client Variation Guidance</h2><p>IF the client has a flat occipital bone, THEN adjust your horizontal sections lower to avoid removing excess weight at the nape, which can create an unbalanced silhouette. IF the client has a prominent parietal ridge or uneven head shape, THEN modify section placement by following the natural contours rather than forcing geometric divisions, ensuring the finished cut appears balanced when viewed from all angles despite anatomical variations.</p><h2>Procedure</h2><ol><li>Drape the client properly with neck strip and cape, then comb hair to remove tangles and identify natural growth patterns.</li><li>Locate the apex by intersecting lines from recession areas to crown; identify occipital bone by feeling the protruding bump at nape.</li><li>Find the parietal ridge by placing comb flat against head and tilting until it naturally falls away from the curve.</li><li>Section the top area from front hairline to crown, connecting ear-to-ear across the parietal ridge with tail comb.</li><li>Divide sides by parting from top of ear to previously established top section, creating distinct temporal sections on each side.</li><li>Create back section below the occipital bone, completing the four-quadrant division required for systematic cutting.</li><li>Secure each section with clips, maintaining tension to keep divisions clean and prevent hair from crossing into adjacent sections.</li><li>Verify symmetry by comparing section widths on both sides using mirror and checking that partings align with anatomical landmarks.</li></ol><h2>Safety</h2><p>All combs and sectioning clips must be cleaned with EPA-registered hospital-grade disinfectant such as Barbicide after each client, following manufacturer contact time of ten minutes minimum. <strong>Do NOT section over open wounds, active scalp infections, or inflamed areas, as this can spread pathogens to unaffected areas and cause cross-contamination throughout the service.</strong> If sections fall during cutting and hair mixes between quadrants, stop immediately; re-wet the hair, recomb to identify original growth direction, re-establish sections using original reference points, verify placement bilaterally, then resume cutting from the last completed guideline.</p><h2>Visual Cues</h2><p>Proper sections create visible clean lines along the scalp where hair divides; partings should appear straight and precise when viewed perpendicular to the section. The parietal ridge section curves naturally around the head roughly one finger-width above the ear tops, while the apex sits at the highest point where head begins to round downward. Four corners form distinct right angles at the intersection of top and side sections. When clips are placed, they should sit flat without pulling hair, indicating sections follow the head's natural curvature rather than forcing unnatural geometric angles.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-22-q1",
                              "question": "What is the primary purpose of identifying the parietal ridge during head sectioning?",
                              "options": [
                                        "A. It marks the natural division between the top and side sections of the head",
                                        "B. It indicates where the hairline naturally recedes",
                                        "C. It shows the location of the crown whorl",
                                        "D. It determines the client's natural part location"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The parietal ridge is the curved bone structure that naturally separates the top of the head from the sides, making it the ideal anatomical landmark for dividing these two sections during systematic haircutting."
                    },
                    {
                              "id": "barber-lesson-22-q2",
                              "question": "How many primary sections are created in the standard four-quadrant head sectioning method?",
                              "options": [
                                        "A. Three sections: top, left side, and right side",
                                        "B. Four sections: top, two sides, and back",
                                        "C. Five sections including the nape area",
                                        "D. Six sections to include fringe area"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The standard four-quadrant method divides the head into top, left side, right side, and back sections, providing systematic organization for controlled, balanced haircutting."
                    },
                    {
                              "id": "barber-lesson-22-q3",
                              "question": "Where is the apex located on the head?",
                              "options": [
                                        "A. At the highest point where lines from the recession areas and crown intersect",
                                        "B. At the center of the occipital bone",
                                        "C. Directly at the parietal ridge midpoint",
                                        "D. At the front hairline center"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The apex is found by intersecting imaginary lines from the recession areas to the crown, marking the highest central point of the head and serving as a key reference for top sectioning."
                    },
                    {
                              "id": "barber-lesson-22-q4",
                              "question": "SCENARIO: A client has a noticeably flat occipital bone. What adjustment should you make?",
                              "options": [
                                        "A. Create wider sections throughout all quadrants",
                                        "B. Use vertical rather than horizontal sections exclusively",
                                        "C. Position horizontal sections lower at the nape to preserve weight and balance",
                                        "D. Avoid sectioning the back area entirely"
                              ],
                              "correctAnswer": 2,
                              "explanation": "With a flat occipital bone, lowering the horizontal sections at the nape helps retain weight in an area that lacks natural projection, preventing an overly flat or unbalanced appearance in the finished cut."
                    },
                    {
                              "id": "barber-lesson-22-q5",
                              "question": "SCENARIO: During cutting you notice hair from the side section has fallen into the back section. What is the correct response?",
                              "options": [
                                        "A. Continue cutting and blend the areas together at the end",
                                        "B. Stop cutting, re-wet and recomb hair, re-establish sections at original reference points, then resume from last guideline",
                                        "C. Remove all clips and start the entire sectioning process over",
                                        "D. Cut the mixed hair shorter to match the surrounding area"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When sections mix, stopping immediately prevents compounding errors. Re-wetting, recombing to original growth patterns, and re-establishing sections using anatomical landmarks restores control, allowing you to resume from your last accurate guideline."
                    }
          ],
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
          content: `<h2>Overview</h2><p>The fade is a foundational barbering technique that creates a seamless gradient from longer hair on top to progressively shorter hair toward the neckline and sides. Low fades begin the blend just above the ears, mid fades start around the temple area, and high fades commence near the top of the head. Mastering these variations requires understanding clipper guard selection, lever positioning, and controlled hand movements. Each fade type serves different aesthetic goals and client preferences. This lesson covers the technical execution required to deliver clean, professional fades that meet industry standards and client expectations in a DOL-registered apprenticeship setting.</p><h2>Tools Required</h2><ul><li>Professional-grade clipper with taper lever (adjustable blade)</li><li>Detachable blade clipper or trimmer for detailing</li><li>Clipper guards: #0.5, #1, #1.5, #2, #3 (minimum set)</li><li>Barber comb (carbon fiber or hard rubber)</li><li>Neck duster brush</li><li>Handheld mirror for client consultation</li><li>Spray bottle with clean water</li><li>Disinfected cape and neck strips</li></ul><h2>Client Variations</h2><p>IF the client has coarse, curly hair, THEN use a slightly open lever on initial passes and work more gradually through guard sizes to prevent harsh lines, as curly texture can reveal abrupt transitions more noticeably. IF the client has fine, straight hair, THEN execute tighter passes with closed lever positions because fine hair shows imperfections and requires more precision blending to achieve smooth gradients without visible demarcation lines or patches.</p><h2>Procedure</h2><ol><li>Consult with client to determine fade height preference (low, mid, or high) and establish the guideline using a mirror for visual agreement.</li><li>Begin with a longer guard (#3 or #2) at the top fade line, using upward clipper motion with lever closed to establish initial length.</li><li>Switch to the next shorter guard, overlapping the previous pass by half, using a scooping outward motion to begin the blend transition.</li><li>Continue with progressively shorter guards, opening and closing the taper lever between passes to create intermediate lengths and eliminate visible lines.</li><li>Use the lever-only technique in the transition zone, making short upward flicking motions to refine the gradient without changing guards.</li><li>Blend the lowest section with a #1 or #0.5 guard closed, ensuring smooth connection to the bare fade line or natural hairline.</li><li>Detail edges with a trimmer, creating clean perimeter lines at the sideburns, around the ears, and along the neckline contour.</li><li>Cross-check the fade by viewing from multiple angles under proper lighting, making corrections with clipper-over-comb or lever adjustments as needed.</li></ol><h2>Safety</h2><p>Always clean clipper blades with Clipper-Cide or hospital-grade disinfectant spray between clients, allowing proper contact time per manufacturer instructions. Remove hair buildup and apply blade oil to maintain cutting efficiency and prevent bacterial transmission. <strong>Do NOT execute fades on clients with active scalp infections, open lesions, or inflamed skin conditions, as clipper contact will spread pathogens, cause client discomfort, and violate sanitation protocols, potentially resulting in cross-contamination and infection.</strong> Inspect the scalp thoroughly during consultation before beginning any cutting service.</p><h2>Visual Cues</h2><p>Position your body at a 45-degree angle to the client's head with clippers held at a consistent angle perpendicular to the scalp surface. Watch for the hair to lift and fall naturally as you scoop outward—this indicates proper lever tension and guard glide. The fade should appear as a smooth color gradient with no shelves or demarcation lines visible when viewed from three feet away. Proper blending creates a shadow effect where you cannot identify exactly where one length ends and another begins. The taper lever halfway open creates an intermediate length between guard sizes, essential for seamless transitions in the blend zone.</p><h2>Failure Recovery</h2><p>IF you create a visible line or shelf in the fade: This occurs when guard changes are too abrupt or lever technique is inconsistent. To recover, identify the demarcation line's exact position. Use the guard size that created the line with lever fully open, making gentle upward passes that extend slightly above the problem area. Next, use clipper-over-comb technique to manually blend the transition, holding the comb at a low angle and skimming with clipper teeth lightly across the comb. Finally, use the next shorter guard with lever halfway open to soften the lower boundary, working in small sections until the gradient appears continuous.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-23-q1",
                              "question": "What is the primary difference between low, mid, and high fade placement?",
                              "options": [
                                        "A. The starting point where the fade transition begins on the head",
                                        "B. The clipper guard sizes used for each fade type",
                                        "C. The angle at which the clippers are held during execution",
                                        "D. The amount of time required to complete each fade variation"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Low, mid, and high fades are distinguished by where the fade transition begins: low fades start just above the ears, mid fades begin around the temple, and high fades commence near the top of the head."
                    },
                    {
                              "id": "barber-lesson-23-q2",
                              "question": "What technique is most effective for eliminating visible lines between guard lengths?",
                              "options": [
                                        "A. Using only closed lever positions throughout the entire fade",
                                        "B. Opening and closing the taper lever to create intermediate lengths between guard changes",
                                        "C. Applying more pressure with the clippers during upward strokes",
                                        "D. Switching to a different clipper brand for the transition area"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The taper lever creates intermediate lengths between guard sizes, which is essential for smooth blending and eliminating visible demarcation lines in fade transitions."
                    },
                    {
                              "id": "barber-lesson-23-q3",
                              "question": "When should Clipper-Cide or hospital-grade disinfectant be applied to clipper blades?",
                              "options": [
                                        "A. Between every client after cleaning and before the next service",
                                        "B. Only at the end of the business day",
                                        "C. Once per week during deep cleaning procedures",
                                        "D. Only when visible hair buildup appears on the blades"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Proper sanitation protocol requires disinfecting clipper blades between each client to prevent cross-contamination and bacterial transmission, regardless of visible debris."
                    },
                    {
                              "id": "barber-lesson-23-q4",
                              "question": "SCENARIO: A client with very coarse, tightly curled hair requests a mid fade. During your first pass with a #2 guard, you notice the line is more pronounced than expected. What do you do?",
                              "options": [
                                        "A. Continue with the #1 guard as planned to stay on schedule",
                                        "B. Apply more pressure with the clippers to cut through the coarse texture",
                                        "C. Switch to a more gradual approach using lever adjustments and intermediate guard sizes",
                                        "D. Recommend the client get a different haircut style instead"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Coarse, curly hair reveals transitions more noticeably and requires more gradual blending with intermediate lengths using lever adjustments and closer guard progressions to prevent harsh lines."
                    },
                    {
                              "id": "barber-lesson-23-q5",
                              "question": "SCENARIO: During the fade you notice redness and several small raised bumps with whiteheads near the client's neckline. Correct response?",
                              "options": [
                                        "A. Apply alcohol to disinfect the area and continue carefully",
                                        "B. Stop the service immediately, explain you cannot continue due to the skin condition, and recommend medical consultation",
                                        "C. Avoid that specific area but complete the fade on the rest of the head",
                                        "D. Use a trimmer instead of clippers to finish the neckline area"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Active skin infections or inflammatory conditions are contraindications for barbering services. Continuing would spread infection, violate sanitation protocols, and potentially harm the client. The service must be stopped and medical evaluation recommended."
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
          content: `<h2>Overview</h2><p>The clipper-over-comb technique is a fundamental barbering skill that allows precise control when cutting, tapering, and blending hair. This method combines the use of clippers with a comb to remove length gradually and create seamless transitions between different hair lengths. Mastering this technique is essential for creating professional tapers, fades, and blended haircuts. The barber uses the comb as a guide to lift hair away from the scalp while the clipper cuts over the comb teeth, providing exceptional control over graduation and texture.</p><h2>Tools Required</h2><ul><li>Professional adjustable blade clipper with lever</li><li>Barber comb (7-inch or 8-inch styling comb with fine and wide teeth)</li><li>Clipper oil and cleaning brush</li><li>Neck strip and cape for client protection</li><li>Spray bottle with clean water for dampening</li><li>Mirror for client consultation and verification</li><li>Disinfected shears for detailing</li></ul><h2>Client Considerations</h2><p>IF the client has thick, coarse hair, THEN use wider comb teeth and make multiple passes with the clipper to avoid pulling or snagging. IF the client has fine or thinning hair, THEN use finer comb teeth and exercise lighter pressure to prevent removing too much length too quickly. IF working near sensitive areas or scar tissue, THEN reduce clipper speed and use gentler strokes to minimize discomfort.</p><h2>Procedure</h2><ol><li>Drape the client properly with neck strip and cape, then consult on desired length, style, and ensure hair is clean and slightly damp.</li><li>Section the hair appropriately, beginning at the lower occipital area where the taper or blend will start for the style.</li><li>Insert the comb at the desired angle, typically 45 to 90 degrees from the scalp, with teeth pointing outward to guide the cut.</li><li>Position clippers so the blade runs parallel to the comb, moving upward in smooth, continuous strokes without hesitation or stopping midway.</li><li>Gradually adjust the angle of the comb outward as you move up the head to create seamless tapering and natural graduation.</li><li>Blend any visible lines by adjusting the clipper lever position and repeating strokes with varying comb angles until transitions are smooth.</li><li>Cross-check your work by combing hair in multiple directions, checking for balance, symmetry, and even graduation throughout all sections.</li><li>Finish by detailing edges, removing loose hair with a neck duster, and showing client the final result using a mirror.</li></ol><h2>Safety</h2><p>All tools must be cleaned and disinfected according to Indiana State Board regulations using EPA-registered hospital-grade disinfectant such as Barbicide or approved quaternary ammonium compounds. Clippers should be sanitized between clients with clipper spray disinfectant and blades should be removed weekly for thorough cleaning. <strong>Do NOT use clipper-over-comb on irritated, abraded, or infected skin as this can spread infection, cause additional trauma, and violate sanitation protocols.</strong> Always inspect the scalp before beginning any service.</p><h2>Failure Mode and Recovery</h2><p>If you create a visible line or step in the hair, this typically occurs from holding the comb at an inconsistent angle or stopping the clipper motion prematurely. To recover: first, identify the exact location of the line by combing the hair smooth. Second, position your comb just below the line at a slightly more outward angle. Third, make several light passes with the clipper over the comb, gradually working upward through the problem area. Fourth, blend above and below the corrected area to ensure seamless integration. Fifth, cross-check from multiple angles to verify the line has been eliminated.</p><h2>Visual Cues</h2><p>Watch for the hair standing perpendicular to the comb teeth, indicating proper tension and positioning for clean cutting. The clipper blade should remain parallel to the comb spine throughout each stroke, never tilting or angling away. Observe the hair falling evenly from the clipper, which indicates consistent speed and pressure. Check that your wrist remains flexible, allowing smooth arcing motions that follow the head shape. The finished blend should show no visible demarcation lines when hair is combed in any direction. Proper head positioning places the area being cut at your chest level with adequate lighting to see every detail clearly.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-24-q1",
                              "question": "What is the primary purpose of the comb in the clipper-over-comb technique?",
                              "options": [
                                        "A. To guide the clippers and control the amount of hair being removed",
                                        "B. To hold the hair flat against the scalp during cutting",
                                        "C. To detangle the hair before using clippers",
                                        "D. To measure exact length in inches"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The comb acts as a guide that lifts hair away from the scalp, allowing the barber to control precisely how much hair is removed as the clipper cuts over the comb teeth."
                    },
                    {
                              "id": "barber-lesson-24-q2",
                              "question": "At what angle should the clipper blade be held in relation to the comb during execution?",
                              "options": [
                                        "A. Perpendicular to the comb at 90 degrees",
                                        "B. Parallel to the comb spine",
                                        "C. At a 45-degree angle pointing downward",
                                        "D. At varying angles depending on hair texture"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The clipper blade must remain parallel to the comb spine throughout the stroke to ensure even cutting and proper technique execution."
                    },
                    {
                              "id": "barber-lesson-24-q3",
                              "question": "Which disinfection method is specifically mentioned as appropriate for clipper sanitation between clients?",
                              "options": [
                                        "A. Clipper spray disinfectant and EPA-registered hospital-grade disinfectant",
                                        "B. Soap and warm water only",
                                        "C. Alcohol wipes exclusively",
                                        "D. UV light sanitizer"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The lesson specifies using clipper spray disinfectant between clients and EPA-registered hospital-grade disinfectants like Barbicide or quaternary ammonium compounds according to Indiana regulations."
                    },
                    {
                              "id": "barber-lesson-24-q4",
                              "question": "SCENARIO: A client with very thick, coarse hair sits in your chair requesting a tapered fade. What adjustment should you make?",
                              "options": [
                                        "A. Use only the finest teeth on the comb for maximum precision",
                                        "B. Increase clipper speed and use single fast strokes",
                                        "C. Use wider comb teeth and make multiple passes to avoid pulling",
                                        "D. Skip the comb and use clipper guards only"
                              ],
                              "correctAnswer": 2,
                              "explanation": "According to the client considerations section, thick coarse hair requires wider comb teeth and multiple passes to prevent pulling or snagging the hair during the cutting process."
                    },
                    {
                              "id": "barber-lesson-24-q5",
                              "question": "SCENARIO: Halfway through the service you notice a visible line in the blend at the occipital area. What is the correct recovery method?",
                              "options": [
                                        "A. Continue cutting and hope it blends naturally when styled",
                                        "B. Position the comb below the line at a more outward angle and make light passes to blend",
                                        "C. Start over completely from the beginning of the haircut",
                                        "D. Use shears to cut the entire section shorter"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The failure mode section specifies positioning the comb just below the line at a slightly more outward angle, then making several light passes with the clipper to gradually eliminate the line and blend the area."
                    }
          ],
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
          content: `<h2>Overview</h2><p>Scissor-over-comb is a fundamental barbering technique used to create smooth, blended cuts on short to medium-length hair. This method involves using the comb to lift and control hair while scissors cut the hair that extends beyond the comb. The technique requires coordination between both hands and provides precision control for tapering, blending, and creating graduated lengths. Mastering scissor-over-comb allows barbers to achieve seamless transitions between different hair lengths, particularly effective on the sides, back, and top of the head. This technique is essential for classic men's cuts and provides an alternative to clipper work for clients who prefer scissor-only services.</p><h2>Tools Required</h2><ul><li>Professional barber shears (6.5 to 7 inches recommended)</li><li>Barber comb (fine-tooth cutting comb, 7 to 8 inches)</li><li>Neck strip and cape for client protection</li><li>Spray bottle with clean water for dampening</li><li>Cleaning brush for removing cut hair from tools</li><li>EPA-registered disinfectant for tool sanitation</li><li>Sectioning clips for hair management</li></ul><h2>Client Considerations</h2><p>IF the client has thick, coarse hair, THEN use wider comb teeth and work in smaller sections to maintain control and prevent the comb from catching or pulling. IF the client has fine, thin hair, THEN use closer comb teeth, apply lighter pressure, and keep hair slightly damp to prevent flyaways and ensure precision cutting. IF the client has sensitive skin or previous irritation, THEN maintain the comb flat against the scalp without applying excessive pressure and avoid repeated passes over the same area.</p><h2>Sanitation Protocol</h2><p>Before beginning any service, ensure all tools are properly sanitized using an EPA-registered hospital-grade disinfectant such as Barbicide or a quaternary ammonium compound solution. Immerse combs and shears in disinfectant solution for the manufacturer's recommended contact time, typically ten minutes. Between clients, remove all visible hair debris with a cleaning brush and re-sanitize all implements. This protocol prevents cross-contamination and ensures compliance with state board regulations and professional standards.</p><h2>Safety</h2><p><strong>Do NOT use scissor-over-comb technique on wet, slippery hair when working near the ears or hairline, as this significantly increases the risk of accidentally cutting the skin.</strong> Excessive moisture reduces tactile feedback and can cause the comb to slip unexpectedly, leading to painful cuts or nicks that require immediate first aid and potentially disrupt the client relationship. Always maintain appropriate dampness—hair should be barely moist, not saturated.</p><h2>Failure Recovery</h2><p>If you create an uneven line or remove too much length in one area, immediately assess the depth and location of the error. First, stop cutting and evaluate the surrounding hair to determine how much additional length must be removed to correct the mistake. Second, blend the area by using the scissor-over-comb technique at a slightly lower angle to gradually taper into the mistake. Third, work outward from the problem area in small increments, constantly cross-checking symmetry on both sides. Fourth, dampen the hair and comb through repeatedly to identify any remaining unevenness before making final corrections.</p><h2>Visual Cues</h2><p>Position yourself at eye level with the section you are cutting, maintaining a working angle between 45 and 90 degrees depending on the desired graduation. The comb should glide smoothly through the hair with consistent tension, neither too tight nor too loose. Watch for the hair extending beyond the comb teeth—this extension should be uniform before each cut. Your shear blades should remain parallel to the comb, moving in a fluid scooping motion. The cut hair should fall cleanly without pulling or bending. Check for even graduation by observing the hair's natural fall pattern and ensuring smooth transitions without visible lines or steps between sections.</p><h2>Procedure</h2><ol><li>Section the hair appropriately and dampen with water spray to achieve workable moisture without saturation, ensuring even texture throughout all areas.</li><li>Begin at the lower hairline, inserting the comb at the desired starting point with teeth angled slightly upward toward the head.</li><li>Draw the comb upward smoothly through the hair, maintaining consistent tension and allowing hair to extend beyond the comb teeth uniformly.</li><li>Position scissors parallel to the comb, blades slightly open, and cut the hair protruding beyond the comb using smooth, controlled strokes.</li><li>Move the comb incrementally upward, overlapping the previous section by one-quarter inch to ensure seamless blending and prevent demarcation lines.</li><li>Repeat the combing and cutting motion, gradually adjusting the comb angle to create the desired taper and graduation through the section.</li><li>Cross-check your work by combing hair in the opposite direction, looking for uneven lengths, and making corrective cuts as necessary.</li><li>Blend transition areas between sections using diagonal comb angles, ensuring smooth integration without visible lines separating different lengths throughout the cut.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-25-q1",
                              "question": "What is the primary purpose of the comb in scissor-over-comb technique?",
                              "options": [
                                        "A. To lift and control hair while providing a cutting guide for the scissors",
                                        "B. To detangle hair and remove knots before cutting begins",
                                        "C. To measure exact lengths in inches for precision cutting",
                                        "D. To apply tension to the scalp for easier cutting"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The comb serves as both a lifting mechanism and a cutting guide, allowing the barber to control the hair while the scissors cut only the hair extending beyond the comb teeth."
                    },
                    {
                              "id": "barber-lesson-25-q2",
                              "question": "What angle range should shear blades maintain relative to the comb during scissor-over-comb cutting?",
                              "options": [
                                        "A. Perpendicular at 90 degrees to create texture",
                                        "B. Parallel to the comb for smooth, even cutting",
                                        "C. At 45 degrees downward to increase speed",
                                        "D. At varying random angles for natural appearance"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The shear blades must remain parallel to the comb to ensure even, controlled cutting and to prevent accidentally cutting into the comb or creating uneven results."
                    },
                    {
                              "id": "barber-lesson-25-q3",
                              "question": "How much should each successive comb pass overlap the previous section?",
                              "options": [
                                        "A. One-quarter inch to ensure seamless blending",
                                        "B. One full inch for faster work completion",
                                        "C. No overlap is necessary with this technique",
                                        "D. One-half inch only on thick hair types"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Overlapping by one-quarter inch ensures proper blending between sections and prevents visible demarcation lines or steps in the finished haircut."
                    },
                    {
                              "id": "barber-lesson-25-q4",
                              "question": "SCENARIO: A client with very thick, coarse hair keeps experiencing the comb catching and pulling during scissor-over-comb work. What is the correct adjustment?",
                              "options": [
                                        "A. Add more water to make the hair completely saturated",
                                        "B. Switch to a finer-tooth comb for better control",
                                        "C. Use wider comb teeth and work in smaller sections",
                                        "D. Increase cutting speed to minimize discomfort"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Thick, coarse hair requires wider comb teeth to prevent catching, and smaller sections provide better control and reduce pulling, making the service more comfortable and precise."
                    },
                    {
                              "id": "barber-lesson-25-q5",
                              "question": "SCENARIO: During the service you notice you have created a visible horizontal line across the side of the head. What is the correct response?",
                              "options": [
                                        "A. Continue cutting and address it at the end with clippers",
                                        "B. Stop immediately, blend the area by adjusting comb angle and working outward in small increments",
                                        "C. Wet the hair heavily to hide the line temporarily",
                                        "D. Cut all surrounding hair to match the shortest length"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Immediately stopping and using adjusted comb angles to blend outward from the problem area allows for correction without removing excessive length, following the proper failure recovery protocol."
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
          content: `<h2>Overview</h2><p>The flat top and classic taper haircut represent foundational skills in traditional barbering. The flat top features a horizontal plane on top with squared corners and tight sides, while the classic taper blends smoothly from longer crown hair to shorter sides and neckline. Both styles require precise clipper control, proper body positioning, and an understanding of head shape. Mastering these cuts builds essential technical skills including elevation, guideline establishment, and blending techniques. These timeless styles remain popular across diverse clientele and form the basis for many contemporary variations in men's grooming.</p><h2>Tools Required</h2><ul><li>Professional barber clippers with guards (#000 to #8)</li><li>Flat top comb with level indicator</li><li>Wide-tooth clipper-over-comb</li><li>Taper/blending shears</li><li>Neck duster and cape</li><li>Spray bottle with clean water</li><li>Styling products (pomade or gel)</li><li>Hand mirror for client consultation</li></ul><h2>Client Variations</h2><p>IF the client has coarse, dense hair, THEN use a higher guard number initially and work down gradually to avoid removing too much length too quickly. IF the client has fine or thinning hair, THEN avoid creating a flat top as it may expose scalp visibility on the plane; recommend a textured crew cut or classic taper instead. IF the client has an elongated head shape, THEN keep the flat top height moderate to maintain proportion. IF the client has scalp sensitivity or recent abrasions, THEN use guards rather than clipper-over-comb techniques near affected areas.</p><h2>Procedure</h2><ol><li>Drape client properly and consult on desired flat top height and taper length, confirming head shape suitability for the style requested.</li><li>Establish guideline by cutting top section to desired length using clippers with appropriate guard, working front to back with consistent pressure.</li><li>Create the flat plane by using clipper-over-comb technique, holding comb parallel to floor and removing hair protruding above comb teeth.</li><li>Square the corners by angling clipper at forty-five degrees where top plane meets side sections, creating crisp architectural definition.</li><li>Taper the sides using progressively shorter guards, starting at temple and working down, blending each section with overlapping clipper strokes.</li><li>Detail the outline at ears, sideburns, and neckline using trimmer or inverted clipper blade for clean, defined perimeter lines.</li><li>Blend any visible lines using shear-over-comb or light clipper work, ensuring smooth transitions between all sections and lengths.</li><li>Apply light styling product, check symmetry using mirror and client feedback, and perform final detailing for polished, professional finish.</li></ol><h2>Safety</h2><p>Sanitize all clippers, guards, combs, and shears using EPA-registered hospital-grade disinfectant such as Barbicide or Marvicide for minimum ten minutes between clients. <strong>Do NOT attempt a flat top on clients with active scalp infections, open wounds, or severe psoriasis, as clipper-over-comb techniques require close scalp contact and can spread infection or cause painful irritation to compromised skin.</strong> Always inspect scalp before beginning service.</p><h2>Failure Recovery</h2><p>If an uneven plane appears on the flat top with one corner lower than others, the cause is typically inconsistent comb angle or body position shifts during clipper-over-comb work. To recover: First, re-establish your stance directly behind the client for centered perspective. Second, dampen the top section lightly to control hair. Third, place flat top comb across the entire plane to identify high spots. Fourth, carefully remove only the elevated areas using controlled clipper-over-comb passes. Fifth, recheck plane from multiple angles including side views. Sixth, blend any new cutting lines into surrounding sections.</p><h2>Visual Cues</h2><p>The flat top plane should appear perfectly horizontal when viewed from the side, with no doming or concave depressions across the surface. Corners should form crisp ninety-degree angles when viewed from front or back, creating a distinct architectural silhouette. The taper should show gradual progression from approximately one-eighth inch at the bottom to the guideline length, with no visible lines or steps between sections. Proper elevation during cutting keeps clippers perpendicular to the head curve on sides and parallel to floor on top. Client head position should remain upright and straight; tilting creates asymmetry. Observe the natural fall of hair between passes to identify any missed sections or uneven areas requiring correction.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-27-q1",
                              "question": "What is the primary purpose of using a flat top comb with level indicator during this haircut?",
                              "options": [
                                        "A. To ensure the horizontal plane remains level and parallel to the floor throughout the cutting process",
                                        "B. To detangle the hair before beginning the clipper work on top",
                                        "C. To measure the exact length of hair being removed from sides",
                                        "D. To create texture and remove bulk from dense hair sections"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The flat top comb with level indicator is specifically designed to help the barber maintain a perfectly horizontal plane on top of the head, which is the defining characteristic of a flat top haircut."
                    },
                    {
                              "id": "barber-lesson-27-q2",
                              "question": "When tapering the sides of a classic haircut, what technique ensures smooth blending between guard lengths?",
                              "options": [
                                        "A. Using only one guard length throughout the entire side section",
                                        "B. Overlapping clipper strokes while progressing through shorter guards from top to bottom",
                                        "C. Cutting all hair to the same length before blending",
                                        "D. Working from the neckline upward with increasing guard sizes"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Overlapping clipper strokes while using progressively shorter guards creates seamless transitions without visible lines, which is essential for a professional taper. This gradual progression ensures smooth blending."
                    },
                    {
                              "id": "barber-lesson-27-q3",
                              "question": "Why must all clippers and tools be disinfected with hospital-grade disinfectant for a minimum of ten minutes between clients?",
                              "options": [
                                        "A. To comply with DOL apprenticeship regulations and prevent transmission of scalp infections and bloodborne pathogens",
                                        "B. To keep the tools lubricated and functioning properly",
                                        "C. To remove hair clippings that might dull the blades",
                                        "D. To make the tools appear clean and professional to clients"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Hospital-grade disinfection for the proper contact time is required to kill pathogens including bacteria, viruses, and fungi that can be transmitted between clients, protecting both client and barber health and meeting regulatory requirements."
                    },
                    {
                              "id": "barber-lesson-27-q4",
                              "question": "SCENARIO: A client with very fine, thinning hair requests a flat top haircut. What is the appropriate professional response?",
                              "options": [
                                        "A. Proceed with the flat top as requested since the client knows what they want",
                                        "B. Create a shorter flat top to minimize the appearance of thinning",
                                        "C. Recommend an alternative style such as a textured crew cut or classic taper that better suits their hair density",
                                        "D. Use a higher guard number to leave more length on top"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine or thinning hair is not suitable for a flat top because the horizontal plane will expose scalp visibility. A professional barber should recommend alternatives that work with the client's hair characteristics while achieving a similar aesthetic."
                    },
                    {
                              "id": "barber-lesson-27-q5",
                              "question": "SCENARIO: While executing clipper-over-comb on the flat top plane, you notice one corner is significantly lower than the others. What is the correct response?",
                              "options": [
                                        "A. Continue cutting and lower all other sections to match the lowest corner",
                                        "B. Re-establish centered body position, identify high spots with the comb, and carefully remove only elevated areas",
                                        "C. Switch to a longer guard and start over from the beginning",
                                        "D. Blend the low corner into the sides to hide the mistake"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The recovery procedure involves repositioning for proper perspective, identifying what remains high rather than cutting more from the low area, and making targeted corrections. Starting over or reducing all sections would result in an excessively short flat top."
                    }
          ],
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
          content: `<h2>Overview</h2><p>This checkpoint lesson assesses your mastery of fundamental haircutting techniques covered throughout Module 4. You will demonstrate proper tool selection, sectioning, elevation, cutting angles, and finishing techniques while maintaining sanitation standards and client safety. This comprehensive evaluation ensures you can execute various haircuts with precision and professionalism. Your performance will reflect your readiness to progress in the apprenticeship program and serve clients independently under supervision.</p><h2>Tools Required</h2><ul><li>Professional haircutting shears with adjustable tension</li><li>Texturizing or thinning shears for blending and weight removal</li><li>Multiple cutting combs including all-purpose and tail combs</li><li>Sectioning clips in various sizes for hair management</li><li>Spray bottle filled with clean water for dampening</li><li>Barber cape and neck strip for client protection</li><li>Clippers with multiple guard attachments and accessories</li><li>Disinfectant solution approved for salon tools and surfaces</li></ul><h2>Procedure</h2><ol><li>Conduct thorough client consultation identifying desired style, hair characteristics, growth patterns, and any contraindications before beginning the service.</li><li>Drape client properly with sanitized cape and neck strip, ensuring complete coverage and comfort throughout the haircutting procedure.</li><li>Shampoo and towel-dry hair to appropriate dampness level, detangling gently with wide-tooth comb from ends to roots progressively.</li><li>Section hair systematically using appropriate parting patterns for chosen technique, securing each section with clips to maintain organization and control.</li><li>Establish guideline using proper elevation, finger position, and cutting angle consistent with desired style and hair texture requirements.</li><li>Progress through sections methodically using traveling guide or stationary guide technique, maintaining consistent tension and visualizing projected length.</li><li>Cross-check entire haircut using opposite sectioning pattern to identify and correct any unevenness or weight line inconsistencies immediately.</li><li>Refine perimeter, blend weight lines, and personalize cut using point cutting, slide cutting, or texturizing techniques as appropriate.</li><li>Style hair using appropriate products and tools to showcase the finished cut, ensuring client satisfaction before concluding service.</li><li>Clean and disinfect all tools immediately, sweep station thoroughly, and document service details for client record maintenance.</li></ol><h2>Safety</h2><p>All cutting tools must be cleaned with soap and water then fully immersed in EPA-registered hospital-grade disinfectant for manufacturer-recommended contact time between clients. <strong>Do NOT attempt haircuts on clients with open scalp wounds, active infections, or contagious conditions as this creates cross-contamination risk and may worsen the client's condition requiring medical attention.</strong> IF the client has coarse, dense hair, THEN use wider tooth combs and adjust tension to prevent hand fatigue and ensure cutting accuracy. IF the client has fine, thin hair, THEN reduce tension and use smaller subsections to prevent over-removal and maintain desired density throughout the cut.</p><h2>Visual Cues</h2><p>Monitor finger position maintaining consistent elevation angle between zero and ninety degrees depending on technique requirements. Observe hair projection perpendicular to curve of head for graduation or parallel to floor for uniform layers. Watch for clean, decisive shear closure producing sharp cutting lines without bending or folding hair strands. Check weight distribution by observing how hair falls naturally, identifying heavy areas appearing bulky or disconnected sections showing gaps. Verify perimeter hangs evenly when client's head is in neutral position with symmetrical balance on both sides. If sections appear uneven during cross-checking, you have inconsistent guideline adherence requiring immediate correction by re-cutting affected areas using proper elevation and original guideline as reference point for accuracy.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-4-checkpoint-q1",
                              "question": "What is the primary purpose of cross-checking a haircut?",
                              "options": [
                                        "A. To identify and correct any unevenness or inconsistencies in the cut",
                                        "B. To add texture and remove bulk from thick hair",
                                        "C. To establish the initial guideline for the haircut",
                                        "D. To determine the client's desired style and length"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Cross-checking involves cutting through opposite sectioning patterns to identify any unevenness, weight line inconsistencies, or errors that occurred during the initial cutting process, allowing for immediate correction."
                    },
                    {
                              "id": "barber-module-4-checkpoint-q2",
                              "question": "Which technique maintains consistent length throughout by keeping hair projection perpendicular to the head curve?",
                              "options": [
                                        "A. Uniform layering with zero elevation",
                                        "B. Graduation technique creating stacked weight",
                                        "C. Blunt cutting with hair at natural fall",
                                        "D. Texturizing to remove internal weight"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Graduation technique involves projecting hair perpendicular to the curve of the head and cutting at an angle, which creates a stacked or built-up weight area while maintaining controlled length progression."
                    },
                    {
                              "id": "barber-module-4-checkpoint-q3",
                              "question": "What is the correct contact time requirement for tool disinfection between clients?",
                              "options": [
                                        "A. The manufacturer-recommended contact time for the EPA-registered disinfectant being used",
                                        "B. Exactly five minutes regardless of the disinfectant product",
                                        "C. A quick spray and immediate wipe-down",
                                        "D. Overnight soaking in any antibacterial solution"
                              ],
                              "correctAnswer": 0,
                              "explanation": "EPA-registered hospital-grade disinfectants have specific manufacturer-recommended contact times that must be followed to ensure proper disinfection. This time varies by product and must be strictly observed for effective sanitation."
                    },
                    {
                              "id": "barber-module-4-checkpoint-q4",
                              "question": "SCENARIO: A client with fine, thin hair requests a layered cut. What adjustment should you make?",
                              "options": [
                                        "A. Use maximum tension and large sections to speed up the service",
                                        "B. Apply heavy thinning shears throughout to create texture",
                                        "C. Reduce tension and use smaller subsections to prevent over-removal",
                                        "D. Increase elevation angles to remove more weight"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine, thin hair requires reduced tension and smaller subsections to maintain control and prevent removing too much hair, which would make the hair appear even thinner and compromise the desired density and style."
                    },
                    {
                              "id": "barber-module-4-checkpoint-q5",
                              "question": "SCENARIO: During cross-checking you notice sections appear uneven with visible gaps. What is the correct response?",
                              "options": [
                                        "A. Continue with styling as the product will hide the unevenness",
                                        "B. Re-cut affected areas using proper elevation and the original guideline as reference",
                                        "C. Apply texturizing shears randomly to blend the inconsistencies",
                                        "D. Inform the client that hair settles differently after a few days"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Unevenness discovered during cross-checking must be corrected immediately by re-cutting the affected areas using proper technique and referencing the original guideline to ensure consistency and precision throughout the haircut."
                    }
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
          content: `<h2>Overview</h2><p>Proper shave preparation is essential for achieving a close, comfortable shave while minimizing irritation and ingrown hairs. Hot towel service softens beard hair, opens pores, and relaxes facial muscles, creating optimal conditions for razor glide. This foundational skill combines thermal therapy with product application to prepare skin and hair for blade contact. Mastering shave preparation demonstrates professionalism and ensures client comfort throughout the service. Understanding skin response to heat and moisture allows you to customize treatment for individual client needs while maintaining sanitation standards.</p><h2>Tools Required</h2><ul><li>Hot towel cabinet or steamer maintaining 130-140°F temperature range</li><li>Clean terry cloth towels, minimum 12x12 inches, lint-free white or light colored</li><li>Pre-shave oil containing natural lubricants like jojoba or grape seed</li><li>Lather product: shaving cream, soap, or gel appropriate for skin type</li><li>Lather brush with badger, boar, or synthetic bristles for product distribution</li><li>Disinfected shaving bowl or mug for lather preparation and application</li><li>EPA-registered hospital-grade disinfectant spray for surface preparation</li></ul><h2>Procedure</h2><ol><li>Sanitize hands and drape client with clean towel tucked snugly around neck, ensuring full chest and shoulder protection from moisture.</li><li>Analyze facial skin condition and hair growth patterns, identifying any contraindications like lesions, severe acne, or active skin infections.</li><li>Steam towel to 130-140°F, wring thoroughly to remove excess water, test temperature on your inner wrist before client application.</li><li>Apply first hot towel to face covering beard area completely, leaving nose exposed for breathing, maintain contact two to three minutes.</li><li>Remove towel and immediately apply pre-shave oil using circular motions, massaging into beard area to coat hair shafts and soften cuticles.</li><li>Prepare lather to creamy consistency using brush in circular motions, building volume with appropriate water-to-product ratio for rich texture.</li><li>Apply second hot towel over pre-shave oil for one to two minutes, allowing additional softening and pore opening before lathering.</li><li>Remove towel and apply generous lather using brush in circular motions, ensuring complete beard coverage with consistent product thickness throughout.</li></ol><h2>Safety</h2><p>All towels must be laundered in hot water with detergent and dried completely between clients to prevent bacterial growth and cross-contamination. <strong>Do NOT apply hot towels to clients with diabetes, impaired circulation, or reduced thermal sensitivity as they may experience burns without feeling excessive heat, resulting in second-degree burns and potential liability.</strong> IF the client has sensitive skin or rosacea, THEN reduce towel temperature to 120°F and decrease contact time to 90 seconds maximum. IF the client has coarse, dense beard hair, THEN extend hot towel application to three full minutes and consider a third towel cycle for optimal softening. Use EPA-registered hospital-grade disinfectant on all surface areas before service begins. Failure mode: If towel is too hot causing client discomfort, immediately remove towel, apply cool damp cloth to affected area for 30 seconds, assess for redness or irritation, allow skin to return to normal temperature for two minutes, then proceed with properly tested warm towel at reduced temperature before continuing service.</p><h2>Visual Cues</h2><p>Position client reclined at 30-45 degree angle with head supported in headrest, ensuring neck is relaxed and accessible. Towel should conform smoothly to facial contours without gaps, covering from sideburns down to jawline and chin. Properly steamed towel releases visible vapor when unfolded and appears uniformly damp throughout. Pre-shave oil application should create subtle sheen across beard area without pooling or dripping. Lather consistency should form stiff peaks when lifted with brush, appearing bright white and creamy. Properly prepared skin shows slight redness from increased circulation, with beard hair appearing darker and lying flat against skin rather than standing erect.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-29-q1",
                              "question": "What is the optimal temperature range for hot towels used in shave preparation?",
                              "options": [
                                        "A. 130-140°F",
                                        "B. 150-160°F",
                                        "C. 110-120°F",
                                        "D. 160-170°F"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Hot towels should be maintained at 130-140°F to effectively soften beard hair and open pores without risking burns or client discomfort. This temperature range provides therapeutic benefit while remaining safe."
                    },
                    {
                              "id": "barber-lesson-29-q2",
                              "question": "When should pre-shave oil be applied during the hot towel service?",
                              "options": [
                                        "A. Before the first hot towel application",
                                        "B. After the first hot towel and before the second towel",
                                        "C. After both hot towels are complete",
                                        "D. Mixed into the lather product"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Pre-shave oil is applied after the first hot towel softens the hair and opens pores, then a second hot towel is applied over the oil to drive it deeper into the hair shaft and skin for maximum effectiveness."
                    },
                    {
                              "id": "barber-lesson-29-q3",
                              "question": "What indicates properly prepared lather consistency?",
                              "options": [
                                        "A. Forms stiff peaks when lifted with brush and appears creamy white",
                                        "B. Runs freely off the brush in liquid form",
                                        "C. Appears transparent and watery",
                                        "D. Contains visible bubbles and foam only"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Proper lather should be thick enough to form stiff peaks, indicating the right water-to-product ratio. This creamy, dense consistency provides optimal cushion and lubrication for the razor during shaving."
                    },
                    {
                              "id": "barber-lesson-29-q4",
                              "question": "SCENARIO: A client mentions he has Type 2 diabetes and asks for the hot towel shave service. What do you do?",
                              "options": [
                                        "A. Proceed normally since diabetes does not affect shaving",
                                        "B. Apply towels at higher temperature to ensure effectiveness",
                                        "C. Decline the hot towel service due to impaired thermal sensitivity and circulation concerns",
                                        "D. Use only one towel instead of two"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Clients with diabetes often have impaired circulation and reduced thermal sensitivity, meaning they may not feel excessive heat and could suffer burns. This is a contraindication for hot towel service and the service should be declined or modified significantly."
                    },
                    {
                              "id": "barber-lesson-29-q5",
                              "question": "SCENARIO: During the first hot towel application you notice the client suddenly flinches and says the towel feels too hot. Correct response?",
                              "options": [
                                        "A. Tell the client to tolerate it because hot towels are supposed to be hot",
                                        "B. Immediately remove towel, apply cool damp cloth for 30 seconds, assess skin, then retry with properly tested cooler towel",
                                        "C. Leave the towel in place but reduce the time to 30 seconds",
                                        "D. Remove the towel and proceed directly to lathering without further preparation"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Client safety is paramount. Immediately remove the hot towel, apply a cool compress to prevent burns, assess for damage, allow skin to recover, and then retry with a properly temperature-tested towel at a lower heat to continue the service safely."
                    }
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
          content: `<h2>Overview</h2><p>Beard design and shaping is a specialized barber service that combines artistic vision with technical precision to enhance a client's facial features. This lesson teaches you how to analyze face shapes and create complementary beard designs using professional tools and techniques. Proper beard shaping requires understanding facial structure, hair growth patterns, and style principles. Mastering this skill allows you to provide personalized grooming services that boost client confidence and satisfaction.</p><h2>Tools Required</h2><ul><li>Professional adjustable clippers with guard attachments (sizes 1-8)</li><li>Detailing trimmer or T-blade outliner for precision work</li><li>Barber shears for scissor-over-comb technique</li><li>Fine-tooth comb and wide-tooth comb for sectioning</li><li>Beard brush with natural or synthetic bristles</li><li>Straight razor or safety razor for clean edge definition</li><li>Hand mirror for client consultation and approval</li><li>Neck strip and cape for proper draping</li></ul><h2>Client Considerations</h2><p>IF the client has a round face shape, THEN design a longer, more angular beard with defined cheek lines and shorter sides to create vertical length and elongate the face. IF the client has an oblong or rectangular face, THEN keep the beard fuller on the sides with shorter length on the chin to add width and balance proportions. IF the client has coarse, curly beard hair, THEN use longer guard settings initially as curly hair appears shorter when dry and will shrink after trimming.</p><h2>Procedure</h2><ol><li>Consult with client to determine desired beard style, assess face shape, and identify natural growth patterns and density variations throughout the beard area.</li><li>Drape the client properly with neck strip and cape, then cleanse and brush the beard thoroughly to remove debris and detangle hair.</li><li>Establish cheek line and neckline boundaries using detailing trimmer, creating clean, symmetrical lines that complement the client's facial structure and jawline.</li><li>Select appropriate clipper guard length and trim beard to desired length, moving against growth direction for even cutting across all facial zones.</li><li>Blend the beard gradually from neckline to chin using progressively longer guards, creating smooth transitions without visible lines or unevenness throughout.</li><li>Use scissor-over-comb technique to refine length, remove bulk, and shape the mustache area, checking symmetry from multiple angles throughout the process.</li><li>Detail edges with trimmer or razor, removing stray hairs outside design lines, then apply aftershave or beard oil as finishing product.</li><li>Show client the finished result using hand mirror for front and side views, making minor adjustments as needed for complete satisfaction.</li></ol><h2>Safety</h2><p>All tools must be sanitized before and after each client service. Clipper blades should be cleaned with Clippercide or similar EPA-registered disinfectant spray, while combs and guards must be washed with soap and water then immersed in Barbicide solution for ten minutes. Razors require blade disposal in sharps container and handle disinfection between uses.<strong>Do NOT perform beard shaping services on clients with active skin infections, open wounds, or severe acne in the beard area, as cutting and trimming can spread bacteria, worsen the condition, and potentially expose you to bloodborne pathogens requiring medical intervention.</strong></p><h2>Visual Cues</h2><p>Position yourself at eye level with the client's beard, moving systematically from one side to the other to maintain symmetry. Observe the natural angle where the jawline meets the neck, typically one finger-width above the Adam's apple for proper neckline placement. Check that cheek lines follow a straight or slightly curved path from the sideburn to the mustache corner, typically level with the nose bottom. The beard should appear denser at the chin and gradually lighter toward the cheeks. Step back periodically to assess overall balance and proportion from three feet away, ensuring both sides match in length, shape, and definition.</p><h2>Failure Recovery</h2><p>If you accidentally create an uneven patch or cut the beard too short in one area, do not attempt to match the mistake by cutting everything shorter immediately. First, assess the damage by combing the area and determining the exact length difference. Then, use scissor-over-comb technique with minimal tension to gradually blend the shorter section into surrounding areas, creating a subtle transition. Work in small increments, checking symmetry after each pass. If the error is significant, consult with the client about adjusting the overall beard length or modifying the style to incorporate the shorter section as an intentional design element.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-31-q1",
                              "question": "What is the primary purpose of using the scissor-over-comb technique during beard shaping?",
                              "options": [
                                        "A. To refine length, remove bulk, and create smooth transitions in the beard",
                                        "B. To establish the initial cheek line and neckline boundaries",
                                        "C. To apply finishing products evenly throughout the beard",
                                        "D. To detangle and prepare the beard before using clippers"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The scissor-over-comb technique is specifically used to refine length, remove excess bulk, and shape areas like the mustache while creating smooth, natural-looking results that clippers alone cannot achieve."
                    },
                    {
                              "id": "barber-lesson-31-q2",
                              "question": "Where should the neckline typically be positioned when shaping a beard?",
                              "options": [
                                        "A. Directly at the jawbone where it meets the neck",
                                        "B. Approximately one finger-width above the Adam's apple",
                                        "C. Two inches below the chin for all face shapes",
                                        "D. At the point where the neck meets the shoulder"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The proper neckline placement is typically one finger-width above the Adam's apple, following the natural angle where the jawline meets the neck for a clean, professional appearance."
                    },
                    {
                              "id": "barber-lesson-31-q3",
                              "question": "Why must clipper blades be disinfected between clients?",
                              "options": [
                                        "A. To prevent cross-contamination and transmission of bacteria, fungi, or bloodborne pathogens between clients",
                                        "B. To keep the blades sharp and functioning properly",
                                        "C. To remove hair clippings that might dull the cutting edges",
                                        "D. To comply with manufacturer warranty requirements"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Disinfecting clipper blades between clients is essential to prevent cross-contamination and the spread of infections, bacteria, fungi, or bloodborne pathogens, protecting both clients and the barber."
                    },
                    {
                              "id": "barber-lesson-31-q4",
                              "question": "SCENARIO: A client with a round face requests a full, bushy beard that adds width to his face. What do you do?",
                              "options": [
                                        "A. Proceed with the requested style exactly as the client described it",
                                        "B. Refuse the service and tell the client his idea will not work",
                                        "C. Professionally explain how a longer, angular beard would better complement his face shape and suggest modifications",
                                        "D. Create the bushy beard but charge extra for the consultation"
                              ],
                              "correctAnswer": 2,
                              "explanation": "As a professional barber, you should educate clients about styles that complement their features. Diplomatically suggest a longer, more angular design that creates vertical length for round faces while respecting the client's input."
                    },
                    {
                              "id": "barber-lesson-31-q5",
                              "question": "SCENARIO: During the service you notice you have accidentally created an uneven patch on one side of the beard. Correct response?",
                              "options": [
                                        "A. Immediately cut the entire beard to match the shortest area",
                                        "B. Use scissor-over-comb technique to gradually blend the shorter section, working in small increments",
                                        "C. Tell the client it will grow back and continue with the original plan",
                                        "D. Apply more product to the area to hide the unevenness"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct recovery method is to use scissor-over-comb technique to gradually blend the shorter section into surrounding areas, working carefully in small increments rather than hastily cutting everything shorter."
                    }
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
          content: `<h2>Overview</h2><p>Post-shave care is essential to prevent irritation, ingrown hairs, and infection while promoting healthy skin recovery. After removing hair, the skin barrier is temporarily compromised and requires immediate attention with appropriate products and techniques. Proper post-shave treatment soothes razor burn, closes pores, restores pH balance, and provides antimicrobial protection. This lesson covers product selection, application techniques, client skin assessment, and management of common reactions. Mastering these skills ensures client comfort, prevents complications, and demonstrates professional expertise that builds trust and repeat business in your barbering practice.</p><h2>Tools Required</h2><ul><li>Cold water or cold towel compress</li><li>Aftershave lotion, balm, or astringent (alcohol-based or alcohol-free options)</li><li>Moisturizer or post-shave serum with soothing ingredients</li><li>Alum block or styptic powder for minor nicks</li><li>Clean towels (separate from shaving towels)</li><li>Antiseptic spray or EPA-registered disinfectant for workspace</li><li>Cotton pads or applicators for product application</li></ul><h2>Decision Factors</h2><p>IF the client has sensitive skin or visible redness, THEN use alcohol-free aftershave balm with aloe vera or chamomile and avoid astringents that cause stinging or further irritation. IF the client has oily or acne-prone skin, THEN apply a lightweight, non-comedogenic aftershave with salicylic acid or witch hazel to prevent clogged pores and breakouts. IF the client has dry or mature skin, THEN select a rich moisturizing balm with hyaluronic acid or vitamin E to restore hydration and elasticity.</p><h2>Procedure</h2><ol><li>Rinse the shaved area thoroughly with cool water to remove all remaining shaving cream, stubble, and debris from the skin surface.</li><li>Pat the skin completely dry using a clean towel with gentle pressing motions, avoiding any rubbing that could cause additional irritation.</li><li>Apply alum block or styptic powder to any nicks or cuts using light pressure until bleeding stops, typically within seconds.</li><li>Dispense a small amount of chosen aftershave product into your palm or onto a cotton pad for controlled, sanitary application.</li><li>Apply the aftershave using gentle upward and outward motions, covering all shaved areas evenly without excessive rubbing or pressure on skin.</li><li>Follow with moisturizer if needed, using light patting motions to seal in hydration and create a protective barrier on skin.</li><li>Advise the client on home care, including avoiding sun exposure, touching the area, or applying fragranced products for twenty-four hours.</li></ol><h2>Safety</h2><p>All post-shave products must be dispensed from containers using clean applicators or hands washed immediately before application to prevent cross-contamination between clients. Workstations should be disinfected with EPA-registered hospital-grade disinfectant between each client, including all product containers and dispensers. <strong>Do NOT apply aftershave products containing alcohol or fragrance to clients with open cuts, active infections, or inflamed skin conditions, as this causes severe burning, delayed healing, and potential bacterial introduction into compromised tissue.</strong> Always check expiration dates on products and discard any items showing contamination signs.</p><h2>Visual Cues</h2><p>Properly treated skin should appear calm with reduced redness within two to three minutes of aftershave application, showing even moisture distribution without pooling or dry patches. Watch for immediate adverse reactions including increased redness, hives, or swelling that indicate allergic response requiring product removal. The skin should feel cool and taut but not tight or uncomfortable, with a subtle matte or slight sheen depending on product type used. Observe the neck area at a forty-five-degree angle under proper lighting to detect any missed spots, uneven application, or developing razor bumps that need attention.</p><h2>Failure Mode</h2><p>If a client develops sudden widespread redness and burning sensation after aftershave application, this indicates allergic reaction or inappropriate product selection for skin type. Immediately remove the product by rinsing the entire area with cool water for at least sixty seconds. Pat dry gently and apply a plain, fragrance-free aloe vera gel or hypoallergenic moisturizer to calm inflammation. Place a cold compress on the affected area for five-minute intervals. Document the product used and reaction observed, and recommend the client avoid that ingredient family in future. If swelling or hives develop, advise seeking medical attention and do not proceed with additional products.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-32-q1",
                              "question": "What is the primary purpose of applying aftershave products immediately following a shave service?",
                              "options": [
                                        "A. To soothe skin, close pores, restore pH balance, and provide antimicrobial protection",
                                        "B. To add fragrance and make the client smell pleasant for the rest of the day",
                                        "C. To remove any remaining shaving cream residue from the skin surface",
                                        "D. To prepare the skin for immediate sun exposure and outdoor activities"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Aftershave products serve multiple therapeutic purposes including soothing irritation, closing pores, restoring skin pH, and providing antimicrobial protection to prevent infection in the temporarily compromised skin barrier."
                    },
                    {
                              "id": "barber-lesson-32-q2",
                              "question": "Which type of aftershave product is most appropriate for a client with oily, acne-prone skin?",
                              "options": [
                                        "A. Rich moisturizing balm with hyaluronic acid and heavy emollients",
                                        "B. Lightweight, non-comedogenic aftershave with salicylic acid or witch hazel",
                                        "C. Alcohol-based astringent with added synthetic fragrances and dyes",
                                        "D. Thick cream containing petroleum jelly and mineral oil base"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Oily and acne-prone skin requires lightweight, non-comedogenic products that won't clog pores. Ingredients like salicylic acid and witch hazel help control oil and prevent breakouts without adding heaviness."
                    },
                    {
                              "id": "barber-lesson-32-q3",
                              "question": "What is the correct method for drying the skin immediately after rinsing following a shave?",
                              "options": [
                                        "A. Pat the skin completely dry using gentle pressing motions with a clean towel, avoiding rubbing",
                                        "B. Vigorously rub the skin with a coarse towel to stimulate blood circulation",
                                        "C. Allow the skin to air dry naturally without using any towel contact",
                                        "D. Use a high-speed blow dryer on cool setting to evaporate water quickly"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Patting with gentle pressing motions removes water without causing additional irritation to freshly shaved skin. Rubbing can cause friction and inflammation on the compromised skin barrier."
                    },
                    {
                              "id": "barber-lesson-32-q4",
                              "question": "SCENARIO: A client with visible razor burn and multiple areas of redness requests aftershave application. What do you do?",
                              "options": [
                                        "A. Apply a strong alcohol-based astringent to disinfect and tighten the irritated areas",
                                        "B. Skip all aftershave products and send the client home without post-shave treatment",
                                        "C. Select an alcohol-free aftershave balm with aloe vera or chamomile and apply gently",
                                        "D. Use a medicated acne treatment containing benzoyl peroxide on the affected areas"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Sensitive, irritated skin requires gentle, alcohol-free products with soothing ingredients like aloe vera or chamomile. Alcohol-based products would cause burning and worsen the irritation on already compromised skin."
                    },
                    {
                              "id": "barber-lesson-32-q5",
                              "question": "SCENARIO: During post-shave product application you notice the client's skin becoming increasingly red with visible hives forming. Correct response?",
                              "options": [
                                        "A. Continue with the service and apply additional moisturizer to cover the reaction",
                                        "B. Immediately rinse the area with cool water, apply plain aloe vera gel, and use a cold compress",
                                        "C. Apply more of the same product to help the skin adjust to the ingredients",
                                        "D. Ignore the reaction as it will resolve naturally within a few hours"
                              ],
                              "correctAnswer": 1,
                              "explanation": "This indicates an allergic reaction requiring immediate product removal. Rinsing with cool water, applying plain aloe vera, and using cold compresses are the correct steps to manage the reaction and prevent worsening symptoms."
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
          content: `<h2>Overview</h2><p>Mustache trimming and styling is a precision service that requires careful attention to facial structure, hair growth patterns, and client preferences. A well-groomed mustache enhances facial features and complements overall appearance. This skill combines technical execution with artistic vision, requiring the barber to assess symmetry, proportion, and balance. Mastering mustache trimming demonstrates professionalism and builds client loyalty. Understanding various mustache styles, from classic handlebar to modern pencil designs, allows you to recommend options that best suit each client's face shape and personal style.</p><h2>Tools Required</h2><ul><li>Barber shears (preferably 5.5 to 6 inches with fine tips for detail work)</li><li>Mustache comb (fine-toothed, typically 4 to 5 inches in length)</li><li>Trimming clippers with guards (sizes 1 through 4 for length control)</li><li>Detailing trimmer or outliner for precise edge work</li><li>Straight razor or safety razor for clean lines and definition</li><li>Mustache wax or styling product for shaping and hold</li><li>Disinfected towels and neck strips for client protection</li><li>Handheld mirror for client consultation and approval</li></ul><h2>Client Assessment</h2><p>IF the client has coarse, thick mustache hair, THEN use thinning shears after initial trimming to reduce bulk and create a softer appearance without losing length. IF the client has fine or sparse mustache hair, THEN avoid over-trimming and use minimal tension when combing to prevent removing too much hair, which can create patchy areas. IF the client has sensitive skin or recent irritation, THEN postpone razor detailing and use only scissors and clippers for this service.</p><h2>Procedure</h2><ol><li>Consult with client to determine desired mustache style, length, and shape while assessing facial features and natural growth patterns for best results.</li><li>Drape client properly with neck strip and cape, then sanitize hands and ensure all tools are clean and disinfected before beginning service.</li><li>Comb mustache hair downward in natural growth direction to remove tangles and assess current length, identifying any uneven areas requiring attention.</li><li>Begin trimming at center of upper lip using shears, working outward toward corners while maintaining consistent length and checking symmetry between both sides.</li><li>Use clippers with appropriate guard to establish overall length, moving horizontally across mustache while following natural contour of upper lip for even results.</li><li>Detail edges using trimmer or razor to define clean upper and lower borders, creating sharp lines that frame the mustache precisely.</li><li>Thin bulk if necessary using thinning shears at mid-length, avoiding roots and tips to maintain natural appearance while reducing excess weight.</li><li>Apply small amount of mustache wax or styling product, working through hair with fingertips, then comb into desired shape and style.</li><li>Show client results using handheld mirror, make any final adjustments based on feedback, and provide styling recommendations for home maintenance.</li></ol><h2>Safety</h2><p>All combs, shears, and clipper blades must be cleaned with Barbicide or EPA-registered hospital-grade disinfectant between clients, with minimum ten-minute contact time per manufacturer specifications. Tools should be stored in sanitized containers after proper disinfection. <strong>Do NOT trim a mustache if active cold sores, open lesions, or skin infections are present in the mustache area, as this can spread infection to other facial areas and contaminate tools, requiring immediate service termination and medical referral.</strong></p><h2>Failure Mode Recovery</h2><p>If you accidentally trim the mustache too short on one side, creating visible asymmetry, immediately stop cutting. First, inform the client honestly about the mistake. Second, carefully assess whether you can shorten the opposite side to match without compromising the overall style. Third, if matching is possible, use scissors to carefully remove hair incrementally while constantly checking symmetry. Fourth, if the mustache is now too short for the desired style, discuss alternative shorter styles that work with the current length. Fifth, document the incident and offer a complimentary follow-up appointment when growth allows proper reshaping.</p><h2>Visual Cues</h2><p>Position yourself directly in front of the client at eye level to assess symmetry accurately throughout the service. The mustache should follow the natural curve of the upper lip, with corners typically ending at the outer edges of the mouth or slightly beyond. Shears should be held at a 45-degree angle when point-cutting for texture. Hair should appear even when combed downward, with no gaps or patches visible. The upper border should create a clean line approximately one-eighth inch below the nose base. Lower border follows the natural lip line, maintaining consistent distance. Observe that both sides mirror each other in length, density, and shape when viewed from the front.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-33-q1",
                              "question": "What is the primary purpose of using thinning shears during mustache trimming?",
                              "options": [
                                        "A. To reduce bulk and create a softer appearance without significantly affecting length",
                                        "B. To establish the initial length and overall shape of the mustache",
                                        "C. To create sharp, defined edges along the borders of the mustache",
                                        "D. To remove all hair that extends beyond the desired mustache area"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Thinning shears are used to reduce bulk and create a softer appearance without losing significant length, particularly useful for clients with coarse, thick mustache hair."
                    },
                    {
                              "id": "barber-lesson-33-q2",
                              "question": "When trimming a mustache with scissors, what is the recommended starting point?",
                              "options": [
                                        "A. Begin at the outer corners and work inward toward the center",
                                        "B. Start at the center of the upper lip and work outward toward the corners",
                                        "C. Begin at the lower border and work upward to the upper border",
                                        "D. Start randomly at any point to ensure a natural, uneven appearance"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct technique is to begin trimming at the center of the upper lip using shears and work outward toward the corners while maintaining consistent length and checking symmetry."
                    },
                    {
                              "id": "barber-lesson-33-q3",
                              "question": "What is the minimum contact time required for Barbicide or EPA-registered disinfectant on barbering tools?",
                              "options": [
                                        "A. Ten minutes per manufacturer specifications",
                                        "B. Three minutes for basic sanitation",
                                        "C. Thirty seconds of spray application",
                                        "D. Five minutes for adequate disinfection"
                              ],
                              "correctAnswer": 0,
                              "explanation": "All tools must be cleaned with Barbicide or EPA-registered hospital-grade disinfectant with a minimum ten-minute contact time per manufacturer specifications to ensure proper disinfection."
                    },
                    {
                              "id": "barber-lesson-33-q4",
                              "question": "SCENARIO: A client with very fine, sparse mustache hair requests a trim to clean up stray hairs. What is your best approach?",
                              "options": [
                                        "A. Use heavy tension when combing and trim aggressively to create a defined shape",
                                        "B. Apply thinning shears throughout to reduce any appearance of bulk",
                                        "C. Use minimal tension when combing and avoid over-trimming to prevent creating patchy areas",
                                        "D. Recommend shaving the mustache completely and starting over for better results"
                              ],
                              "correctAnswer": 2,
                              "explanation": "For clients with fine or sparse mustache hair, you should use minimal tension when combing and avoid over-trimming to prevent removing too much hair, which can create patchy, uneven areas."
                    },
                    {
                              "id": "barber-lesson-33-q5",
                              "question": "SCENARIO: During the service you notice you accidentally trimmed one side of the mustache significantly shorter than the other. What is the correct response?",
                              "options": [
                                        "A. Continue trimming and hope the client doesn't notice the difference",
                                        "B. Immediately stop, inform the client honestly, assess if matching is possible, and offer solutions or a follow-up appointment",
                                        "C. Apply extra mustache wax to the shorter side to make it appear longer",
                                        "D. Quickly trim the entire mustache very short to hide the mistake"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When a mistake occurs, professional protocol requires immediately stopping, honestly informing the client, carefully assessing whether the opposite side can be matched, and offering appropriate solutions including complimentary follow-up appointments if needed."
                    }
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
          content: `<h2>Overview</h2><p>Hair color theory is the foundation of successful chemical color services in the barbershop. Understanding the color wheel enables barbers to predict color outcomes, correct unwanted tones, and achieve desired results consistently. The color wheel consists of primary colors (red, yellow, blue), secondary colors (orange, green, violet), and tertiary colors created by mixing adjacent hues. Complementary colors sit opposite each other on the wheel and neutralize one another when combined. This principle is essential for color correction, toning, and formulation. Mastering color theory allows barbers to communicate professionally with clients and deliver predictable, quality results in highlighting, grey blending, and full color applications.</p><h2>Client Assessment</h2><p>IF the client has warm undertones in their skin, THEN select ash or cool tones to create balance and avoid brassy results. IF the client has cool undertones with pink or blue base, THEN choose warm or golden tones to complement their complexion and create harmonious results. IF the client has previously colored hair with visible banding or multiple levels, THEN perform a strand test to determine processing time and formulation adjustments needed for even color distribution.</p><h2>Tools Required</h2><ul><li>Color wheel chart displaying primary, secondary, and tertiary color relationships</li><li>Color swatches or manufacturer's shade guide showing level and tone variations</li><li>Mixing bowl (glass or plastic, non-metallic) for color formulation</li><li>Tint brush with firm bristles for precise application techniques</li><li>Protective gloves (nitrile or vinyl) for barrier protection during application</li><li>Measuring tools including applicator bottle or scale for accurate formulation</li><li>Sectioning clips (metal-free plastic) to organize hair during application</li><li>Protective cape and towels to shield client's skin and clothing</li></ul><h2>Procedure</h2><ol><li>Conduct thorough consultation identifying current hair level, desired outcome, and any previous chemical treatments to establish realistic expectations and proper formulation.</li><li>Perform strand test on inconspicuous section to verify processing time, color result, and hair integrity before proceeding with full application.</li><li>Section hair into four quadrants from center front hairline to nape and ear to ear, securing each with clips.</li><li>Mix color formula according to manufacturer's directions, measuring developer and colorant precisely to maintain proper ratios and achieve predictable results.</li><li>Apply color beginning at areas requiring most deposit or lift, typically starting one-half inch from scalp on virgin hair applications.</li><li>Process according to strand test results and manufacturer's timing, checking color development every five to ten minutes to monitor progress.</li><li>Rinse thoroughly with lukewarm water until water runs clear, then apply color-safe shampoo and conditioner to stabilize pH balance.</li><li>Style hair and evaluate final result against desired outcome, documenting formula and timing for client record maintenance and future services.</li></ol><h2>Safety</h2><p>All color mixing tools and applicators must be sanitized between clients using EPA-registered hospital-grade disinfectant with appropriate contact time, typically ten minutes for non-porous implements. Combs and brushes should be cleaned of all hair and debris, then fully immersed in disinfectant solution. <strong>Do NOT apply permanent color or lightener to hair that shows signs of severe breakage, excessive damage, or scalp abrasions, as this will cause further structural damage, chemical burns, or hair loss requiring extensive corrective treatment.</strong> Always perform a patch test twenty-four to forty-eight hours before service for clients with sensitivity concerns or previous allergic reactions.</p><h2>Color Correction</h2><p>If unwanted orange or brassy tones appear after lightening, the cause is typically insufficient lifting or improper toner selection. To recover: first, evaluate the current level achieved versus desired level. Second, identify the unwanted tone using the color wheel to determine its complement. Third, formulate a toner using the opposite color (blue-violet for orange, blue for orange-yellow). Fourth, apply toner to damp, towel-dried hair for even saturation. Fifth, process for recommended time while monitoring every three to five minutes. Sixth, rinse thoroughly and assess, repeating if necessary with reduced processing time.</p><h2>Visual Cues</h2><p>Observe the hair's underlying pigment by holding sections at a forty-five degree angle against natural light to identify warm or cool tones present. Proper saturation appears glossy and uniform throughout each section, with no dry spots or uneven application visible. During processing, color development should progress evenly from application point outward without demarcation lines or spotting. The hair should maintain its structural integrity with minimal swelling or softening. Completed color results should show consistent tone from roots to ends when viewed in both natural and artificial lighting conditions, with no banding or patchiness visible.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-35-q1",
                              "question": "Which colors are considered primary colors on the color wheel used in hair color theory?",
                              "options": [
                                        "A. Red, yellow, and blue",
                                        "B. Orange, green, and violet",
                                        "C. Red, orange, and yellow",
                                        "D. Blue, green, and violet"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Red, yellow, and blue are the three primary colors that cannot be created by mixing other colors. All other colors on the wheel are created by combining these primary colors in various proportions."
                    },
                    {
                              "id": "barber-lesson-35-q2",
                              "question": "What is the relationship between complementary colors on the color wheel?",
                              "options": [
                                        "A. They are adjacent to each other and blend harmoniously",
                                        "B. They sit opposite each other and neutralize one another",
                                        "C. They are variations of the same hue at different levels",
                                        "D. They are always warm tones that create vibrant results"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Complementary colors are positioned directly opposite each other on the color wheel and neutralize each other when mixed. This principle is fundamental for color correction and toning services to eliminate unwanted tones."
                    },
                    {
                              "id": "barber-lesson-35-q3",
                              "question": "Why must color mixing bowls and tools be non-metallic during hair color application?",
                              "options": [
                                        "A. Metal can react with color chemicals causing unpredictable results or oxidation",
                                        "B. Metal tools are too heavy for precise application techniques",
                                        "C. Non-metallic tools are easier to clean and sanitize between clients",
                                        "D. Metal bowls retain heat that accelerates processing time excessively"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Metal can cause oxidation reactions with hair color chemicals, leading to unpredictable color results, altered formulations, or compromised chemical stability. Non-metallic tools ensure color integrity and predictable outcomes."
                    },
                    {
                              "id": "barber-lesson-35-q4",
                              "question": "SCENARIO: A client with warm, golden skin undertones requests a hair color service and wants to avoid looking brassy. What do you do?",
                              "options": [
                                        "A. Apply warm golden tones to match their skin and enhance the warmth",
                                        "B. Use red-based colors to create vibrant contrast with their complexion",
                                        "C. Select ash or cool-toned colors to balance their warm undertones and prevent brassiness",
                                        "D. Refuse the service because warm skin always results in brassy hair color"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Clients with warm skin undertones benefit from ash or cool-toned hair colors that create balance and prevent brassy results. Cool tones neutralize excess warmth and create a complementary, harmonious appearance."
                    },
                    {
                              "id": "barber-lesson-35-q5",
                              "question": "SCENARIO: During color processing you notice unwanted orange tones developing on previously lightened hair. Correct response?",
                              "options": [
                                        "A. Immediately rinse the color out and start over with a darker shade",
                                        "B. Formulate a blue-violet toner to neutralize the orange and apply after rinsing",
                                        "C. Continue processing longer to push through the orange stage to pale yellow",
                                        "D. Apply additional lightener over the wet color to lift out the orange pigment"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Orange tones should be neutralized using their complementary color from the wheel: blue-violet. After rinsing the initial color, formulate and apply a blue-violet toner to correct the unwanted warm tones and achieve the desired result."
                    }
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
          content: `<h2>Overview</h2><p>Chemical safety and patch testing are critical foundations for every barber performing chemical services. A patch test identifies allergic reactions or sensitivities before full application, protecting both client health and professional liability. This lesson covers proper patch test execution, contraindication identification, and emergency response protocols. Understanding chemical interactions with skin and hair prevents adverse reactions, burns, and legal complications. Mastery of these skills ensures safe service delivery and builds client trust in your professional judgment.</p><h2>Tools Required</h2><ul><li>Disposable gloves (nitrile or vinyl)</li><li>Chemical product to be tested (hair color, relaxer, or perm solution)</li><li>Cotton swabs or applicator sticks</li><li>Client consultation card with allergy history documentation</li><li>Timer or stopwatch for monitoring development time</li><li>Antiseptic wipes or alcohol pads</li><li>Small mixing bowl and measuring tools</li><li>Adhesive bandage or non-stick gauze pad</li></ul><h2>Client Variation Decision Protocol</h2><p>IF the client has a history of skin allergies, eczema, psoriasis, or previous reactions to hair products, THEN perform the patch test 48 hours before service and document results thoroughly. IF the client has open wounds, active dermatitis, sunburn, or inflamed scalp conditions, THEN postpone chemical services until the condition fully heals. IF the client is using prescription retinoids, has undergone recent laser treatments, or takes photosensitizing medications, THEN extend the patch test observation period to 72 hours and consult with their physician before proceeding.</p><h2>Sanitation Protocol</h2><p>All mixing tools and application instruments must be sanitized with hospital-grade EPA-registered disinfectant such as Barbicide or Marvicide for the manufacturer-specified contact time, typically ten minutes. Discard all single-use items including gloves, cotton swabs, and applicators immediately after patch test completion. Clean work surfaces with disinfectant before and after each client interaction to prevent cross-contamination and maintain professional hygiene standards.</p><h2>Safety</h2><p><strong>Do NOT perform chemical services on clients with active scalp abrasions, open sores, or bleeding lesions. Applying chemicals to compromised skin can cause severe chemical burns, systemic absorption of toxic substances, infection, permanent scarring, and potential litigation for negligence.</strong> Always conduct a thorough scalp and skin analysis before beginning any chemical service. Document all observations and client responses in writing. If a client shows signs of allergic reaction during the patch test including redness, swelling, itching, or blistering, immediately remove the product with cool water and apply a cold compress. Advise the client to seek medical attention if symptoms persist or worsen after initial treatment.</p><h2>Failure Mode and Recovery</h2><p>If a client develops localized irritation or mild redness during the patch test observation period, this indicates sensitivity to the chemical formula. Immediately discontinue plans for the full chemical service. Apply cool water to the test area for five minutes. Pat dry gently with a clean towel. Apply a thin layer of hydrocortisone cream if available and not contraindicated. Document the reaction with photographs if possible. Recommend the client consult a dermatologist before attempting alternative chemical formulations. Suggest alternative non-chemical services that achieve similar aesthetic goals without triggering sensitivity reactions.</p><h2>Visual Cues</h2><p>Apply the patch test mixture to a small area approximately the size of a quarter behind the ear or on the inner elbow. The test area should be clean, dry, and free from lotions or oils. Position your application at a 45-degree angle to ensure even product distribution without excessive saturation. The applied product should appear as a thin, uniform layer without pooling or dripping. Healthy skin remains its natural color while negative reactions show progressive redness, raised welts, or blister formation. Observe skin texture changes including roughness, flaking, or unusual warmth indicating inflammatory response.</p><h2>Procedure</h2><ol><li>Review client consultation card thoroughly, asking specifically about previous chemical service reactions, current medications, and known allergies to cosmetic ingredients or fragrances.</li><li>Put on disposable gloves and clean the test area behind the ear or inner elbow with an antiseptic wipe, allowing the area to air dry completely.</li><li>Mix a small amount of the chemical product according to manufacturer instructions, using the exact formula and proportions planned for the full service application.</li><li>Apply a quarter-sized amount of product to the test area using a cotton swab, spreading it evenly in a thin layer without rubbing vigorously.</li><li>Allow the product to remain on the skin for the manufacturer-recommended development time, typically 20 to 30 minutes, monitoring for immediate adverse reactions throughout.</li><li>Remove the product gently with cool water and pat the area dry, then cover with a small adhesive bandage or gauze if recommended by product instructions.</li><li>Instruct the client to leave the test area undisturbed for 48 hours, avoiding water exposure, and to monitor for redness, itching, swelling, or blistering reactions.</li><li>Document the patch test date, time, product used, and initial skin response in the client record, scheduling the follow-up service only after negative test confirmation.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-36-q1",
                              "question": "What is the primary purpose of performing a patch test before chemical services?",
                              "options": [
                                        "A. To identify allergic reactions or sensitivities before full application",
                                        "B. To determine the correct processing time for the chemical",
                                        "C. To test the strength of the chemical formula",
                                        "D. To practice application techniques on a small area"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The primary purpose of a patch test is to identify allergic reactions or sensitivities before applying chemicals to the entire scalp or hair, protecting client health and preventing adverse reactions."
                    },
                    {
                              "id": "barber-lesson-36-q2",
                              "question": "How long should properly mixed chemical products remain on the patch test area during initial application?",
                              "options": [
                                        "A. 5 to 10 minutes",
                                        "B. 20 to 30 minutes according to manufacturer instructions",
                                        "C. 1 hour minimum",
                                        "D. Until the client reports discomfort"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Chemical products should remain on the patch test area for the manufacturer-recommended development time, typically 20 to 30 minutes, to accurately simulate the conditions of a full service application."
                    },
                    {
                              "id": "barber-lesson-36-q3",
                              "question": "Where should a patch test be applied on the client?",
                              "options": [
                                        "A. Behind the ear or on the inner elbow in a quarter-sized area",
                                        "B. On the scalp near the hairline",
                                        "C. On the back of the hand",
                                        "D. On the neck below the hairline"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The patch test should be applied behind the ear or on the inner elbow in a quarter-sized area, as these locations provide accessible skin that closely resembles scalp sensitivity without being highly visible."
                    },
                    {
                              "id": "barber-lesson-36-q4",
                              "question": "SCENARIO: A client arrives for a color service and mentions they have active eczema patches on their scalp and neck. What do you do?",
                              "options": [
                                        "A. Apply a protective barrier cream and proceed with the service",
                                        "B. Perform a quick patch test and proceed if no immediate reaction occurs",
                                        "C. Postpone the chemical service until the eczema condition fully heals",
                                        "D. Use a gentler chemical formula designed for sensitive skin"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Active eczema represents compromised skin integrity and is a contraindication for chemical services. The service must be postponed until the condition fully heals to prevent severe reactions, chemical burns, and complications."
                    },
                    {
                              "id": "barber-lesson-36-q5",
                              "question": "SCENARIO: During the 48-hour observation period, your client calls reporting mild redness and slight itching at the patch test site. Correct response?",
                              "options": [
                                        "A. Tell them it is normal and proceed with the scheduled service",
                                        "B. Advise them to remove any covering, apply cool water, discontinue the planned service, and recommend dermatologist consultation",
                                        "C. Instruct them to apply moisturizer and monitor for another 24 hours",
                                        "D. Schedule them immediately to complete the service before reaction worsens"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Redness and itching indicate sensitivity or allergic reaction. The correct response is to discontinue service plans immediately, advise cool water application, and recommend professional medical consultation to prevent severe reactions during full application."
                    }
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
          content: `<h2>Overview</h2><p>Relaxers and texturizers permanently alter hair structure by breaking disulfide bonds within the cortex. Sodium hydroxide, guanidine hydroxide, and ammonium thioglycolate are common active ingredients that rearrange protein chains to achieve straightening or softening effects. Understanding pH levels, processing times, and client hair history is critical for safe application. This service demands precision, timing, and thorough consultation to prevent irreversible damage. Proper technique protects scalp integrity while delivering desired texture modification results for diverse clientele.</p><h2>Tools Required</h2><ul><li>Relaxer or texturizer chemical system with neutralizing shampoo</li><li>Protective base cream or petroleum jelly</li><li>Applicator brushes and tail comb for sectioning</li><li>Timer for accurate processing monitoring</li><li>Plastic or rubber gloves for chemical protection</li><li>Neutralizing conditioner and pH-balanced post-service treatment</li><li>Spray bottle with cool water for emergency dilution</li><li>Cape, towels, and neck strips for client protection</li></ul><h2>Client Assessment</h2><p><strong>IF</strong> the client has virgin hair with no previous chemical treatments, <strong>THEN</strong> apply relaxer from mid-shaft to ends first, then roots last to avoid over-processing at the scalp where heat accelerates the reaction. <strong>IF</strong> the client has previously relaxed hair requiring a touch-up, <strong>THEN</strong> apply only to new growth, maintaining at least one-eighth inch distance from previously processed hair to prevent overlapping, breakage, and excessive thinning.</p><h2>Safety</h2><p>Disinfect all non-porous tools including combs, brushes, and bowls using an EPA-registered hospital-grade disinfectant such as 10% sodium hypochlorite solution or quaternary ammonium compound, ensuring ten-minute contact time between clients. <strong>Do NOT</strong> apply relaxer to hair with existing scalp abrasions, cuts, irritation, or if metallic dyes are present, as this will cause severe chemical burns, uncontrollable exothermic reactions, hair disintegration, and potential permanent scarring requiring medical intervention.</p><h2>Failure Recovery</h2><p>If hair becomes excessively limp or shows signs of over-processing such as a mushy texture or stretching without returning to form, immediately rinse chemical thoroughly with cool water for at least five minutes. Apply neutralizing shampoo, lather gently without manipulation, and rinse completely. Apply protein-based reconstructor to damaged areas, process according to manufacturer instructions. Follow with intensive moisturizing conditioner, then assess breakage extent. Schedule follow-up treatment and advise client on gentle handling and no further chemical services for minimum eight weeks.</p><h2>Visual Cues</h2><p>Maintain consistent one-eighth to one-quarter inch sections for uniform saturation and processing. Apply relaxer with applicator brush at forty-five-degree angle to hair shaft, ensuring cream flows from base through mid-lengths smoothly. Hair should exhibit gradual softening with natural sheen rather than chalky, dull appearance indicating over-processing. Test curl pattern by gently smoothing section; hair should straighten to desired degree without excessive stretching. Scalp should remain free of redness; any irritation signals immediate removal necessity.</p><h2>Procedure</h2><ol><li>Conduct thorough consultation examining hair porosity, elasticity, prior chemical history, and perform strand test to determine appropriate processing time and formula strength.</li><li>Drape client with waterproof cape and towels, then apply protective base cream generously to hairline, ears, nape, and entire scalp perimeter.</li><li>Section hair into four quadrants from crown to nape and ear to ear, securing each with clips for systematic application control.</li><li>Beginning in the most resistant area, apply relaxer to one-quarter inch sections from scalp to ends on virgin hair or new growth only on retouch.</li><li>Smooth product through hair shaft using applicator or back of comb, monitoring processing every three to five minutes by testing strand relaxation degree.</li><li>When desired straightness is achieved without over-processing, rinse thoroughly with lukewarm water for minimum five minutes until water runs completely clear of product.</li><li>Apply neutralizing shampoo, lather gently, and rinse completely; repeat neutralizing process two additional times to halt chemical action and restore pH balance.</li><li>Apply deep conditioning treatment, process according to directions, then rinse, towel blot, and style as desired using appropriate heat protectants and minimal tension.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-37-q1",
                              "question": "What is the primary chemical action that occurs during relaxer application to permanently straighten hair?",
                              "options": [
                                        "A. Breaking disulfide bonds within the hair cortex",
                                        "B. Coating the cuticle layer with silicone polymers",
                                        "C. Heating the hair shaft to denature melanin",
                                        "D. Evaporating moisture from the medulla"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Relaxers work by breaking disulfide bonds in the cortex, which allows permanent rearrangement of the hair's protein structure for straightening effects."
                    },
                    {
                              "id": "barber-lesson-37-q2",
                              "question": "When performing a relaxer retouch service, where should the chemical be applied?",
                              "options": [
                                        "A. From scalp through all previously relaxed hair",
                                        "B. Only to new growth, avoiding previously processed areas",
                                        "C. Only to the ends where damage is most visible",
                                        "D. Uniformly throughout all hair for consistent results"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Relaxer should only be applied to new growth during retouch services to prevent overlapping on previously processed hair, which causes breakage and excessive damage."
                    },
                    {
                              "id": "barber-lesson-37-q3",
                              "question": "What is the minimum rinse time required to remove relaxer chemical before neutralizing?",
                              "options": [
                                        "A. Five minutes with lukewarm water",
                                        "B. Thirty seconds with cold water",
                                        "C. Two minutes with hot water",
                                        "D. Ten minutes alternating temperatures"
                              ],
                              "correctAnswer": 0,
                              "explanation": "A minimum of five minutes of thorough rinsing with lukewarm water is essential to completely remove relaxer chemical before beginning the neutralization process."
                    },
                    {
                              "id": "barber-lesson-37-q4",
                              "question": "SCENARIO: A client arrives with visible scalp abrasions from recent braiding and requests a relaxer service. What do you do?",
                              "options": [
                                        "A. Apply extra protective base and proceed carefully",
                                        "B. Use a mild formula texturizer instead of regular relaxer",
                                        "C. Refuse service and reschedule after scalp heals completely",
                                        "D. Apply relaxer quickly to minimize scalp contact time"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Relaxer must never be applied to abraded or irritated scalp as it will cause severe chemical burns and potential scarring. The service must be postponed until complete healing occurs."
                    },
                    {
                              "id": "barber-lesson-37-q5",
                              "question": "SCENARIO: During processing you notice hair becoming mushy and stretching excessively without returning to form. Correct response?",
                              "options": [
                                        "A. Apply more relaxer to balance the chemical reaction",
                                        "B. Immediately rinse with cool water, neutralize, and apply protein treatment",
                                        "C. Continue processing to achieve maximum straightness",
                                        "D. Blow dry the hair to firm up the structure"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Mushy, overstretched hair indicates severe over-processing. Immediate rinsing, neutralizing, and protein treatment are critical to halt damage and attempt structural recovery."
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
          content: `<h2>Overview</h2><p>Scalp treatments address a range of conditions including dryness, oiliness, dandruff, and minor irritations. As a barber apprentice, you must accurately assess scalp health, select appropriate products, and apply treatments using proper techniques. Understanding the scalp's physiology and recognizing common conditions enables you to provide therapeutic services that improve client comfort and hair health. This lesson covers assessment protocols, product selection criteria, application methods, and contraindications. Effective scalp treatments require knowledge of ingredients, manual manipulation techniques, and timing. Proper execution promotes circulation, balances sebum production, and creates optimal conditions for healthy hair growth while enhancing the overall barbering experience.</p><h2>Tools Required</h2><ul><li>Shampoo bowl and adjustable chair</li><li>Scalp analysis magnifying lamp or dermatoscope</li><li>Treatment applicator bottles with precision nozzles</li><li>Scalp massage brushes with rubber or silicone bristles</li><li>Towels, capes, and neck strips</li><li>Disinfected combs and sectioning clips</li><li>Treatment products: oils, serums, medicated lotions, exfoliating scrubs</li><li>Timer for product processing</li></ul><h2>Client Assessment Decision Matrix</h2><p>IF the client presents with visible flaking and itching, THEN select anti-dandruff treatment containing zinc pyrithione or ketoconazole, apply directly to affected areas, and allow five to seven minutes processing time before rinsing. IF the client has oily scalp with clogged follicles, THEN use clarifying treatment with tea tree oil or salicylic acid, focus on problem zones, perform gentle exfoliation, and follow with balancing toner to regulate sebum production.</p><h2>Procedure</h2><ol><li>Drape client properly with cape and towel, position comfortably at shampoo bowl, and perform visual scalp analysis under adequate lighting to identify conditions.</li><li>Section hair into four quadrants using clips, part cleanly to expose scalp surface, and examine closely for inflammation, lesions, or contraindications requiring referral.</li><li>Apply selected treatment product using applicator bottle, distribute evenly across affected areas, and use fingertips to spread thin layer without oversaturating or missing spots.</li><li>Perform rotary massage using fingertip pads in circular motions, apply gentle pressure moving from hairline to crown, stimulate circulation for three to five minutes.</li><li>Allow product to process according to manufacturer instructions, typically five to fifteen minutes, monitor client comfort, and check for adverse reactions during processing time.</li><li>Rinse thoroughly with lukewarm water, ensure complete product removal from scalp and hair, and apply appropriate conditioner to hair lengths avoiding scalp if necessary.</li><li>Towel dry gently by patting rather than rubbing, examine scalp post-treatment for immediate results, and document condition plus products used in client record.</li><li>Provide homecare recommendations including product suggestions, treatment frequency, and advise client to schedule follow-up appointment to monitor progress and adjust protocol.</li></ol><h2>Safety</h2><p>All tools contacting the scalp must be disinfected using EPA-registered hospital-grade disinfectant such as Barbicide solution mixed at proper concentration, with minimum ten-minute immersion time. <strong>Do NOT apply scalp treatments if client presents with open wounds, active infections, severe inflammation, or undiagnosed lesions, as application can spread pathogens, worsen condition, cause intense pain, and create liability for practicing outside scope by treating medical conditions requiring physician care.</strong> Always perform patch test twenty-four hours prior when using new products on sensitive clients.</p><h2>Failure Mode and Recovery</h2><p>If client experiences burning sensation during treatment, the cause is typically product sensitivity or overly concentrated formula on compromised scalp barrier. Immediately rinse product completely using cool water, apply soothing aloe vera gel or chamomile compress, document incident in client record, and apply cold compress if redness persists. Offer complimentary gentle shampoo service the following week. Never reapply the same product. Always conduct patch testing for future visits and select hypoallergenic alternatives formulated for sensitive scalp conditions.</p><h2>Visual Cues</h2><p>Position client reclined at forty-five degree angle at shampoo bowl with neck comfortably supported on basin edge, ensuring proper alignment without strain. Part hair in clean, straight lines creating quarter-inch subsections that expose scalp clearly. Apply treatment in thin, visible layer resembling light glaze rather than thick paste. During massage, fingertips should maintain contact moving in consistent circles approximately one-inch diameter. Scalp should appear slightly pink from stimulation but never red or irritated. Product distribution should be even with no pooling or dry patches visible through magnification.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-38-q1",
                              "question": "What is the primary purpose of performing scalp treatments in a barbershop setting?",
                              "options": [
                                        "A. To diagnose and cure medical scalp diseases",
                                        "B. To address common conditions like dryness, oiliness, and dandruff while promoting scalp health",
                                        "C. To replace the need for dermatological consultation",
                                        "D. To eliminate the need for regular shampooing"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Scalp treatments in barbering address common non-medical conditions to improve comfort and hair health. Barbers do not diagnose or treat medical conditions, which require physician care."
                    },
                    {
                              "id": "barber-lesson-38-q2",
                              "question": "Which massage motion is recommended during scalp treatment application?",
                              "options": [
                                        "A. Linear strokes from front to back only",
                                        "B. Rotary circular motions using fingertip pads with gentle pressure",
                                        "C. Vigorous rubbing with palm of hand",
                                        "D. Tapping motions with fingernails"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Rotary circular motions with fingertip pads provide effective stimulation, promote circulation, and distribute product evenly without causing irritation or discomfort to the client."
                    },
                    {
                              "id": "barber-lesson-38-q3",
                              "question": "What is the minimum immersion time for disinfecting scalp treatment tools in Barbicide solution?",
                              "options": [
                                        "A. Ten minutes",
                                        "B. Five minutes",
                                        "C. Twenty minutes",
                                        "D. Three minutes"
                              ],
                              "correctAnswer": 0,
                              "explanation": "EPA-registered disinfectants like Barbicide require a minimum ten-minute immersion time at proper dilution to effectively eliminate pathogens and ensure client safety."
                    },
                    {
                              "id": "barber-lesson-38-q4",
                              "question": "SCENARIO: A client arrives complaining of itchy scalp with visible white flakes throughout the hair. What is the appropriate treatment approach?",
                              "options": [
                                        "A. Apply heavy conditioning oil and wrap in hot towel",
                                        "B. Refuse service and refer to dermatologist immediately",
                                        "C. Select anti-dandruff treatment with zinc pyrithione, apply to affected areas, and process for five to seven minutes",
                                        "D. Use clarifying shampoo only without additional treatment"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Visible flaking with itching indicates dandruff, a common non-medical condition. Anti-dandruff treatments containing zinc pyrithione are appropriate for barbershop application with proper processing time."
                    },
                    {
                              "id": "barber-lesson-38-q5",
                              "question": "SCENARIO: During application, your client suddenly complains of burning sensation on the scalp. What is the correct immediate response?",
                              "options": [
                                        "A. Tell client it is normal and continue with treatment",
                                        "B. Immediately rinse product completely with cool water and apply soothing gel",
                                        "C. Reduce processing time by half and then rinse",
                                        "D. Apply more product to dilute the concentration"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Burning indicates sensitivity or adverse reaction requiring immediate cessation. Complete rinsing with cool water removes the irritant, and soothing gel provides relief. Document the incident and avoid the product in future services."
                    }
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
          content: `<h2>Overview</h2><p>This checkpoint validates comprehensive understanding of chemical services in barbering, including permanent waves, chemical relaxers, and texture modifications. Mastery requires knowledge of product chemistry, scalp analysis, timing protocols, neutralization procedures, and corrective techniques. You must demonstrate ability to assess client suitability, execute services safely, recognize processing stages, and troubleshoot complications. Chemical services demand precision, attention to detail, and strict adherence to manufacturer instructions and safety protocols to protect client health and achieve desired results.</p><h2>Tools Required</h2><ul><li>Chemical relaxer or perm solution with appropriate strength for hair type and desired result</li><li>Neutralizer or neutralizing shampoo specifically formulated to halt chemical processing and restore pH balance</li><li>Protective gloves, cape, and towels to prevent chemical contact with skin and clothing</li><li>Applicator bottles or brushes designed for precise product application and sectioning control</li><li>Timer with audible alarm to ensure accurate processing duration and prevent over-processing damage</li><li>Clarifying shampoo and deep conditioning treatment for pre-service preparation and post-service restoration</li><li>Plastic sectioning clips, tail comb, and wide-tooth comb for controlled application patterns</li></ul><h2>Client Assessment Decision Points</h2><p>IF the client has fine, color-treated hair, THEN select a mild-strength chemical formula, reduce processing time by 20-30 percent, and perform a test strand to assess porosity and potential breakage before full application. IF the client has coarse, resistant virgin hair, THEN use regular or super-strength formula with full recommended processing time and ensure complete saturation through all hair layers for uniform results. IF scalp shows irritation, abrasions, or recent chemical services within six weeks, THEN postpone service and reschedule after healing or waiting period.</p><h2>Procedure</h2><ol><li>Perform thorough consultation and scalp analysis, documenting previous chemical services, examining hair texture, porosity, and elasticity to determine appropriate product strength.</li><li>Drape client with chemical-safe cape and towels, apply protective barrier cream around hairline and ears to prevent skin irritation from chemical contact.</li><li>Section hair systematically into four quadrants, then subdivide into workable sections no larger than one-half inch for complete product saturation and control.</li><li>Apply chemical product beginning at most resistant areas first, maintaining consistent one-quarter inch distance from scalp, working quickly for even processing throughout.</li><li>Monitor processing continuously, checking texture and curl pattern development every three to five minutes, performing strand tests to assess chemical action progress.</li><li>Rinse thoroughly with lukewarm water for minimum five minutes until water runs clear, gently squeezing sections without tangling or manipulating hair structure.</li><li>Apply neutralizer according to manufacturer directions, timing precisely to re-bond disulfide bonds and lock in new hair configuration permanently.</li><li>Rinse neutralizer completely, apply pH-balancing conditioner, towel-dry gently, and provide aftercare instructions including twenty-four hour water avoidance and specialized product recommendations.</li></ol><h2>Safety</h2><p>All chemical services require EPA-registered hospital-grade disinfectant such as Barbicide solution for implements, with ten-minute immersion time before reuse. <strong>Do NOT apply chemical relaxers or perms over hair previously treated with metallic dyes or incompatible chemicals, as this causes severe breakage, heat generation, smoking, and potential scalp burns requiring emergency medical intervention.</strong> Always wear nitrile gloves during application and perform patch tests twenty-four to forty-eight hours before service on clients with sensitivity history. If chemical enters eyes, flush immediately with water for fifteen minutes and seek medical attention.</p><h2>Visual Cues</h2><p>Observe cream consistency during application, maintaining smooth, even coating without gaps or heavy buildup that indicates improper saturation patterns. Hair should appear uniformly dampened and darkened by product throughout all sections with visible sheen under lighting. During processing, properly softened hair exhibits smooth texture when strand is gently pressed, while under-processed hair feels rough or resistant. Over-processing shows excessive limpness, stretching without return, or webbing appearance when fingers spread through strands. Neutralizer foam should be bright white and evenly distributed, turning slightly cream-colored as oxidation occurs, indicating proper chemical bonding throughout molecular structure.</p><h2>Failure Mode and Recovery</h2><p>If hair becomes over-processed showing extreme elasticity, breakage, or gummy texture, immediately rinse all chemical product with cool water for ten minutes to halt processing. First, apply concentrated protein treatment to temporarily strengthen compromised bonds and reduce further damage. Second, follow with deep moisturizing conditioner to restore flexibility and prevent britttle fracture. Third, trim visibly compromised ends to remove weakest sections. Fourth, instruct client to avoid all heat styling for two weeks. Fifth, schedule follow-up conditioning treatments weekly for one month to rebuild internal structure progressively.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-6-checkpoint-q1",
                              "question": "What is the primary purpose of neutralizer in chemical texture services?",
                              "options": [
                                        "A. To re-bond disulfide bonds and permanently lock in the new hair configuration",
                                        "B. To remove excess chemical product from the hair shaft",
                                        "C. To add moisture and shine to chemically processed hair",
                                        "D. To lower the pH level before shampooing"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Neutralizer re-bonds the disulfide bonds that were broken during chemical processing, permanently fixing the new curl or straightening pattern. This oxidation process is essential to stabilize the hair structure."
                    },
                    {
                              "id": "barber-module-6-checkpoint-q2",
                              "question": "When applying chemical relaxer, where should application begin?",
                              "options": [
                                        "A. At the scalp working outward to the ends",
                                        "B. At the most resistant areas first, maintaining quarter-inch distance from scalp",
                                        "C. At the hairline moving toward the crown",
                                        "D. At previously relaxed areas to ensure even processing"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Application begins at the most resistant areas first while maintaining a quarter-inch distance from the scalp to prevent burns. This ensures even processing throughout and protects sensitive scalp tissue."
                    },
                    {
                              "id": "barber-module-6-checkpoint-q3",
                              "question": "How long should implements be immersed in Barbicide solution for proper disinfection?",
                              "options": [
                                        "A. Ten minutes minimum for hospital-grade disinfection",
                                        "B. Three minutes for quick turnaround between clients",
                                        "C. Thirty minutes for complete sterilization",
                                        "D. Five minutes for adequate cleaning"
                              ],
                              "correctAnswer": 0,
                              "explanation": "EPA-registered hospital-grade disinfectants like Barbicide require a minimum ten-minute immersion time to effectively kill pathogens and meet professional sanitation standards."
                    },
                    {
                              "id": "barber-module-6-checkpoint-q4",
                              "question": "SCENARIO: A client arrives requesting a relaxer service. During consultation, you notice her scalp has several small scratches and irritated areas. What do you do?",
                              "options": [
                                        "A. Apply extra barrier cream to the irritated areas and proceed carefully",
                                        "B. Use a milder formula and reduce processing time",
                                        "C. Postpone the service and reschedule after the scalp has healed completely",
                                        "D. Perform a strand test first to check for adverse reactions"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Chemical services must never be performed on broken, irritated, or abraded skin as chemicals will cause severe burning, pain, and potential scarring. The service must be postponed until complete healing occurs."
                    },
                    {
                              "id": "barber-module-6-checkpoint-q5",
                              "question": "SCENARIO: During processing, you perform a strand test and notice the hair stretches excessively without returning and feels gummy. Correct response?",
                              "options": [
                                        "A. Continue processing but check again in two minutes",
                                        "B. Immediately rinse with cool water, then apply protein treatment followed by deep conditioner",
                                        "C. Apply neutralizer immediately to stop the chemical action",
                                        "D. Add more product to ensure complete processing"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Excessive stretching and gummy texture indicate over-processing. Immediate cool water rinsing halts chemical action, followed by protein treatment to strengthen bonds and deep conditioning to restore moisture and prevent breakage."
                    }
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
          videoFile: '/videos/barber-lessons/barber-apprenticeship-intro.mp4',
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
