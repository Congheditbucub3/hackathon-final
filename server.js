'use strict';

/*
 * Orbit Zero is intentionally dependency-free. Node 18+ provides `fetch`, so
 * the OpenAI key stays on this server instead of being bundled into the game.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const MAX_REQUEST_BYTES = 48 * 1024;
const REQUEST_TIMEOUT_MS = 55_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const educationStages = {
  Singapore: ['Secondary', 'O-Level', 'N-Level', 'Junior College', 'A-Level', 'IB', 'Polytechnic', 'ITE', 'Undergraduate', 'Graduate'],
  'United States': ['Middle School', 'High School', 'AP/IB', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Undergraduate', 'Graduate'],
  Vietnam: ['Grade 10', 'Grade 11', 'Grade 12', 'National High School Exam preparation', 'Vocational', 'Undergraduate', 'Graduate']
};

const careerCatalog = {
  computer_science_ai: 'Computer Science & AI',
  engineering_automation: 'Engineering, Mechanics & Automation',
  business_finance: 'Business, Finance & Commerce',
  health_sciences: 'Health Sciences',
  psychology_social_work: 'Psychology & Social Work',
  education_learning: 'Education & Learning',
  law_public_policy: 'Law & Public Policy',
  environment_energy: 'Environment & Energy',
  agriculture_food: 'Agriculture & Food Technology',
  creative_design_media: 'Creative Design & Media'
};

/*
 * A deliberately small, server-side fallback database. It is not live
 * research: every card tells the player to check the linked official source.
 * The tiers are planning labels only, never estimates of admission odds.
 */
const curatedSchoolDatabase = {
  Singapore: [
    { tier: 'Reach', name: 'National University of Singapore', city: 'Singapore', sourceLinks: [{ label: 'Official admissions site', url: 'https://nus.edu.sg/oam/' }] },
    { tier: 'Match', name: 'Nanyang Technological University', city: 'Singapore', sourceLinks: [{ label: 'Official admissions site', url: 'https://www.ntu.edu.sg/admissions' }] },
    { tier: 'More Accessible', name: 'Singapore Institute of Technology', city: 'Singapore', sourceLinks: [{ label: 'Official admissions site', url: 'https://www.singaporetech.edu.sg/admissions' }] }
  ],
  'United States': [
    { tier: 'Reach', name: 'Massachusetts Institute of Technology', city: 'Cambridge, Massachusetts', sourceLinks: [{ label: 'Official admissions site', url: 'https://mitadmissions.org/' }] },
    { tier: 'Match', name: 'University of Illinois Urbana-Champaign', city: 'Champaign-Urbana, Illinois', sourceLinks: [{ label: 'Official admissions site', url: 'https://www.admissions.illinois.edu/' }] },
    { tier: 'More Accessible', name: 'Arizona State University', city: 'Tempe, Arizona', sourceLinks: [{ label: 'Official admissions site', url: 'https://admission.asu.edu/' }] }
  ],
  Vietnam: [
    { tier: 'Reach', name: 'Vietnam National University, Hanoi', city: 'Hanoi', sourceLinks: [{ label: 'Official university site', url: 'https://en.vnu.edu.vn/' }] },
    { tier: 'Match', name: 'Hanoi University of Science and Technology', city: 'Hanoi', sourceLinks: [{ label: 'Official university site', url: 'https://en.hust.edu.vn/' }] },
    { tier: 'More Accessible', name: 'FPT University', city: 'Hanoi', sourceLinks: [{ label: 'Official university site', url: 'https://daihoc.fpt.edu.vn/' }] }
  ]
};

