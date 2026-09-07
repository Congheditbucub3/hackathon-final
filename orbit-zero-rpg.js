(() => {
  'use strict';

  const SCHEMA_VERSION = 4;
  const ACTIVE_USER_KEY = 'orbitzero:active-user';
  const PROFILE_PREFIX = 'orbitzero:profile:';
  const WORLD = { width: 1600, height: 1000, viewWidth: 960, viewHeight: 600, playerRadius: 15, spawn: { x: 800, y: 500 } };
  const $ = (id) => document.getElementById(id);
  const ui = {
    avatarOptions: $('avatar-options'), colorOptions: $('color-options'), avatarPreview: $('avatar-preview'),
    avatarName: $('avatar-name'), avatarAura: $('avatar-aura'), userId: $('user-id'), accountStatus: $('account-status'),
    returningUser: $('returning-user'), start: $('start-button'), resume: $('resume-profile'),
    profileFields: $('profile-fields'), profileCountry: $('profile-country'), profileStage: $('profile-stage'),
    profileAcademicBand: $('profile-academic-band'), profileTime: $('profile-time'), profileBudget: $('profile-budget'),
    profileLocation: $('profile-location'), profileUrgency: $('profile-urgency'), profileContinue: $('profile-continue'),
    profileStatus: $('profile-status'), customizationPanel: $('customization-panel'), editProfile: $('edit-profile'),
    missionCount: $('mission-count'), collisionCount: $('collision-count'), activeMission: $('active-mission'),
    missionList: $('mission-list'), worldTip: $('world-tip'), prompt: $('interaction-prompt'), promptText: $('interaction-text'),
    miniAvatar: $('mini-avatar'), miniName: $('mini-name'), playerId: $('player-id-display'),
    viewProfile: $('view-profile'), modalLayer: $('modal-layer'), toast: $('toast'), canvas: $('world-canvas'),
    resultLede: $('result-lede'), puzzleStat: $('puzzle-stat'), resetStat: $('reset-stat'), idStat: $('id-stat'),
    careerList: $('career-list'), profileJson: $('profile-json'), aiPathwayPanel: $('ai-pathway-panel'),
    aiPathwayStatus: $('ai-pathway-status'), aiPathwayList: $('ai-pathway-list'), aiPathwayRetry: $('ai-pathway-retry'),
    aiPathwayLoading: $('ai-pathway-loading'), aiPathwayUnavailable: $('ai-pathway-unavailable')
  };
  const ctx = ui.canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const avatars = [
    { emoji: '👾', name: 'Void Sprite' }, { emoji: '👽', name: 'Lunar Scout' },
    { emoji: '🤖', name: 'Bolt Buddy' }, { emoji: '🐙', name: 'Nebula Noodle' },
    { emoji: '🦠', name: 'Cosmic Blob' }, { emoji: '🛸', name: 'Tiny Saucer' }
  ];
  const colors = [
    { hex: '#b888f8', name: 'Starlight lilac' }, { hex: '#f58acb', name: 'Comet pink' },
    { hex: '#74e7df', name: 'Mint signal' }, { hex: '#f5c76b', name: 'Solar gold' },
    { hex: '#8b72ff', name: 'Orbit violet' }, { hex: '#ff8d8d', name: 'Coral flare' }
  ];
  const educationStages = {
    Singapore: ['Secondary', 'O-Level', 'N-Level', 'Junior College', 'A-Level', 'IB', 'Polytechnic', 'ITE', 'Undergraduate', 'Graduate'],
    'United States': ['Middle School', 'High School', 'AP/IB', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Undergraduate', 'Graduate'],
    Vietnam: ['Grade 10', 'Grade 11', 'Grade 12', 'National High School Exam preparation', 'Vocational', 'Undergraduate', 'Graduate']
  };
  const academicBands = ['Building foundations', 'Developing', 'Strong', 'Excellent'];
  const profileChoices = {
    studyTime: ['threeMonths', 'oneYear', 'twoYears', 'fourYears'],
    budget: ['low', 'medium', 'flexible'],
    location: ['home', 'city', 'remote'],
    incomeUrgency: ['needsNow', 'soon', 'flexible']
  };
  const experienceTimelineMeta = {
    computer_science_ai: [
      ['Build one small website, automation, game, or data chart.', 'A working link, repository, or short demo.', 'It shows you can turn a problem into a useful digital tool.'],
      ['Complete two projects that solve different user problems.', 'Project notes that explain the problem, choices, and result.', 'Range of work is more convincing than a single tutorial copy.'],
      ['Join a hackathon, coding club, open-source, or volunteer tech project.', 'A contribution link, teammate feedback, or event record.', 'It demonstrates collaboration and real constraints.'],
      ['Take an internship, freelance task, or real-client project when available.', 'A reference, shipped work, or anonymised project summary.', 'Employers can see how you work beyond a classroom project.'],
      ['Junior software developer, QA tester, data analyst, IT support, or AI operations assistant.', 'A focused CV plus a portfolio of your strongest work.', 'This first role builds professional habits and domain direction.']
    ],
    engineering_automation: [
      ['Model a small mechanism or build a simple Arduino-style prototype.', 'Photos, CAD files, sketches, and test notes.', 'It demonstrates practical problem-solving, not only theory.'],
      ['Improve a prototype after testing it with someone else.', 'Before-and-after designs and a short test log.', 'Iteration is a core engineering habit.'],
      ['Join robotics, maker, technical competition, or lab activities.', 'Build log, competition entry, or supervisor feedback.', 'It proves you can contribute in a technical team.'],
      ['Take a lab, maintenance, product-test, or automation placement when available.', 'A placement reference or documented technical task.', 'Industry evidence connects your skills to real systems.'],
      ['Engineering technician, junior automation engineer, product-test, or operations role.', 'A concise project portfolio and practical examples.', 'This creates a base for deeper engineering responsibility.']
    ],
    business_finance: [
      ['Make a budget, cash-flow tracker, or simple market comparison.', 'A clear spreadsheet and a one-page explanation.', 'It shows structured thinking with everyday numbers.'],
      ['Run a small project budget or take part in a case competition.', 'A spreadsheet, presentation, or team feedback.', 'It demonstrates decisions, trade-offs, and communication.'],
      ['Contribute to a student organisation, community project, or business simulation.', 'A results summary or role description.', 'It adds evidence that you can coordinate people and tasks.'],
      ['Take an operations, finance, sales, or analyst internship when available.', 'A supervisor reference or anonymised work sample.', 'It shows you can apply analysis in a real organisation.'],
      ['Operations analyst, finance assistant, business analyst, or graduate trainee.', 'A CV with spreadsheets, projects, and outcome examples.', 'This role turns your evidence into professional experience.']
    ],
    health_sciences: [
      ['Create a reliable health-information poster or science explainer.', 'A sourced one-page resource or presentation.', 'It builds evidence-reading and clear communication.'],
      ['Volunteer with an appropriate community-health or wellbeing initiative.', 'A participation record and reflective notes.', 'It demonstrates responsibility around people and information.'],
      ['Support a research, lab, science-club, or public-health project.', 'A supervisor note, poster, or project contribution.', 'It introduces careful methods and teamwork.'],
      ['Pursue a permitted placement, research assistantship, or lab-support role.', 'Placement feedback or a documented task summary.', 'Regulated roles need supervised, route-specific experience.'],
      ['Research assistant, laboratory assistant, public-health support, or route-specific entry role.', 'A focused CV with safe, supervised experience.', 'This helps you identify the health pathway you want to deepen.']
    ],
    psychology_social_work: [
      ['Create a wellbeing resource using reputable sources.', 'A short sourced guide or presentation.', 'It shows ethical communication and research awareness.'],
      ['Volunteer in a community, peer-support, or service setting with suitable supervision.', 'A role record and reflective learning notes.', 'It builds empathy, boundaries, and reliability.'],
      ['Assist with a research, survey, or community-programme project.', 'A contribution summary or supervisor feedback.', 'It demonstrates evidence gathering without overstating clinical experience.'],
      ['Seek an appropriate supervised placement or support role.', 'A placement record and professional reference.', 'Direct practice work requires careful supervision and local rules.'],
      ['Community programme assistant, research assistant, support worker, or route-specific graduate role.', 'A CV with ethical, supervised experience examples.', 'This develops real-world judgement before specialist training.']
    ],
    education_learning: [
      ['Tutor or explain one topic to a learner you know.', 'A short lesson plan and learner feedback.', 'It shows whether you can make ideas understandable.'],
      ['Create two mini lessons, activities, or learning resources.', 'Lesson samples and revision notes.', 'A small body of work demonstrates instructional thinking.'],
      ['Mentor, volunteer in a classroom, or help a learning club.', 'A role record or organiser feedback.', 'It gives experience responding to real learners.'],
      ['Take a teaching, edtech, or programme-support placement when available.', 'Placement feedback or a resource used by learners.', 'It connects your skills to real educational settings.'],
      ['Teaching assistant, learning coordinator, education programme, or edtech support role.', 'A CV with learner feedback and sample resources.', 'This is a practical base for teaching or learning-design pathways.']
    ],
    law_public_policy: [
      ['Write a short evidence-based brief about a local issue.', 'A one-page brief with sources.', 'It builds the research and reasoning used in policy work.'],
      ['Join debate, mock trial, civic research, or a policy case activity.', 'A presentation, argument outline, or feedback.', 'It develops clear argument and communication.'],
      ['Volunteer with a civic, legal-information, or community organisation where appropriate.', 'A role record and organiser feedback.', 'It shows you can work carefully with public needs.'],
      ['Take a policy, compliance, public-sector, or research placement when available.', 'A supervisor reference or anonymised writing sample.', 'It provides real context for rules, evidence, and stakeholders.'],
      ['Policy assistant, legal support, compliance assistant, or public-sector graduate role.', 'A writing portfolio and credible experience record.', 'This first role helps you choose a specialist legal or policy direction.']
    ],
    environment_energy: [
      ['Measure one home, school, or community resource-use pattern.', 'A simple audit, chart, and improvement idea.', 'It demonstrates systems thinking with real data.'],
      ['Build a small sustainability project or evidence-based campaign.', 'A project summary, photos, or data update.', 'It shows that you can move from observation to action.'],
      ['Join an environment, energy, maker, or field activity.', 'A role record, field notes, or team feedback.', 'It gives teamwork and practical context.'],
      ['Take an environmental, energy, field, or project internship when available.', 'A placement reference or documented output.', 'It connects sustainability interests to industry practice.'],
      ['Sustainability coordinator, environmental technician, energy analyst, or project assistant.', 'A CV with audits, projects, and field examples.', 'This builds experience for specialist technical or policy work.']
    ],
    agriculture_food: [
      ['Map how one food item moves from source to shelf.', 'A process map with one quality or waste observation.', 'It develops systems thinking about food and production.'],
      ['Run a small growing, food-quality, or preservation experiment safely.', 'A log, photos, and observations.', 'It builds careful documentation and practical curiosity.'],
      ['Join a food, agriculture, sustainability, or science community project.', 'A contribution record or organiser feedback.', 'It adds teamwork and a real-world food-system context.'],
      ['Take a permitted quality, lab, farm, food-tech, or operations placement.', 'A placement reference or project summary.', 'It demonstrates workplace care around quality and process.'],
      ['Quality assurance assistant, food technologist trainee, lab assistant, or operations role.', 'A CV with documented process and quality work.', 'This provides a platform for technical specialisation.']
    ],
    creative_design_media: [
      ['Redesign one screen, poster, story, or visual for a clear audience.', 'A before-and-after image with a short design note.', 'It turns taste into evidence of problem-solving.'],
      ['Complete three portfolio pieces and ask for critique.', 'A small portfolio with feedback-driven revisions.', 'A body of work shows growth and range.'],
      ['Contribute to a student publication, club, campaign, or client-style brief.', 'Published work, a credit, or team feedback.', 'It shows you can design within a real brief.'],
      ['Take an internship, freelance brief, exhibition, or real-client project.', 'A case study, client feedback, or live link.', 'Industry evidence proves you can deliver for others.'],
      ['Junior designer, content designer, production assistant, or UX research support role.', 'A concise portfolio of your best 4–6 pieces.', 'This role creates the professional portfolio that opens later opportunities.']
    ]
  };
  const signalKeys = ['analyticalThinking', 'creativeProblemFraming', 'planning', 'collaboration', 'evidenceSeeking', 'riskPreference'];
  const valueMeta = [
    { key: 'stability', icon: '▣', name: 'Stability', note: 'steady ground and predictable systems' },
    { key: 'growth', icon: '↗', name: 'Growth', note: 'learning, challenge, and possibility' },
    { key: 'creativity', icon: '✦', name: 'Creativity', note: 'making unusual things and ideas' },
    { key: 'autonomy', icon: '⌁', name: 'Autonomy', note: 'room to choose your own route' },
    { key: 'balance', icon: '◒', name: 'Balance', note: 'time, energy, and sustainable pace' },
    { key: 'socialImpact', icon: '♥', name: 'Social impact', note: 'helping people or communities' }
  ];
  const beacons = [
    { id: 'archive', title: 'Silent Archive', subtitle: 'mismatch mosaic', x: 210, y: 730, color: '#a98bff', icon: '⌁' },
    { id: 'bridge', title: 'Market Bridge', subtitle: 'ten energy blocks', x: 1335, y: 225, color: '#f5c76b', icon: '═' },
    { id: 'council', title: 'Council of Three', subtitle: 'shared city puzzle', x: 1360, y: 775, color: '#f58acb', icon: '△' },
    { id: 'vault', title: 'Career Compass Vault', subtitle: 'final calibration', x: 800, y: 500, color: '#b888f8', icon: '✦' }
  ];
  const planets = [
    { name: 'Plum Gloop', x: 475, y: 290, r: 76, color: '#5c2777', light: '#a65bd1', crater: '#31103f' },
    { name: 'The Big Grape', x: 1030, y: 215, r: 92, color: '#43215e', light: '#9c65c6', crater: '#250d36' },
    { name: 'Bloop 7', x: 1230, y: 610, r: 72, color: '#623463', light: '#d071c0', crater: '#351638' },
    { name: 'Moon Potato', x: 655, y: 825, r: 67, color: '#523668', light: '#9b7bb3', crater: '#301b45' },
    { name: 'Purple Pebble', x: 1480, y: 390, r: 48, color: '#4a285d', light: '#af70cc', crater: '#2c123a' }
  ];
  const routes = [
    { color: '#a98bff', points: [[800, 500], [620, 570], [430, 650], [210, 730]] },
    { color: '#f5c76b', points: [[800, 500], [970, 450], [1140, 330], [1335, 225]] },
    { color: '#f58acb', points: [[800, 500], [960, 610], [1130, 710], [1360, 775]] }
  ];
  const stars = Array.from({ length: 220 }, (_, index) => ({
    x: (index * 149 + (index % 7) * 23) % WORLD.width,
    y: (index * 89 + (index % 13) * 17) % WORLD.height,
    size: index % 15 === 0 ? 3 : index % 5 === 0 ? 2 : 1,
    tint: index % 9 === 0 ? '#d6a4ff' : index % 13 === 0 ? '#f5c76b' : '#f3eaff'
  }));

  const bridgeItems = [
    { key: 'anchors', name: 'Gravity anchors', note: 'keep the bridge from becoming spaghetti' },
    { key: 'rails', name: 'Safety rails', note: 'keep the shoppers on the bridge' },
    { key: 'scouts', name: 'Snail scout drones', note: 'slow, accurate, adorable' },
    { key: 'glue', name: 'Wormhole glue', note: 'very exciting; sometimes sticks to time' },
    { key: 'reserve', name: 'Emergency snacks', note: 'the crew calls this “contingency planning”' }
  ];
  const councilPolicies = [
    { id: 'safety', name: 'Safety review', note: 'test the bridge rails before launch', scores: [3, 0, 1] },
    { id: 'prototype', name: 'Open prototype', note: 'let inventors test a reversible version', scores: [0, 3, 0] },
    { id: 'community', name: 'Community seats', note: 'give local families a real vote', scores: [1, 0, 3] },
    { id: 'pilot', name: 'Small pilot', note: 'launch a tiny version, learn, then expand', scores: [1, 2, 1] },
    { id: 'charter', name: 'Shared charter', note: 'publish promises, metrics, and review dates', scores: [2, 1, 2] }
  ];

  const careers = [
    {
      id: 'computer_science_ai', icon: '⌘', title: 'Computer Science & AI',
      overview: 'Design, build, and operate software, data systems, and AI applications.',
      prep: ['Basic programming', 'Math and logic', 'Build a small project'],
      tradeoff: 'Often rewards long problem-solving sessions and continuous learning.',
      traits: { analyticalThinking: 5, creativeProblemFraming: 3, planning: 4, collaboration: 3, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 4, growth: 5, creativity: 3, autonomy: 3, balance: 3, socialImpact: 3 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['city', 'remote'], urgency: ['soon', 'flexible'] }, market: 0.84
    },
    {
      id: 'engineering_automation', icon: '⚙', title: 'Engineering, Mechanics & Automation',
      overview: 'Design and improve machinery, robotics, equipment, and manufacturing systems.',
      prep: ['Math and physics', 'Technical sketches', 'Robotics or IoT projects'],
      tradeoff: 'Hands-on paths can require equipment access or location flexibility.',
      traits: { analyticalThinking: 5, creativeProblemFraming: 3, planning: 4, collaboration: 3, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 4, growth: 4, creativity: 3, autonomy: 3, balance: 3, socialImpact: 3 },
      constraints: { time: ['twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['soon', 'flexible'] }, market: 0.78
    },
    {
      id: 'business_finance', icon: '◈', title: 'Business, Finance & Commerce',
      overview: 'Manage resources, understand organizations, and make well-framed decisions.',
      prep: ['Spreadsheets', 'Data-driven thinking', 'Market awareness'],
      tradeoff: 'The work can be deadline-heavy and often values careful communication.',
      traits: { analyticalThinking: 4, creativeProblemFraming: 3, planning: 5, collaboration: 4, evidenceSeeking: 4, riskPreference: 3 },
      values: { stability: 4, growth: 4, creativity: 2, autonomy: 3, balance: 3, socialImpact: 2 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['low', 'medium', 'flexible'], location: ['city', 'remote'], urgency: ['needsNow', 'soon', 'flexible'] }, market: 0.76
    },
    {
      id: 'health_sciences', icon: '✚', title: 'Health Sciences',
      overview: 'Support healthcare, prevention, treatment, and patient-focused systems.',
      prep: ['Biology and chemistry', 'Patience', 'Evidence-based habits'],
      tradeoff: 'Many roles have structured training routes and location-specific placements.',
      traits: { analyticalThinking: 4, creativeProblemFraming: 2, planning: 4, collaboration: 5, evidenceSeeking: 5, riskPreference: 1 },
      values: { stability: 4, growth: 4, creativity: 2, autonomy: 2, balance: 2, socialImpact: 5 },
      constraints: { time: ['twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['flexible'] }, market: 0.81
    },
    {
      id: 'psychology_social_work', icon: '☍', title: 'Psychology & Social Work',
      overview: 'Study human behavior and support individuals, groups, and communities.',
      prep: ['Active listening', 'Research skills', 'Professional ethics'],
      tradeoff: 'Meaningful work can require patient, emotionally sustainable practice.',
      traits: { analyticalThinking: 3, creativeProblemFraming: 3, planning: 3, collaboration: 5, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 3, growth: 4, creativity: 3, autonomy: 3, balance: 3, socialImpact: 5 },
      constraints: { time: ['twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['soon', 'flexible'] }, market: 0.70
    },
    {
      id: 'education_learning', icon: '✎', title: 'Education & Learning',
      overview: 'Help others learn through teaching, coaching, learning design, and edtech.',
      prep: ['Communication', 'Lesson design', 'Present a concept clearly'],
      tradeoff: 'Impact comes through people, feedback cycles, and sustained preparation.',
      traits: { analyticalThinking: 3, creativeProblemFraming: 4, planning: 4, collaboration: 5, evidenceSeeking: 3, riskPreference: 2 },
      values: { stability: 4, growth: 4, creativity: 4, autonomy: 3, balance: 3, socialImpact: 5 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['low', 'medium', 'flexible'], location: ['home', 'city', 'remote'], urgency: ['soon', 'flexible'] }, market: 0.69
    },
    {
      id: 'law_public_policy', icon: '⚖', title: 'Law & Public Policy',
      overview: 'Analyze rules, protect rights, and develop policy solutions for public systems.',
      prep: ['Reading closely', 'Logical reasoning', 'Research and writing'],
      tradeoff: 'It often needs patience with complex rules and long evidence trails.',
      traits: { analyticalThinking: 5, creativeProblemFraming: 3, planning: 4, collaboration: 3, evidenceSeeking: 5, riskPreference: 1 },
      values: { stability: 4, growth: 4, creativity: 2, autonomy: 3, balance: 3, socialImpact: 4 },
      constraints: { time: ['twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['city', 'remote'], urgency: ['flexible'] }, market: 0.66
    },
    {
      id: 'environment_energy', icon: '♲', title: 'Environment & Energy',
      overview: 'Solve problems around climate, resources, renewable energy, and sustainability.',
      prep: ['Natural sciences', 'Data analysis', 'A local sustainability project'],
      tradeoff: 'Routes can combine fieldwork, systems thinking, and long-term impact.',
      traits: { analyticalThinking: 4, creativeProblemFraming: 4, planning: 4, collaboration: 4, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 3, growth: 4, creativity: 3, autonomy: 3, balance: 3, socialImpact: 5 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['soon', 'flexible'] }, market: 0.73
    },
    {
      id: 'agriculture_food', icon: '☘', title: 'Agriculture & Food Technology',
      overview: 'Develop better food systems, modern agriculture, and biotechnology.',
      prep: ['Biology and chemistry', 'Practical experiments', 'Process thinking'],
      tradeoff: 'Some roles are practical or site-based rather than fully remote.',
      traits: { analyticalThinking: 4, creativeProblemFraming: 3, planning: 4, collaboration: 3, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 3, growth: 4, creativity: 3, autonomy: 3, balance: 3, socialImpact: 4 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['soon', 'flexible'] }, market: 0.67
    },
    {
      id: 'creative_design_media', icon: '✦', title: 'Creative Design & Media',
      overview: 'Create visuals, experiences, stories, and media products people can use.',
      prep: ['A small portfolio', 'Visual practice', 'Learn from feedback'],
      tradeoff: 'It can offer autonomy, while asking for visible work samples and iteration.',
      traits: { analyticalThinking: 2, creativeProblemFraming: 5, planning: 3, collaboration: 4, evidenceSeeking: 2, riskPreference: 4 },
      values: { stability: 2, growth: 4, creativity: 5, autonomy: 4, balance: 3, socialImpact: 3 },
      constraints: { time: ['threeMonths', 'oneYear', 'twoYears'], budget: ['low', 'medium', 'flexible'], location: ['city', 'remote'], urgency: ['needsNow', 'soon', 'flexible'] }, market: 0.71
    }
  ];

  let state = null;
  let draft = { avatarId: 0, color: colors[0].hex };
  let mode = 'welcome';
  let modal = null;
  let priorFocus = null;
  let pressed = new Set();
  let camera = { x: 0, y: 0 };
  let lastFrame = 0;
  let worldTime = 0;
  let lastMoveSave = 0;
  let collisionCooldown = 0;
  let collisionFlash = 0;
  let toastTimer = 0;
  let aiRequestInFlight = false;
  let aiRequestSequence = 0;

  function emptyLearnerProfile() {
    return { country: '', educationStage: '', academicBand: '', studyTime: '', budget: '', location: '', incomeUrgency: '' };
  }
  function normalizeLearnerProfile(value) {
    const raw = isRecord(value) ? value : {};
    const country = Object.prototype.hasOwnProperty.call(educationStages, raw.country) ? raw.country : '';
    const stages = country ? educationStages[country] : [];
    return {
      country: country,
      educationStage: stages.includes(raw.educationStage) ? raw.educationStage : '',
      academicBand: academicBands.includes(raw.academicBand) ? raw.academicBand : '',
      studyTime: profileChoices.studyTime.includes(raw.studyTime) ? raw.studyTime : '',
      budget: profileChoices.budget.includes(raw.budget) ? raw.budget : '',
      location: profileChoices.location.includes(raw.location) ? raw.location : '',
      incomeUrgency: profileChoices.incomeUrgency.includes(raw.incomeUrgency) ? raw.incomeUrgency : ''
    };
  }
  function learnerProfileComplete(profile) {
    const clean = normalizeLearnerProfile(profile);
    return Boolean(clean.country && clean.educationStage && clean.academicBand && clean.studyTime && clean.budget && clean.location && clean.incomeUrgency);
  }
  function learnerConstraints(profile) {
    const clean = normalizeLearnerProfile(profile);
    return { time: clean.studyTime || null, budget: clean.budget || null, location: clean.location || null, urgency: clean.incomeUrgency || null };
  }
  function freshState(userId, learnerProfile = emptyLearnerProfile()) {
    const cleanProfile = normalizeLearnerProfile(learnerProfile);
    return {
      schemaVersion: SCHEMA_VERSION,
      user: { id: userId, createdAt: new Date().toISOString(), lastPlayedAt: new Date().toISOString() },
      learnerProfile: cleanProfile,
      avatar: { id: 0, color: colors[0].hex },
      player: { x: WORLD.spawn.x, y: WORLD.spawn.y, checkpoint: 'Orbit Zero Hub' },
      progress: { archive: false, bridge: false, council: false, vault: false },
      answers: {
        archive: { opening: null, mosaicSolved: false, mosaicMoves: 0, priority: null, priorityCorrect: false },
        bridge: { opening: null, allocation: { anchors: 0, rails: 0, scouts: 0, glue: 0, reserve: 0 }, guardrail: null, guardrailCorrect: false },
        council: { opening: null, policies: [], boardSolved: false, outcome: null },
        values: { stability: 0, growth: 0, creativity: 0, autonomy: 0, balance: 0, socialImpact: 0 },
        constraints: learnerConstraints(cleanProfile)
      },
      signals: { analyticalThinking: 0.4, creativeProblemFraming: 0.4, planning: 0.4, collaboration: 0.4, evidenceSeeking: 0.4, riskPreference: 0.4 },
      collisionCount: 0,
      results: null
    };
  }

  function isRecord(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function normalNumber(value, fallback, low, high) {
    return typeof value === 'number' && Number.isFinite(value) ? clamp(value, low, high) : fallback;
  }
  function normalizeId(value) {
    return String(value || '').trim().toLowerCase().split(' ').join('-').replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  }
  function profileKey(userId) { return PROFILE_PREFIX + normalizeId(userId); }
  function currentAvatar() {
    const selected = state ? state.avatar : draft;
    return avatars[clamp(Number(selected.id || selected.avatarId || 0), 0, avatars.length - 1)];
  }
  function currentColor() {
    const selected = state ? state.avatar : draft;
    return colors.some((color) => color.hex === selected.color) ? selected.color : colors[0].hex;
  }

  function hydrateProfile(raw, userId) {
    const base = freshState(userId);
    if (!isRecord(raw) || ![3, SCHEMA_VERSION].includes(Number(raw.schemaVersion))) return base;
    const answers = isRecord(raw.answers) ? raw.answers : {};
    const avatarId = Number(raw.avatar && raw.avatar.id);
    const safeColor = raw.avatar && colors.some((color) => color.hex === raw.avatar.color) ? raw.avatar.color : base.avatar.color;
    const profile = {
      ...base,
      user: { ...base.user, ...(isRecord(raw.user) ? raw.user : {}), id: userId },
      learnerProfile: normalizeLearnerProfile(raw.learnerProfile),
      avatar: { id: Number.isInteger(avatarId) && avatarId >= 0 && avatarId < avatars.length ? avatarId : 0, color: safeColor },
      player: { ...base.player, ...(isRecord(raw.player) ? raw.player : {}) },
      progress: { ...base.progress, ...(isRecord(raw.progress) ? raw.progress : {}) },
      answers: {
        archive: { ...base.answers.archive, ...(isRecord(answers.archive) ? answers.archive : {}) },
        bridge: { ...base.answers.bridge, ...(isRecord(answers.bridge) ? answers.bridge : {}) },
        council: { ...base.answers.council, ...(isRecord(answers.council) ? answers.council : {}) },
        values: { ...base.answers.values, ...(isRecord(answers.values) ? answers.values : {}) },
        constraints: { ...base.answers.constraints, ...(isRecord(answers.constraints) ? answers.constraints : {}) }
      },
      signals: { ...base.signals, ...(isRecord(raw.signals) ? raw.signals : {}) },
      collisionCount: normalNumber(raw.collisionCount, 0, 0, 9999),
      results: isRecord(raw.results) && Array.isArray(raw.results.recommendations) ? raw.results : null
    };
    profile.player.x = normalNumber(profile.player.x, WORLD.spawn.x, WORLD.playerRadius, WORLD.width - WORLD.playerRadius);
    profile.player.y = normalNumber(profile.player.y, WORLD.spawn.y, WORLD.playerRadius, WORLD.height - WORLD.playerRadius);
    if (!isRecord(profile.answers.bridge.allocation)) profile.answers.bridge.allocation = { ...base.answers.bridge.allocation };
    if (!isRecord(profile.answers.values)) profile.answers.values = { ...base.answers.values };
    if (!isRecord(profile.answers.constraints)) profile.answers.constraints = { ...base.answers.constraints };
    if (learnerProfileComplete(profile.learnerProfile)) {
      const seededConstraints = learnerConstraints(profile.learnerProfile);
      Object.keys(seededConstraints).forEach((key) => {
        if (!profile.answers.constraints[key]) profile.answers.constraints[key] = seededConstraints[key];
      });
    }
    signalKeys.forEach((key) => { profile.signals[key] = normalNumber(profile.signals[key], 0.4, 0, 1); });
    valueMeta.forEach((item) => { profile.answers.values[item.key] = normalNumber(profile.answers.values[item.key], 0, 0, 10); });
    bridgeItems.forEach((item) => { profile.answers.bridge.allocation[item.key] = normalNumber(profile.answers.bridge.allocation[item.key], 0, 0, 10); });
    if (!Array.isArray(profile.answers.council.policies)) profile.answers.council.policies = [];
    profile.answers.council.policies = profile.answers.council.policies.filter((id) => councilPolicies.some((policy) => policy.id === id)).slice(0, 3);
    return profile;
  }

  function readProfile(userId) {
    if (!userId) return null;
    try {
      const stored = localStorage.getItem(profileKey(userId));
      return stored ? hydrateProfile(JSON.parse(stored), userId) : null;
    } catch (_) {
      return null;
    }
  }
  function saveState() {
    if (!state) return;
    state.user.lastPlayedAt = new Date().toISOString();
    try {
      localStorage.setItem(profileKey(state.user.id), JSON.stringify(state));
      localStorage.setItem(ACTIVE_USER_KEY, state.user.id);
    } catch (_) {
      toast('This browser would not save the profile. You can still play this session.');
    }
  }
  function readActiveUserId() {
    try {
      return normalizeId(localStorage.getItem(ACTIVE_USER_KEY) || '');
    } catch (_) {
      return '';
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }
  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.toast.classList.remove('show'), 2800);
  }
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === screenId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function allMissionsComplete() {
    return Boolean(state && state.progress.archive && state.progress.bridge && state.progress.council);
  }
  function missionTotal() {
    return state ? ['archive', 'bridge', 'council'].filter((id) => state.progress[id]).length : 0;
  }
  function nudge(signal, amount) {
    state.signals[signal] = clamp((state.signals[signal] || 0.4) + amount, 0, 1);
  }

  function renderEducationStages(country, selectedStage) {
    if (!ui.profileStage) return;
    const stages = educationStages[country] || [];
    ui.profileStage.disabled = !stages.length;
    ui.profileStage.innerHTML = '<option value="">' + (stages.length ? 'Choose your current stage' : 'Choose a country first') + '</option>' + stages.map((stage) => '<option value="' + escapeHtml(stage) + '">' + escapeHtml(stage) + '</option>').join('');
    ui.profileStage.value = stages.includes(selectedStage) ? selectedStage : '';
  }
  function readLearnerProfileForm() {
    return normalizeLearnerProfile({
      country: ui.profileCountry.value,
      educationStage: ui.profileStage.value,
      academicBand: ui.profileAcademicBand.value,
      studyTime: ui.profileTime.value,
      budget: ui.profileBudget.value,
      location: ui.profileLocation.value,
      incomeUrgency: ui.profileUrgency.value
    });
  }
  function populateLearnerProfile(profile) {
    const clean = normalizeLearnerProfile(profile);
    ui.profileCountry.value = clean.country;
    renderEducationStages(clean.country, clean.educationStage);
    ui.profileAcademicBand.value = clean.academicBand;
    ui.profileTime.value = clean.studyTime;
    ui.profileBudget.value = clean.budget;
    ui.profileLocation.value = clean.location;
    ui.profileUrgency.value = clean.incomeUrgency;
    updateProfileStatus();
  }
  function updateProfileStatus() {
    if (!ui.profileStatus) return;
    const profile = readLearnerProfileForm();
    if (learnerProfileComplete(profile)) {
      ui.profileStatus.textContent = 'Coordinates complete. Your character creator is ready.';
      ui.profileStatus.dataset.state = 'success';
      return;
    }
    ui.profileStatus.textContent = 'Choose your coordinates before entering the character creator.';
    ui.profileStatus.dataset.state = '';
  }
  function showProfileFields(message) {
    if (ui.profileFields) ui.profileFields.hidden = false;
    if (ui.customizationPanel) ui.customizationPanel.hidden = true;
    if (ui.profileStatus && message) {
      ui.profileStatus.textContent = message;
      ui.profileStatus.dataset.state = 'error';
    } else {
      updateProfileStatus();
    }
  }
  function showCharacterCreator() {
    if (ui.profileFields) ui.profileFields.hidden = true;
    if (ui.customizationPanel) ui.customizationPanel.hidden = false;
    renderCustomization();
  }
  function commitStartProfile() {
    const userId = normalizeId(ui.userId.value);
    const profile = readLearnerProfileForm();
    if (!userId) {
      showProfileFields('Choose a short navigator user_id first.');
      ui.userId.focus();
      return;
    }
    if (!learnerProfileComplete(profile)) {
      showProfileFields('Complete every coordinate before entering the character creator.');
      const firstEmpty = [ui.profileCountry, ui.profileStage, ui.profileAcademicBand, ui.profileTime, ui.profileBudget, ui.profileLocation, ui.profileUrgency].find((field) => !field.value);
      if (firstEmpty) firstEmpty.focus();
      return;
    }
    ui.userId.value = userId;
    const saved = readProfile(userId);
    const priorProfile = saved ? normalizeLearnerProfile(saved.learnerProfile) : emptyLearnerProfile();
    state = saved || freshState(userId, profile);
    state.learnerProfile = profile;
    state.answers.constraints = { ...state.answers.constraints, ...learnerConstraints(profile) };
    if (JSON.stringify(priorProfile) !== JSON.stringify(profile) && state.progress.vault) {
      aiRequestSequence += 1;
      aiRequestInFlight = false;
      state.progress.vault = false;
      state.results = null;
      toast('Coordinates updated. Visit the Career Compass Vault again to recalculate your result.');
    }
    draft = { avatarId: state.avatar.id, color: state.avatar.color };
    saveState();
    updateReturningUser();
    showCharacterCreator();
  }
  function showWelcomeForCurrentState() {
    mode = 'welcome';
    closeModal(false);
    if (state) {
      ui.userId.value = state.user.id;
      draft = { avatarId: state.avatar.id, color: state.avatar.color };
      populateLearnerProfile(state.learnerProfile);
    }
    renderCustomization();
    updateReturningUser();
    showProfileFields();
    showScreen('welcome-screen');
  }

  function renderCustomization() {
    const selectedId = draft.avatarId;
    ui.avatarOptions.innerHTML = avatars.map((avatar, index) => '<button class="avatar-choice ' + (index === selectedId ? 'selected' : '') + '" type="button" data-avatar="' + index + '" aria-label="Choose ' + escapeHtml(avatar.name) + '" aria-pressed="' + (index === selectedId) + '">' + avatar.emoji + '</button>').join('');
    ui.colorOptions.innerHTML = colors.map((color) => '<button class="color-choice ' + (color.hex === draft.color ? 'selected' : '') + '" type="button" data-color="' + color.hex + '" style="--choice-color:' + color.hex + '" aria-label="Choose ' + escapeHtml(color.name) + ' glow" aria-pressed="' + (color.hex === draft.color) + '"><span class="sr-only">' + escapeHtml(color.name) + '</span></button>').join('');
    applyAvatarVisuals(false);
  }
  function applyAvatarVisuals(includeGame) {
    const selected = includeGame && state ? state.avatar : { id: draft.avatarId, color: draft.color };
    const avatar = avatars[clamp(Number(selected.id), 0, avatars.length - 1)];
    const color = colors.some((item) => item.hex === selected.color) ? selected.color : colors[0].hex;
    ui.avatarPreview.textContent = avatar.emoji;
    ui.avatarName.textContent = avatar.name;
    ui.avatarAura.style.setProperty('--avatar-color', color);
    if (includeGame && state) {
      ui.miniAvatar.textContent = avatar.emoji;
      ui.miniName.textContent = avatar.name;
      ui.playerId.textContent = state.user.id;
    }
  }
  function updateReturningUser() {
    const userId = normalizeId(ui.userId.value);
    const saved = readProfile(userId);
    if (!saved) {
      ui.accountStatus.textContent = 'NEW SIGNAL';
      ui.returningUser.hidden = true;
      ui.resume.hidden = true;
      return;
    }
    draft = { avatarId: saved.avatar.id, color: saved.avatar.color };
    if (learnerProfileComplete(saved.learnerProfile)) populateLearnerProfile(saved.learnerProfile);
    renderCustomization();
    ui.accountStatus.textContent = saved.results ? 'PROFILE FOUND' : 'ORBIT FOUND';
    ui.returningUser.hidden = false;
    ui.returningUser.textContent = saved.results ? 'Welcome back, ' + userId + '. Your saved top-three paths are ready.' : 'Welcome back, ' + userId + '. ' + missionCountFrom(saved) + ' of 3 missions are saved.';
    ui.resume.hidden = false;
    ui.resume.textContent = saved.results ? 'VIEW SAVED PATHFINDER PROFILE' : 'CONTINUE SAVED TIMELINE';
  }
  function missionCountFrom(profile) {
    return ['archive', 'bridge', 'council'].filter((id) => profile.progress && profile.progress[id]).length;
  }
  function enterOrbit() {
    const userId = normalizeId(ui.userId.value);
    if (!userId) {
      showProfileFields('Choose a short navigator user_id first.');
      ui.userId.focus();
      return;
    }
    const profile = state && state.user.id === userId ? normalizeLearnerProfile(state.learnerProfile) : normalizeLearnerProfile(readProfile(userId) && readProfile(userId).learnerProfile);
    if (!learnerProfileComplete(profile)) {
      showProfileFields('Complete your start coordinates before entering Orbit Zero.');
      return;
    }
    ui.userId.value = userId;
    const saved = readProfile(userId);
    state = saved || freshState(userId, profile);
    state.learnerProfile = profile;
    state.answers.constraints = { ...state.answers.constraints, ...learnerConstraints(profile) };
    state.avatar = { id: draft.avatarId, color: draft.color };
    saveState();
    mode = 'world';
    closeModal(false);
    showScreen('game-screen');
    applyAvatarVisuals(true);
    updateHud();
    camera = {
      x: clamp(state.player.x - WORLD.viewWidth / 2, 0, WORLD.width - WORLD.viewWidth),
      y: clamp(state.player.y - WORLD.viewHeight / 2, 0, WORLD.height - WORLD.viewHeight)
    };
    ui.canvas.focus({ preventScroll: true });
    toast(saved ? 'Saved orbit loaded. The planets still have no patience.' : 'WASD or arrows to fly. Press E at a glowing beacon.');
  }
  function resumeSaved() {
    const userId = normalizeId(ui.userId.value);
    const saved = readProfile(userId);
    if (!saved) {
      toast('No saved signal found for that user_id.');
      return;
    }
    if (!learnerProfileComplete(saved.learnerProfile)) {
      populateLearnerProfile(saved.learnerProfile);
      showProfileFields('Add your start coordinates before resuming this earlier save.');
      return;
    }
    state = saved;
    draft = { avatarId: state.avatar.id, color: state.avatar.color };
    if (state.results) showResults();
    else enterOrbit();
  }

  function updateHud() {
    if (!state) return;
    const complete = missionTotal();
    ui.missionCount.textContent = complete + ' / 3';
    ui.collisionCount.textContent = String(state.collisionCount);
    ui.activeMission.textContent = String(Math.min(complete + 1, 3)).padStart(2, '0') + ' / 03';
    const missionMeta = [
      { id: 'archive', title: 'Silent Archive', detail: 'Solve the scrambled constellation record.' },
      { id: 'bridge', title: 'Market Bridge', detail: 'Spend exactly ten energy blocks wisely.' },
      { id: 'council', title: 'Council of Three', detail: 'Build a shared answer for strange neighbors.' }
    ];
    ui.missionList.innerHTML = missionMeta.map((mission) => {
      const done = state.progress[mission.id];
      const current = !done && mission.id === firstOpenMission();
      return '<li class="mission-item ' + (done ? 'complete' : current ? 'current' : '') + '"><span>' + (done ? '✓' : current ? '✦' : '○') + '</span><div><b>' + mission.title + '</b><small>' + (done ? 'Signal secured' : mission.detail) + '</small></div></li>';
    }).join('');
    ui.viewProfile.disabled = !state.progress.vault;
    if (allMissionsComplete() && !state.progress.vault) ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> The Career Compass Vault is unlocked at the hub.';
    else if (!state.progress.archive) ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> Follow the lilac lane west to the Silent Archive.';
    else if (!state.progress.bridge) ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> The gold lane rises toward the Market Bridge.';
    else if (!state.progress.council) ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> The pink lane bends southeast to the Council of Three.';
    else ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> Planets reset you to the hub; completed missions stay safe.';
  }
  function firstOpenMission() {
    if (!state.progress.archive) return 'archive';
    if (!state.progress.bridge) return 'bridge';
    return 'council';
  }

  function worldToCanvas(x, y) { return { x: x - camera.x, y: y - camera.y }; }
  function inView(x, y, pad) {
    const extra = pad || 120;
    return x >= camera.x - extra && x <= camera.x + WORLD.viewWidth + extra && y >= camera.y - extra && y <= camera.y + WORLD.viewHeight + extra;
  }
  function pointHitsPlanet(x, y) {
    return planets.some((planet) => Math.hypot(x - planet.x, y - planet.y) < planet.r + WORLD.playerRadius - 2);
  }
  function nearestBeacon() {
    if (!state) return null;
    let closest = null;
    beacons.forEach((beacon) => {
      const distance = Math.hypot(state.player.x - beacon.x, state.player.y - beacon.y);
      if (distance < 65 && (!closest || distance < closest.distance)) closest = { ...beacon, distance };
    });
    return closest;
  }
  function updatePrompt() {
    const beacon = nearestBeacon();
    if (!beacon) {
      ui.prompt.hidden = true;
      return;
    }
    ui.prompt.hidden = false;
    if (beacon.id === 'vault' && !allMissionsComplete()) ui.promptText.textContent = 'Vault needs 3 secured signals';
    else if (beacon.id === 'vault' && state.progress.vault) ui.promptText.textContent = 'Open saved Pathfinder Profile';
    else if (state.progress[beacon.id]) ui.promptText.textContent = 'Replay transmission';
    else ui.promptText.textContent = 'Start ' + beacon.title;
  }
  function crashToHub() {
    if (collisionCooldown > 0 || !state) return;
    collisionCooldown = 800;
    collisionFlash = 1;
    state.player.x = WORLD.spawn.x;
    state.player.y = WORLD.spawn.y;
    state.player.checkpoint = 'Orbit Zero Hub';
    state.collisionCount += 1;
    saveState();
    updateHud();
    toast('Planet bonk! You warped safely back to Orbit Zero Hub.');
  }
  function updateWorld(delta) {
    if (!state || mode !== 'world' || modal) return;
    collisionCooldown = Math.max(0, collisionCooldown - delta * 1000);
    collisionFlash = Math.max(0, collisionFlash - delta * 2.7);
    let dx = 0;
    let dy = 0;
    if (pressed.has('w') || pressed.has('arrowup')) dy -= 1;
    if (pressed.has('s') || pressed.has('arrowdown')) dy += 1;
    if (pressed.has('a') || pressed.has('arrowleft')) dx -= 1;
    if (pressed.has('d') || pressed.has('arrowright')) dx += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      const speed = 185;
      const nextX = clamp(state.player.x + (dx / length) * speed * delta, WORLD.playerRadius, WORLD.width - WORLD.playerRadius);
      const nextY = clamp(state.player.y + (dy / length) * speed * delta, WORLD.playerRadius, WORLD.height - WORLD.playerRadius);
      if (pointHitsPlanet(nextX, nextY)) crashToHub();
      else {
        state.player.x = nextX;
        state.player.y = nextY;
        if (worldTime - lastMoveSave > 1200) {
          saveState();
          lastMoveSave = worldTime;
        }
      }
    }
    camera.x = clamp(state.player.x - WORLD.viewWidth / 2, 0, WORLD.width - WORLD.viewWidth);
    camera.y = clamp(state.player.y - WORLD.viewHeight / 2, 0, WORLD.height - WORLD.viewHeight);
    updatePrompt();
  }
  function drawWorld() {
    if (!state || mode !== 'world') return;
    ctx.clearRect(0, 0, WORLD.viewWidth, WORLD.viewHeight);
    ctx.fillStyle = '#0b0510';
    ctx.fillRect(0, 0, WORLD.viewWidth, WORLD.viewHeight);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    drawNebula();
    stars.forEach((star) => {
      if (!inView(star.x, star.y, 5)) return;
      const flicker = Math.floor(worldTime / 260 + star.x) % 5 === 0;
      ctx.fillStyle = star.tint;
      ctx.globalAlpha = flicker ? 0.95 : 0.48;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;
    routes.forEach(drawRoute);
    drawHub();
    planets.forEach(drawPlanet);
    beacons.forEach(drawBeacon);
    drawPlayer();
    ctx.restore();
    if (collisionFlash > 0) {
      ctx.fillStyle = 'rgba(245, 138, 203, ' + (collisionFlash * 0.24) + ')';
      ctx.fillRect(0, 0, WORLD.viewWidth, WORLD.viewHeight);
    }
  }
  function drawNebula() {
    const blocks = [
      [80, 130, 210, 120, '#1a0c2b'], [1160, 690, 260, 150, '#160824'],
      [850, 70, 175, 90, '#210d36'], [280, 820, 250, 90, '#12091d']
    ];
    blocks.forEach((block) => {
      if (!inView(block[0] + block[2] / 2, block[1] + block[3] / 2, 150)) return;
      ctx.fillStyle = block[4];
      ctx.fillRect(block[0], block[1], block[2], block[3]);
      ctx.fillStyle = '#2b123a';
      for (let x = block[0] + 8; x < block[0] + block[2]; x += 26) {
        const y = block[1] + 10 + ((x * 7) % Math.max(20, block[3] - 20));
        ctx.fillRect(x, y, 12, 6);
      }
    });
  }
  function drawRoute(route) {
    ctx.save();
    ctx.fillStyle = route.color;
    ctx.globalAlpha = 0.28;
    for (let index = 1; index < route.points.length; index += 1) {
      const from = route.points[index - 1];
      const to = route.points[index];
      const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
      const steps = Math.floor(distance / 12);
      for (let step = 0; step <= steps; step += 1) {
        const ratio = step / steps;
        const x = Math.round((from[0] + (to[0] - from[0]) * ratio) / 4) * 4;
        const y = Math.round((from[1] + (to[1] - from[1]) * ratio) / 4) * 4;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    }
    ctx.restore();
  }
  function drawHub() {
    const x = WORLD.spawn.x;
    const y = WORLD.spawn.y;
    if (!inView(x, y, 150)) return;
    ctx.save();
    ctx.strokeStyle = '#6c3b92';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(x, y, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#2b123a';
    ctx.fillRect(x - 24, y - 18, 48, 36);
    ctx.fillStyle = '#b888f8';
    ctx.fillRect(x - 16, y - 10, 32, 20);
    ctx.fillStyle = '#f4e9ff';
    ctx.fillRect(x - 7, y - 4, 14, 8);
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#e6d9ff';
    ctx.textAlign = 'center';
    ctx.fillText('ORBIT ZERO HUB', x, y + 130);
    ctx.restore();
  }
  function drawPlanet(planet) {
    if (!inView(planet.x, planet.y, planet.r + 70)) return;
    const grid = 4;
    ctx.save();
    for (let row = -planet.r; row <= planet.r; row += grid) {
      const half = Math.floor(Math.sqrt(Math.max(0, planet.r * planet.r - row * row)) / grid) * grid;
      const shade = row < -planet.r * 0.28 ? planet.light : row > planet.r * 0.38 ? planet.crater : planet.color;
      ctx.fillStyle = shade;
      ctx.fillRect(planet.x - half, planet.y + row, half * 2 + grid, grid);
    }
    ctx.fillStyle = planet.light;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(planet.x - planet.r * 0.45, planet.y - planet.r * 0.34, 17, 10);
    ctx.fillRect(planet.x - planet.r * 0.16, planet.y - planet.r * 0.54, 10, 8);
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = planet.crater;
    ctx.fillRect(planet.x + planet.r * 0.18, planet.y + planet.r * 0.14, 20, 12);
    ctx.fillRect(planet.x - planet.r * 0.43, planet.y + planet.r * 0.32, 13, 9);
    ctx.globalAlpha = 1;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8dcf7';
    ctx.fillText(planet.name.toUpperCase(), planet.x, planet.y + planet.r + 22);
    ctx.fillStyle = '#f58acb';
    ctx.fillText('TOUCH = WARP', planet.x, planet.y + planet.r + 35);
    ctx.restore();
  }
  function drawBeacon(beacon) {
    if (!inView(beacon.x, beacon.y, 100)) return;
    const unlocked = beacon.id !== 'vault' || allMissionsComplete();
    const done = beacon.id === 'vault' ? state.progress.vault : state.progress[beacon.id];
    const pulse = Math.floor(worldTime / 170) % 2 === 0 ? 2 : 0;
    ctx.save();
    ctx.globalAlpha = unlocked ? 1 : 0.38;
    ctx.fillStyle = beacon.color;
    ctx.fillRect(beacon.x - 5 - pulse, beacon.y - 31 - pulse, 10 + pulse * 2, 10 + pulse * 2);
    ctx.globalAlpha = unlocked ? 0.24 : 0.08;
    ctx.fillRect(beacon.x - 23 - pulse, beacon.y - 47 - pulse, 46 + pulse * 2, 40 + pulse * 2);
    ctx.globalAlpha = unlocked ? 1 : 0.45;
    ctx.fillStyle = '#2b123a';
    ctx.fillRect(beacon.x - 19, beacon.y - 2, 38, 12);
    ctx.fillStyle = beacon.color;
    ctx.fillRect(beacon.x - 13, beacon.y + 10, 26, 8);
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = done ? '#74e7df' : '#fff5ff';
    ctx.fillText(done ? '✓' : beacon.icon, beacon.x, beacon.y - 26);
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#f0e5f9';
    ctx.fillText(beacon.title.toUpperCase(), beacon.x, beacon.y + 40);
    ctx.font = '9px monospace';
    ctx.fillStyle = beacon.color;
    ctx.fillText(done ? 'SIGNAL SECURED' : unlocked ? beacon.subtitle.toUpperCase() : 'VAULT LOCKED', beacon.x, beacon.y + 53);
    ctx.restore();
  }
  function drawPlayer() {
    const player = state.player;
    const moving = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].some((key) => pressed.has(key));
    const bounce = moving ? Math.floor(worldTime / 120) % 2 : 0;
    const color = currentColor();
    ctx.save();
    ctx.translate(player.x, player.y - bounce);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    ctx.fillRect(-24, -24, 48, 48);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(-17, -17, 34, 34);
    ctx.fillStyle = '#2b123a';
    ctx.fillRect(-13, -13, 26, 26);
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentAvatar().emoji, 0, -1);
    ctx.textBaseline = 'alphabetic';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#fff4ff';
    ctx.fillText(currentAvatar().name.toUpperCase(), 0, 38);
    ctx.restore();
  }
  function frame(timestamp) {
    const delta = Math.min(0.05, (timestamp - lastFrame) / 1000 || 0);
    lastFrame = timestamp;
    worldTime = timestamp;
    updateWorld(delta);
    drawWorld();
    window.requestAnimationFrame(frame);
  }

  function interact() {
    const beacon = nearestBeacon();
    if (!beacon) {
      toast('Fly closer to a blinking mission beacon.');
      return;
    }
    if (beacon.id === 'vault') {
      if (!allMissionsComplete()) {
        toast('The Career Compass needs three mission signals.');
        return;
      }
      if (state.progress.vault) {
        showResults();
        return;
      }
      setModal({ type: 'vaultValues' });
      return;
    }
    if (state.progress[beacon.id]) {
      setModal({ type: 'info', title: beacon.title + ' stabilized', text: 'That signal is already safe. Your choices were saved in the Pathfinder Profile.' });
      return;
    }
    if (beacon.id === 'archive') setModal({ type: 'archiveIntro' });
    if (beacon.id === 'bridge') setModal({ type: 'bridgeIntro' });
    if (beacon.id === 'council') setModal({ type: 'councilIntro' });
  }

  function modalShell(eyebrow, chip, title, body, closeLabel) {
    return '<article class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-top"><div><span>' + eyebrow + '</span><b>' + chip + '</b></div><button class="modal-close" type="button" data-action="close-modal" aria-label="' + (closeLabel || 'Close transmission') + '">×</button></div><div class="modal-body"><h2 id="modal-title">' + title + '</h2>' + body + '</div></article>';
  }
  function optionButtons(options, action) {
    return '<div class="modal-options">' + options.map((option) => '<button type="button" class="modal-option" data-action="' + action + '" data-value="' + option.id + '"><b>' + option.title + '</b><span>' + option.detail + '</span></button>').join('') + '</div>';
  }
  function setModal(next) {
    if (!modal) priorFocus = document.activeElement;
    modal = next;
    renderModal();
  }
  function closeModal(returnFocus) {
    const wasOpen = Boolean(modal);
    modal = null;
    ui.modalLayer.hidden = true;
    ui.modalLayer.innerHTML = '';
    updatePrompt();
    if (wasOpen && returnFocus !== false && priorFocus && typeof priorFocus.focus === 'function') priorFocus.focus({ preventScroll: true });
    priorFocus = null;
  }
  function renderModal() {
    if (!modal) return;
    let html = '';
    if (modal.type === 'info') {
      html = modalShell('STATION TRANSMISSION', 'INFO', escapeHtml(modal.title), '<p>' + escapeHtml(modal.text) + '</p><div class="modal-footer"><span>Read it, absorb it, pretend you are very wise.</span><button class="secondary-btn" type="button" data-action="close-modal">RETURN</button></div>');
    }
    if (modal.type === 'archiveIntro') {
      const options = [
        { id: 'scan', title: 'Run a spectrum scan', detail: 'Map the scrambled clues before touching a single file.' },
        { id: 'ask', title: 'Ask the librarian squid', detail: 'It has eight arms, eight opinions, and one useful clue.' },
        { id: 'breach', title: 'Kick the archive door', detail: 'Fast, loud, dramatic. The door is probably insured.' }
      ];
      html = modalShell('MISSION 01 // SILENT ARCHIVE', 'DIALOGUE', 'The files have stage fright.', '<p>An interstellar librarian has mixed up the constellation records. Its safety rule is simple: <strong>do not restore what you cannot verify.</strong> How do you enter?</p>' + optionButtons(options, 'archive-opening'));
    }
    if (modal.type === 'archiveStory') {
      html = modalShell('MISSION 01 // SILENT ARCHIVE', 'PUZZLE', 'A constellation fell apart.', '<p>The librarian presents a 3×3 mismatch mosaic. Slide the empty tile with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys until the glyphs match the reference constellation.</p><div class="story-box">On-screen arrows are here too, because even galaxy heroes sometimes use thumbs.</div><div class="modal-footer"><span>Rebuild the picture, then verify it.</span><button class="primary-btn" type="button" data-action="start-mosaic">OPEN MOSAIC</button></div>');
    }
    if (modal.type === 'mosaic') html = renderMosaic();
    if (modal.type === 'archiveQuestion') {
      const options = [
        { id: 'medical', title: 'Medical archive — 42 people × risk 4 = 168', detail: 'Critical risk multiplier: 4' },
        { id: 'shelter', title: 'Shelter records — 79 people × risk 2 = 158', detail: 'Medium risk multiplier: 2' },
        { id: 'habitat', title: 'Habitat registry — 150 people × risk 1 = 150', detail: 'Low risk multiplier: 1' }
      ];
      html = modalShell('MISSION 01 // SILENT ARCHIVE', 'EVIDENCE CHECK', 'Which file wakes up first?', '<p>Use the archive rule: <strong>priority = people affected × risk multiplier.</strong> The files are loud, but the numbers are louder.</p>' + optionButtons(options, 'archive-priority'));
    }
    if (modal.type === 'bridgeIntro') {
      const options = [
        { id: 'plan', title: 'Draw the boring-safe plan', detail: 'List the safety needs before choosing shiny extras.' },
        { id: 'pilot', title: 'Build a tiny test bridge', detail: 'Learn from a reversible version before full launch.' },
        { id: 'spark', title: 'Use maximum wormhole glue', detail: 'It says “non-toxic” in six very small languages.' }
      ];
      html = modalShell('MISSION 02 // MARKET BRIDGE', 'DIALOGUE', 'The market is floating away.', '<p>A bridge between two asteroid markets needs exactly ten energy blocks. The merchants would like speed. The safety inspector would like everyone to remain in one piece.</p>' + optionButtons(options, 'bridge-opening'));
    }
    if (modal.type === 'bridgeAllocation') html = renderBridgeAllocation();
    if (modal.type === 'bridgeQuestion') {
      const options = [
        { id: 'stable', title: '3 anchors, 2 rails, 3 scouts, 1 glue, 1 reserve', detail: 'Uses exactly 10 and meets every stated safety need.' },
        { id: 'wobbly', title: '4 anchors, 1 rail, 4 scouts, 1 glue, 0 reserve', detail: 'Looks confident, but misses two safety needs.' },
        { id: 'gooey', title: '3 anchors, 2 rails, 0 scouts, 5 glue, 0 reserve', detail: 'The bridge may become a museum piece.' }
      ];
      html = modalShell('MISSION 02 // MARKET BRIDGE', 'CONSTRAINT CHECK', 'Pick the bridge that survives lunch rush.', '<p>Safety protocol demands <strong>at least 3 anchors, 2 rails, and 1 reserve</strong>; total energy must equal 10. Which plan qualifies?</p>' + optionButtons(options, 'bridge-guardrail'));
    }
    if (modal.type === 'councilIntro') {
      const options = [
        { id: 'listen', title: 'Ask what each neighbor cannot lose', detail: 'Find needs before proposing a solution.' },
        { id: 'rule', title: 'Set a decision rule', detail: 'Give the discussion an orderly frame immediately.' },
        { id: 'pilot', title: 'Offer a reversible pilot', detail: 'Try a shared path before deciding forever.' }
      ];
      html = modalShell('MISSION 03 // COUNCIL OF THREE', 'DIALOGUE', 'Three aliens; one bridge; zero chill.', '<p>The Architect wants safety. The Dreamer wants experiments. The Guardian wants fairness. All three are technically correct, which is extremely inconvenient.</p>' + optionButtons(options, 'council-opening'));
    }
    if (modal.type === 'councilBoard') html = renderCouncilBoard();
    if (modal.type === 'councilOutcome') {
      const options = [
        { id: 'charter', title: 'Publish a shared charter', detail: 'Make the promises and review dates visible to everyone.' },
        { id: 'pilot', title: 'Launch a phased pilot', detail: 'Test, learn, and revise with clear safety guardrails.' },
        { id: 'services', title: 'Secure core services first', detail: 'Stabilize the basics before adding experimental layers.' }
      ];
      html = modalShell('MISSION 03 // COUNCIL OF THREE', 'FINAL CHOICE', 'How does the city keep its promise?', '<p>' + (state.answers.council.boardSolved ? 'Your policy board gives every council a voice. ' : 'The board did not meet every threshold, but you can still choose a thoughtful next step. ') + 'Pick the kind of promise you would make public.</p>' + optionButtons(options, 'council-outcome'));
    }
    if (modal.type === 'vaultValues') html = renderVaultValues();
    ui.modalLayer.hidden = false;
    ui.modalLayer.innerHTML = html;
    const card = ui.modalLayer.querySelector('.modal-card');
    if (card) card.focus({ preventScroll: true });
  }

  function renderMosaic() {
    const glyphs = { 1: '▲', 2: '●', 3: '■', 4: '◆', 5: '★', 6: '⬟', 7: '☾', 8: '✚', 0: '' };
    const tiles = modal.board.map((tile) => '<div class="mosaic-tile ' + (tile === 0 ? 'empty' : '') + '" aria-label="' + (tile === 0 ? 'empty space' : 'fragment ' + tile) + '">' + glyphs[tile] + '</div>').join('');
    const done = modal.solved;
    const status = done ? 'Constellation synced in ' + modal.moves + ' moves. The squid performs a tiny victory wiggle.' : 'Moves: ' + modal.moves + '. Move the empty tile toward the lower-right corner.';
    const controls = '<div class="direction-pad" aria-label="Mosaic controls"><button type="button" data-action="mosaic-move" data-value="up" aria-label="Move empty tile up">↑</button><button type="button" data-action="mosaic-move" data-value="left" aria-label="Move empty tile left">←</button><button type="button" data-action="mosaic-move" data-value="down" aria-label="Move empty tile down">↓</button><button type="button" data-action="mosaic-move" data-value="right" aria-label="Move empty tile right">→</button></div>';
    const footer = done ? '<button class="primary-btn" type="button" data-action="archive-verify">VERIFY PATTERN</button>' : '<button class="secondary-btn" type="button" data-action="mosaic-reset">RESET MOSAIC</button>';
    const target = [1, 2, 3, 4, 5, 6, 7, 8, 0].map((tile) => '<span aria-label="' + (tile === 0 ? 'empty space' : 'target glyph ' + tile) + '">' + (tile === 0 ? '□' : glyphs[tile]) + '</span>').join('');
    return modalShell('MISSION 01 // SILENT ARCHIVE', 'KEYBOARD PUZZLE', 'Put the star crumbs back in order.', '<p>Move the tiles until they match the reference constellation.</p><div class="puzzle-layout"><div class="mosaic-grid" aria-live="polite">' + tiles + '</div><div><div class="target-grid" aria-label="Target constellation order">' + target + '</div>' + controls + '</div></div><p class="puzzle-status ' + (done ? 'success' : '') + '" aria-live="polite">' + status + '</p><div class="modal-footer"><span>WASD and arrows work here.</span>' + footer + '</div>');
  }
  function renderBridgeAllocation() {
    const allocation = state.answers.bridge.allocation;
    const total = bridgeTotal();
    const rows = bridgeItems.map((item) => '<div class="allocation-row"><div><b>' + item.name + '</b><small>' + item.note + '</small></div><div class="stepper"><button type="button" data-action="bridge-change" data-key="' + item.key + '" data-delta="-1" aria-label="Remove energy from ' + item.name + '">−</button><strong>' + allocation[item.key] + '</strong><button type="button" data-action="bridge-change" data-key="' + item.key + '" data-delta="1" aria-label="Add energy to ' + item.name + '">+</button></div></div>').join('');
    const ready = total === 10;
    return modalShell('MISSION 02 // MARKET BRIDGE', 'RESOURCE PUZZLE', 'Build with exactly ten blocks.', '<p>Spend every energy block. The bridge is a real bridge, not a metaphor, though it is being very metaphorical about it.</p><div class="allocation-total"><span>ENERGY ALLOCATED</span><b>' + total + ' / 10</b></div><div class="allocation-list">' + rows + '</div><div class="story-box">For the next check, remember: 3 anchors + 2 rails + 1 reserve are non-negotiable.</div><div class="modal-footer"><span>' + (ready ? 'Ten blocks allocated. Time to test the safety logic.' : 'Allocate ' + (10 - total) + ' more energy block' + (10 - total === 1 ? '' : 's') + '.') + '</span><button class="primary-btn" type="button" data-action="bridge-next" ' + (ready ? '' : 'disabled') + '>CHECK BRIDGE</button></div>');
  }
  function renderCouncilBoard() {
    const selected = state.answers.council.policies;
    const totals = councilTotals();
    const cards = councilPolicies.map((policy) => '<button type="button" class="policy-card ' + (selected.includes(policy.id) ? 'selected' : '') + '" data-action="toggle-policy" data-value="' + policy.id + '" aria-pressed="' + selected.includes(policy.id) + '"><b>' + policy.name + '</b><span>' + policy.note + '</span><small>Architect +' + policy.scores[0] + ' · Dreamer +' + policy.scores[1] + ' · Guardian +' + policy.scores[2] + '</small></button>').join('');
    const ready = selected.length === 3;
    return modalShell('MISSION 03 // COUNCIL OF THREE', 'SHARED PUZZLE', 'Pick exactly three promises.', '<p>Every council needs a score of at least 3. Combine three policies so nobody is left outside the airlock.</p><div class="council-scoreboard"><div><span>ARCHITECT</span><b>' + totals[0] + ' / 3</b></div><div><span>DREAMER</span><b>' + totals[1] + ' / 3</b></div><div><span>GUARDIAN</span><b>' + totals[2] + ' / 3</b></div></div><div class="policy-grid">' + cards + '</div><div class="modal-footer"><span>' + (ready ? 'Three promises selected. Check whether everyone can sign.' : 'Choose ' + (3 - selected.length) + ' more promise' + (3 - selected.length === 1 ? '' : 's') + '.') + '</span><button class="primary-btn" type="button" data-action="council-next" ' + (ready ? '' : 'disabled') + '>CHECK TREATY</button></div>');
  }
  function renderVaultValues() {
    const values = state.answers.values;
    const total = valueTotal();
    const rows = valueMeta.map((item) => '<div class="allocation-row value-row"><div><b><i>' + item.icon + '</i> ' + item.name + '</b><small>' + item.note + '</small></div><div class="stepper"><button type="button" data-action="value-change" data-key="' + item.key + '" data-delta="-1" aria-label="Remove a vision token from ' + item.name + '">−</button><strong>' + values[item.key] + '</strong><button type="button" data-action="value-change" data-key="' + item.key + '" data-delta="1" aria-label="Add a vision token to ' + item.name + '">+</button></div></div>').join('');
    const ready = total === 10;
    return modalShell('CAREER COMPASS VAULT', 'VISION TOKENS', 'What pulls your future forward?', '<p>Give your ten Vision Tokens to the things you want a route to offer. There is no ideal pattern—only an honest one.</p><div class="allocation-total"><span>VISION TOKENS</span><b>' + total + ' / 10</b></div><div class="allocation-list">' + rows + '</div><div class="modal-footer"><span>' + (ready ? 'The compass can now read your priorities.' : 'Place ' + (10 - total) + ' more token' + (10 - total === 1 ? '' : 's') + '.') + '</span><button class="primary-btn" type="button" data-action="vault-values-next" ' + (ready ? '' : 'disabled') + '>STABILIZE PROFILE</button></div>');
  }
  function bridgeTotal() {
    return bridgeItems.reduce((sum, item) => sum + Number(state.answers.bridge.allocation[item.key] || 0), 0);
  }
  function valueTotal() {
    return valueMeta.reduce((sum, item) => sum + Number(state.answers.values[item.key] || 0), 0);
  }
  function councilTotals() {
    const totals = [0, 0, 0];
    state.answers.council.policies.forEach((id) => {
      const policy = councilPolicies.find((item) => item.id === id);
      if (policy) policy.scores.forEach((score, index) => { totals[index] += score; });
    });
    return totals;
  }
  function bridgeQuality() {
    const allocation = state.answers.bridge.allocation;
    let score = 0.35;
    if (allocation.anchors >= 3) score += 0.2;
    if (allocation.rails >= 2) score += 0.2;
    if (allocation.reserve >= 1) score += 0.15;
    if (allocation.scouts >= 1) score += 0.1;
    return clamp(score, 0, 1);
  }
  function completeMission(id, title, text) {
    state.progress[id] = true;
    saveState();
    updateHud();
    setModal({ type: 'info', title: title + ' — signal secured', text: text + ' Return to Orbit Zero and find the next blinking beacon.' });
  }
  function moveMosaic(direction) {
    if (!modal || modal.type !== 'mosaic' || modal.solved) return;
    const empty = modal.board.indexOf(0);
    const row = Math.floor(empty / 3);
    const column = empty % 3;
    let next = -1;
    if (direction === 'up' && row > 0) next = empty - 3;
    if (direction === 'down' && row < 2) next = empty + 3;
    if (direction === 'left' && column > 0) next = empty - 1;
    if (direction === 'right' && column < 2) next = empty + 1;
    if (next < 0) return;
    modal.board[empty] = modal.board[next];
    modal.board[next] = 0;
    modal.moves += 1;
    modal.solved = modal.board.every((value, index) => value === (index === 8 ? 0 : index + 1));
    renderModal();
  }
  function handleAction(action, element) {
    if (!action) return;
    const value = element.dataset.value;
    const key = element.dataset.key;
    if (action === 'close-modal') { closeModal(); return; }
    if (action === 'archive-opening') {
      state.answers.archive.opening = value;
      if (value === 'scan') { nudge('evidenceSeeking', 0.2); nudge('analyticalThinking', 0.13); }
      if (value === 'ask') { nudge('evidenceSeeking', 0.13); nudge('collaboration', 0.12); }
      if (value === 'breach') { nudge('riskPreference', 0.2); nudge('creativeProblemFraming', 0.1); }
      saveState();
      setModal({ type: 'archiveStory' });
      return;
    }
    if (action === 'start-mosaic') {
      setModal({ type: 'mosaic', board: [1, 3, 6, 5, 0, 2, 4, 7, 8], moves: 0, solved: false });
      return;
    }
    if (action === 'mosaic-move') { moveMosaic(value); return; }
    if (action === 'mosaic-reset') {
      modal.board = [1, 3, 6, 5, 0, 2, 4, 7, 8];
      modal.moves = 0;
      modal.solved = false;
      renderModal();
      return;
    }
    if (action === 'archive-verify') {
      state.answers.archive.mosaicSolved = true;
      state.answers.archive.mosaicMoves = modal.moves;
      nudge('analyticalThinking', 0.22);
      nudge('creativeProblemFraming', modal.moves <= 14 ? 0.16 : 0.09);
      saveState();
      setModal({ type: 'archiveQuestion' });
      return;
    }
    if (action === 'archive-priority') {
      const correct = value === 'medical';
      state.answers.archive.priority = value;
      state.answers.archive.priorityCorrect = correct;
      nudge('evidenceSeeking', correct ? 0.22 : 0.05);
      nudge('analyticalThinking', correct ? 0.12 : 0.03);
      completeMission('archive', 'Silent Archive', correct ? 'You followed the evidence instead of the loudest file. The librarian squid is delighted.' : 'The librarian squid logs the answer and gives you a gentle eight-armed reminder to check the formula next time.');
      return;
    }
    if (action === 'bridge-opening') {
      state.answers.bridge.opening = value;
      if (value === 'plan') { nudge('planning', 0.18); nudge('evidenceSeeking', 0.08); }
      if (value === 'pilot') { nudge('creativeProblemFraming', 0.15); nudge('riskPreference', 0.09); }
      if (value === 'spark') { nudge('riskPreference', 0.2); nudge('creativeProblemFraming', 0.1); }
      saveState();
      setModal({ type: 'bridgeAllocation' });
      return;
    }
    if (action === 'bridge-change') {
      const delta = Number(element.dataset.delta);
      const allocation = state.answers.bridge.allocation;
      if (delta > 0 && bridgeTotal() >= 10) { toast('The battery crate is empty. Ten is the limit.'); return; }
      if (delta < 0 && allocation[key] <= 0) return;
      allocation[key] = clamp(allocation[key] + delta, 0, 10);
      saveState();
      renderModal();
      return;
    }
    if (action === 'bridge-next') {
      if (bridgeTotal() !== 10) { toast('Spend all ten energy blocks first.'); return; }
      setModal({ type: 'bridgeQuestion' });
      return;
    }
    if (action === 'bridge-guardrail') {
      const correct = value === 'stable';
      state.answers.bridge.guardrail = value;
      state.answers.bridge.guardrailCorrect = correct;
      nudge('planning', correct ? 0.23 : 0.07);
      nudge('analyticalThinking', correct ? 0.12 : 0.04);
      nudge('riskPreference', state.answers.bridge.opening === 'spark' ? 0.04 : 0.08);
      completeMission('bridge', 'Market Bridge', correct ? 'Your bridge is sturdy, funded, and only a little bit snack-powered.' : 'The inspector accepts your prototype notes, but circles the missing constraints in very purple ink.');
      return;
    }
    if (action === 'council-opening') {
      state.answers.council.opening = value;
      if (value === 'listen') { nudge('collaboration', 0.2); nudge('evidenceSeeking', 0.06); }
      if (value === 'rule') { nudge('planning', 0.16); nudge('analyticalThinking', 0.07); }
      if (value === 'pilot') { nudge('creativeProblemFraming', 0.18); nudge('riskPreference', 0.12); }
      saveState();
      setModal({ type: 'councilBoard' });
      return;
    }
    if (action === 'toggle-policy') {
      const selected = state.answers.council.policies;
      const index = selected.indexOf(value);
      if (index >= 0) selected.splice(index, 1);
      else if (selected.length < 3) selected.push(value);
      else { toast('The council only lets you promise three things at once.'); return; }
      saveState();
      renderModal();
      return;
    }
    if (action === 'council-next') {
      if (state.answers.council.policies.length !== 3) { toast('Choose exactly three policies.'); return; }
      const totals = councilTotals();
      const solved = totals.every((score) => score >= 3);
      state.answers.council.boardSolved = solved;
      nudge('collaboration', solved ? 0.24 : 0.09);
      nudge('planning', solved ? 0.12 : 0.05);
      nudge('creativeProblemFraming', solved ? 0.1 : 0.06);
      saveState();
      setModal({ type: 'councilOutcome' });
      return;
    }
    if (action === 'council-outcome') {
      state.answers.council.outcome = value;
      if (value === 'charter') { nudge('collaboration', 0.1); nudge('evidenceSeeking', 0.07); }
      if (value === 'pilot') { nudge('creativeProblemFraming', 0.1); nudge('riskPreference', 0.08); }
      if (value === 'services') { nudge('planning', 0.1); }
      completeMission('council', 'Council of Three', state.answers.council.boardSolved ? 'Every council signs the treaty. The Dreamer immediately asks if the signature can glitter.' : 'The council accepts your proposed next step and asks you to keep listening as the city iterates.');
      return;
    }
    if (action === 'value-change') {
      const delta = Number(element.dataset.delta);
      const values = state.answers.values;
      if (delta > 0 && valueTotal() >= 10) { toast('All ten Vision Tokens are already in orbit.'); return; }
      if (delta < 0 && values[key] <= 0) return;
      values[key] = clamp(values[key] + delta, 0, 10);
      saveState();
      renderModal();
      return;
    }
    if (action === 'vault-values-next') {
      if (valueTotal() !== 10) { toast('Place all ten Vision Tokens first.'); return; }
      finishProfile();
      return;
    }
  }

  function vectorFit(player, weights) {
    let weighted = 0;
    let total = 0;
    Object.keys(weights).forEach((key) => {
      weighted += (player[key] || 0) * weights[key];
      total += weights[key];
    });
    return total ? weighted / total : 0.5;
  }
  function missionProblemVector() {
    const archiveScore = state.answers.archive.mosaicSolved ? (state.answers.archive.priorityCorrect ? 1 : 0.72) : 0.35;
    const bridgeScore = state.answers.bridge.guardrailCorrect ? Math.max(0.85, bridgeQuality()) : bridgeQuality() * 0.76;
    const councilScore = state.answers.council.boardSolved ? 0.94 : 0.62;
    return {
      analyticalThinking: archiveScore,
      creativeProblemFraming: clamp((state.answers.archive.mosaicMoves && state.answers.archive.mosaicMoves <= 14 ? 0.9 : 0.68) + (state.answers.bridge.opening === 'pilot' ? 0.1 : 0), 0, 1),
      planning: bridgeScore,
      collaboration: councilScore,
      evidenceSeeking: archiveScore,
      riskPreference: state.signals.riskPreference
    };
  }
  function constraintFit(career) {
    const chosen = state.answers.constraints;
    const keys = ['time', 'budget', 'location', 'urgency'];
    const score = keys.reduce((sum, key) => sum + (career.constraints[key].includes(chosen[key]) ? 1 : 0.45), 0);
    return score / keys.length;
  }
  function rankCareers() {
    const values = {};
    valueMeta.forEach((item) => { values[item.key] = state.answers.values[item.key] / 10; });
    const problem = missionProblemVector();
    return careers.map((career) => {
      const components = {
        problemSolving: Math.round(vectorFit(problem, career.traits) * 100),
        skills: Math.round(vectorFit(state.signals, career.traits) * 100),
        values: Math.round(vectorFit(values, career.values) * 100),
        constraints: Math.round(constraintFit(career) * 100),
        market: Math.round(career.market * 100)
      };
      const score = Math.round(components.problemSolving * 0.3 + components.skills * 0.25 + components.values * 0.2 + components.constraints * 0.15 + components.market * 0.1);
      return { id: career.id, icon: career.icon, title: career.title, overview: career.overview, prep: career.prep, tradeoff: career.tradeoff, score: score, components: components };
    }).sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
  }
  function choiceLabel(key, value) {
    const labels = {
      studyTime: { threeMonths: 'up to 3 months', oneYear: 'about 1 year', twoYears: 'about 2 years', fourYears: '4+ years' },
      budget: { low: 'cost-sensitive', medium: 'medium', flexible: 'flexible' },
      location: { home: 'near home', city: 'big city', remote: 'remote-friendly' },
      incomeUrgency: { needsNow: 'income needed now', soon: 'income needed within 6 months', flexible: 'a flexible income timeline' }
    };
    return (labels[key] && labels[key][value]) || 'not set';
  }
  function localFitSummary(career) {
    const label = { problemSolving: 'mission problem-solving', skills: 'the approach you took during missions', values: 'your Vision Token priorities', constraints: 'your practical preferences', market: 'the game’s static market signal' };
    const strongest = Object.entries(career.components || {}).sort((left, right) => right[1] - left[1]).slice(0, 2).map(([key]) => label[key]).filter(Boolean);
    const profile = normalizeLearnerProfile(state.learnerProfile);
    const context = profile.country && profile.educationStage ? ' The route below is framed for a ' + profile.educationStage + ' learner in ' + profile.country + '.' : '';
    return 'This route rose because of ' + (strongest.length ? strongest.join(' and ') : 'your game choices') + '.' + context;
  }
  function experienceTiming(profile) {
    const stage = profile.educationStage || 'your current stage';
    const beforeTertiary = ['Secondary', 'O-Level', 'N-Level', 'Junior College', 'A-Level', 'IB', 'Polytechnic', 'ITE', 'Middle School', 'High School', 'AP/IB', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Grade 10', 'Grade 11', 'Grade 12', 'National High School Exam preparation', 'Vocational'].includes(stage);
    return [
      'Now · ' + stage,
      beforeTertiary ? 'Next 3–6 months' : 'This term · next 3–6 months',
      beforeTertiary ? 'Over the next school year' : 'Over the next 6–12 months',
      beforeTertiary ? 'During your next study stage' : 'During study or your next role',
      'Before entry-role applications',
      'When a suitable opening appears'
    ];
  }
  function experienceTimelineFor(career) {
    const profile = normalizeLearnerProfile(state.learnerProfile);
    const steps = experienceTimelineMeta[career.id] || [
      ['Complete one focused project or volunteer activity.', 'A short work sample or role record.', 'It makes your interest visible.'],
      ['Improve your work using feedback.', 'Before-and-after evidence.', 'It demonstrates growth.'],
      ['Contribute to a real team or community project.', 'A contribution record.', 'It adds real-world context.'],
      ['Seek a supervised placement or client-style brief when available.', 'Feedback or a work summary.', 'It helps you become job-ready.'],
      ['An entry-level role in this field.', 'A focused CV and evidence portfolio.', 'It begins your professional experience.']
    ];
    const timing = experienceTiming(profile);
    return [
      { label: 'NOW / CURRENT STAGE', timing: timing[0], activity: 'Choose one small ' + career.title.toLowerCase() + ' problem you would like to understand or improve.', proof: 'A one-sentence goal and a saved starting example.', why: 'A concrete problem gives your experience a useful direction.' },
      { label: 'EARLY EXPERIENCE', timing: timing[1], activity: steps[0][0], proof: steps[0][1], why: steps[0][2] },
      { label: 'STRONGER EVIDENCE', timing: timing[2], activity: steps[1][0], proof: steps[1][1], why: steps[1][2] },
      { label: 'INDUSTRY EXPERIENCE', timing: timing[3], activity: steps[2][0], proof: steps[2][1], why: steps[2][2] },
      { label: 'JOB-READY EVIDENCE', timing: timing[4], activity: steps[3][0], proof: steps[3][1], why: steps[3][2] },
      { label: 'FIRST ENTRY ROLE', timing: timing[5], activity: steps[4][0], proof: steps[4][1], why: steps[4][2] }
    ];
  }
  function profilePayload(recommendations) {
    return {
      user_id: state.user.id,
      completed_at: state.results ? state.results.completedAt : new Date().toISOString(),
      scoring_weights: { problem_solving: 30, skills: 25, values: 20, constraints: 15, demo_market_signal: 10 },
      mission_evidence: {
        silent_archive: { mosaic_solved: state.answers.archive.mosaicSolved, evidence_check_correct: state.answers.archive.priorityCorrect },
        market_bridge: { energy_blocks: bridgeTotal(), guardrail_check_correct: state.answers.bridge.guardrailCorrect },
        council_of_three: { treaty_board_solved: state.answers.council.boardSolved }
      },
      signals: state.signals,
      vision_tokens: state.answers.values,
      practical_constraints: state.answers.constraints,
      learner_profile: {
        country: state.learnerProfile.country,
        education_stage: state.learnerProfile.educationStage,
        academic_performance_band: state.learnerProfile.academicBand,
        preferred_study_time: state.learnerProfile.studyTime,
        budget: state.learnerProfile.budget,
        location: state.learnerProfile.location,
        income_urgency: state.learnerProfile.incomeUrgency
      },
      top_paths: recommendations.map((career, index) => ({ rank: index + 1, id: career.id, title: career.title, score: career.score, components: career.components }))
    };
  }
  function finishProfile() {
    const recommendations = rankCareers().slice(0, 3);
    aiRequestSequence += 1;
    aiRequestInFlight = false;
    state.progress.vault = true;
    state.results = { completedAt: new Date().toISOString(), recommendations: recommendations, payload: profilePayload(recommendations) };
    saveState();
    closeModal(false);
    showResults();
  }
  function safeHttpUrl(value) {
    try {
      const parsed = new URL(String(value || ''));
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
    } catch (_) {
      return '';
    }
  }
  function isShortText(value, maximum = 700) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maximum;
  }
  function makePathwayRequest(recommendations) {
    const profile = normalizeLearnerProfile(state.learnerProfile);
    const signals = {};
    signalKeys.forEach((key) => { signals[key] = Math.round(normalNumber(state.signals[key], 0.4, 0, 1) * 100) / 100; });
    return {
      profile: {
        country: profile.country,
        educationStage: profile.educationStage,
        academicBand: profile.academicBand,
        studyTime: profile.studyTime,
        budget: profile.budget,
        location: profile.location,
        incomeUrgency: profile.incomeUrgency
      },
      game: {
        topCareers: recommendations.map((career) => ({ id: career.id, name: career.title, score: Math.round(career.score), why: localFitSummary(career).slice(0, 350) })),
        signals: signals
      }
    };
  }
  function pathwayFingerprint(recommendations) {
    return JSON.stringify(makePathwayRequest(recommendations));
  }
  function normalizeLivePathways(raw, recommendations) {
    if (!isRecord(raw) || !Array.isArray(raw.pathways) || raw.pathways.length !== 3) return null;
    const expectedIds = recommendations.map((career) => career.id);
    const expectedTiers = ['Reach', 'Match', 'More Accessible'];
    const seen = new Set();
    const clean = raw.pathways.map((pathway) => {
      if (!isRecord(pathway) || !expectedIds.includes(pathway.careerId) || seen.has(pathway.careerId)) return null;
      seen.add(pathway.careerId);
      if (!isShortText(pathway.careerName, 160) || !isShortText(pathway.fitSummary) || !Array.isArray(pathway.programmeTypes) || pathway.programmeTypes.length < 1 || pathway.programmeTypes.length > 5 || !pathway.programmeTypes.every((item) => isShortText(item, 180))) return null;
      if (!Array.isArray(pathway.tradeoffs) || pathway.tradeoffs.length < 1 || pathway.tradeoffs.length > 5 || !pathway.tradeoffs.every((item) => isShortText(item, 360))) return null;
      if (!Array.isArray(pathway.schools) || pathway.schools.length !== 3) return null;
      const schools = pathway.schools.map((school, index) => {
        if (!isRecord(school) || school.tier !== expectedTiers[index] || !isShortText(school.name, 180) || !isShortText(school.country, 100) || !isShortText(school.city, 120) || !isShortText(school.programme, 240) || !isShortText(school.whyMatch) || !isShortText(school.admissionContext)) return null;
        if (!Array.isArray(school.sourceLinks) || school.sourceLinks.length > 4) return null;
        const sourceLinks = school.sourceLinks.map((source) => {
          const url = isRecord(source) ? safeHttpUrl(source.url) : '';
          return url && isShortText(source.label, 140) ? { label: source.label.trim(), url: url } : null;
        });
        if (sourceLinks.some((source) => !source)) return null;
        return { tier: school.tier, name: school.name.trim(), country: school.country.trim(), city: school.city.trim(), programme: school.programme.trim(), whyMatch: school.whyMatch.trim(), admissionContext: school.admissionContext.trim(), sourceLinks: sourceLinks };
      });
      if (schools.some((school) => !school)) return null;
      return {
        careerId: pathway.careerId,
        careerName: pathway.careerName.trim(),
        fitSummary: pathway.fitSummary.trim(),
        programmeTypes: pathway.programmeTypes.map((item) => item.trim()),
        tradeoffs: pathway.tradeoffs.map((item) => item.trim()),
        schools: schools
      };
    });
    return clean.some((pathway) => !pathway) || seen.size !== expectedIds.length ? null : clean;
  }
  function renderSourceLinks(links) {
    if (!links.length) return '<p class="source-links"><span>No comparable official source link was returned; verify the school’s admissions page before acting.</span></p>';
    return '<p class="source-links">' + links.map((link) => '<a href="' + escapeHtml(link.url) + '" target="_blank" rel="noreferrer noopener">' + escapeHtml(link.label) + ' ↗</a>').join('') + '</p>';
  }
  function renderLivePathwayCard(pathway, index, source) {
    const detail = '<div class="pathway-detail-grid"><section class="pathway-detail"><h4>Suitable programme types</h4><p>' + pathway.programmeTypes.map(escapeHtml).join(' · ') + '</p></section><section class="pathway-detail"><h4>Trade-offs to compare</h4><p>' + pathway.tradeoffs.map(escapeHtml).join(' · ') + '</p></section></div>';
    const schools = pathway.schools.map((school) => '<article class="school-option" data-tier="' + (school.tier === 'More Accessible' ? 'more-accessible' : school.tier.toLowerCase()) + '"><span class="school-tier">' + escapeHtml(school.tier) + '</span><h4>' + escapeHtml(school.name) + '</h4><p><strong>' + escapeHtml(school.city) + ', ' + escapeHtml(school.country) + '</strong></p><p><strong>Programme:</strong> ' + escapeHtml(school.programme) + '</p><p><strong>Why it may fit:</strong> ' + escapeHtml(school.whyMatch) + '</p><p><strong>Admission context:</strong> ' + escapeHtml(school.admissionContext) + '</p>' + renderSourceLinks(school.sourceLinks) + '</article>').join('');
    const origin = source === 'curated_database' ? 'CURATED DATABASE' : 'LIVE RESEARCH';
    return '<article class="pathway-card"><header class="pathway-card__header"><div><p class="eyebrow">' + origin + ' · PATH ' + String(index + 1).padStart(2, '0') + '</p><h3>' + escapeHtml(pathway.careerName) + '</h3></div><span class="pathway-card__rank">0' + (index + 1) + '</span></header><p class="pathway-card__summary"><strong>Why it fits:</strong> ' + escapeHtml(pathway.fitSummary) + '</p>' + detail + '<section class="school-options" aria-label="Three school options for ' + escapeHtml(pathway.careerName) + '">' + schools + '</section></article>';
  }
  function setAiStatus(text, stateName) {
    if (!ui.aiPathwayStatus) return;
    ui.aiPathwayStatus.textContent = text;
    ui.aiPathwayStatus.dataset.state = stateName || '';
  }
  function renderAiPathwayPanel(recommendations) {
    if (!ui.aiPathwayPanel || !state || !state.results) return;
    const fingerprint = pathwayFingerprint(recommendations);
    const cached = isRecord(state.results.aiPathway) && state.results.aiPathway.fingerprint === fingerprint ? state.results.aiPathway : null;
    if (ui.aiPathwayLoading) ui.aiPathwayLoading.hidden = !aiRequestInFlight;
    if (ui.aiPathwayUnavailable) ui.aiPathwayUnavailable.hidden = !(cached && cached.status === 'unavailable');
    if (ui.aiPathwayRetry) ui.aiPathwayRetry.hidden = !(cached && cached.status === 'unavailable');
    if (aiRequestInFlight) {
      setAiStatus('RESEARCHING CURRENT SOURCES', '');
      ui.aiPathwayList.innerHTML = '';
      return;
    }
    if (cached && cached.status === 'ready' && Array.isArray(cached.pathways)) {
      const usingDatabase = cached.source === 'curated_database' || cached.fallback === true;
      setAiStatus(usingDatabase ? 'DATABASE GUIDANCE READY' : 'LIVE GUIDANCE READY', 'ready');
      const note = usingDatabase ? '<p class="ai-pathway-placeholder">Live AI research is unavailable right now, so these are database-based planning options. Check each official source before acting.</p>' : '';
      ui.aiPathwayList.innerHTML = note + cached.pathways.map((pathway, index) => renderLivePathwayCard(pathway, index, cached.source)).join('');
      return;
    }
    if (cached && cached.status === 'unavailable') {
      setAiStatus('GUIDANCE UNAVAILABLE', 'error');
      ui.aiPathwayList.innerHTML = '';
      return;
    }
    setAiStatus('AI GUIDANCE STANDBY', '');
    ui.aiPathwayList.innerHTML = '<p class="ai-pathway-placeholder">Current school research will begin automatically. Your navigator user_id is not included in the request.</p>';
  }
  async function requestPathwayGuidance(force = false) {
    if (!state || !state.results || aiRequestInFlight) return;
    const recommendations = state.results.recommendations || rankCareers().slice(0, 3);
    const fingerprint = pathwayFingerprint(recommendations);
    const cached = isRecord(state.results.aiPathway) && state.results.aiPathway.fingerprint === fingerprint ? state.results.aiPathway : null;
    if (!force && cached && (cached.status === 'ready' || cached.status === 'unavailable')) {
      renderAiPathwayPanel(recommendations);
      return;
    }
    const requestId = ++aiRequestSequence;
    aiRequestInFlight = true;
    renderAiPathwayPanel(recommendations);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 35000);
      const response = await fetch('/api/pathway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makePathwayRequest(recommendations)),
        signal: controller.signal
      });
      window.clearTimeout(timeout);
      const payload = await response.json().catch(() => null);
      const pathways = response.ok && payload && payload.ok ? normalizeLivePathways(payload, recommendations) : null;
      if (!pathways) throw new Error('Pathway response was unavailable or did not match the expected format.');
      if (requestId !== aiRequestSequence || !state || !state.results) return;
      state.results.aiPathway = { status: 'ready', fingerprint: fingerprint, pathways: pathways, disclaimer: isShortText(payload.disclaimer, 900) ? payload.disclaimer.trim() : '', researchNotes: isShortText(payload.researchNotes, 900) ? payload.researchNotes.trim() : '', source: payload.source === 'curated_database' ? 'curated_database' : 'openai_live_research', fallback: payload.fallback === true, generatedAt: isShortText(payload.generatedAt, 80) ? payload.generatedAt : new Date().toISOString() };
      saveState();
    } catch (_) {
      if (requestId === aiRequestSequence && state && state.results) {
        state.results.aiPathway = { status: 'unavailable', fingerprint: fingerprint, generatedAt: new Date().toISOString() };
        saveState();
      }
    } finally {
      if (requestId === aiRequestSequence) aiRequestInFlight = false;
      if (state && state.results) renderAiPathwayPanel(state.results.recommendations || recommendations);
    }
  }
  function showResults() {
    if (!state || !state.results) {
      toast('Finish the Career Compass Vault to unlock the Pathfinder Profile.');
      return;
    }
    mode = 'results';
    closeModal(false);
    showScreen('results-screen');
    renderResults();
    requestPathwayGuidance();
  }
  function renderExperienceTimeline(career) {
    const steps = experienceTimelineFor(career);
    const items = steps.map((step) => '<li><strong>' + escapeHtml(step.label) + ' <span class="experience-timeline__time">· ' + escapeHtml(step.timing) + '</span></strong><p class="experience-timeline__activity">' + escapeHtml(step.activity) + '</p><p><b>Proof:</b> ' + escapeHtml(step.proof) + '</p><p><b>Why it matters:</b> ' + escapeHtml(step.why) + '</p></li>').join('');
    return '<section class="baseline-pathway experience-guide" aria-label="Experience-Building Timeline for ' + escapeHtml(career.title) + '"><p class="baseline-pathway__label">EXPERIENCE-BUILDING TIMELINE</p><p class="experience-guide__intro">A compact roadmap for building real evidence before a first role.</p><ol class="experience-timeline">' + items + '</ol><p class="baseline-pathway__note">Guidance only: activities, placements, employment, admissions, and professional qualifications are never guaranteed.</p></section>';
  }
  function renderResults() {
    const recommendations = state.results.recommendations || rankCareers().slice(0, 3);
    const profile = normalizeLearnerProfile(state.learnerProfile);
    ui.resultLede.textContent = 'Navigator ' + state.user.id + ', your choices point to routes where your current problem-solving style, values, and practical coordinates overlap' + (profile.country ? '. Your route guide uses your ' + profile.country + ' context' + (profile.educationStage ? ' and ' + profile.educationStage + ' stage' : '') + '.' : '.');
    ui.puzzleStat.textContent = missionTotal() + ' / 3';
    ui.resetStat.textContent = String(state.collisionCount);
    ui.idStat.textContent = state.user.id;
    ui.careerList.innerHTML = recommendations.map((career, index) => '<article class="career-card"><div class="career-rank">0' + (index + 1) + '</div><div class="career-main"><p class="career-icon">' + career.icon + '</p><h3>' + escapeHtml(career.title) + '</h3><p>' + escapeHtml(career.overview) + '</p><p class="career-prep"><b>Try next:</b> ' + career.prep.map(escapeHtml).join(' · ') + '</p><p class="career-tradeoff"><b>Trade-off:</b> ' + escapeHtml(career.tradeoff) + '</p></div><div class="career-score"><div><span>PATH ALIGNMENT</span><b>' + career.score + '/100</b></div><div class="score-meter" role="progressbar" aria-label="' + escapeHtml(career.title) + ' path alignment" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + career.score + '"><span style="width:' + career.score + '%"></span></div><small>Problem ' + career.components.problemSolving + ' · Skills ' + career.components.skills + ' · Values ' + career.components.values + ' · Constraints ' + career.components.constraints + ' · Demo market ' + career.components.market + '</small></div>' + renderExperienceTimeline(career) + '</article>').join('');
    ui.profileJson.textContent = JSON.stringify(state.results.payload || profilePayload(recommendations), null, 2);
    renderAiPathwayPanel(recommendations);
  }
  function newTimeline() {
    if (!state) return;
    if (!window.confirm('Start a new timeline for ' + state.user.id + '? This replaces the saved mission choices for this user_id.')) return;
    const userId = state.user.id;
    const learnerProfile = normalizeLearnerProfile(state.learnerProfile);
    aiRequestSequence += 1;
    state = freshState(userId, learnerProfile);
    draft = { avatarId: state.avatar.id, color: state.avatar.color };
    saveState();
    showWelcomeForCurrentState();
    toast('New timeline ready. The galaxy has conveniently re-scrambled itself.');
  }

  function isTextEntry(element) {
    return element && ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
  }
  function keyToDirection(key) {
    const normalized = key.toLowerCase();
    if (normalized === 'w' || normalized === 'arrowup') return 'up';
    if (normalized === 's' || normalized === 'arrowdown') return 'down';
    if (normalized === 'a' || normalized === 'arrowleft') return 'left';
    if (normalized === 'd' || normalized === 'arrowright') return 'right';
    return null;
  }
  function trapFocus(event) {
    const focusable = Array.from(ui.modalLayer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function attachEvents() {
    ui.profileFields.addEventListener('submit', (event) => {
      event.preventDefault();
      commitStartProfile();
    });
    ui.avatarOptions.addEventListener('click', (event) => {
      const button = event.target.closest('[data-avatar]');
      if (!button) return;
      draft.avatarId = Number(button.dataset.avatar);
      renderCustomization();
    });
    ui.colorOptions.addEventListener('click', (event) => {
      const button = event.target.closest('[data-color]');
      if (!button) return;
      draft.color = button.dataset.color;
      renderCustomization();
    });
    ui.userId.addEventListener('input', updateReturningUser);
    ui.profileCountry.addEventListener('change', () => {
      renderEducationStages(ui.profileCountry.value, '');
      updateProfileStatus();
    });
    [ui.profileStage, ui.profileAcademicBand, ui.profileTime, ui.profileBudget, ui.profileLocation, ui.profileUrgency].forEach((field) => field.addEventListener('change', updateProfileStatus));
    $('generate-id').addEventListener('click', () => {
      const code = Math.random().toString(36).slice(2, 7).toUpperCase();
      ui.userId.value = 'oz-' + code;
      updateReturningUser();
      ui.userId.focus();
    });
    ui.profileContinue.addEventListener('click', commitStartProfile);
    if (ui.editProfile) ui.editProfile.addEventListener('click', () => showProfileFields());
    ui.start.addEventListener('click', enterOrbit);
    ui.resume.addEventListener('click', resumeSaved);
    ui.aiPathwayRetry.addEventListener('click', () => requestPathwayGuidance(true));
    $('return-to-dock').addEventListener('click', () => {
      showWelcomeForCurrentState();
    });
    $('brand-home').addEventListener('click', () => {
      if (mode === 'welcome') return;
      showWelcomeForCurrentState();
    });
    ui.viewProfile.addEventListener('click', showResults);
    $('back-to-world').addEventListener('click', () => {
      mode = 'world';
      showScreen('game-screen');
      updateHud();
      ui.canvas.focus({ preventScroll: true });
    });
    $('new-timeline').addEventListener('click', newTimeline);
    ui.modalLayer.addEventListener('click', (event) => {
      if (event.target === ui.modalLayer) { closeModal(); return; }
      const actionElement = event.target.closest('[data-action]');
      if (actionElement) handleAction(actionElement.dataset.action, actionElement);
    });
    document.addEventListener('keydown', (event) => {
      const direction = keyToDirection(event.key);
      if (modal) {
        if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
        if (event.key === 'Tab') { trapFocus(event); return; }
        if (modal.type === 'mosaic' && direction) { event.preventDefault(); moveMosaic(direction); }
        return;
      }
      if (mode !== 'world' || isTextEntry(event.target)) return;
      const normalized = event.key.toLowerCase();
      if (direction) {
        pressed.add(normalized);
        event.preventDefault();
      }
      if (normalized === 'e' && !event.repeat) {
        event.preventDefault();
        interact();
      }
    });
    document.addEventListener('keyup', (event) => pressed.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => pressed.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });
  }
  function init() {
    const activeUser = readActiveUserId();
    if (activeUser) ui.userId.value = activeUser;
    renderEducationStages(ui.profileCountry.value, '');
    renderCustomization();
    updateReturningUser();
    showProfileFields();
    attachEvents();
    window.requestAnimationFrame(frame);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
