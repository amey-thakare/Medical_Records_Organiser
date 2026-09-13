

interface ExtractedParameter {
  parameterName: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  status: 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN';
}

const PARAMETER_RULES = [
  {
    name: 'Hemoglobin',
    keywords: ['hemoglobin', 'hb', 'hgb'],
    pattern: /((?:hemoglobin|hb|hgb)[\s:.-]*)([\d.]+)\s*(g\/dl|g\/l|mmol\/l)?/i,
    min: 12.0,
    max: 17.5,
  },
  {
    name: 'Blood Glucose',
    keywords: ['glucose', 'fasting blood sugar', 'fbs', 'random blood sugar', 'rbs', 'blood sugar'],
    pattern: /((?:glucose|blood sugar|fbs|rbs)[\s:.-]*)([\d.]+)\s*(mg\/dl|mmol\/l)?/i,
    min: 70,
    max: 140, // General reference
  },
  {
    name: 'HbA1c',
    keywords: ['hba1c', 'glycated hemoglobin', 'a1c'],
    pattern: /((?:hba1c|a1c)[\s:.-]*)([\d.]+)\s*(%)?/i,
    min: 4.0,
    max: 5.6,
  },
  {
    name: 'Total Cholesterol',
    keywords: ['total cholesterol', 'cholesterol total'],
    pattern: /((?:total cholesterol|cholesterol)[\s:.-]*)([\d.]+)\s*(mg\/dl|mmol\/l)?/i,
    min: 125,
    max: 200,
  },
  {
    name: 'HDL',
    keywords: ['hdl', 'hdl cholesterol', 'high density lipoprotein'],
    pattern: /((?:hdl|hdl cholesterol)[\s:.-]*)([\d.]+)\s*(mg\/dl|mmol\/l)?/i,
    min: 40,
    max: 100,
  },
  {
    name: 'LDL',
    keywords: ['ldl', 'ldl cholesterol', 'low density lipoprotein'],
    pattern: /((?:ldl|ldl cholesterol)[\s:.-]*)([\d.]+)\s*(mg\/dl|mmol\/l)?/i,
    min: 0,
    max: 100,
  },
  {
    name: 'Triglycerides',
    keywords: ['triglycerides', 'trig'],
    pattern: /((?:triglycerides|trig)[\s:.-]*)([\d.]+)\s*(mg\/dl|mmol\/l)?/i,
    min: 0,
    max: 150,
  },
  {
    name: 'WBC',
    keywords: ['wbc', 'white blood cell', 'leukocytes'],
    pattern: /((?:wbc|white blood cell|leukocytes)[\s:.-]*)([\d.]+)\s*(x10\^3\/ul|thou\/ul|10\^9\/l)?/i,
    min: 4.5,
    max: 11.0,
  },
  {
    name: 'RBC',
    keywords: ['rbc', 'red blood cell', 'erythrocytes'],
    pattern: /((?:rbc|red blood cell|erythrocytes)[\s:.-]*)([\d.]+)\s*(m\/ul|mil\/ul|10\^12\/l)?/i,
    min: 4.0,
    max: 5.9,
  },
  {
    name: 'Platelets',
    keywords: ['platelet', 'plt', 'thrombocytes'],
    pattern: /((?:platelet|plt|thrombocytes)[\s:.-]*)([\d.]+)\s*(x10\^3\/ul|thou\/ul|10\^9\/l)?/i,
    min: 150,
    max: 450,
  },
  {
    name: 'TSH',
    keywords: ['tsh', 'thyroid stimulating hormone'],
    pattern: /((?:tsh)[\s:.-]*)([\d.]+)\s*(uiu\/ml|miu\/l|miu\/ml)?/i,
    min: 0.4,
    max: 4.0,
  }
];

export const extractHealthParameters = (text: string): ExtractedParameter[] => {
  const extracted: ExtractedParameter[] = [];
  const normalizedText = text.toLowerCase().replace(/\n/g, ' ');

  PARAMETER_RULES.forEach(rule => {
    // Check if any keywords exist in the text first for a quick filter
    const hasKeyword = rule.keywords.some(kw => normalizedText.includes(kw));
    
    if (hasKeyword) {
      const match = text.match(rule.pattern);
      if (match && match[2]) {
        const valueStr = match[2];
        const numericValue = parseFloat(valueStr);
        const unit = match[3] ? match[3].trim() : undefined;

        let status: ExtractedParameter['status'] = 'UNKNOWN';
        if (!isNaN(numericValue)) {
          if (numericValue < rule.min) status = 'LOW';
          else if (numericValue > rule.max) status = 'HIGH';
          else status = 'NORMAL';
        }

        extracted.push({
          parameterName: rule.name,
          value: valueStr,
          numericValue: isNaN(numericValue) ? undefined : numericValue,
          unit,
          referenceMin: rule.min,
          referenceMax: rule.max,
          status
        });
      }
    }
  });

  return extracted;
};

export const categorizeDocument = (text: string, extractedParams: ExtractedParameter[]) => {
  const normalizedText = text.toLowerCase();
  
  const tags = new Set<string>();
  let category = 'General Report';

  // Categories based on parameters
  const paramNames = extractedParams.map(p => p.parameterName);
  
  if (paramNames.includes('Hemoglobin') || paramNames.includes('WBC') || paramNames.includes('RBC')) {
    category = 'Blood Test';
    tags.add('blood');
    tags.add('cbc');
  } else if (paramNames.includes('Total Cholesterol') || paramNames.includes('LDL')) {
    category = 'Lipid Profile';
    tags.add('cholesterol');
    tags.add('lipids');
  } else if (paramNames.includes('Blood Glucose') || paramNames.includes('HbA1c')) {
    category = 'Diabetes / Blood Sugar';
    tags.add('glucose');
    tags.add('diabetes');
  } else if (paramNames.includes('TSH')) {
    category = 'Thyroid Report';
    tags.add('thyroid');
  }

  // Tags based on text matching
  if (normalizedText.includes('urine')) tags.add('urine');
  if (normalizedText.includes('x-ray') || normalizedText.includes('xray')) tags.add('x-ray');
  if (normalizedText.includes('mri')) tags.add('mri');
  if (normalizedText.includes('ct scan')) tags.add('ct-scan');
  if (normalizedText.includes('prescription')) tags.add('prescription');

  return {
    category,
    tags: Array.from(tags)
  };
};