const curatedCareerDatabase = {
  computer_science_ai: {
    programmeTypes: ['Computer Science', 'Software Engineering', 'Data Science or Artificial Intelligence'],
    preparation: 'mathematics, logical reasoning, and programming fundamentals',
    experience: 'Build a small coded project, document what you learned, and seek a supervised project or internship.',
    firstRole: 'Junior software developer, data analyst, or AI support role',
    tradeoffs: ['Tools change quickly, so continuing practice matters.', 'Some routes are theory-heavy before they become project-heavy.']
  },
  engineering_automation: {
    programmeTypes: ['Mechanical Engineering', 'Mechatronics or Automation Engineering', 'Electrical or Robotics Engineering'],
    preparation: 'mathematics, physics, systems thinking, and practical problem solving',
    experience: 'Create a small build log, technical sketch, or prototype and look for a lab, maker, or industry placement.',
    firstRole: 'Junior automation, mechanical, or systems engineering role',
    tradeoffs: ['Hands-on learning can require equipment and on-site time.', 'Programme sequences can be structured around prerequisite modules.']
  },
  business_finance: {
    programmeTypes: ['Business Administration', 'Finance', 'Business Analytics or Economics'],
    preparation: 'numeracy, evidence-based decisions, communication, and spreadsheet habits',
    experience: 'Analyse a small public dataset or local business case and seek a project, club role, or internship.',
    firstRole: 'Business analyst, operations associate, or finance support role',
    tradeoffs: ['Work can be deadline-heavy and communication-intensive.', 'Some specialised roles may need further professional learning.']
  },
  health_sciences: {
    programmeTypes: ['Health Sciences', 'Public Health', 'Biomedical Science'],
    preparation: 'scientific literacy, care with evidence, communication, and sustained study habits',
    experience: 'Explore an approved health, science, or community project and seek supervised exposure where appropriate.',
    firstRole: 'Health programme, laboratory, research, or patient-services support role',
    tradeoffs: ['Some health routes have regulated or placement-based requirements.', 'Training can take longer before income becomes predictable.']
  },
  psychology_social_work: {
    programmeTypes: ['Psychology', 'Social Work', 'Community Development or Human Services'],
    preparation: 'research literacy, ethical reflection, active listening, and clear writing',
    experience: 'Join a supervised community activity or research project and reflect on boundaries and ethical practice.',
    firstRole: 'Community programme, research, or social-services support role',
    tradeoffs: ['People-facing work needs sustainable boundaries and supervision.', 'Some professional practice routes require additional accredited study.']
  },
  education_learning: {
    programmeTypes: ['Education', 'Learning Sciences', 'Educational Technology'],
    preparation: 'communication, structured planning, subject knowledge, and feedback skills',
    experience: 'Design a short learning activity, tutor with supervision, or contribute to an education project.',
    firstRole: 'Learning support, training, education programme, or edtech support role',
    tradeoffs: ['Impact often comes through ongoing preparation and feedback cycles.', 'Teaching pathways can have country-specific certification rules.']
  },
  law_public_policy: {
    programmeTypes: ['Law', 'Public Policy', 'Public Administration or International Relations'],
    preparation: 'close reading, structured argument, research, and careful writing',
    experience: 'Write an evidence-based brief on a local issue and seek a debate, civic, policy, or legal-observation experience.',
    firstRole: 'Policy, compliance, legal-services, or public-programme support role',
    tradeoffs: ['Routes may involve long reading and evidence trails.', 'Professional legal practice has country-specific qualifying requirements.']
  },
  environment_energy: {
    programmeTypes: ['Environmental Science', 'Environmental Engineering', 'Energy Systems or Sustainability'],
    preparation: 'science, data interpretation, systems thinking, and local environmental observation',
    experience: 'Document a local sustainability problem and join a supervised research, field, or community project.',
    firstRole: 'Sustainability, environmental data, or energy-programme support role',
    tradeoffs: ['Work can combine desk analysis with field or site activity.', 'Some roles depend on local industry and regulatory context.']
  },
  agriculture_food: {
    programmeTypes: ['Food Science', 'Agricultural Technology', 'Biotechnology'],
    preparation: 'biology, chemistry, process thinking, and practical experiments',
    experience: 'Run a documented food, biology, or systems project and explore supervised laboratory or production exposure.',
    firstRole: 'Food technology, quality, laboratory, or agricultural-innovation support role',
    tradeoffs: ['Some work is site-based rather than remote.', 'Practical placements can shape the timing and location of study.']
  },
  creative_design_media: {
    programmeTypes: ['Design', 'Interaction Design', 'Digital Media or Visual Communication'],
    preparation: 'visual practice, storytelling, iteration, and feedback habits',
    experience: 'Make a small portfolio piece, record revisions, and seek a critique, club project, or internship.',
    firstRole: 'Junior designer, content, media, or creative-production role',
    tradeoffs: ['Portfolio quality and iteration can matter as much as coursework.', 'Freelance and project work can make income timing less predictable.']
  }
};

