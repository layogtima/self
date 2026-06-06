/**
 * Lion Circuits — API Factory & Mock Data
 *
 * Drop-in replacement: swap MockAPI for a real fetch-based client
 * implementing the same interface. The app calls only:
 *
 *   API.pricing.calculate(specs)   → { unitCost, nre, … total }
 *   API.gerber.analyze(file)       → { layers, width, height }
 *   API.gerber.sampleZipBlob()     → Blob (zip)
 *   API.catalog                    → static option sets
 */

// ─── Catalog: every selectable option in the UI ───────────────

const Catalog = Object.freeze({

  baseMaterials: [
    { id: 'fr4',      label: 'FR4',       desc: 'Glass-reinforced epoxy. Industry standard.' },
    { id: 'rogers',   label: 'Rogers',    desc: 'Low-loss PTFE. For RF & microwave.', pro: true },
    { id: 'aluminum', label: 'Aluminum',  desc: 'Metal-core. For LED & high-heat.', pro: true },
  ],

  layers: {
    basic: [2, 4, 6],
    pro:   [8, 10, 12, 14, 18, 20, 22],
  },

  quantities: {
    basic: [5, 10, 15, 20, 25],
  },

  thickness: [
    { value: 0.4, label: '0.4 mm', desc: 'Ultra-thin',      pro: true },
    { value: 0.6, label: '0.6 mm', desc: 'Very thin',        pro: true },
    { value: 0.8, label: '0.8 mm', desc: 'Thin' },
    { value: 1.2, label: '1.2 mm', desc: 'Slim' },
    { value: 1.6, label: '1.6 mm', desc: 'Standard',         recommended: true },
    { value: 2.0, label: '2.0 mm', desc: 'Thick' },
    { value: 2.4, label: '2.4 mm', desc: 'Extra thick',      pro: true },
  ],

  copper: [
    { value: 1, label: '1 oz (35 μm)',  desc: 'Standard for most signal traces.',  recommended: true },
    { value: 2, label: '2 oz (70 μm)',  desc: 'Higher current capacity.',           pro: true },
    { value: 3, label: '3 oz (105 μm)', desc: 'Heavy power applications.',          pro: true },
  ],

  finish: [
    { id: 'hasl',     label: 'HASL',           desc: 'Hot-air leveled tin-lead. Most economical.',     recommended: true },
    { id: 'leadfree', label: 'Lead-Free HASL', desc: 'RoHS-compliant. Slightly higher cost.' },
    { id: 'enig',     label: 'ENIG',           desc: 'Immersion gold. Flat pads for fine-pitch BGA.',  pro: true },
  ],

  maskColors: [
    { id: 'green', label: 'Green', hex: '#1B7A2B', desc: 'Classic. Best contrast for inspection.' },
    { id: 'blue',  label: 'Blue',  hex: '#1565C0', desc: 'Popular for commercial products.' },
    { id: 'red',   label: 'Red',   hex: '#C62828', desc: 'Bold. Great for prototyping.' },
    { id: 'black', label: 'Black', hex: '#2C2C2C', desc: 'Sleek, professional finish.' },
    { id: 'white', label: 'White', hex: '#E0E0E0', desc: 'Clean look. Ideal for LED boards.' },
  ],

  buildTime: [
    { id: '5-6', label: '5–6 Business Days', desc: 'Standard production',          icon: 'fa-leaf',   surcharge: 0 },
    { id: '4-5', label: '4–5 Business Days', desc: 'Priority queue',               icon: 'fa-gauge',  surcharge: 0 },
    { id: '2-3', label: '2–3 Business Days', desc: 'Rush — dedicated line',        icon: 'fa-bolt',   surcharge: 200 },
    { id: '1-2', label: '1–2 Business Days', desc: 'Express — top priority',       icon: 'fa-rocket', surcharge: 500 },
  ],

  shipping: [
    { id: 'standard', label: 'DTDC Standard', desc: '2–3 working days after production', cost: 0 },
    { id: 'plus',     label: 'DTDC Plus',     desc: '1–2 working days after production', cost: 150 },
  ],

  deliveryFormats: [
    { id: 'single',      label: 'Single PCB',           desc: 'Individual boards.' },
    { id: 'panel_cust',  label: 'Panel by Customer',    desc: 'You provide the panelization.',   pro: true },
    { id: 'panel_lc',    label: 'Panel by Lion Circuits', desc: 'We panelize for optimal yield.', pro: true },
  ],

  discreteDesigns: [1, 2, 3],
});


