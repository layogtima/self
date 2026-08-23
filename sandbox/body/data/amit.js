/* BODY — Amit Goyal. Raw values transcribed from
   reports/amit-g-report.pdf (Healthians Smart Report 3.0, sampled 22 Aug 2026,
   with comparative history back to Jul 2023). Values exactly as printed.
   The issues[] blurbs are curated content — the part the doctor fine-tunes. */

window.BODY.patients.push({
  id: 'amit',
  name: 'Amit Goyal',
  shortName: 'Amit',
  sex: 'm',
  age: 36,
  avatar: 'assets/amit-g.webp',
  accent: 'var(--accent-amit)',
  accentSoft: 'var(--accent-amit-soft)',

  healthScore: 89,
  prevHealthScore: 86,
  vitals: { heightLabel: "5'11\"", heightCm: 180.3, weightKg: 78, bmi: 23.81 },

  summary: 'Trending better overall — one new finding (B12 + homocysteine) is the thing to work on.',
  wins: 'Weight down 5 kg (BMI 23.8), triglycerides normalized (158 → 80), HDL up to 56, pancreatic enzymes back in range, ESR 4 and HbA1c 4.8 — excellent.',
  winsShort: 'Weight down, blood fats normal again, energy markers great.',
  winsSince: 'Dec 2025',

  draws: [
    { id: '2023-07-03', label: 'Jul 2023' },
    { id: '2025-12-10', label: 'Dec 2025' },
    { id: '2025-12-13', label: 'Dec ’25 (TSH)' },
    { id: '2026-08-22', label: 'Aug 2026' }
  ],

  results: {
    /* lipids */
    tc: { '2023-07-03': 170, '2025-12-10': 200, '2026-08-22': 201.9 },
    hdl: { '2023-07-03': 48, '2025-12-10': 45.7, '2026-08-22': 55.9 },
    ldl: { '2023-07-03': 107.2, '2026-08-22': 131.9 },
    tg: { '2023-07-03': 76, '2025-12-10': 158.5, '2026-08-22': 79.7 },
    vldl: { '2026-08-22': 14 },
    nonhdl: { '2026-08-22': 146.0 },
    tc_hdl: { '2026-08-22': 3.61 },
    ldl_hdl: { '2026-08-22': 2.36 },
    apoa1: { '2026-08-22': 124.5 },
    apob: { '2026-08-22': 93.9 },
    apob_a1: { '2026-08-22': 0.75 },

    /* liver */
    alp: { '2023-07-03': 61.1, '2025-12-10': 80.1, '2026-08-22': 84.8 },
    ggtp: { '2023-07-03': 14.9, '2025-12-10': 26.7, '2026-08-22': 26.9 },
    proteins: { '2023-07-03': 6.41, '2025-12-10': 7.05, '2026-08-22': 7.7 },
    ast: { '2023-07-03': 22.1, '2025-12-10': 29.4, '2026-08-22': 31.3 },
    alt: { '2023-07-03': 22.4, '2025-12-10': 42.9, '2026-08-22': 47.7 },
    bili_total: { '2026-08-22': 0.67 },
    bili_direct: { '2026-08-22': 0.16 },
    bili_indirect: { '2026-08-22': 0.51 },
    albumin: { '2026-08-22': 4.80 },
    globulin: { '2026-08-22': 2.90 },
    ag_ratio: { '2026-08-22': 1.66 },
    ast_alt: { '2026-08-22': 0.66 },
    nafld: { '2026-08-22': -5.08 },

    /* thyroid */
    t3: { '2023-07-03': 1.13, '2025-12-10': 1.43, '2026-08-22': 1.52 },
    t4: { '2023-07-03': 10.42, '2025-12-10': 9.77, '2026-08-22': 12.1 },
    tsh: { '2023-07-03': 4.15, '2025-12-10': 10.12, '2025-12-13': 6.25, '2026-08-22': 6.82 },

    /* glucose */
    hba1c: { '2023-07-03': 5.2, '2025-12-10': 5.4, '2026-08-22': 4.8 },
    glucose_f: { '2026-08-22': 89.3 },

    /* vitamins */
    vitd: { '2023-07-03': 9.36, '2025-12-10': 18.23, '2026-08-22': 29.41 },
    b12: { '2026-08-22': 141 },

    /* iron */
    iron: { '2023-07-03': 59.8, '2025-12-10': 77.1, '2026-08-22': 78.3 },
    ferritin: { '2023-07-03': 69.2, '2026-08-22': 70.7 },
    tibc: { '2026-08-22': 373.1 },
    uibc: { '2026-08-22': 294.80 },
    transferrin_sat: { '2026-08-22': 20.99 },

    /* inflammation */
    crp: { '2023-07-03': 0.78, '2026-08-22': 2.71 },
    hscrp: { '2023-07-03': 0.72, '2025-12-10': 3.08, '2026-08-22': 2.3 },
    esr: { '2025-12-10': 9, '2026-08-22': 4 },
    homocysteine: { '2026-08-22': 25.9 },
    ra_factor: { '2026-08-22': '<10' },

    /* hormones + screening */
    testosterone: { '2026-08-22': 4.63 },
    ca199: { '2026-08-22': 8.70 },
    cea: { '2026-08-22': 1.99 },
    psa: { '2026-08-22': 0.77 },

    /* kidney & electrolytes */
    creatinine: { '2023-07-03': 0.64, '2025-12-10': 0.74, '2026-08-22': 0.74 },
    egfr: { '2026-08-22': 120.43 },
    urea: { '2023-07-03': 19, '2025-12-10': 21.2, '2026-08-22': 20 },
    bun: { '2026-08-22': 9.4 },
    uric_acid: { '2023-07-03': 4.6, '2025-12-10': 5.1, '2026-08-22': 5.1 },
    sodium: { '2023-07-03': 144, '2025-12-10': 144, '2026-08-22': 144 },
    potassium: { '2025-12-10': 4.08, '2026-08-22': 4.27 },
    chloride: { '2023-07-03': 106, '2025-12-10': 104, '2026-08-22': 103 },
    phosphorus: { '2023-07-03': 3.8, '2025-12-10': 4.2, '2026-08-22': 3.9 },

    /* CBC */
    hb: { '2023-07-03': 14.9, '2025-12-10': 16.7, '2026-08-22': 16.9 },
    tlc: { '2026-08-22': 6.9 },
    rbc: { '2026-08-22': 5.63 },
    pcv: { '2026-08-22': 50.7 },
    platelets: { '2023-07-03': 313, '2025-12-10': 324, '2026-08-22': 343 },
    mcv: { '2026-08-22': 90.1 },
    mch: { '2026-08-22': 30.0 },
    mchc: { '2026-08-22': 33.3 },
    rdw_cv: { '2026-08-22': 15.0 },
    rdw_sd: { '2026-08-22': 36.00 },
    neutrophils: { '2026-08-22': 51.4 },
    lymphocytes: { '2026-08-22': 34.2 },
    monocytes: { '2026-08-22': 8.5 },
    eosinophils: { '2026-08-22': 5.4 },
    basophils: { '2026-08-22': 0.5 },
    anc: { '2026-08-22': 3.56 },
    alc: { '2026-08-22': 2.37 },
    amc: { '2026-08-22': 0.59 },
    aec: { '2026-08-22': 0.37 },
    abc: { '2026-08-22': 0.03 },
    mpv: { '2026-08-22': 8.7 },

    /* urine */
    u_color: { '2026-08-22': 'Yellow' },
    u_appearance: { '2026-08-22': 'Clear' },
    u_sg: { '2026-08-22': 1.015 },
    u_ph: { '2026-08-22': 5.5 },
    u_glucose: { '2026-08-22': 'Negative' },
    u_protein: { '2026-08-22': 'Negative' },
    u_ketones: { '2025-12-10': 'Negative', '2026-08-22': 'Negative' },
    u_blood: { '2026-08-22': 'Negative' },
    u_pus: { '2026-08-22': '3-5' },
    u_epithelial: { '2026-08-22': '2-3' },
    u_bacteria: { '2026-08-22': 'Absent' },

    /* other */
    amylase: { '2023-07-03': 50.3, '2025-12-10': 113.9, '2026-08-22': 60 },
    lipase: { '2025-12-10': 152, '2026-08-22': 38 },
    magnesium: { '2026-08-22': 2.1 },
    calcium: { '2023-07-03': 9.6, '2025-12-10': 9.9, '2026-08-22': 10.3 },
    hbsag: { '2026-08-22': 'Non-Reactive' }
  },

  issues: [
    {
      id: 'b12-homocysteine',
      headline: 'b12',
      tag: 'vitamin B12',
      severity: 'priority',
      trend: 'new',
      markers: ['b12', 'homocysteine'],
      regions: ['brain', 'blood'],
      human: {
        title: 'Vitamin B12 is genuinely low',
        short: 'B12 vitamin is low. Take it every day — it fixes itself.',
        body: 'B12 is well below range, and a related marker (homocysteine) has climbed because of it. This is the one thing to actively fix — the good news is it responds well to supplements, and everything it affects is reversible at this stage.',
        actions: ['Take B12 daily — consistently', 'Ask about folate', 'Retest in ~2 months']
      },
      expert: {
        title: 'Functional B12 deficiency with hyperhomocysteinemia',
        pattern: 'B12 141 pg/mL (ref 222–1439) with homocysteine 25.9 µmol/L (ref 6–16) — first homocysteine measurement, consistent with deficiency-driven elevation. RDW-CV 15.0% mildly high but MCV 90.1 normal: no overt macrocytosis yet. Was on methylcobalamin 1500 mcg/day per Dec-2025 regimen; level suggests poor adherence or absorption.',
        accountFor: ['Dietary intake pattern', 'Adherence to existing B12 supplementation', 'Folate status (not tested this draw)', 'PPI or metformin use, alcohol'],
        ruleOut: ['Malabsorption / pernicious anemia if no response to consistent oral repletion', 'Persistent hyperhomocysteinemia after B12+folate replete (MTHFR discussion)'],
        monitor: 'B12 + homocysteine at ~10 weeks'
      }
    },
    {
      id: 'thyroid',
      headline: 'tsh',
      tag: 'the thyroid',
      severity: 'attention',
      trend: 'improving',
      markers: ['tsh', 't3', 't4'],
      regions: ['thyroid'],
      human: {
        title: 'Thyroid still working too hard, but improving',
        short: 'Thyroid is working extra hard, but it\'s getting better.',
        body: 'TSH is above range at 6.82, but it has come down a long way from 10.12 in December, and the actual thyroid hormones (T3, T4) are solidly normal. Keep an eye on it rather than worry about it.',
        actions: ['Retest monthly for now']
      },
      expert: {
        title: 'Subclinical hypothyroidism, improving',
        pattern: 'TSH 10.12 (Dec 2025) → 6.25 (repeat, 3 days later) → 6.82 (Aug 2026), ref 0.38–5.33, with normal T4 12.1 and T3 1.52 throughout — subclinical, and the Dec repeat already showed regression toward the mean. Below the usual ≥10 treatment threshold absent symptoms.',
        accountFor: ['Symptoms review (energy, cold intolerance, weight)', 'TPO antibodies never tested — would establish autoimmune etiology', 'B12 deficiency co-occurrence (autoimmune association)'],
        ruleOut: ['Persistent vs transient elevation (monthly cadence per report)', 'Assay/timing variability — TSH drawn at different times of day'],
        monitor: 'Thyroid profile monthly (report advisory)'
      }
    },
    {
      id: 'lipids',
      headline: 'ldl',
      tag: 'cholesterol',
      severity: 'attention',
      trend: 'stable',
      markers: ['ldl', 'tc', 'apob', 'hscrp'],
      regions: ['heart'],
      human: {
        title: 'Cholesterol: one number up, the rest look great',
        short: 'One cholesterol number is up. The rest look great.',
        body: 'LDL has drifted up (132), but triglycerides normalized, HDL rose to 56, and the deeper particle test (ApoB) is comfortably normal. The overall heart-risk picture improved even though the headline number didn\'t.',
        actions: ['Diet: fibre up, saturated fat down', 'Recheck with next draw']
      },
      expert: {
        title: 'Isolated LDL-C elevation with reassuring ApoB',
        pattern: 'LDL-C 131.9 (ref <100), TC 201.9 — but ApoB 93.9 (ref 60–140), non-HDL 146, TC/HDL 3.61, TG 79.7, HDL 55.9. LDL-C/ApoB discordance suggests particle number is less concerning than LDL-C alone implies. hs-CRP 2.3 mg/L = intermediate-risk band, down from 3.08.',
        accountFor: ['Recent 5 kg weight loss (transient LDL rises can occur)', 'Dietary saturated-fat pattern', 'Thyroid status — hypothyroidism raises LDL; may fall as TSH normalizes'],
        ruleOut: ['Persistent elevation on repeat fasting panel (NCEP: confirm across samples)', 'Familial pattern if LDL stays >130 despite TSH and weight stabilizing'],
        monitor: 'Fasting lipids with next draw'
      }
    },
    {
      id: 'vitd',
      headline: 'vitd',
      tag: 'vitamin D',
      severity: 'watch',
      trend: 'improving',
      markers: ['vitd'],
      regions: ['bones'],
      human: {
        title: 'Vitamin D nearly there',
        short: 'Vitamin D is almost at the good zone. Keep going.',
        body: 'From 9 → 18 → 29 across three tests. You\'re one step from the sufficient zone (30+). Whatever you\'re doing, keep doing it.',
        actions: ['Continue D3 weekly', 'Sunlight helps too']
      },
      expert: {
        title: 'Vitamin D insufficiency, steadily correcting',
        pattern: '9.36 → 18.23 → 29.41 ng/mL (sufficiency ≥30) on 60k IU/week D3 + K2. Calcium 10.3 (upper-normal) — worth a glance when D3 continues.',
        accountFor: ['Maintenance vs loading dose from here', 'Calcium at 10.3 with ongoing D3'],
        ruleOut: [],
        monitor: 'Vitamin D every 2 months (report advisory)'
      }
    }
  ],

  routine: [
    { id: 'mob', day: 'Mon', time: '19:15', label: 'Mobility + yoga', mins: 45 },
    { id: 'pil', day: 'Wed', time: '19:15', label: 'Core pilates', mins: 45 },
    { id: 'car', day: 'Fri', time: '18:15', label: 'Cardio', mins: 40 }
  ],

  /* filled in from Settings › People — never committed, see .gitignore */
  insurance: {},

  regimen: [
    { name: 'B12 (Methylcobalamin)', dose: '1500 mcg sublingual, daily', note: 'level still low — adherence is the question' },
    { name: 'Vitamin D3', dose: '60,000 IU weekly, with fatty meal', note: 'working — 9 → 29 ng/ml' },
    { name: 'Vitamin K2 (MK-7)', dose: '100 mcg daily, with D3', note: 'D3 companion' },
    { name: 'Omega-3', dose: '1000–2000 mg EPA+DHA daily', note: 'TG normalized' },
    { name: 'Magnesium Glycinate', dose: '300–400 mg, night', note: 'sleep + thyroid support' }
  ],

  retests: [
    { label: 'Thyroid profile + Testosterone', every: '1 month', due: 'Sep 2026', overdue: false },
    { label: 'B12 + Homocysteine', every: '2 months', due: 'Oct 2026', overdue: false },
    { label: 'Hemogram, Iron, Folate, Vit D', every: '2 months', due: 'Oct 2026', overdue: false }
  ],

  records: [
    {
      title: 'Life Maximiser Plus — Smart Report',
      lab: 'Healthians',
      date: 'Aug 2026',
      pages: 44,
      file: 'reports/amit-g-report.pdf',
      downloadName: 'amit-healthians-smart-report-2026-08.pdf',
      covers: 'Jul 2023 → Aug 2026 (4 draws)'
    }
  ]
});