const academicBands = ['Building foundations', 'Developing', 'Strong', 'Excellent'];
const timeOptions = ['threeMonths', 'oneYear', 'twoYears', 'fourYears'];
const budgetOptions = ['low', 'medium', 'flexible'];
const locationOptions = ['home', 'city', 'remote'];
const urgencyOptions = ['needsNow', 'soon', 'flexible'];
const componentKeys = ['problemSolving', 'skills', 'values', 'constraints', 'market'];
const signalKeys = ['analyticalThinking', 'creativeProblemFraming', 'planning', 'collaboration', 'evidenceSeeking', 'riskPreference'];
const valueKeys = ['stability', 'growth', 'creativity', 'autonomy', 'balance', 'socialImpact'];
const rateBuckets = new Map();

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, text) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  response.end(text);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function enumValue(value, allowed, label) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new HttpError(400, 'INVALID_PAYLOAD', 'Invalid ' + label + '.');
  }
  return value;
}

function boundedNumber(value, label, minimum, maximum) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new HttpError(400, 'INVALID_PAYLOAD', 'Invalid ' + label + '.');
  }
  return Math.round(value * 100) / 100;
}

function pickNumericObject(value, keys, label, minimum, maximum) {
  if (value === undefined) return {};
  if (!isPlainObject(value)) throw new HttpError(400, 'INVALID_PAYLOAD', 'Invalid ' + label + '.');
  const picked = {};
  for (const key of keys) {
    if (value[key] !== undefined) picked[key] = boundedNumber(value[key], label + '.' + key, minimum, maximum);
  }
  return picked;
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const contentLength = Number(request.headers['content-length']);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      request.resume();
      reject(new HttpError(413, 'BODY_TOO_LARGE', 'Request body is too large.'));
      return;
    }

    const chunks = [];
    let size = 0;
    let settled = false;
    request.on('data', (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        settled = true;
        chunks.length = 0;
        reject(new HttpError(413, 'BODY_TOO_LARGE', 'Request body is too large.'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (settled) return;
      settled = true;
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw) throw new Error('empty');
        resolve(JSON.parse(raw));
      } catch (_) {
        reject(new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON.'));
      }
    });
    request.on('error', () => {
      if (!settled) {
        settled = true;
        reject(new HttpError(400, 'INVALID_REQUEST', 'Unable to read request body.'));
      }
    });
  });
}

function isSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const forwardedHost = String(request.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const host = forwardedHost || request.headers.host;
  const forwardedProtocol = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProtocol || 'http';
  return Boolean(host) && origin === protocol + '://' + host;
}