// ─── Tips: educational content for every field ────────────────

const Tips = Object.freeze({
  layers:
    'Layers are the copper sheets that carry electrical signals inside your PCB. ' +
    'A 2-layer board has copper on the top and bottom — perfect for most hobby and simple commercial circuits. ' +
    '4+ layers add internal copper planes for complex routing, better power distribution, and reduced electromagnetic interference. ' +
    'Rule of thumb: if your schematic fits comfortably on one side, 2 layers works. ' +
    'Dense microcontroller or high-speed designs typically need 4 or more.',

  dimensions:
    'The physical outline size of your PCB in millimeters (width × height). ' +
    'Larger boards use more raw material and cost more to produce. ' +
    'If you uploaded a Gerber file, we auto-detect this from your board-outline layer. ' +
    'Tip: keeping your board compact saves cost and makes it easier to fit in enclosures.',

  quantity:
    'How many identical copies of your board you need. ' +
    'Unit cost drops significantly at higher quantities because setup costs (NRE) are spread across more boards. ' +
    'For initial prototyping, 5–10 is typical. For pilot runs, 50–100. ' +
    'Need more than 25? Switch to Pro mode for custom quantities.',

  baseMaterial:
    'The substrate your PCB is built on. ' +
    'FR4 is the industry workhorse — a glass-reinforced epoxy laminate that works for 95% of designs. ' +
    'Rogers materials are low-loss PTFE laminates for RF/microwave circuits above 1 GHz. ' +
    'Aluminum-backed PCBs conduct heat away from components — standard for LED lighting and power converters.',

  thickness:
    'The total stackup thickness of your finished board, measured in millimeters. ' +
    '1.6 mm is the global standard — compatible with most connectors, enclosures, and card-edge slots. ' +
    'Go thinner (0.8 mm) for wearables, compact devices, or flex-rigid transitions. ' +
    'Go thicker (2.0–2.4 mm) when you need mechanical rigidity or specific connector requirements.',

  copper:
    'Copper weight indicates how thick the copper foil is on each layer, measured in ounces per square foot. ' +
    '1 oz (35 μm) is standard — handles up to ~1.5 A per mm of trace width. ' +
    '2 oz (70 μm) doubles current capacity — use for power rails, motor drivers, or high-current LED strings. ' +
    '3 oz (105 μm) is for dedicated power boards and industrial applications.',

  finish:
    'Surface finish protects exposed copper pads from oxidation and ensures reliable soldering. ' +
    'HASL (Hot Air Solder Leveling) coats pads with molten solder — most economical, great for hand-soldering and standard SMD. ' +
    'Lead-Free HASL is the same process with RoHS-compliant alloy — required for products sold in the EU. ' +
    'ENIG (Electroless Nickel/Immersion Gold) gives perfectly flat pads — essential for fine-pitch BGA, QFN, and press-fit connectors.',

  maskColor:
    'Solder mask is the colored polymer coating that covers your PCB\'s copper traces, ' +
    'protecting them from accidental solder bridges, oxidation, and environmental damage. ' +
    'Green offers the best visual contrast during manual inspection — it\'s the engineer\'s choice. ' +
    'Other colors perform identically and are chosen for branding or product aesthetics.',

  buildTime:
    'Production lead time from order confirmation to boards leaving the factory. ' +
    'Standard (5–6 days) runs in our normal queue and gives the best value. ' +
    'Rush and express options put your order on a dedicated production line — ' +
    'ideal for tight deadlines, competition prep, or time-sensitive prototyping.',

  shipping:
    'Delivery transit time after your boards are manufactured and pass quality inspection. ' +
    'Standard DTDC shipping is free and arrives in 2–3 working days across India. ' +
    'DTDC Plus gets your boards there in 1–2 working days for time-critical projects.',

  deliveryFormat:
    'How your boards are delivered. ' +
    'Single PCB means we ship individual, routed boards ready to use. ' +
    'Panel by Customer means you provide the panelization layout in your Gerber files. ' +
    'Panel by Lion Circuits means our engineers panelize your design for optimal material yield — recommended for production runs.',

  discreteDesign:
    'If your order contains multiple different board designs in one panel, indicate how many unique designs are included. ' +
    'Most orders have 1 design. Multi-design panels are common when you want to produce several small boards together.',
});


