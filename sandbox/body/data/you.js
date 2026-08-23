/* body. — the demo persona.
   This is who the app shows to anyone who opens it without ?lovesey.
   Every number here is invented but internally coherent: the trends,
   the flags and the prose all agree with each other, so the interface
   can be explored honestly without exposing a real person's records. */

window.BODY.patients.push({
  id: 'you',
  demo: true,
  name: 'You',
  shortName: 'You',
  sex: 'm',
  age: 34,
  avatar: '',
  accent: 'var(--accent-you)',
  accentSoft: 'var(--accent-you-soft)',

  healthScore: 86,
  prevHealthScore: 82,
  vitals: { heightLabel: "5'9\"", heightCm: 175, weightKg: 74, bmi: 24.2 },

  summary: 'A sample body, so you can look around. Two things to tend, plenty going right.',
  wins: 'Blood pressure settled into range, triglycerides down from 190 to 128, resting heart rate down to 62, and HbA1c is comfortably normal at 5.2.',
  winsShort: 'Blood pressure settled, blood fats down, heart rate lower.',
  winsSince: 'Feb 2026',

  draws: [
    { id: '2025-02-14', label: 'Feb 2025' },
    { id: '2026-02-11', label: 'Feb 2026' },
    { id: '2026-08-15', label: 'Aug 2026' }
  ],

  results: {
    tc: { '2025-02-14': 214, '2026-02-11': 205, '2026-08-15': 196 },
    hdl: { '2025-02-14': 41, '2026-02-11': 44.6, '2026-08-15': 49.2 },
    ldl: { '2025-02-14': 138, '2026-02-11': 129, '2026-08-15': 118.4 },
    tg: { '2025-02-14': 190, '2026-02-11': 152, '2026-08-15': 128 },
    vldl: { '2026-08-15': 25.6 },
    nonhdl: { '2026-08-15': 146.8 },
    apob: { '2026-08-15': 96 },

    alp: { '2026-02-11': 78, '2026-08-15': 81.4 },
    ggtp: { '2025-02-14': 44, '2026-02-11': 38.2, '2026-08-15': 33.6 },
    ast: { '2025-02-14': 34, '2026-02-11': 29.8, '2026-08-15': 27.4 },
    alt: { '2025-02-14': 46, '2026-02-11': 38.4, '2026-08-15': 34.1 },
    bili_total: { '2026-08-15': 0.71 },
    albumin: { '2026-08-15': 4.5 },
    proteins: { '2026-08-15': 7.2 },

    t3: { '2026-08-15': 1.21 },
    t4: { '2026-08-15': 8.9 },
    tsh: { '2025-02-14': 3.1, '2026-02-11': 3.44, '2026-08-15': 3.62 },

    hba1c: { '2025-02-14': 5.6, '2026-02-11': 5.4, '2026-08-15': 5.2 },
    glucose_f: { '2026-02-11': 96, '2026-08-15': 91 },

    vitd: { '2025-02-14': 16.4, '2026-02-11': 21.2, '2026-08-15': 26.8 },
    b12: { '2026-02-11': 268, '2026-08-15': 305 },

    iron: { '2026-08-15': 88 },
    ferritin: { '2026-08-15': 96 },

    hscrp: { '2026-02-11': 2.4, '2026-08-15': 1.6 },
    esr: { '2026-08-15': 7 },
    homocysteine: { '2026-08-15': 11.2 },

    creatinine: { '2026-02-11': 0.92, '2026-08-15': 0.95 },
    egfr: { '2026-08-15': 104 },
    urea: { '2026-08-15': 26 },
    uric_acid: { '2025-02-14': 7.1, '2026-02-11': 6.9, '2026-08-15': 7.4 },
    sodium: { '2026-08-15': 141 },
    potassium: { '2026-08-15': 4.3 },
    calcium: { '2026-08-15': 9.5 },
    magnesium: { '2026-08-15': 2.0 },

    hb: { '2025-02-14': 15.1, '2026-02-11': 15.3, '2026-08-15': 15.2 },
    tlc: { '2026-08-15': 6.4 },
    rbc: { '2026-08-15': 5.1 },
    pcv: { '2026-08-15': 45.2 },
    platelets: { '2026-08-15': 268 },
    mcv: { '2026-08-15': 88.6 },

    /* things measured at home */
    bp_sys: { '2026-02-11': 138, '2026-08-15': 124, '2026-08-22': 121 },
    bp_dia: { '2026-02-11': 88, '2026-08-15': 80, '2026-08-22': 78 },
    resting_hr: { '2026-02-11': 74, '2026-08-15': 65, '2026-08-22': 62 },
    sleep_h: { '2026-08-22': 6.2 },
    steps: { '2026-08-22': 7400 }
  },

  issues: [
    {
      id: 'sleep',
      tag: 'sleep',
      headline: 'sleep_h',
      severity: 'priority',
      trend: 'worsening',
      markers: ['sleep_h', 'resting_hr'],
      regions: ['brain'],
      human: {
        title: 'Sleep is running short',
        short: 'You are averaging just over 6 hours. Aim for 7.',
        body: 'Logged sleep has been sitting around 6 hours a night, below the 7–9 most adults need. Short sleep nudges blood pressure, appetite and blood sugar in the wrong direction, so it is worth treating as a real health item rather than a lifestyle detail. The good news: it is the single change with the widest knock-on benefit.',
        actions: ['Pick a fixed lights-out time', 'Log sleep for two weeks', 'Screens off 45 min before bed']
      },
      expert: {
        title: 'Chronic short sleep with sympathetic signature',
        pattern: 'Self-logged sleep ~6.2 h/night against a 7–9 h target, alongside resting HR that improved to 62 but plateaued. Short sleep duration is an independent risk factor for hypertension and insulin resistance; note prior BP 138/88 normalising to 121/78 as other habits improved.',
        accountFor: ['Shift or late-work pattern', 'Caffeine timing', 'Alcohol before bed (fragments sleep architecture)'],
        ruleOut: ['Obstructive sleep apnoea if snoring or daytime somnolence', 'Restless legs / iron status (ferritin 96 is adequate)'],
        monitor: 'Two weeks of logged sleep, then review'
      }
    },
    {
      id: 'uric',
      tag: 'uric acid',
      headline: 'uric_acid',
      severity: 'attention',
      trend: 'worsening',
      markers: ['uric_acid'],
      regions: ['kidneys'],
      human: {
        title: 'Uric acid is creeping up',
        short: 'A bit high, and rising. Water and less sugar help.',
        body: 'Uric acid has gone from 6.9 to 7.4, just past the top of the range. On its own it rarely causes symptoms, but sustained high levels can lead to gout and are linked to blood pressure. Hydration, fewer sugary drinks and less alcohol move this number quickly.',
        actions: ['Drink more water daily', 'Cut sugary drinks', 'Recheck in 3 months']
      },
      expert: {
        title: 'Hyperuricaemia, mild and trending up',
        pattern: 'Uric acid 7.1 → 6.9 → 7.4 mg/dl (ref 3.5–7.2). eGFR 104 and creatinine 0.95 — renal handling intact. No gout history recorded.',
        accountFor: ['Fructose and alcohol intake', 'Purine-heavy diet', 'Thiazide or low-dose aspirin if taken'],
        ruleOut: ['Gout if any acute mono-arthritis', 'Metabolic syndrome clustering (BP, lipids, HbA1c all improving here)'],
        monitor: 'Repeat uric acid in 3 months'
      }
    },
    {
      id: 'vitd-you',
      tag: 'vitamin D',
      headline: 'vitd',
      severity: 'attention',
      trend: 'improving',
      markers: ['vitd'],
      regions: ['bones'],
      human: {
        title: 'Vitamin D still below the line',
        short: 'Climbing nicely — 16 to 27. Keep going to 30.',
        body: 'Vitamin D has risen steadily over 18 months and is nearly at the sufficient zone of 30. Whatever you have been doing is working; the last stretch just needs consistency.',
        actions: ['Keep the weekly D3', 'Daylight before noon']
      },
      expert: {
        title: 'Vitamin D insufficiency, correcting',
        pattern: '16.4 → 21.2 → 26.8 ng/ml (sufficiency ≥ 30). Calcium 9.5 and magnesium 2.0 both adequate as cofactors.',
        accountFor: ['Dose consistency', 'Sun exposure and skin tone'],
        ruleOut: [],
        monitor: 'Vitamin D in 3 months'
      }
    },
    {
      id: 'lipids-you',
      tag: 'cholesterol',
      headline: 'ldl',
      severity: 'watch',
      trend: 'improving',
      markers: ['ldl', 'tc', 'hdl', 'tg'],
      regions: ['heart'],
      human: {
        title: 'Cholesterol heading the right way',
        short: 'Everything improved. LDL is just over the line.',
        body: 'Total cholesterol, LDL and triglycerides all fell over the last year while HDL rose — that is the whole panel moving in the right direction at once. LDL at 118 is still a little above the ideal 100, so this stays a watch item, not a worry.',
        actions: ['Keep it up', 'Recheck with next panel']
      },
      expert: {
        title: 'Improving atherogenic profile, LDL above optimal',
        pattern: 'LDL-C 138 → 129 → 118.4; TG 190 → 128; HDL 41 → 49.2; ApoB 96 (ref 60–140); non-HDL 146.8. hs-CRP down 2.4 → 1.6. Consistent directional improvement across the panel.',
        accountFor: ['Sustained diet and activity changes', 'Family history of premature CAD if any'],
        ruleOut: ['Persistent LDL > 130 on repeat despite lifestyle'],
        monitor: 'Fasting lipids in 6 months'
      }
    }
  ],

  routine: [
    { id: 'mob', day: 'Mon', time: '19:15', label: 'Mobility + yoga', mins: 45 },
    { id: 'pil', day: 'Wed', time: '19:15', label: 'Core pilates', mins: 45 },
    { id: 'car', day: 'Fri', time: '18:15', label: 'Cardio', mins: 40 }
  ],

  regimen: [
    { name: 'Vitamin D3', dose: '60,000 IU weekly', note: 'working — 16 → 27 ng/ml' },
    { name: 'Omega-3', dose: '1000 mg daily', note: 'triglycerides down' }
  ],

  retests: [
    { label: 'Uric acid', every: '3 months', due: 'Nov 2026', overdue: false },
    { label: 'Vitamin D', every: '3 months', due: 'Nov 2026', overdue: false },
    { label: 'Lipids + HbA1c', every: '6 months', due: 'Feb 2027', overdue: false }
  ],

  insurance: {
    provider: 'Example Health Insurance',
    policyNo: 'DEMO-0000-0000',
    type: 'Family floater',
    sumInsured: '₹10,00,000',
    validTill: 'Mar 2027',
    tpa: 'Demo TPA Services',
    helpline: '1800-000-0000',
    note: 'Sample details — edit your own in Settings › People.'
  },

  records: [
    {
      title: 'Annual health check (sample)',
      lab: 'Example Diagnostics',
      date: 'Aug 2026',
      pages: 12,
      file: '',
      downloadName: '',
      covers: 'Feb 2025 → Aug 2026 (3 draws)'
    }
  ]
});