function clientAddress(request) {
  return String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

function withinRateLimit(request) {
  const now = Date.now();
  const address = clientAddress(request);
  const bucket = rateBuckets.get(address);
  if (!bucket || now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(address, { startedAt: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX_REQUESTS;
}

function validatePathwayPayload(body) {
  if (!isPlainObject(body) || !isPlainObject(body.profile) || !isPlainObject(body.game)) {
    throw new HttpError(400, 'INVALID_PAYLOAD', 'A profile and game result are required.');
  }

  const profile = body.profile;
  const country = enumValue(profile.country, Object.keys(educationStages), 'country');
  const educationStage = enumValue(profile.educationStage, educationStages[country], 'education stage');
  const academicBand = enumValue(profile.academicBand, academicBands, 'academic-performance band');
  const studyTime = enumValue(profile.studyTime || profile.time, timeOptions, 'study time');
  const budget = enumValue(profile.budget, budgetOptions, 'budget');
  const location = enumValue(profile.location, locationOptions, 'location');
  const incomeUrgency = enumValue(profile.incomeUrgency || profile.urgency, urgencyOptions, 'income urgency');

  const game = body.game;
  const topCareers = Array.isArray(game.topCareers) ? game.topCareers : game.top_paths;
  if (!Array.isArray(topCareers) || topCareers.length !== 3) {
    throw new HttpError(400, 'INVALID_PAYLOAD', 'Exactly three career results are required.');
  }

  const uniqueIds = new Set();
  const normalizedCareers = topCareers.map((career, index) => {
    if (!isPlainObject(career)) throw new HttpError(400, 'INVALID_PAYLOAD', 'Invalid career result.');
    const id = enumValue(career.id, Object.keys(careerCatalog), 'career id');
    if (uniqueIds.has(id)) throw new HttpError(400, 'INVALID_PAYLOAD', 'Career results must be unique.');
    uniqueIds.add(id);
    const score = boundedNumber(career.score, 'career score', 0, 100);
    return {
      id,
      title: careerCatalog[id],
      score,
      rank: index + 1,
      components: pickNumericObject(career.components, componentKeys, 'career components', 0, 100)
    };
  });

  return {
    profile: { country, educationStage, academicBand, studyTime, budget, location, incomeUrgency },
    game: {
      topCareers: normalizedCareers,
      signals: pickNumericObject(game.signals, signalKeys, 'game signals', 0, 1),
      values: pickNumericObject(game.values, valueKeys, 'game values', 0, 10)
    }
  };
}

const pathwaySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    pathways: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          careerId: { type: 'string', enum: Object.keys(careerCatalog) },
          careerName: { type: 'string' },
          fitSummary: { type: 'string' },
          programmeTypes: { type: 'array', items: { type: 'string' } },
          progression: {
            type: 'object',
            additionalProperties: false,
            properties: {
              currentStage: { type: 'string' },
              subjectsAndQualifications: { type: 'string' },
              universityProgramme: { type: 'string' },
              portfolioOrInternship: { type: 'string' },
              firstRole: { type: 'string' },
              optionalGraduateStudy: { type: 'string' }
            },
            required: ['currentStage', 'subjectsAndQualifications', 'universityProgramme', 'portfolioOrInternship', 'firstRole', 'optionalGraduateStudy']
          },
          tradeoffs: { type: 'array', items: { type: 'string' } },
          schools: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                tier: { type: 'string', enum: ['Reach', 'Match', 'More Accessible'] },
                name: { type: 'string' },
                country: { type: 'string' },
                city: { type: 'string' },
                programme: { type: 'string' },
                whyMatch: { type: 'string' },
                admissionContext: { type: 'string' },
                sourceLinks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: { label: { type: 'string' }, url: { type: 'string' } },
                    required: ['label', 'url']
                  }
                }
              },
              required: ['tier', 'name', 'country', 'city', 'programme', 'whyMatch', 'admissionContext', 'sourceLinks']
            }
          }
        },
        required: ['careerId', 'careerName', 'fitSummary', 'programmeTypes', 'progression', 'tradeoffs', 'schools']
      }
    },
    researchNotes: { type: 'string' },
    disclaimer: { type: 'string' }
  },
  required: ['pathways', 'researchNotes', 'disclaimer']
};

const researchInstructions = [
  'You are Orbit Zero Pathfinder, an evidence-minded educational pathway guide. This is guidance, not a diagnosis or professional admissions advice.',
  'Use the web-search tool before answering. Research current official university programme and admissions pages for every proposed school. Prefer official university and government admissions pages. Return official source URLs in sourceLinks whenever possible.',
  'For the player\'s three requested careers, return exactly three schools each, in this exact order: Reach, Match, More Accessible. These labels are qualitative planning labels based only on the stated background, published entry information, capacity, and constraints. They are not acceptance-rate claims and never promise admission.',
  'Do not invent or estimate acceptance rates, programme availability, rankings, scholarships, prerequisite subjects, or admissions rules. If comparable current data is unavailable, say so plainly in admissionContext or researchNotes. Never promise admission.',
  'Keep recommendations relevant to the player\'s country and education stage, while suggesting study destinations in Singapore, the United States, or Vietnam when a cross-country option is appropriate. Explain cost, study length, location, and income-timing trade-offs concretely but cautiously.',
  'Use short, practical wording. The progression must cover current stage, subjects or qualifications, university programme, portfolio or internship, first role, and optional master\'s or PhD.',
  'Treat the supplied game scores and preferences as self-reported signals only; do not infer protected traits, mental health, or certainty about a person\'s future.'
].join('\n');

function boundedText(value, label, maximum, minimum = 1) {
  if (typeof value !== 'string') throw new Error('Invalid AI output: ' + label + '.');
  const text = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length < minimum || text.length > maximum) throw new Error('Invalid AI output: ' + label + '.');
  return text;
}

