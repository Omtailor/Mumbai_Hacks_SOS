// AI Analysis System for SOS Requests
export interface AnalysisResult {
  priority: 'critical' | 'high' | 'medium' | 'low' | 'minimal' | 'spam';
  category: 'medical' | 'food' | 'shelter' | 'trapped' | 'other';
  score: number;
  reasoning: string;
}

const SEVERITY_KEYWORDS = {
  high: ['bleeding', 'blood', 'unconscious', 'not breathing', 'heart attack', 'stroke', 'overdose', 'severe pain', 'dying', 'death', 'critical', 'emergency', 'urgent', 'brain damage', 'broken bone', 'fracture', 'accident', 'fire', 'explosion'],
  medium: ['pain', 'injury', 'hurt', 'sick', 'fever', 'medical', 'help', 'assistance', 'trapped', 'stuck'],
  low: ['minor', 'small', 'question', 'information', 'lost', 'stranded']
};

const IMMEDIACY_KEYWORDS = {
  critical: ['now', 'immediately', 'urgent', 'emergency', 'dying', 'critical', 'can\'t breathe', 'heart attack', 'stroke'],
  moderate: ['soon', 'help', 'need', 'assistance', 'pain', 'hurt'],
  low: ['later', 'when possible', 'information', 'question']
};

const VULNERABILITY_KEYWORDS = {
  high: ['child', 'children', 'baby', 'infant', 'elderly', 'old', 'disabled', 'pregnant', 'wheelchair'],
  medium: ['adult', 'person'],
  low: ['minor concern', 'small issue']
};

const SPAM_KEYWORDS = ['test', 'testing', 'hello', 'hi', 'fake', 'joke', 'lol', 'haha', 'spam', 'ignore'];

const CATEGORY_KEYWORDS = {
  medical: ['bleeding', 'blood', 'injury', 'hurt', 'pain', 'sick', 'fever', 'unconscious', 'heart attack', 'stroke', 'overdose', 'medical', 'hospital', 'doctor', 'medicine', 'broken bone', 'fracture', 'breathing'],
  food: ['hungry', 'food', 'water', 'thirsty', 'starving', 'drink', 'meal', 'eat', 'nutrition', 'supplies'],
  shelter: ['cold', 'hot', 'weather', 'roof', 'homeless', 'shelter', 'house', 'building', 'protection', 'warmth'],
  trapped: ['trapped', 'stuck', 'locked', 'can\'t move', 'debris', 'collapsed', 'cave', 'elevator', 'basement', 'underground'],
  other: []
};

export function analyzeRequest(message: string, age: string, phone: string, name: string): AnalysisResult {
  const text = message.toLowerCase();
  
  // Check for spam
  const isSpam = SPAM_KEYWORDS.some(keyword => text.includes(keyword)) || 
                 text.length < 10 || 
                 /^(.)\1{4,}/.test(text); // Repeated characters
  
  if (isSpam) {
    return {
      priority: 'spam',
      category: 'other',
      score: 0,
      reasoning: 'Flagged by AI: Potential spam or test message detected'
    };
  }

  // Factor 1: Severity (S) - Weight: 0.35
  let severityScore = 0.1;
  let severityReason = '';
  for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      if (level === 'high') {
        severityScore = 1;
        severityReason = `severe symptoms (${matches.slice(0,2).join(', ')})`;
      } else if (level === 'medium' && severityScore < 0.5) {
        severityScore = 0.5;
        severityReason = `moderate symptoms (${matches.slice(0,2).join(', ')})`;
      } else if (level === 'low' && severityScore < 0.2) {
        severityScore = 0.1;
        severityReason = 'minor symptoms';
      }
      break;
    }
  }

  // Factor 2: Immediacy (T) - Weight: 0.25
  let immediacyScore = 0.1;
  let immediacyReason = '';
  for (const [level, keywords] of Object.entries(IMMEDIACY_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      if (level === 'critical') {
        immediacyScore = 1;
        immediacyReason = 'immediate action needed';
      } else if (level === 'moderate' && immediacyScore < 0.5) {
        immediacyScore = 0.5;
        immediacyReason = 'timely response needed';
      } else if (level === 'low' && immediacyScore < 0.2) {
        immediacyScore = 0.1;
        immediacyReason = 'non-urgent';
      }
      break;
    }
  }

  // Factor 3: Vulnerability (V) - Weight: 0.15
  let vulnerabilityScore = 0.5; // Default adult
  let vulnerabilityReason = '';
  
  // Age-based vulnerability
  if (age) {
    const ageNum = parseInt(age);
    if (ageNum <= 12) {
      vulnerabilityScore = 1;
      vulnerabilityReason = `child (age ${age})`;
    } else if (ageNum >= 65) {
      vulnerabilityScore = 1;
      vulnerabilityReason = `elderly (age ${age})`;
    } else {
      vulnerabilityScore = 0.5;
      vulnerabilityReason = `adult (age ${age})`;
    }
  }

  // Keyword-based vulnerability
  for (const [level, keywords] of Object.entries(VULNERABILITY_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      if (level === 'high') {
        vulnerabilityScore = Math.max(vulnerabilityScore, 1);
        vulnerabilityReason = vulnerabilityReason ? `${vulnerabilityReason}, vulnerable person` : 'vulnerable person';
      }
      break;
    }
  }

  // Factor 4: Credibility (C) - Weight: 0.15
  let credibilityScore = 1; // Default high confidence
  let credibilityReason = 'verified contact info';
  
  if (!phone || phone.length !== 10) {
    credibilityScore = 0.5;
    credibilityReason = 'incomplete contact info';
  }
  if (!name || name.length < 2) {
    credibilityScore = Math.min(credibilityScore, 0.5);
    credibilityReason = 'incomplete personal info';
  }

  // Factor 5: Escalation History (E) - Weight: 0.10
  let escalationScore = 0.5; // Default first-time
  let escalationReason = 'first-time request';

  // Calculate weighted priority score
  const priorityScore = 
    0.35 * severityScore + 
    0.25 * immediacyScore + 
    0.15 * vulnerabilityScore + 
    0.15 * credibilityScore + 
    0.10 * escalationScore;

  // Map score to priority level
  let priority: AnalysisResult['priority'], priorityLabel: string;
  if (priorityScore >= 0.8) {
    priority = 'critical';
    priorityLabel = 'Critical';
  } else if (priorityScore >= 0.6) {
    priority = 'high';
    priorityLabel = 'High';
  } else if (priorityScore >= 0.4) {
    priority = 'medium';
    priorityLabel = 'Medium';
  } else if (priorityScore >= 0.2) {
    priority = 'low';
    priorityLabel = 'Low';
  } else {
    priority = 'minimal';
    priorityLabel = 'Minimal';
  }

  // Determine category
  let category: AnalysisResult['category'] = 'other';
  let maxMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'other') continue;
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat as AnalysisResult['category'];
    }
  }

  // Generate reasoning
  const reasoningParts = [];
  if (severityReason) reasoningParts.push(severityReason);
  if (vulnerabilityReason) reasoningParts.push(vulnerabilityReason);
  if (immediacyReason) reasoningParts.push(immediacyReason);
  if (escalationReason && escalationScore !== 0.5) reasoningParts.push(escalationReason);
  if (credibilityScore < 1) reasoningParts.push(credibilityReason);

  const reasoning = `${priorityLabel} Priority because: ${reasoningParts.join(', ')}.`;

  return {
    priority,
    category,
    score: Math.round(priorityScore * 100) / 100,
    reasoning
  };
}