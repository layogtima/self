// BIOMONITOR 3000 - DATA LAYER
// Patient: Amit Goyal | Last Scan: 10/DEC/2025

const BIOMONITOR_DATA = {
  // ═══════════════════════════════════════════════════════════════
  // PATIENT PROFILE
  // ═══════════════════════════════════════════════════════════════
  patient: {
    name: "AMIT GOYAL",
    dob: "25/SEP/1989",
    age: 36,
    weight: 83, // kg
    height: 183, // cm
    bmi: 24.8,
    vaultId: "16124726558",
    lastScan: "10/DEC/2025",
    healthScore: 86,
    bloodGroup: "UNKNOWN" // Not in report
  },

  // ═══════════════════════════════════════════════════════════════
  // VITAL STATISTICS - Key Metrics
  // ═══════════════════════════════════════════════════════════════
  vitals: {
    hba1c: {
      label: "HbA1c",
      value: 5.4,
      unit: "%",
      refRange: "4.4 - 5.7",
      status: "good",
      description: "Blood sugar control over 3 months"
    },
    hemoglobin: {
      label: "Hemoglobin",
      value: 16.7,
      unit: "g/dL",
      refRange: "13.0 - 17.0",
      status: "good",
      description: "Oxygen-carrying capacity"
    },
    fastingGlucose: {
      label: "Fasting Glucose",
      value: 89.5,
      unit: "mg/dl",
      refRange: "70 - 100",
      status: "good",
      description: "Blood sugar level (fasting)"
    },
    creatinine: {
      label: "Creatinine",
      value: 0.74,
      unit: "mg/dl",
      refRange: "0.6 - 1.6",
      status: "good",
      description: "Kidney function marker"
    },
    gfr: {
      label: "GFR",
      value: 120.43,
      unit: "mL/min",
      refRange: ">90",
      status: "good",
      description: "Kidney filtration rate"
    },
    totalCholesterol: {
      label: "Total Cholesterol",
      value: 200,
      unit: "mg/dl",
      refRange: "<200",
      status: "attention",
      description: "At borderline threshold"
    },
    hdl: {
      label: "HDL (Good)",
      value: 45.7,
      unit: "mg/dl",
      refRange: "40 - 60",
      status: "attention",
      description: "Could be higher"
    },
    ldl: {
      label: "LDL (Bad)",
      value: 122.6,
      unit: "mg/dl",
      refRange: "<100",
      status: "attention",
      description: "Near/above optimal"
    },
    triglycerides: {
      label: "Triglycerides",
      value: 158.5,
      unit: "mg/dl",
      refRange: "<150",
      status: "attention",
      description: "Borderline high"
    },
    esr: {
      label: "ESR",
      value: 9,
      unit: "mm/hr",
      refRange: "0 - 10",
      status: "good",
      description: "Inflammation marker"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SYSTEM STATUS - Organ/System Health
  // ═══════════════════════════════════════════════════════════════
  systems: {
    thyroid: {
      label: "Thyroid",
      status: "concern",
      icon: "⚠",
      summary: "TSH elevated - Subclinical hypothyroidism",
      details: [
        { label: "TSH", value: 10.12, unit: "µIU/mL", refRange: "0.38 - 5.33", status: "concern" },
        { label: "T3 Total", value: 1.43, unit: "ng/ml", refRange: "0.87 - 1.78", status: "good" },
        { label: "T4 Total", value: 9.77, unit: "ug/dl", refRange: "5.48 - 14.28", status: "good" }
      ]
    },
    liver: {
      label: "Liver",
      status: "good",
      icon: "●",
      summary: "All markers within normal range",
      details: [
        { label: "SGPT/ALT", value: 42.9, unit: "U/L", refRange: "3 - 50", status: "good" },
        { label: "SGOT/AST", value: 29.4, unit: "U/L", refRange: "3 - 50", status: "good" },
        { label: "ALP", value: 80.1, unit: "U/L", refRange: "43 - 115", status: "good" },
        { label: "GGT", value: 26.7, unit: "U/L", refRange: "5 - 55", status: "good" },
        { label: "Bilirubin", value: 0.5, unit: "mg/dl", refRange: "0.3 - 1.2", status: "good" }
      ]
    },
    kidney: {
      label: "Kidney",
      status: "good",
      icon: "●",
      summary: "Excellent filtration and function",
      details: [
        { label: "Creatinine", value: 0.74, unit: "mg/dl", refRange: "0.6 - 1.6", status: "good" },
        { label: "GFR", value: 120.43, unit: "mL/min", refRange: ">90", status: "good" },
        { label: "Urea", value: 21.2, unit: "mg/dl", refRange: "17 - 43", status: "good" },
        { label: "Uric Acid", value: 5.1, unit: "mg/dl", refRange: "3.5 - 7.2", status: "good" }
      ]
    },
    pancreas: {
      label: "Pancreas",
      status: "concern",
      icon: "⚠",
      summary: "Elevated enzymes - Monitor",
      details: [
        { label: "Amylase", value: 113.9, unit: "U/L", refRange: "22 - 80", status: "concern" },
        { label: "Lipase", value: 152, unit: "U/L", refRange: "<67", status: "concern" }
      ]
    },
    respiratory: {
      label: "Respiratory",
      status: "attention",
      icon: "◐",
      summary: "Chronic inflammation indicated",
      details: [
        { label: "hs-CRP", value: 3.08, unit: "mg/L", refRange: "<1.0", status: "concern" },
        { label: "Eosinophils", value: 9.2, unit: "%", refRange: "1 - 6", status: "attention" },
        { label: "AEC", value: 0.74, unit: "10³/µL", refRange: "0.04 - 0.44", status: "attention" }
      ],
      note: "Chronic bronchial irritation - reduce smoke inhalation"
    },
    cardiac: {
      label: "Cardiac",
      status: "good",
      icon: "●",
      summary: "CEA normal, lipids borderline",
      details: [
        { label: "CEA", value: 1.9, unit: "ng/mL", refRange: "<3.0", status: "good" }
      ]
    },
    metabolic: {
      label: "Metabolic",
      status: "good",
      icon: "●",
      summary: "Blood sugar well controlled",
      details: [
        { label: "HbA1c", value: 5.4, unit: "%", refRange: "4.4 - 5.7", status: "good" },
        { label: "Fasting Glucose", value: 89.5, unit: "mg/dl", refRange: "70 - 100", status: "good" }
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // ACTIVE CONDITIONS
  // ═══════════════════════════════════════════════════════════════
  conditions: [
    {
      id: "hypothyroid",
      label: "Subclinical Hypothyroidism",
      severity: "moderate",
      status: "active",
      region: "neck",
      summary: "TSH 10.12 µIU/mL (nearly 2x upper limit)",
      impact: "Fatigue, mood dysregulation, weight changes, brain fog",
      action: "Consult endocrinologist, test TPO & Anti-Tg antibodies"
    },
    {
      id: "respiratory-inflammation",
      label: "Respiratory Inflammation",
      severity: "moderate",
      status: "active",
      region: "chest",
      summary: "Elevated hs-CRP (3.08) + eosinophils (9.2%)",
      impact: "Chronic cough, reduced lung function, systemic inflammation",
      action: "Reduce smoke inhalation, steam therapy, monitor"
    },
    {
      id: "pancreatic-stress",
      label: "Pancreatic Enzyme Elevation",
      severity: "mild",
      status: "monitoring",
      region: "abdomen",
      summary: "Amylase 113.9, Lipase 152",
      impact: "May indicate mild pancreatic stress",
      action: "Follow up testing, reduce alcohol/irritants"
    }
  ],

  // ═══════════════════════════════════════════════════════════════
  // DEFICIENCIES & CONCERNS
  // ═══════════════════════════════════════════════════════════════
  deficiencies: [
    {
      id: "b12",
      label: "Vitamin B12",
      value: 136,
      unit: "pg/ml",
      refRange: "222 - 1439",
      status: "concern",
      severity: "high",
      impact: "Mood disturbance, fatigue, cognitive issues, neuropathy",
      action: "Methylcobalamin 1500mcg daily for 8-12 weeks"
    },
    {
      id: "vitd",
      label: "Vitamin D",
      value: 18.23,
      unit: "ng/ml",
      refRange: "30 - 100",
      status: "concern",
      severity: "moderate",
      impact: "Depression, bone health, immune function",
      action: "D3 60,000 IU weekly + K2 100mcg"
    },
    {
      id: "hdl",
      label: "HDL Cholesterol",
      value: 45.7,
      unit: "mg/dl",
      refRange: "40 - 60",
      status: "attention",
      severity: "mild",
      impact: "Cardiovascular protection could be better",
      action: "Exercise, omega-3, reduce refined carbs"
    }
  ],

  // ═══════════════════════════════════════════════════════════════
  // INFLAMMATION MARKERS
  // ═══════════════════════════════════════════════════════════════
  inflammation: [
    {
      label: "hs-CRP",
      value: 3.08,
      unit: "mg/L",
      refRange: "<1.0",
      status: "concern",
      description: "High sensitivity C-reactive protein - elevated indicates systemic inflammation"
    },
    {
      label: "Eosinophils",
      value: 9.2,
      unit: "%",
      refRange: "1 - 6",
      status: "attention",
      description: "Elevated - may indicate allergic/inflammatory response"
    },
    {
      label: "AEC",
      value: 0.74,
      unit: "10³/µL",
      refRange: "0.04 - 0.44",
      status: "attention",
      description: "Absolute eosinophil count elevated"
    },
    {
      label: "ESR",
      value: 9,
      unit: "mm/hr",
      refRange: "0 - 10",
      status: "good",
      description: "Erythrocyte sedimentation rate - normal"
    }
  ],

  // ═══════════════════════════════════════════════════════════════
  // CHEM REGIMEN - Supplements
  // ═══════════════════════════════════════════════════════════════
  chems: [
    {
      id: "b12",
      name: "Methylcobalamin B12",
      dose: "1500mcg",
      form: "Sublingual",
      frequency: "Daily",
      timing: "Morning with food",
      duration: "8-12 weeks, then retest",
      purpose: "Restore B12 levels - critical for nerve function, mood, energy",
      brands: ["Methylcobal", "Nurokind-OD", "Meconerve"],
      status: "active"
    },
    {
      id: "d3",
      name: "Vitamin D3",
      dose: "60,000 IU",
      form: "Sachet/Capsule",
      frequency: "Weekly",
      timing: "With fatty meal",
      duration: "8 weeks loading, then maintenance",
      purpose: "Correct deficiency - bone health, mood, immune function",
      brands: ["Calcirol", "D-Rise", "Tayo"],
      status: "active"
    },
    {
      id: "k2",
      name: "Vitamin K2 (MK-7)",
      dose: "100mcg",
      form: "Capsule",
      frequency: "Daily",
      timing: "With D3",
      duration: "Ongoing while taking D3",
      purpose: "Direct calcium to bones, not arteries - essential D3 companion",
      brands: ["HealthKart", "NOW Foods"],
      status: "active"
    },
    {
      id: "omega3",
      name: "Omega-3 Fish Oil",
      dose: "1000-2000mg EPA+DHA",
      form: "Softgel",
      frequency: "Daily",
      timing: "With meal",
      duration: "Ongoing",
      purpose: "Anti-inflammatory, triglyceride reduction, brain health",
      brands: ["Carbamide Forte", "HealthKart", "Nature Made"],
      status: "active"
    },
    {
      id: "magnesium",
      name: "Magnesium Glycinate",
      dose: "300-400mg",
      form: "Capsule",
      frequency: "Daily",
      timing: "Night",
      duration: "Ongoing",
      purpose: "Sleep, muscle relaxation, stress response, thyroid support",
      brands: ["NOW Foods", "HealthKart"],
      status: "active"
    }
  ],

  // ═══════════════════════════════════════════════════════════════
  // DAILY ROUTINE - Protocol by Phase
  // ═══════════════════════════════════════════════════════════════
  routine: {
    currentPhase: 1,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        duration: "Weeks 1-2",
        morning: [
          { task: "Water first thing", priority: "high", icon: "💧" },
          { task: "Supplements with fatty breakfast", priority: "high", icon: "💊" },
          { task: "Morning sunlight 15-20min", priority: "high", icon: "☀️" }
        ],
        afternoon: [
          { task: "No smoke before 4pm", priority: "high", icon: "🚭" },
          { task: "Light movement/walk", priority: "medium", icon: "🚶" }
        ],
        evening: [
          { task: "Last bowl 2hrs before sleep", priority: "medium", icon: "🌙" },
          { task: "Steam inhalation for cough", priority: "medium", icon: "♨️" },
          { task: "Magnesium before bed", priority: "high", icon: "💊" }
        ]
      },
      {
        phase: 2,
        name: "Building",
        duration: "Weeks 3-4",
        morning: [
          { task: "Water first thing", priority: "high", icon: "💧" },
          { task: "Supplements with fatty breakfast", priority: "high", icon: "💊" },
          { task: "Morning sunlight 15-20min", priority: "high", icon: "☀️" }
        ],
        afternoon: [
          { task: "No smoke before 6pm", priority: "high", icon: "🚭" },
          { task: "20-30min exercise", priority: "high", icon: "🏃" },
          { task: "Largest meal at lunch", priority: "medium", icon: "🍽️" }
        ],
        evening: [
          { task: "Light dinner 3hrs before sleep", priority: "medium", icon: "🥗" },
          { task: "Steam inhalation", priority: "low", icon: "♨️" },
          { task: "Magnesium before bed", priority: "high", icon: "💊" }
        ]
      },
      {
        phase: 3,
        name: "Optimization",
        duration: "Weeks 5-8",
        morning: [
          { task: "Water first thing", priority: "high", icon: "💧" },
          { task: "Supplements with fatty breakfast", priority: "high", icon: "💊" },
          { task: "Morning sunlight 15-20min", priority: "high", icon: "☀️" }
        ],
        afternoon: [
          { task: "Experiment with smoke-free days", priority: "high", icon: "🚭" },
          { task: "30min exercise (cardio/strength/yoga)", priority: "high", icon: "💪" }
        ],
        evening: [
          { task: "No screens 1hr before bed", priority: "medium", icon: "📵" },
          { task: "Consistent sleep time", priority: "high", icon: "🛏️" },
          { task: "Magnesium before bed", priority: "high", icon: "💊" }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // UPCOMING TESTS & CHECKUPS
  // ═══════════════════════════════════════════════════════════════
  upcomingTests: [
    {
      test: "TPO Antibodies",
      purpose: "Check for Hashimoto's thyroiditis",
      priority: "high",
      timeframe: "ASAP",
      status: "pending"
    },
    {
      test: "Anti-Thyroglobulin (Anti-Tg)",
      purpose: "Autoimmune thyroid confirmation",
      priority: "high",
      timeframe: "ASAP",
      status: "pending"
    },
    {
      test: "Homocysteine",
      purpose: "Methylation/B12 function check",
      priority: "medium",
      timeframe: "Result pending",
      status: "awaiting"
    },
    {
      test: "Vitamin B12 Retest",
      purpose: "Check supplementation efficacy",
      priority: "medium",
      timeframe: "8-12 weeks",
      status: "scheduled"
    },
    {
      test: "Vitamin D Retest",
      purpose: "Check supplementation efficacy",
      priority: "medium",
      timeframe: "8 weeks",
      status: "scheduled"
    },
    {
      test: "Lipase/Amylase Follow-up",
      purpose: "Monitor pancreatic enzymes",
      priority: "medium",
      timeframe: "4-6 weeks",
      status: "scheduled"
    },
    {
      test: "Lipid Profile Retest",
      purpose: "Check triglyceride/cholesterol improvement",
      priority: "low",
      timeframe: "3 months",
      status: "scheduled"
    },
    {
      test: "hs-CRP Retest",
      purpose: "Monitor inflammation after lifestyle changes",
      priority: "medium",
      timeframe: "6-8 weeks",
      status: "scheduled"
    }
  ],

  // ═══════════════════════════════════════════════════════════════
  // BODY REGIONS - For SVG mapping
  // ═══════════════════════════════════════════════════════════════
  bodyRegions: {
    head: {
      label: "Head/Brain",
      status: "attention",
      conditions: ["B12 deficiency affecting cognition"],
      systems: ["metabolic"]
    },
    neck: {
      label: "Neck/Thyroid",
      status: "concern",
      conditions: ["hypothyroid"],
      systems: ["thyroid"]
    },
    chest: {
      label: "Chest/Lungs",
      status: "attention",
      conditions: ["respiratory-inflammation"],
      systems: ["respiratory", "cardiac"]
    },
    abdomen: {
      label: "Abdomen",
      status: "attention",
      conditions: ["pancreatic-stress"],
      systems: ["pancreas", "liver"]
    },
    lowerAbdomen: {
      label: "Lower Abdomen",
      status: "good",
      conditions: [],
      systems: ["kidney"]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // COMPLETE BLOOD COUNT DETAILS
  // ═══════════════════════════════════════════════════════════════
  cbc: {
    rbc: { label: "RBC", value: 5.45, unit: "10⁶/µL", refRange: "4.50 - 5.50", status: "good" },
    wbc: { label: "WBC", value: 8.1, unit: "10³/µL", refRange: "4.0 - 10.0", status: "good" },
    platelets: { label: "Platelets", value: 324, unit: "10³/µL", refRange: "150 - 410", status: "good" },
    hematocrit: { label: "Hematocrit", value: 50.4, unit: "%", refRange: "40.0 - 50.0", status: "attention" },
    mcv: { label: "MCV", value: 92.5, unit: "fL", refRange: "83.0 - 101.0", status: "good" },
    mch: { label: "MCH", value: 30.6, unit: "pg", refRange: "27.0 - 32.0", status: "good" },
    mchc: { label: "MCHC", value: 33.1, unit: "g/dL", refRange: "31.5 - 34.5", status: "good" },
    rdw: { label: "RDW-CV", value: 14.4, unit: "%", refRange: "11.6 - 14.0", status: "attention" },
    neutrophils: { label: "Neutrophils", value: 43.9, unit: "%", refRange: "40 - 80", status: "good" },
    lymphocytes: { label: "Lymphocytes", value: 38.4, unit: "%", refRange: "20 - 40", status: "good" },
    monocytes: { label: "Monocytes", value: 8.2, unit: "%", refRange: "2 - 10", status: "good" },
    eosinophils: { label: "Eosinophils", value: 9.2, unit: "%", refRange: "1 - 6", status: "attention" },
    basophils: { label: "Basophils", value: 0.3, unit: "%", refRange: "0 - 2", status: "good" }
  },

  // ═══════════════════════════════════════════════════════════════
  // URINE ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  urine: {
    color: { label: "Color", value: "Yellow", refRange: "Pale Yellow", status: "good" },
    appearance: { label: "Appearance", value: "Clear", refRange: "Clear", status: "good" },
    ph: { label: "pH", value: 6.0, refRange: "4.5 - 7.5", status: "good" },
    specificGravity: { label: "Specific Gravity", value: 1.010, refRange: "1.001 - 1.035", status: "good" },
    glucose: { label: "Glucose", value: "Negative", refRange: "Negative", status: "good" },
    protein: { label: "Protein", value: "Negative", refRange: "Negative", status: "good" },
    ketones: { label: "Ketones", value: "Negative", refRange: "Negative", status: "good" },
    blood: { label: "Blood", value: "Negative", refRange: "Nil", status: "good" },
    bacteria: { label: "Bacteria", value: "Absent", refRange: "Absent", status: "good" }
  }
};

// Status helper functions
const STATUS_COLORS = {
  good: '#4ADE80',      // green-400
  attention: '#FACC15', // yellow-400
  concern: '#FB923C',   // orange-400
  critical: '#F87171'   // red-400
};

const STATUS_LABELS = {
  good: 'OPTIMAL',
  attention: 'MONITOR',
  concern: 'CONCERN',
  critical: 'CRITICAL'
};

// Export for use in Vue app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BIOMONITOR_DATA, STATUS_COLORS, STATUS_LABELS };
}