function boundedTextList(value, label, minimum, maximum, itemMaximum) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) throw new Error('Invalid AI output: ' + label + '.');
  return value.map((item, index) => boundedText(item, label + '[' + index + ']', itemMaximum));
}

function safeHttpsUrl(value) {
  if (typeof value !== 'string' || value.length > 500) throw new Error('Invalid AI output: source URL.');
  let url;
  try {
    url = new URL(value);
  } catch (_) {
    throw new Error('Invalid AI output: source URL.');
  }
  const hostname = url.hostname.toLowerCase();
  const isPrivateIpv4 = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
  if (url.protocol !== 'https:' || !hostname || url.username || url.password || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' || isPrivateIpv4) {
    throw new Error('Invalid AI output: source URL.');
  }
  return url.toString();
}

function normalizeSources(value) {
  if (!Array.isArray(value) || value.length > 3) throw new Error('Invalid AI output: source links.');
  return value.map((item, index) => {
    if (!isPlainObject(item)) throw new Error('Invalid AI output: source link.');
    return {
      label: boundedText(item.label, 'source link ' + index + ' label', 120),
      url: safeHttpsUrl(item.url)
    };
  });
}

function normalizePathwayOutput(value, expectedCareers) {
  if (!isPlainObject(value) || !Array.isArray(value.pathways) || value.pathways.length !== 3) {
    throw new Error('Invalid AI output: pathways.');
  }

  const expectedTiers = ['Reach', 'Match', 'More Accessible'];
  const pathways = value.pathways.map((rawPathway, pathwayIndex) => {
    if (!isPlainObject(rawPathway)) throw new Error('Invalid AI output: pathway.');
    const expectedCareer = expectedCareers[pathwayIndex];
    if (rawPathway.careerId !== expectedCareer.id) throw new Error('Invalid AI output: career order.');
    if (!Array.isArray(rawPathway.schools) || rawPathway.schools.length !== 3) throw new Error('Invalid AI output: schools.');
    const rawProgression = rawPathway.progression;
    if (!isPlainObject(rawProgression)) throw new Error('Invalid AI output: progression.');

    const schools = rawPathway.schools.map((school, schoolIndex) => {
      if (!isPlainObject(school) || school.tier !== expectedTiers[schoolIndex]) {
        throw new Error('Invalid AI output: school tier order.');
      }
      return {
        tier: school.tier,
        name: boundedText(school.name, 'school name', 160),
        country: boundedText(school.country, 'school country', 80),
        city: boundedText(school.city, 'school city', 100),
        programme: boundedText(school.programme, 'school programme', 220),
        whyMatch: boundedText(school.whyMatch, 'school rationale', 700),
        admissionContext: boundedText(school.admissionContext, 'admission context', 900),
        sourceLinks: normalizeSources(school.sourceLinks)
      };
    });

    return {
      careerId: expectedCareer.id,
      careerName: expectedCareer.title,
      fitSummary: boundedText(rawPathway.fitSummary, 'fit summary', 900),
      programmeTypes: boundedTextList(rawPathway.programmeTypes, 'programme types', 1, 5, 180),
      progression: {
        currentStage: boundedText(rawProgression.currentStage, 'current stage', 450),
        subjectsAndQualifications: boundedText(rawProgression.subjectsAndQualifications, 'subjects and qualifications', 550),
        universityProgramme: boundedText(rawProgression.universityProgramme, 'university programme', 450),
        portfolioOrInternship: boundedText(rawProgression.portfolioOrInternship, 'portfolio or internship', 450),
        firstRole: boundedText(rawProgression.firstRole, 'first role', 350),
        optionalGraduateStudy: boundedText(rawProgression.optionalGraduateStudy, 'graduate study', 450)
      },
      tradeoffs: boundedTextList(rawPathway.tradeoffs, 'tradeoffs', 1, 5, 380),
      schools
    };
  });

  return {
    pathways,
    researchNotes: boundedText(value.researchNotes, 'research notes', 900, 0),
    disclaimer: boundedText(value.disclaimer, 'disclaimer', 500)
  };
}

function labelFor(value, labels) {
  return labels[value] || value;
}

