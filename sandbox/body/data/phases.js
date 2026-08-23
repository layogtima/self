/* body. — the day/night keyframe table.
   One anchor per phase of the light. setPhase(hour) in app.js lerps between
   the two surrounding anchors and writes the result to documentElement as
   CSS custom properties, so the whole scene follows the real clock.

   `dark: true` means readability tokens flip to the dark set at this anchor
   (in theme mode "auto"). Everything else is pure scenery. */

window.BODY_PHASES = {
  /* where the sun/moon sits: hour -> arc. Day runs sunrise..sunset. */
  sunrise: 6.2,
  sunset: 18.6,

  anchors: [
    {
      at: 0, name: 'Deep night', dark: true,
      vars: {
        'sky-top': '#081a17', 'sky-haze': '#0c2620', 'field': '#0b241f',
        'mountain': '#2c4740', 'mountain-near': '#1d352f',
        'meadow': '#04100c', 'glow': '#4ecda0',
        'sun-core': '#cfe4f2', 'sun-disc': '#e8f1f7', 'sun-edge': '#a9c6d8',
        'star-opacity': '1', 'haze-strength': '0.25', 'scene-warm': '0'
      }
    },
    {
      at: 5.2, name: 'First light', dark: true,
      vars: {
        'sky-top': '#243a4a', 'sky-haze': '#4a4a5e', 'field': '#3d3f4a',
        'mountain': '#5c5a70', 'mountain-near': '#3f4055',
        'meadow': '#131f26', 'glow': '#63c9b0',
        'sun-core': '#ffd9b0', 'sun-disc': '#f2a86a', 'sun-edge': '#e08a52',
        'star-opacity': '0.45', 'haze-strength': '0.55', 'scene-warm': '0.3'
      }
    },
    {
      at: 6.8, name: 'Dawn', dark: false,
      vars: {
        'sky-top': '#f6dcc4', 'sky-haze': '#f4c69c', 'field': '#e8bb95',
        'mountain': '#9d8092', 'mountain-near': '#7d6579',
        'meadow': '#2a4238', 'glow': '#3fbf94',
        'sun-core': '#fff0d2', 'sun-disc': '#f7b167', 'sun-edge': '#e8894a',
        'star-opacity': '0', 'haze-strength': '0.7', 'scene-warm': '0.75'
      }
    },
    {
      at: 9.5, name: 'Morning', dark: false,
      vars: {
        'sky-top': '#fdfaea', 'sky-haze': '#f8ead0', 'field': '#eee0b6',
        'mountain': '#95879b', 'mountain-near': '#776d84',
        'meadow': '#204237', 'glow': '#35b489',
        'sun-core': '#fffbe8', 'sun-disc': '#fbe6a4', 'sun-edge': '#eec96e',
        'star-opacity': '0', 'haze-strength': '0.42', 'scene-warm': '0.4'
      }
    },
    {
      at: 13, name: 'Midday', dark: false,
      vars: {
        'sky-top': '#fbf5dd', 'sky-haze': '#f7e6b4', 'field': '#eddcae',
        'mountain': '#8d7f8e', 'mountain-near': '#6f6577',
        'meadow': '#1e4034', 'glow': '#35b489',
        'sun-core': '#fff6d6', 'sun-disc': '#f7d98a', 'sun-edge': '#e2a94e',
        'star-opacity': '0', 'haze-strength': '0.35', 'scene-warm': '0.5'
      }
    },
    {
      at: 17.2, name: 'Golden hour', dark: false,
      vars: {
        'sky-top': '#fbe6bd', 'sky-haze': '#f6c98c', 'field': '#e9bd88',
        'mountain': '#8f7385', 'mountain-near': '#6d5568',
        'meadow': '#22392e', 'glow': '#3cbf95',
        'sun-core': '#ffeec0', 'sun-disc': '#f6b45f', 'sun-edge': '#dd8438',
        'star-opacity': '0', 'haze-strength': '0.62', 'scene-warm': '0.9'
      }
    },
    {
      at: 19.1, name: 'Dusk', dark: true,
      vars: {
        'sky-top': '#3f3a56', 'sky-haze': '#7a5570', 'field': '#5d4258',
        'mountain': '#4e4361', 'mountain-near': '#382f49',
        'meadow': '#111d22', 'glow': '#4ecda0',
        'sun-core': '#ffd0a8', 'sun-disc': '#e88b62', 'sun-edge': '#c96a4a',
        'star-opacity': '0.35', 'haze-strength': '0.5', 'scene-warm': '0.6'
      }
    },
    {
      at: 21, name: 'Night', dark: true,
      vars: {
        'sky-top': '#102a25', 'sky-haze': '#14372e', 'field': '#12302a',
        'mountain': '#3d5a52', 'mountain-near': '#2b4740',
        'meadow': '#061510', 'glow': '#4ecda0',
        'sun-core': '#c6e3f4', 'sun-disc': '#e4eff6', 'sun-edge': '#9fc0d4',
        'star-opacity': '0.9', 'haze-strength': '0.3', 'scene-warm': '0.1'
      }
    },
    {
      at: 24, name: 'Deep night', dark: true,
      vars: {
        'sky-top': '#081a17', 'sky-haze': '#0c2620', 'field': '#0b241f',
        'mountain': '#2c4740', 'mountain-near': '#1d352f',
        'meadow': '#04100c', 'glow': '#4ecda0',
        'sun-core': '#cfe4f2', 'sun-disc': '#e8f1f7', 'sun-edge': '#a9c6d8',
        'star-opacity': '1', 'haze-strength': '0.25', 'scene-warm': '0'
      }
    }
  ],

  presets: [
    { label: 'Dawn', h: 6.6 },
    { label: 'Morning', h: 9.5 },
    { label: 'Noon', h: 13 },
    { label: 'Golden', h: 17.4 },
    { label: 'Dusk', h: 19.1 },
    { label: 'Night', h: 22 }
  ]
};
