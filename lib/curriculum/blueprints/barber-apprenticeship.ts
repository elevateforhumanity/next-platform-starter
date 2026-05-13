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