function buildCuratedDatabaseFallback(payload) {
  const profile = payload.profile;
  const schools = curatedSchoolDatabase[profile.country];
  const timeLabel = labelFor(profile.studyTime, { threeMonths: 'a short study window', oneYear: 'about one year', twoYears: 'about two years', fourYears: 'four or more years' });
  const budgetLabel = labelFor(profile.budget, { low: 'a limited budget', medium: 'a medium budget', flexible: 'a flexible budget' });
  const locationLabel = labelFor(profile.location, { home: 'near home', city: 'a big city', remote: 'remote-friendly options where possible' });
  const urgencyLabel = labelFor(profile.incomeUrgency, { needsNow: 'income needed now', soon: 'income wanted within six months', flexible: 'a flexible income timeline' });

  const pathways = payload.game.topCareers.map((career) => {
    const guide = curatedCareerDatabase[career.id];
    if (!guide) throw new Error('Missing curated career database entry.');
    return {
      careerId: career.id,
      careerName: career.title,
      fitSummary: career.title + ' remained in the player\'s top-three game result (' + career.score + '/100). It is a reflective route to compare with their ' + profile.academicBand.toLowerCase() + ' academic-performance band and current planning preferences, not a diagnosis.',
      programmeTypes: guide.programmeTypes,
      progression: {
        currentStage: 'Current stage: ' + profile.educationStage + ' in ' + profile.country + '.',
        subjectsAndQualifications: 'Explore the current subject and qualification expectations for ' + guide.programmeTypes[0] + ' through each linked official site; build foundations in ' + guide.preparation + '.',
        universityProgramme: 'Compare current programme routes related to ' + guide.programmeTypes.join(', ') + ' before choosing where to apply.',
        portfolioOrInternship: guide.experience,
        firstRole: 'Possible first direction: ' + guide.firstRole + '.',
        optionalGraduateStudy: 'Later specialisation can be considered only if it supports a clear interest, role goal, or research question.'
      },
      tradeoffs: guide.tradeoffs.concat([
        'Your plan currently points to ' + timeLabel + ', ' + budgetLabel + ', and study ' + locationLabel + '; compare current costs, duration, and placement formats directly with each school.',
        'Your income preference is ' + urgencyLabel + '; consider how study and placement timing could affect that goal.'
      ]),
      schools: schools.map((school) => ({
        tier: school.tier,
        name: school.name,
        country: profile.country,
        city: school.city,
        programme: 'Programme type to check: ' + guide.programmeTypes[0] + '.',
        whyMatch: school.tier + ' is a planning label for comparing this school with the player\'s current stage, preferences, and ' + career.title + ' interest. It is not an estimate of admission likelihood.',
        admissionContext: 'This is a curated-database starting point, not live research. Use the official source to check the current route for a ' + profile.educationStage + ' learner from ' + profile.country + '. Orbit Zero does not compare or estimate admission rates.',
        sourceLinks: school.sourceLinks.map((source) => ({ label: source.label, url: source.url }))
      }))
    };
  });

  return normalizePathwayOutput({
    pathways,
    researchNotes: 'AI pathway guidance is temporarily unavailable. These school cards come from Orbit Zero\'s curated server-side school database, not live web research. Verify programme availability and current admissions information through the linked official sites.',
    disclaimer: 'Guidance only. Reach, Match, and More Accessible are planning labels, not acceptance-rate claims, rankings, admission estimates, or guarantees.'
  }, payload.game.topCareers);
}

function extractOutputText(apiResponse) {
  if (typeof apiResponse.output_text === 'string' && apiResponse.output_text.trim()) return apiResponse.output_text;
  if (!Array.isArray(apiResponse.output)) return '';
  return apiResponse.output
    .filter((item) => item && item.type === 'message' && Array.isArray(item.content))
    .flatMap((item) => item.content)
    .filter((content) => content && content.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text)
    .join('\n');
}

