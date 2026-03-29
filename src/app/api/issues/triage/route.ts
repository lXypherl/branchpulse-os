import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateCompletion } from '@/lib/ai';

// Rule-based fallback when Ollama is offline
function ruleBasedTriage(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();

  // Severity detection
  let severity = 'MEDIUM';
  let severityConfidence = 60;
  if (text.match(/fire|emergency|hazard|toxic|injury|critical|immediate|danger|contamination|temperature deviation/)) {
    severity = 'CRITICAL'; severityConfidence = 85;
  } else if (text.match(/broken|failure|violation|expired|blocked|overdue|urgent/)) {
    severity = 'HIGH'; severityConfidence = 75;
  } else if (text.match(/minor|cosmetic|signage|label|outdated|delay/)) {
    severity = 'LOW'; severityConfidence = 70;
  }

  // Category detection
  let category = 'Operations';
  let categoryConfidence = 55;
  if (text.match(/fire|safety|hazard|emergency|exit|extinguisher|temperature|storage|hygiene/)) {
    category = 'Safety'; categoryConfidence = 80;
  } else if (text.match(/security|theft|lock|alarm|access|unauthorized/)) {
    category = 'Security'; categoryConfidence = 80;
  } else if (text.match(/inventory|stock|supply|shortage|expired product/)) {
    category = 'Inventory'; categoryConfidence = 75;
  } else if (text.match(/maintenance|repair|hvac|plumbing|electrical|equipment/)) {
    category = 'Maintenance'; categoryConfidence = 75;
  } else if (text.match(/compliance|audit|certification|license|permit|training/)) {
    category = 'Compliance'; categoryConfidence = 75;
  } else if (text.match(/brand|signage|display|uniform|appearance/)) {
    category = 'Brand Standards'; categoryConfidence = 70;
  }

  // Role suggestion
  let suggestedRole = 'BRANCH_MANAGER';
  let roleConfidence = 50;
  if (severity === 'CRITICAL') { suggestedRole = 'REGIONAL_MANAGER'; roleConfidence = 70; }
  if (category === 'Maintenance') { suggestedRole = 'AREA_MANAGER'; roleConfidence = 65; }

  return {
    severity: { value: severity, confidence: severityConfidence },
    category: { value: category, confidence: categoryConfidence },
    suggestedRole: { value: suggestedRole, confidence: roleConfidence },
    source: 'rules' as const,
  };
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description } = await request.json();
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  // Try Ollama first
  const prompt = `Analyze this issue and respond ONLY with valid JSON (no other text):
{"severity": "CRITICAL" or "HIGH" or "MEDIUM" or "LOW", "severityConfidence": 0-100, "category": one of "Safety","Security","Compliance","Maintenance","Operations","Inventory","Brand Standards","IT", "categoryConfidence": 0-100, "suggestedRole": "BRANCH_MANAGER" or "AREA_MANAGER" or "REGIONAL_MANAGER", "roleConfidence": 0-100}

Issue Title: ${title}
Issue Description: ${description || 'No description provided'}`;

  const aiResponse = await generateCompletion(prompt, 'You are an operations issue triage system. Respond ONLY with JSON.');

  if (aiResponse) {
    try {
      // Try to parse JSON from the response (handle markdown code blocks)
      const jsonStr = aiResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({
        severity: { value: parsed.severity, confidence: parsed.severityConfidence || 70 },
        category: { value: parsed.category, confidence: parsed.categoryConfidence || 70 },
        suggestedRole: { value: parsed.suggestedRole, confidence: parsed.roleConfidence || 60 },
        source: 'ai',
      });
    } catch {
      // AI returned garbage, fall through to rules
    }
  }

  // Fallback to rules
  return NextResponse.json(ruleBasedTriage(title, description || ''));
}
