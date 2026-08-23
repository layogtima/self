/* BODY — Aparna Divakar. Raw values transcribed from
   reports/aparna-d-report.pdf (Healthians Smart Report 3.0, sampled 22 Aug 2026,
   with comparative history back to Jun 2023). Values exactly as printed.
   The issues[] blurbs are curated content — the part the doctor fine-tunes. */

window.BODY.patients.push({
  id: 'aparna',
  name: 'Aparna Divakar',
  shortName: 'Aparna',
  sex: 'f',
  age: 33,
  avatar: 'assets/aparna-d.webp',
  accent: 'var(--accent-aparna)',
  accentSoft: 'var(--accent-aparna-soft)',

  healthScore: 83,
  prevHealthScore: null,
  vitals: { heightLabel: "5'3\"", heightCm: 160, weightKg: 70, bmi: 27.01 },

  summary: 'Mostly steady — the liver panel is the one thing that needs a doctor\'s attention soon.',
  wins: 'Triglycerides normalized (232 → 130), HDL up to 53, thyroid fully normal, HbA1c 4.7, homocysteine normal, all screening markers clear, and the fibrosis score says no lasting liver damage is likely.',
  winsShort: 'Blood fats normal again, thyroid great, no lasting liver damage likely.',
  winsSince: 'Dec 2025',

  draws: [
    { id: '2023-06-24', label: 'Jun 2023' },
    { id: '2025-12-10', label: 'Dec 2025' },
    { id: '2026-08-22', label: 'Aug 2026' }
  ],

  results: {
    /* lipids */
    tc: { '2023-06-24': 205, '2025-12-10': 201, '2026-08-22': 201.4 },
    hdl: { '2023-06-24': 43.9, '2025-12-10': 42.6, '2026-08-22': 52.7 },
    ldl: { '2023-06-24': 139, '2026-08-22': 133.1 },
    tg: { '2023-06-24': 89, '2025-12-10': 232.5, '2026-08-22': 129.5 },
    vldl: { '2026-08-22': 16 },
    nonhdl: { '2026-08-22': 148.7 },
    tc_hdl: { '2026-08-22': 3.82 },
    ldl_hdl: { '2026-08-22': 2.53 },
    apoa1: { '2026-08-22': 125.6 },
    apob: { '2026-08-22': 95.6 },
    apob_a1: { '2026-08-22': 0.76 },

    /* liver */
    alp: { '2023-06-24': 98.5, '2025-12-10': 95.4, '2026-08-22': 104.6 },
    ggtp: { '2023-06-24': 105.6, '2025-12-10': 123.3, '2026-08-22': 221.3 },
    proteins: { '2023-06-24': 7, '2025-12-10': 7.48, '2026-08-22': 7.52 },
    ast: { '2023-06-24': 63.4, '2025-12-10': 22.8, '2026-08-22': 45.6 },
    alt: { '2023-06-24': 62.1, '2025-12-10': 28.5, '2026-08-22': 107.4 },
    bili_total: { '2026-08-22': 0.92 },
    bili_direct: { '2026-08-22': 0.18 },
    bili_indirect: { '2026-08-22': 0.75 },
    albumin: { '2026-08-22': 4.33 },
    globulin: { '2026-08-22': 3.19 },
    ag_ratio: { '2026-08-22': 1.36 },
    ast_alt: { '2026-08-22': 0.42 },
    nafld: { '2026-08-22': -4.25 },

    /* thyroid */
    t3: { '2025-12-10': 1.45, '2026-08-22': 1.27 },
    t4: { '2025-12-10': 7.24, '2026-08-22': 9.11 },
    tsh: { '2025-12-10': 1.87, '2026-08-22': 2.15 },

    /* glucose & insulin */
    hba1c: { '2025-12-10': 5.3, '2026-08-22': 4.7 },
    glucose_f: { '2026-08-22': 84.4 },
    insulin_f: { '2026-08-22': 22.70 },

    /* vitamins */
    vitd: { '2023-06-24': 13.71, '2025-12-10': 19.68, '2026-08-22': 23.76 },
    b12: { '2026-08-22': 218 },

    /* iron */
    iron: { '2025-12-10': 140, '2026-08-22': 95 },
    ferritin: { '2025-12-10': 72.4, '2026-08-22': 57 },
    tibc: { '2026-08-22': 373.5 },
    uibc: { '2026-08-22': 278.50 },
    transferrin_sat: { '2026-08-22': 25.44 },

    /* inflammation */
    crp: { '2026-08-22': 3.76 },
    hscrp: { '2026-08-22': 3.11 },
    esr: { '2023-06-24': 39, '2026-08-22': 19 },
    homocysteine: { '2026-08-22': 10.0 },
    ra_factor: { '2026-08-22': '<10' },

    /* hormones + screening */
    testosterone: { '2026-08-22': 0.81 },
    prolactin: { '2026-08-22': 9.9 },
    fsh: { '2026-08-22': 3.46 },
    lh: { '2026-08-22': 4.97 },
    ca125: { '2026-08-22': 11.4 },
    ca153: { '2026-08-22': 9.50 },
    cea: { '2026-08-22': 1.81 },

    /* kidney & electrolytes */
    creatinine: { '2023-06-24': 0.64, '2025-12-10': 0.76, '2026-08-22': 0.78 },
    egfr: { '2026-08-22': 102.79 },
    urea: { '2023-06-24': 13, '2025-12-10': 13, '2026-08-22': 14.8 },
    bun: { '2026-08-22': 6.9 },
    uric_acid: { '2023-06-24': 6.4, '2025-12-10': 5.9, '2026-08-22': 6.9 },
    sodium: { '2023-06-24': 138, '2025-12-10': 138, '2026-08-22': 140 },
    potassium: { '2023-06-24': 3.95, '2026-08-22': 4.53 },
    chloride: { '2023-06-24': 105, '2025-12-10': 102, '2026-08-22': 106 },
    phosphorus: { '2023-06-24': 2.8, '2026-08-22': 3.7 },

    /* CBC */
    hb: { '2023-06-24': 14.2, '2025-12-10': 14.1, '2026-08-22': 14.1 },
    tlc: { '2026-08-22': 7.3 },
    rbc: { '2026-08-22': 4.90 },
    pcv: { '2026-08-22': 42.6 },
    platelets: { '2023-06-24': 329, '2025-12-10': 330, '2026-08-22': 300 },
    mcv: { '2026-08-22': 87.1 },
    mch: { '2026-08-22': 28.8 },
    mchc: { '2026-08-22': 33.1 },
    rdw_cv: { '2026-08-22': 13.2 },
    rdw_sd: { '2026-08-22': 40.30 },
    neutrophils: { '2026-08-22': 43.1 },
    lymphocytes: { '2026-08-22': 44.5 },
    monocytes: { '2026-08-22': 9.7 },
    eosinophils: { '2026-08-22': 2.4 },
    basophils: { '2026-08-22': 0.3 },
    anc: { '2026-08-22': 3.15 },
    alc: { '2026-08-22': 3.25 },
    amc: { '2026-08-22': 0.71 },
    aec: { '2026-08-22': 0.18 },
    abc: { '2026-08-22': 0.02 },
    mpv: { '2026-08-22': 8.2 },

    /* urine */
    u_color: { '2026-08-22': 'Yellow' },
    u_appearance: { '2026-08-22': 'Clear' },
    u_sg: { '2026-08-22': 1.015 },
    u_ph: { '2026-08-22': 5.0 },
    u_glucose: { '2026-08-22': 'Negative' },
    u_protein: { '2026-08-22': 'Negative' },
    u_ketones: { '2025-12-10': 'Negative', '2026-08-22': 'Negative' },
    u_blood: { '2026-08-22': 'Negative' },
    u_pus: { '2026-08-22': '2-3' },
    u_epithelial: { '2026-08-22': '3-4' },
    u_bacteria: { '2026-08-22': 'Absent' },

    /* other */
    amylase: { '2026-08-22': 64.6 },
    lipase: { '2026-08-22': 31 },
    magnesium: { '2026-08-22': 1.9 },
    calcium: { '2023-06-24': 8.7, '2025-12-10': 9.4, '2026-08-22': 9.4 },
    hbsag: { '2026-08-22': 'Non-Reactive' }
  },

  issues: [
    {
      id: 'liver',
      headline: 'ggtp',
      tag: 'the liver',
      severity: 'priority',
      trend: 'worsening',
      markers: ['ggtp', 'alt', 'ast', 'alp', 'nafld'],
      regions: ['liver'],
      human: {
        title: 'Liver enzymes need a doctor visit soon',
        short: 'The liver needs a doctor visit soon. Very fixable.',
        body: 'GGT and ALT have risen clearly since December — this is the one result that shouldn\'t wait for the next routine check. The reassuring part: the fibrosis score says lasting damage is unlikely, bilirubin and liver function are fully normal, and enzyme rises like this are usually reversible once the cause is found.',
        actions: ['Book a liver ultrasound', 'Review meds, supplements & alcohol with doctor', 'Recheck liver panel in 4–6 weeks']
      },
      expert: {
        title: 'GGT-dominant mixed liver enzyme elevation, rising',
        pattern: 'GGT 105.6 → 123.3 → 221.3 U/L (ref 5–38, now ~5.8× ULN); ALT 62.1 → 28.5 → 107.4 (ref 3–35, ~3.1× ULN); AST 45.6; ALP 104.6 (mildly high). R-factor ≈ 2.9 → mixed hepatocellular/cholestatic picture with GGT dominance. Synthetic function intact: bilirubin 0.92, albumin 4.33, A/G 1.36. NFS −4.25 → advanced fibrosis unlikely. Context: fasting insulin 22.7 (ceiling), BMI 27, TG spiked to 232 in Dec 2025 — metabolic-liver axis plausible, but the steep GGT rise over 8 months deserves a real workup.',
        accountFor: ['Alcohol pattern (GGT is the most alcohol-sensitive enzyme)', 'All medications, OCP, herbal/ayurvedic supplements', 'Metabolic axis: insulin 22.7, HOMA-IR ≈ 4.7, BMI 27', 'Rate of change: GGT +80% in 8 months'],
        ruleOut: ['Fatty liver / steatohepatitis — ultrasound ± elastography', 'Biliary pathology (GGT+ALP pattern)', 'Viral hepatitis (HBsAg non-reactive; consider HCV)', 'Autoimmune hepatitis / Wilson\'s if elevation persists unexplained'],
        monitor: 'Repeat LFT in 4–6 weeks'
      }
    },
    {
      id: 'metabolic',
      headline: 'insulin_f',
      tag: 'blood sugar balance',
      severity: 'attention',
      trend: 'stable',
      markers: ['insulin_f', 'uric_acid', 'testosterone', 'tg'],
      regions: ['pancreas', 'hormones'],
      human: {
        title: 'Body working hard to keep blood sugar normal',
        short: 'Blood sugar is fine, but the body works extra hard for it.',
        body: 'Blood sugar itself is excellent (HbA1c 4.7), but fasting insulin is at the very top of its range — the body is compensating. Together with uric acid and a slightly high testosterone, it\'s a pattern worth discussing once, not a crisis. It also ties into the liver picture.',
        actions: ['Discuss insulin resistance with doctor', 'Movement + strength work help this directly']
      },
      expert: {
        title: 'Compensated insulin resistance, possible PCOS axis',
        pattern: 'Fasting insulin 22.70 µIU/mL (ref 1.9–23) with glucose 84.4 → HOMA-IR ≈ 4.7 (IR threshold ~2.5). HbA1c 4.7 — fully compensated. Supporting: uric acid 6.9 (ref 2.6–6.0), TG 232 in Dec 2025, BMI 27, testosterone 0.81 (ref < 0.75). Prolactin, FSH, LH normal. Links mechanistically to the liver/NAFLD picture.',
        accountFor: ['Cycle history + clinical signs (Rotterdam criteria) for PCOS', 'Insulin resistance as driver of both liver and lipid findings', 'Uric acid 6.9 as metabolic-syndrome component'],
        ruleOut: ['PCOS (ultrasound already indicated for liver — ovaries can be assessed same visit)', 'Repeat fasting insulin+glucose to confirm (single measurement)'],
        monitor: 'Fasting insulin + glucose with next draw'
      }
    },
    {
      id: 'vitd',
      headline: 'vitd',
      tag: 'vitamin D',
      severity: 'attention',
      trend: 'improving',
      markers: ['vitd'],
      regions: ['bones'],
      human: {
        title: 'Vitamin D still low, but climbing',
        short: 'Vitamin D is low but climbing. Keep at it.',
        body: '13.7 → 19.7 → 23.8 across three years — moving the right way, still short of the sufficient zone (30+). Worth stepping up the dose consistency.',
        actions: ['D3 weekly, consistently', 'Retest in 2 months']
      },
      expert: {
        title: 'Vitamin D insufficiency, slowly correcting',
        pattern: '13.71 → 19.68 → 23.76 ng/mL (sufficiency ≥30). Magnesium 1.9 at the floor of range — relevant as a D3 cofactor. Calcium normal.',
        accountFor: ['Dose adequacy — current trajectory needs ~2 more cycles', 'Magnesium repletion as cofactor'],
        ruleOut: [],
        monitor: 'Vit D + Calcium every 2 months (report advisory)'
      }
    },
    {
      id: 'b12',
      headline: 'b12',
      tag: 'vitamin B12',
      severity: 'watch',
      trend: 'new',
      markers: ['b12'],
      regions: ['brain', 'blood'],
      human: {
        title: 'B12 sitting right at the line',
        short: 'B12 is right at the line. An easy fix.',
        body: '218 against a lower limit of 222 — technically low but only just, and homocysteine (the downstream marker) is completely normal, which suggests it isn\'t biting yet. Easy to fix before it becomes a thing.',
        actions: ['Start a B12 supplement', 'Retest next month']
      },
      expert: {
        title: 'Borderline B12, functionally compensated',
        pattern: 'B12 218 pg/mL (ref 222–1439) with homocysteine 10.0 (ref 5–13) normal — borderline number without functional deficiency. CBC unremarkable (MCV 87.1).',
        accountFor: ['Dietary intake', 'Trajectory — first measurement, no trend yet'],
        ruleOut: ['Functional deficiency if homocysteine rises on retest'],
        monitor: 'B12 + Folate monthly (report advisory)'
      }
    },
    {
      id: 'inflammation-lipids',
      headline: 'hscrp',
      tag: 'inflammation',
      severity: 'watch',
      trend: 'improving',
      markers: ['hscrp', 'esr', 'ldl', 'tc'],
      regions: ['heart'],
      human: {
        title: 'Mild background inflammation + borderline cholesterol',
        short: 'A little inflammation — just keep an eye on it.',
        body: 'The inflammation markers are mildly up (and ESR has halved since 2023), and LDL cholesterol sits just above range while everything else in the lipid panel improved. Both are "keep an eye on it" items that may settle as the liver and insulin picture is sorted.',
        actions: ['Recheck with next draw']
      },
      expert: {
        title: 'Low-grade inflammation with borderline LDL',
        pattern: 'hs-CRP 3.11 mg/L (≥3 = higher-risk band), ESR 19 (ref 0–12, down from 39 in 2023), CRP 3.76 within range. LDL-C 133.1 but ApoB 95.6 normal, TC/HDL 3.82 — discordance again reassuring. Likely downstream of the metabolic/liver picture rather than independent.',
        accountFor: ['hs-CRP is non-specific — recent illness invalidates it', 'Expected to improve with liver/IR management'],
        ruleOut: ['Persistently elevated hs-CRP on repeat (NCEP: repeat before acting on it)'],
        monitor: 'Lipids + hs-CRP with next draw'
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
    { name: 'Vitamin D3', dose: '60,000 IU weekly', note: 'seeded from report advisory — confirm current use' },
    { name: 'Vitamin B12', dose: 'daily supplement', note: 'suggested by borderline level — confirm with doctor' }
  ],

  retests: [
    { label: 'Liver panel recheck', every: '4–6 weeks', due: 'early Oct 2026', overdue: false },
    { label: 'B12 + Folate', every: '1 month', due: 'Sep 2026', overdue: false },
    { label: 'ECG', every: '1 month', due: 'Sep 2026', overdue: false },
    { label: 'Vit D, Calcium, Hemogram, Smear', every: '2 months', due: 'Oct 2026', overdue: false }
  ],

  records: [
    {
      title: 'Life Maximiser Plus — Smart Report',
      lab: 'Healthians',
      date: 'Aug 2026',
      pages: 47,
      file: 'reports/aparna-d-report.pdf',
      downloadName: 'aparna-healthians-smart-report-2026-08.pdf',
      covers: 'Jun 2023 → Aug 2026 (3 draws)'
    }
  ]
});