// ─── Pricing Service (mock — swap for real API) ──────────────

const PricingEngine = {

  _baseRate: {
    2: 79.96,  4: 199.90,  6: 399.80,  8: 799.60,
    10: 1199.40, 12: 1599.20, 14: 1999.00,
    18: 2998.50, 20: 3498.25, 22: 3998.00,
  },

  _thicknessMul: {
    0.4: 1.15, 0.6: 1.10, 0.8: 1.05, 1.0: 1.02,
    1.2: 1.00, 1.6: 1.00, 2.0: 1.10, 2.4: 1.20,
  },

  _finishMul: { hasl: 1.00, leadfree: 1.15, enig: 1.50 },

  _copperMul: { 1: 1.00, 2: 1.30, 3: 1.60 },

  _buildSurcharge: { '5-6': 0, '4-5': 0, '2-3': 200, '1-2': 500 },

  _shippingCost: { standard: 0, plus: 150 },

  _GST_RATE: 0.18,

  calculate(specs) {
    const rate       = this._baseRate[specs.layers] || 79.96;
    const areaFactor = Math.max((specs.width * specs.height) / 2000, 0.5);
    const thickF     = this._thicknessMul[specs.thickness] || 1.0;
    const finishF    = this._finishMul[specs.finish] || 1.0;
    const copperF    = this._copperMul[specs.copperThickness] || 1.0;

    const unitCost   = +(rate * areaFactor * thickF * finishF * copperF).toFixed(2);
    const nre        = specs.layers > 2 ? 500 : 0;
    const itemsTotal = +(unitCost * specs.quantity).toFixed(2);
    const subtotal   = +(itemsTotal + nre).toFixed(2);

    const buildSurcharge = this._buildSurcharge[specs.buildTime] || 0;
    const beforeTax      = subtotal + buildSurcharge;
    const gst            = +(beforeTax * this._GST_RATE).toFixed(2);
    const shippingCost   = this._shippingCost[specs.shipping] || 0;
    const total          = +(beforeTax + gst + shippingCost).toFixed(2);

    return {
      unitCost,
      nre,
      quantity: specs.quantity,
      itemsTotal,
      subtotal,
      buildSurcharge,
      gst,
      shippingCost,
      total,
    };
  },
};


// ─── Gerber Service (mock analysis + sample generation) ──────

