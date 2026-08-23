/* BODY — shared catalog.
   Marker definitions, body regions, and panel grouping shared by both patients.
   Reference ranges are per-sex where Healthians differentiates (m/f), else `all`.
   `worse` says which direction is the bad one — used only for delta coloring.
   Patient files push into BODY.patients; app.js computes everything judgmental. */

window.BODY = {
  patients: [],

  regions: [
    { id: 'brain', label: 'Brain & Nerves', desc: 'B12 and homocysteine — nerve health, energy, focus, mood.' },
    { id: 'thyroid', label: 'Thyroid', desc: 'The body\'s thermostat: metabolism, energy, temperature, weight.' },
    { id: 'heart', label: 'Heart & Vessels', desc: 'Cholesterol particles and vascular inflammation.' },
    { id: 'blood', label: 'Blood', desc: 'Red cells, white cells, platelets and iron — the delivery network.' },
    { id: 'liver', label: 'Liver', desc: 'Enzymes and function tests — the body\'s processing plant.' },
    { id: 'pancreas', label: 'Gut & Pancreas', desc: 'Digestive enzymes and blood-sugar control.' },
    { id: 'kidneys', label: 'Kidneys', desc: 'Filtration, electrolytes, and what shows up in urine.' },
    { id: 'hormones', label: 'Hormones', desc: 'Reproductive hormones and routine screening markers.' },
    { id: 'bones', label: 'Bones & Minerals', desc: 'Vitamin D, calcium, phosphorus, magnesium.' }
  ],

  panels: [
    { id: 'vitals', label: 'Measured at Home' },
    { id: 'lipids', label: 'Lipid Profile' },
    { id: 'liver', label: 'Liver Function' },
    { id: 'thyroid', label: 'Thyroid Profile' },
    { id: 'diabetes', label: 'Glucose & Insulin' },
    { id: 'vitamins', label: 'Vitamins' },
    { id: 'iron', label: 'Iron Studies' },
    { id: 'inflammation', label: 'Inflammation' },
    { id: 'hormones', label: 'Hormones' },
    { id: 'tumor', label: 'Screening Markers' },
    { id: 'kidney', label: 'Kidney & Electrolytes' },
    { id: 'cbc', label: 'Complete Blood Count' },
    { id: 'urine', label: 'Urine Routine' },
    { id: 'other', label: 'Other' }
  ],

  markers: {
    /* --- lipids --- */
    tc: { name: 'Total Cholesterol', unit: 'mg/dl', panel: 'lipids', regions: ['heart'], ref: { all: [0, 200] }, worse: 'high', human: 'All cholesterol added up' },
    hdl: { name: 'HDL Cholesterol', unit: 'mg/dl', panel: 'lipids', regions: ['heart'], ref: { all: [40, 60] }, worse: 'low', human: 'The protective kind — higher is better' },
    ldl: { name: 'LDL Cholesterol', unit: 'mg/dl', panel: 'lipids', regions: ['heart'], ref: { all: [0, 100] }, worse: 'high', human: 'The kind that builds up in arteries' },
    tg: { name: 'Triglycerides', unit: 'mg/dl', panel: 'lipids', regions: ['heart'], ref: { all: [0, 150] }, worse: 'high', human: 'Circulating fat — very diet-responsive' },
    vldl: { name: 'VLDL', unit: 'mg/dl', panel: 'lipids', regions: ['heart'], ref: { all: [0, 30] }, worse: 'high' },
    nonhdl: { name: 'Non-HDL Cholesterol', unit: 'mg/dl', panel: 'lipids', regions: ['heart'], ref: { all: [0, 160] }, worse: 'high' },
    tc_hdl: { name: 'Total / HDL Ratio', unit: '', panel: 'lipids', regions: ['heart'], ref: { all: [3.3, 4.4] }, worse: 'high' },
    ldl_hdl: { name: 'LDL / HDL Ratio', unit: '', panel: 'lipids', regions: ['heart'], ref: { all: [0.5, 3.0] }, worse: 'high' },
    apoa1: { name: 'Apolipoprotein A1', unit: 'mg/dl', panel: 'lipids', regions: ['heart'], ref: { m: [105, 175], f: [105, 205] }, worse: 'low' },
    apob: { name: 'Apolipoprotein B', unit: 'mg/dl', panel: 'lipids', regions: ['heart'], ref: { m: [60, 140], f: [55, 130] }, worse: 'high', human: 'Counts the artery-clogging particles directly' },
    apob_a1: { name: 'ApoB / ApoA1 Ratio', unit: '', panel: 'lipids', regions: ['heart'], ref: null, refDisplay: 'low risk: 0.4–0.99 (m) · 0.3–0.89 (f)', worse: 'high' },

    /* --- liver --- */
    alp: { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', panel: 'liver', regions: ['liver', 'bones'], ref: { m: [43, 115], f: [33, 98] }, worse: 'high' },
    ggtp: { name: 'GGT (Gamma GT)', unit: 'U/L', panel: 'liver', regions: ['liver'], ref: { m: [5, 55], f: [5, 38] }, worse: 'high', human: 'A liver enzyme that rises with stress on the liver' },
    ast: { name: 'AST (SGOT)', unit: 'U/L', panel: 'liver', regions: ['liver'], ref: { m: [3, 50], f: [3, 35] }, worse: 'high' },
    alt: { name: 'ALT (SGPT)', unit: 'U/L', panel: 'liver', regions: ['liver'], ref: { m: [3, 50], f: [3, 35] }, worse: 'high', human: 'The most liver-specific enzyme' },
    proteins: { name: 'Total Proteins', unit: 'g/dl', panel: 'liver', regions: ['liver'], ref: { all: [6.6, 8.3] } },
    albumin: { name: 'Albumin', unit: 'g/dl', panel: 'liver', regions: ['liver'], ref: { all: [3.5, 5.2] }, worse: 'low' },
    globulin: { name: 'Globulin', unit: 'g/dl', panel: 'liver', regions: ['liver'], ref: { m: [2.0, 3.5], f: [3.0, 4.2] } },
    ag_ratio: { name: 'Albumin / Globulin Ratio', unit: '', panel: 'liver', regions: ['liver'], ref: { all: [1.2, 2.0] } },
    bili_total: { name: 'Bilirubin, Total', unit: 'mg/dl', panel: 'liver', regions: ['liver'], ref: { all: [0.3, 1.2] }, worse: 'high' },
    bili_direct: { name: 'Bilirubin, Direct', unit: 'mg/dl', panel: 'liver', regions: ['liver'], ref: { all: [0, 0.2] }, worse: 'high' },
    bili_indirect: { name: 'Bilirubin, Indirect', unit: 'mg/dl', panel: 'liver', regions: ['liver'], ref: { all: [0, 0.8] }, worse: 'high' },
    /* display-only ref: a low ratio is common in health — don't let it flag the region */
    ast_alt: { name: 'AST / ALT Ratio', unit: '', panel: 'liver', regions: ['liver'], ref: null, refDisplay: '0.7–1.4' },
    nafld: { name: 'NAFLD Fibrosis Score', unit: '', panel: 'liver', regions: ['liver'], ref: null, refDisplay: '< −1.455 = low fibrosis likelihood', worse: 'high', human: 'Screens for lasting liver scarring — lower is better' },

    /* --- thyroid --- */
    t3: { name: 'T3, Total', unit: 'ng/ml', panel: 'thyroid', regions: ['thyroid'], ref: { all: [0.87, 1.78] } },
    t4: { name: 'T4, Total', unit: 'ug/dl', panel: 'thyroid', regions: ['thyroid'], ref: { all: [5.48, 14.28] } },
    tsh: { name: 'TSH (Ultra-sensitive)', unit: 'µIU/mL', panel: 'thyroid', regions: ['thyroid'], ref: { all: [0.38, 5.33] }, worse: 'high', human: 'High TSH means the thyroid is being pushed to work harder' },

    /* --- glucose & insulin --- */
    hba1c: { name: 'HbA1c', unit: '%', panel: 'diabetes', regions: ['pancreas'], ref: { all: [4.2, 5.7] }, worse: 'high', human: 'Three-month blood sugar average' },
    glucose_f: { name: 'Glucose, Fasting', unit: 'mg/dl', panel: 'diabetes', regions: ['pancreas'], ref: { all: [70, 100] }, worse: 'high' },
    insulin_f: { name: 'Insulin, Fasting', unit: 'µIU/mL', panel: 'diabetes', regions: ['pancreas'], ref: { all: [1.9, 23] }, worse: 'high', human: 'How hard the pancreas works to keep sugar normal' },

    /* --- measured at home (self: true surfaces these first in the log form) --- */
    bp_sys: { name: 'Blood pressure (upper)', unit: 'mmHg', panel: 'vitals', regions: ['heart'], ref: { all: [90, 130] }, worse: 'high', self: true, human: 'The push when the heart beats' },
    bp_dia: { name: 'Blood pressure (lower)', unit: 'mmHg', panel: 'vitals', regions: ['heart'], ref: { all: [60, 85] }, worse: 'high', self: true, human: 'The push between beats' },
    resting_hr: { name: 'Resting heart rate', unit: 'bpm', panel: 'vitals', regions: ['heart'], ref: { all: [55, 90] }, worse: 'high', self: true, human: 'Beats per minute at rest — lower is usually fitter' },
    spo2: { name: 'Oxygen (SpO₂)', unit: '%', panel: 'vitals', regions: ['blood'], ref: { all: [95, 100] }, worse: 'low', self: true, human: 'How much oxygen the blood is carrying' },
    sleep_h: { name: 'Sleep', unit: 'h', panel: 'vitals', regions: ['brain'], ref: { all: [7, 9] }, worse: 'low', self: true, human: 'Hours slept last night' },
    temp_c: { name: 'Temperature', unit: '°C', panel: 'vitals', regions: [], ref: { all: [36.1, 37.2] }, worse: 'high', self: true },
    waist_cm: { name: 'Waist', unit: 'cm', panel: 'vitals', regions: [], ref: { m: [null, 94], f: [null, 80] }, refDisplay: 'under 94 cm (m) · 80 cm (f)', worse: 'high', self: true },
    steps: { name: 'Steps', unit: '/day', panel: 'vitals', regions: [], ref: null, refDisplay: 'aim 7,000+', self: true },
    mood: { name: 'Energy today', unit: '/5', panel: 'vitals', regions: ['brain'], ref: { all: [3, 5] }, worse: 'low', self: true, human: 'How you actually feel, 1 to 5' },

    /* --- vitamins --- */
    vitd: { name: 'Vitamin D (25-OH)', unit: 'ng/ml', panel: 'vitamins', regions: ['bones'], ref: { all: [30, 100] }, worse: 'low', human: 'Bone, mood and immune support' },
    b12: { name: 'Vitamin B12', unit: 'pg/ml', panel: 'vitamins', regions: ['brain', 'blood'], ref: { all: [222, 1439] }, worse: 'low', human: 'Nerve and blood-cell fuel' },

    /* --- iron --- */
    iron: { name: 'Iron, Serum', unit: 'ug/dl', panel: 'iron', regions: ['blood'], ref: { m: [70, 180], f: [60, 180] }, worse: 'low' },
    ferritin: { name: 'Ferritin', unit: 'ng/ml', panel: 'iron', regions: ['blood'], ref: { m: [23.9, 336.2], f: [11, 306.8] }, worse: 'low', human: 'The iron savings account' },
    tibc: { name: 'TIBC', unit: 'µg/dl', panel: 'iron', regions: ['blood'], ref: { all: [250, 400] } },
    uibc: { name: 'UIBC', unit: 'ug/dl', panel: 'iron', regions: ['blood'], ref: { all: [155, 355] } },
    transferrin_sat: { name: 'Transferrin Saturation', unit: '%', panel: 'iron', regions: ['blood'], ref: { m: [10, 50], f: [15, 50] }, worse: 'low' },

    /* --- inflammation --- */
    crp: { name: 'CRP (Quantitative)', unit: 'mg/L', panel: 'inflammation', regions: ['heart'], ref: { all: [0, 5] }, worse: 'high' },
    hscrp: { name: 'hs-CRP', unit: 'mg/L', panel: 'inflammation', regions: ['heart'], ref: { all: [0, 1.0] }, worse: 'high', human: 'Low-grade inflammation linked to heart risk' },
    esr: { name: 'ESR', unit: 'mm/hr', panel: 'inflammation', regions: ['blood'], ref: { m: [0, 10], f: [0, 12] }, worse: 'high' },
    homocysteine: { name: 'Homocysteine', unit: 'µmol/L', panel: 'inflammation', regions: ['brain', 'heart'], ref: { m: [6, 16], f: [5, 13] }, worse: 'high', human: 'Rises when B-vitamins run low; hard on blood vessels' },
    ra_factor: { name: 'Rheumatoid Factor', unit: 'IU/mL', panel: 'inflammation', regions: [], ref: { all: [null, 14] }, refDisplay: '< 14', worse: 'high' },

    /* --- hormones --- */
    testosterone: { name: 'Testosterone, Total', unit: 'ng/mL', panel: 'hormones', regions: ['hormones'], ref: { m: [1.98, 6.79], f: [null, 0.75] }, worse: 'high' },
    prolactin: { name: 'Prolactin', unit: 'ng/ml', panel: 'hormones', regions: ['hormones'], ref: { all: [3.34, 26.72] } },
    fsh: { name: 'FSH', unit: 'mIU/mL', panel: 'hormones', regions: ['hormones'], ref: null, refDisplay: 'phase-dependent (mid-follicular 3.85–8.78)' },
    lh: { name: 'LH', unit: 'mIU/mL', panel: 'hormones', regions: ['hormones'], ref: null, refDisplay: 'phase-dependent (mid-follicular 2.12–10.89)' },

    /* --- screening / tumor markers --- */
    ca125: { name: 'CA-125', unit: 'U/mL', panel: 'tumor', regions: ['hormones'], ref: { all: [null, 35] }, refDisplay: '< 35', worse: 'high' },
    ca153: { name: 'CA-15.3', unit: 'U/mL', panel: 'tumor', regions: ['hormones'], ref: { all: [0, 23.5] }, worse: 'high' },
    ca199: { name: 'CA-19.9', unit: 'U/mL', panel: 'tumor', regions: ['pancreas'], ref: { all: [null, 37] }, refDisplay: '< 37', worse: 'high' },
    cea: { name: 'CEA', unit: 'ng/mL', panel: 'tumor', regions: [], ref: { all: [null, 3] }, refDisplay: 'non-smokers < 3.00', worse: 'high' },
    psa: { name: 'PSA, Total', unit: 'ng/mL', panel: 'tumor', regions: ['hormones'], ref: { all: [0, 4] }, worse: 'high' },

    /* --- kidney & electrolytes --- */
    creatinine: { name: 'Creatinine', unit: 'mg/dl', panel: 'kidney', regions: ['kidneys'], ref: { m: [0.6, 1.6], f: [0.3, 1.0] }, worse: 'high' },
    egfr: { name: 'eGFR', unit: 'mL/min/1.73m²', panel: 'kidney', regions: ['kidneys'], ref: { m: [74, 138], f: null }, refDisplay: '> 90 normal', worse: 'low' },
    urea: { name: 'Urea', unit: 'mg/dl', panel: 'kidney', regions: ['kidneys'], ref: { all: [17, 43] } },
    bun: { name: 'BUN', unit: 'mg/dl', panel: 'kidney', regions: ['kidneys'], ref: { all: [7.92, 20.03] } },
    uric_acid: { name: 'Uric Acid', unit: 'mg/dl', panel: 'kidney', regions: ['kidneys'], ref: { m: [3.5, 7.2], f: [2.6, 6.0] }, worse: 'high' },
    sodium: { name: 'Sodium', unit: 'mmol/L', panel: 'kidney', regions: ['kidneys'], ref: { all: [136, 146] } },
    potassium: { name: 'Potassium', unit: 'mmol/L', panel: 'kidney', regions: ['kidneys'], ref: { all: [3.5, 5.5] } },
    chloride: { name: 'Chloride', unit: 'mmol/L', panel: 'kidney', regions: ['kidneys'], ref: { all: [101, 109] } },
    phosphorus: { name: 'Phosphorus', unit: 'mg/dl', panel: 'kidney', regions: ['kidneys', 'bones'], ref: { all: [2.5, 4.5] } },

    /* --- CBC --- */
    hb: { name: 'Hemoglobin', unit: 'g/dL', panel: 'cbc', regions: ['blood'], ref: { m: [13.0, 17.0], f: [12.0, 15.0] }, worse: 'low', human: 'Oxygen-carrying capacity' },
    tlc: { name: 'White Cells (TLC)', unit: '10³/uL', panel: 'cbc', regions: ['blood'], ref: { all: [4.0, 10.0] } },
    rbc: { name: 'Red Cell Count', unit: '10⁶/µl', panel: 'cbc', regions: ['blood'], ref: { m: [4.5, 5.5], f: [3.8, 4.8] } },
    pcv: { name: 'Hematocrit (PCV)', unit: '%', panel: 'cbc', regions: ['blood'], ref: { m: [40.0, 50.0], f: [36.0, 46.0] } },
    platelets: { name: 'Platelets', unit: '10³/µl', panel: 'cbc', regions: ['blood'], ref: { all: [150, 410] } },
    mcv: { name: 'MCV', unit: 'fL', panel: 'cbc', regions: ['blood'], ref: { all: [83.0, 101.0] } },
    mch: { name: 'MCH', unit: 'pg', panel: 'cbc', regions: ['blood'], ref: { all: [27.0, 32.0] } },
    mchc: { name: 'MCHC', unit: 'g/dL', panel: 'cbc', regions: ['blood'], ref: { all: [31.5, 34.5] } },
    rdw_cv: { name: 'RDW-CV', unit: '%', panel: 'cbc', regions: ['blood'], ref: { all: [11.6, 14.0] }, worse: 'high' },
    rdw_sd: { name: 'RDW-SD', unit: 'fL', panel: 'cbc', regions: ['blood'], ref: { all: [39.0, 46.0] } },
    neutrophils: { name: 'Neutrophils', unit: '%', panel: 'cbc', regions: ['blood'], ref: { all: [40, 80] } },
    lymphocytes: { name: 'Lymphocytes', unit: '%', panel: 'cbc', regions: ['blood'], ref: { all: [20, 40] } },
    monocytes: { name: 'Monocytes', unit: '%', panel: 'cbc', regions: ['blood'], ref: { all: [2, 10] } },
    eosinophils: { name: 'Eosinophils', unit: '%', panel: 'cbc', regions: ['blood'], ref: { all: [1, 6] } },
    basophils: { name: 'Basophils', unit: '%', panel: 'cbc', regions: ['blood'], ref: { all: [0, 2] } },
    anc: { name: 'Neutrophils, Absolute', unit: '10³/uL', panel: 'cbc', regions: ['blood'], ref: { all: [2.0, 7.0] } },
    alc: { name: 'Lymphocytes, Absolute', unit: '10³/uL', panel: 'cbc', regions: ['blood'], ref: { all: [1.0, 3.0] } },
    amc: { name: 'Monocytes, Absolute', unit: '10³/uL', panel: 'cbc', regions: ['blood'], ref: { all: [0.2, 1.0] } },
    aec: { name: 'Eosinophils, Absolute', unit: '10³/uL', panel: 'cbc', regions: ['blood'], ref: { all: [0.02, 0.5] } },
    abc: { name: 'Basophils, Absolute', unit: '10³/uL', panel: 'cbc', regions: ['blood'], ref: { all: [0.02, 0.10] } },
    mpv: { name: 'MPV', unit: 'fL', panel: 'cbc', regions: ['blood'], ref: { all: [7, 9] } },

    /* --- urine --- */
    u_color: { name: 'Colour', unit: '', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: 'Pale Yellow' },
    u_appearance: { name: 'Appearance', unit: '', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: 'Clear' },
    u_sg: { name: 'Specific Gravity', unit: '', panel: 'urine', regions: ['kidneys'], ref: { all: [1.001, 1.035] } },
    u_ph: { name: 'pH', unit: '', panel: 'urine', regions: ['kidneys'], ref: { all: [4.5, 7.5] } },
    u_glucose: { name: 'Glucose (Urine)', unit: '', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: 'Negative' },
    u_protein: { name: 'Protein (Urine)', unit: '', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: 'Negative' },
    u_ketones: { name: 'Ketones (Urine)', unit: '', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: 'Negative' },
    u_blood: { name: 'Blood (Urine)', unit: '', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: 'Nil' },
    u_pus: { name: 'Pus Cells', unit: '/HPF', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: '0–5' },
    u_epithelial: { name: 'Epithelial Cells', unit: '/HPF', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: '0–5' },
    u_bacteria: { name: 'Bacteria', unit: '', panel: 'urine', regions: ['kidneys'], ref: null, refDisplay: 'Absent' },

    /* --- other --- */
    amylase: { name: 'Amylase', unit: 'U/L', panel: 'other', regions: ['pancreas'], ref: { all: [22, 80] }, worse: 'high' },
    lipase: { name: 'Lipase', unit: 'U/L', panel: 'other', regions: ['pancreas'], ref: { all: [0, 67] }, worse: 'high' },
    magnesium: { name: 'Magnesium', unit: 'mg/dl', panel: 'other', regions: ['bones'], ref: { m: [1.8, 2.6], f: [1.9, 2.5] }, worse: 'low' },
    calcium: { name: 'Calcium', unit: 'mg/dl', panel: 'other', regions: ['bones'], ref: { all: [8.8, 10.6] } },
    hbsag: { name: 'Hepatitis B Surface Antigen', unit: '', panel: 'other', regions: ['liver'], ref: null, refDisplay: 'Non-Reactive' }
  }
};