async function requestPathwayGuidance(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new HttpError(503, 'AI_UNAVAILABLE', 'AI pathway guidance is temporarily unavailable.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  timeout.unref();

  try {
    const body = {
      model: process.env.OPENAI_MODEL || 'gpt-5.5',
      store: false,
      instructions: researchInstructions,
      input: [{
        role: 'user',
        content: [{
          type: 'input_text',
          text: JSON.stringify({
            task: 'Create current, source-backed pathway guidance from this validated anonymous player profile and game result.',
            player: payload
          })
        }]
      }],
      tools: [{ type: 'web_search_preview', search_context_size: 'medium' }],
      tool_choice: 'required',
      max_tool_calls: 10,
      max_output_tokens: 8000,
      include: ['web_search_call.action.sources'],
      text: {
        format: {
          type: 'json_schema',
          name: 'orbit_zero_pathway_guidance',
          strict: true,
          schema: pathwaySchema
        }
      }
    };

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    let apiResponse;
    try {
      apiResponse = await upstream.json();
    } catch (_) {
      throw new Error('OpenAI returned a non-JSON response.');
    }
    if (!upstream.ok || !apiResponse || apiResponse.status !== 'completed') {
      const status = Number(upstream.status) || 0;
      console.error('[pathway] OpenAI request was unavailable (status ' + status + ').');
      throw new HttpError(503, 'AI_UNAVAILABLE', 'AI pathway guidance is temporarily unavailable.');
    }

    let parsed;
    try {
      parsed = JSON.parse(extractOutputText(apiResponse));
    } catch (_) {
      throw new Error('OpenAI response did not contain valid structured JSON.');
    }
    return normalizePathwayOutput(parsed, payload.game.topCareers);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('[pathway] AI guidance failed safely.');
    throw new HttpError(503, 'AI_UNAVAILABLE', 'AI pathway guidance is temporarily unavailable.');
  } finally {
    clearTimeout(timeout);
  }
}

async function handlePathwayRequest(request, response) {
  if (!isSameOrigin(request) || request.headers['sec-fetch-site'] === 'cross-site') {
    sendJson(response, 403, { ok: false, code: 'SAME_ORIGIN_REQUIRED', message: 'This endpoint is available from Orbit Zero only.' });
    return;
  }
  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    sendJson(response, 415, { ok: false, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Send JSON to this endpoint.' });
    return;
  }
  if (!withinRateLimit(request)) {
    sendJson(response, 429, { ok: false, code: 'RATE_LIMITED', message: 'Please wait before requesting another pathway update.' });
    return;
  }

  try {
    const payload = validatePathwayPayload(await readJson(request));
    let guidance;
    let source = 'live_research';
    let fallback = false;
    try {
      guidance = await requestPathwayGuidance(payload);
    } catch (error) {
      if (!(error instanceof HttpError) || error.code !== 'AI_UNAVAILABLE') throw error;
      guidance = buildCuratedDatabaseFallback(payload);
      source = 'curated_database';
      fallback = true;
      console.warn('[pathway] Serving curated database fallback.');
    }
    sendJson(response, 200, {
      ok: true,
      ...guidance,
      generatedAt: new Date().toISOString(),
      source,
      fallback
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 503;
    const code = error instanceof HttpError ? error.code : 'AI_UNAVAILABLE';
    const message = error instanceof HttpError ? error.message : 'AI pathway guidance is temporarily unavailable.';
    sendJson(response, status, { ok: false, code, message });
  }
}

function serveStatic(request, response, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method not allowed');
    return;
  }
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  if (requestedPath.split('/').filter(Boolean).some((segment) => segment.startsWith('.'))) {
    sendText(response, 403, 'Forbidden');
    return;
  }
  const filePath = path.resolve(root, '.' + requestedPath);
  if (!(filePath === root || filePath.startsWith(root + path.sep))) {
    sendText(response, 403, 'Forbidden');
    return;
  }
  const relativePath = path.relative(root, filePath);
  if (relativePath.split(path.sep).some((segment) => segment.startsWith('.'))) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendText(response, statError && statError.code === 'ENOENT' ? 404 : 403, statError && statError.code === 'ENOENT' ? 'Not found' : 'Forbidden');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(filePath).on('error', () => sendText(response, 500, 'Server error')).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch (_) {
    sendText(response, 400, 'Bad request');
    return;
  }

  if (pathname === '/api/pathway') {
    if (request.method !== 'POST') {
      sendJson(response, 405, { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Use POST for pathway guidance.' });
      return;
    }
    void handlePathwayRequest(request, response);
    return;
  }
  serveStatic(request, response, pathname);
});

server.listen(port, '0.0.0.0', () => {
  console.log('Orbit Zero is running on port ' + port);
});