const GerberService = {

  analyze(file) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          layers: 2,
          width: 50,
          height: 40,
          drillCount: 24,
          format: 'RS-274X',
        });
      }, 1800);
    });
  },

  async sampleZipBlob() {
    const JSZip = window.JSZip;
    if (!JSZip) {
      throw new Error('JSZip not loaded');
    }

    const zip = new JSZip();

    zip.file('sample_top_copper.gtl', [
      'G04 Lion Circuits Sample — Top Copper*',
      '%FSLAX36Y36*%',
      '%MOMM*%',
      '%ADD10C,0.254*%',
      '%ADD11C,1.524*%',
      '%ADD12R,1.524X1.524*%',
      'D10*',
      'X0Y0D02*',
      'X50000000Y0D01*',
      'X50000000Y40000000D01*',
      'X0Y40000000D01*',
      'X0Y0D01*',
      'D10*',
      'X5000000Y5000000D02*',
      'X20000000Y5000000D01*',
      'X20000000Y20000000D01*',
      'D11*',
      'X10000000Y10000000D03*',
      'X15000000Y10000000D03*',
      'X10000000Y15000000D03*',
      'X15000000Y15000000D03*',
      'X30000000Y25000000D03*',
      'X35000000Y25000000D03*',
      'X40000000Y25000000D03*',
      'D12*',
      'X25000000Y30000000D03*',
      'X30000000Y30000000D03*',
      'X35000000Y30000000D03*',
      'X40000000Y30000000D03*',
      'M02*',
    ].join('\n'));

    zip.file('sample_bottom_copper.gbl', [
      'G04 Lion Circuits Sample — Bottom Copper*',
      '%FSLAX36Y36*%',
      '%MOMM*%',
      '%ADD10C,0.254*%',
      '%ADD11C,1.524*%',
      'D10*',
      'X0Y0D02*',
      'X50000000Y0D01*',
      'X50000000Y40000000D01*',
      'X0Y40000000D01*',
      'X0Y0D01*',
      'D11*',
      'X10000000Y10000000D03*',
      'X15000000Y10000000D03*',
      'X10000000Y15000000D03*',
      'X15000000Y15000000D03*',
      'M02*',
    ].join('\n'));

    zip.file('sample_board_outline.gko', [
      'G04 Lion Circuits Sample — Board Outline (50 × 40 mm)*',
      '%FSLAX36Y36*%',
      '%MOMM*%',
      '%ADD10C,0.100*%',
      'D10*',
      'X0Y0D02*',
      'X50000000Y0D01*',
      'X50000000Y40000000D01*',
      'X0Y40000000D01*',
      'X0Y0D01*',
      'M02*',
    ].join('\n'));

    zip.file('sample_soldermask_top.gts', [
      'G04 Lion Circuits Sample — Top Solder Mask*',
      '%FSLAX36Y36*%',
      '%MOMM*%',
      '%ADD11C,1.778*%',
      '%ADD12R,1.778X1.778*%',
      'D11*',
      'X10000000Y10000000D03*',
      'X15000000Y10000000D03*',
      'X10000000Y15000000D03*',
      'X15000000Y15000000D03*',
      'X30000000Y25000000D03*',
      'X35000000Y25000000D03*',
      'X40000000Y25000000D03*',
      'D12*',
      'X25000000Y30000000D03*',
      'X30000000Y30000000D03*',
      'X35000000Y30000000D03*',
      'X40000000Y30000000D03*',
      'M02*',
    ].join('\n'));

    zip.file('sample_drill.drl', [
      'M48',
      '; Lion Circuits Sample — Drill File',
      'METRIC,TZ',
      'T1C0.800',
      'T2C1.000',
      '%',
      'T1',
      'X10000Y10000',
      'X15000Y10000',
      'X10000Y15000',
      'X15000Y15000',
      'T2',
      'X25000Y30000',
      'X30000Y30000',
      'X35000Y30000',
      'X40000Y30000',
      'M30',
    ].join('\n'));

    zip.file('README.txt', [
      'SAMPLE GERBER FILE SET — Lion Circuits',
      '========================================',
      '',
      'Board: 50 mm × 40 mm, 2-layer, FR4',
      '',
      'This sample contains standard Gerber RS-274X and Excellon drill files',
      'for a simple demo PCB. Use it to explore the Lion Circuits quotation tool.',
      '',
      'Files included:',
      '  sample_top_copper.gtl      — Top copper layer',
      '  sample_bottom_copper.gbl   — Bottom copper layer',
      '  sample_board_outline.gko   — Board outline / mechanical',
      '  sample_soldermask_top.gts  — Top solder mask openings',
      '  sample_drill.drl           — Drill / holes (Excellon)',
      '',
      'In your own projects, these files are generated automatically by',
      'PCB design software like KiCad, Eagle, Altium Designer, or EasyEDA.',
      '',
      'Learn more: https://www.lioncircuits.com',
    ].join('\n'));

    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  },
};


// ─── API Factory ─────────────────────────────────────────────
//
// Usage in the app:
//   const price = API.pricing.calculate(specs);
//   const info  = await API.gerber.analyze(file);
//   const blob  = await API.gerber.sampleZipBlob();
//   const opts  = API.catalog.maskColors;
//   const tip   = API.tips.layers;
//
// To connect a real backend, replace the pricing/gerber
// implementations while keeping the same signatures.
// ─────────────────────────────────────────────────────────────

const API = Object.freeze({
  pricing: PricingEngine,
  gerber:  GerberService,
  catalog: Catalog,
  tips:    Tips,
});
