/* ==========================================================================
   Special Days — themes, gold SVG library, registry
   Loaded synchronously before paint so the active card is resolved early.
   Dates: "MM-DD" = fixed every year, "YYYY-MM-DD" = lunar / dated festival.
   ========================================================================== */

var THEME_PRESETS = {
  'theme-emerald':  { label: 'Emerald',  accent: '#FDE68A' },
  'theme-royal':    { label: 'Royal',    accent: '#FDE68A' },
  'theme-harvest':  { label: 'Harvest',  accent: '#FDE68A' },
  'theme-tricolor': { label: 'Tricolor', accent: '#FDE68A' },
  'theme-sapphire': { label: 'Sapphire', accent: '#FDE68A' },
  'theme-gratitude':{ label: 'Gratitude',accent: '#FDE68A' }
};

/* one shared gradient + shadow definition, injected once by the engine */
var SD_GOLD_DEFS =
  '<svg class="sd-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">' +
    '<defs>' +
      '<linearGradient id="sdGold" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#FEF3C7"/>' +
        '<stop offset="52%" stop-color="#FDE68A"/>' +
        '<stop offset="100%" stop-color="#D97706"/>' +
      '</linearGradient>' +
      '<linearGradient id="sdGoldLite" x1="0" y1="1" x2="0" y2="0">' +
        '<stop offset="0%" stop-color="#D97706"/>' +
        '<stop offset="55%" stop-color="#FDE68A"/>' +
        '<stop offset="100%" stop-color="#FEF3C7"/>' +
      '</linearGradient>' +
      '<filter id="sdGoldShadow" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feDropShadow dx="0" dy="1.4" stdDeviation="1.5" flood-color="#451A03" flood-opacity="0.45"/>' +
      '</filter>' +
      '<radialGradient id="sdMarigold" cx="0.38" cy="0.3" r="0.78">' +
        '<stop offset="0%" stop-color="#FDE68A"/>' +
        '<stop offset="42%" stop-color="#F59E0B"/>' +
        '<stop offset="100%" stop-color="#C2410C"/>' +
      '</radialGradient>' +
      '<radialGradient id="sdGlow" cx="0.5" cy="0.5" r="0.5">' +
        '<stop offset="0%" stop-color="#FDE68A" stop-opacity="0.55"/>' +
        '<stop offset="58%" stop-color="#F59E0B" stop-opacity="0.22"/>' +
        '<stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<linearGradient id="sdLeaf" x1="0" y1="0" x2="0.45" y2="1">' +
        '<stop offset="0%" stop-color="#46A576"/>' +
        '<stop offset="58%" stop-color="#1F6B4E"/>' +
        '<stop offset="100%" stop-color="#0D4534"/>' +
      '</linearGradient>' +
    '</defs>' +
  '</svg>';

var SVG_LIBRARY = {
  patterns: {
    muggu_grid:
      '<svg viewBox="0 0 640 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<g fill="none" stroke="#FDE68A" stroke-width="1">' +
          '<path d="M0 40h640M0 100h640M70 0v160M210 0v160M350 0v160M490 0v160"/>' +
          '<path d="M0 70h640M0 130h640" stroke-dasharray="2 8"/>' +
        '</g>' +
        '<g fill="#FDE68A">' +
          '<circle cx="70" cy="40" r="3"/><circle cx="210" cy="40" r="3"/><circle cx="350" cy="40" r="3"/><circle cx="490" cy="40" r="3"/>' +
          '<circle cx="70" cy="100" r="3"/><circle cx="210" cy="100" r="3"/><circle cx="350" cy="100" r="3"/><circle cx="490" cy="100" r="3"/>' +
          '<circle cx="140" cy="70" r="2"/><circle cx="280" cy="70" r="2"/><circle cx="420" cy="70" r="2"/><circle cx="560" cy="70" r="2"/>' +
        '</g>' +
        '<g fill="none" stroke="#FDE68A" stroke-width="1" opacity=".7">' +
          '<path d="M140 56l8 8-8 8-8-8zM280 116l8 8-8 8-8-8zM420 56l8 8-8 8-8-8zM560 116l8 8-8 8-8-8z"/>' +
        '</g>' +
      '</svg>',
    rangoli_rings:
      '<svg viewBox="0 0 640 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<g fill="none" stroke="#FDE68A" stroke-width="1">' +
          '<circle cx="120" cy="80" r="54"/><circle cx="120" cy="80" r="38"/><circle cx="120" cy="80" r="22"/><circle cx="120" cy="80" r="8"/>' +
          '<circle cx="470" cy="80" r="58"/><circle cx="470" cy="80" r="40"/><circle cx="470" cy="80" r="24"/><circle cx="470" cy="80" r="9"/>' +
        '</g>' +
        '<g fill="#FDE68A" opacity=".85">' +
          '<circle cx="120" cy="80" r="2.4"/><circle cx="470" cy="80" r="2.4"/>' +
          '<circle cx="296" cy="34" r="2"/><circle cx="296" cy="126" r="2"/><circle cx="600" cy="34" r="2"/><circle cx="600" cy="126" r="2"/>' +
        '</g>' +
      '</svg>',
    diya_glow:
      '<svg viewBox="0 0 640 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<g fill="none" stroke="#FDE68A" stroke-width="1" opacity=".85">' +
          '<path d="M0 122c80-46 160-46 240 0s160 46 240 0 120-38 160-26"/>' +
          '<path d="M0 140c80-46 160-46 240 0s160 46 240 0 120-38 160-26" opacity=".6"/>' +
        '</g>' +
        '<g fill="#FDE68A">' +
          '<circle cx="96" cy="112" r="3"/><circle cx="250" cy="112" r="3"/><circle cx="404" cy="112" r="3"/><circle cx="558" cy="112" r="3"/>' +
        '</g>' +
      '</svg>',
    temple_arch:
      '<svg viewBox="0 0 640 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<g fill="none" stroke="#FDE68A" stroke-width="1.2">' +
          '<path d="M60 160V66a54 54 0 0 1 108 0v94"/>' +
          '<path d="M236 160V78a44 44 0 0 1 88 0v82"/>' +
          '<path d="M392 160V66a54 54 0 0 1 108 0v94"/>' +
          '<path d="M568 160V78a44 44 0 0 1 60-35"/>' +
          '<path d="M0 46h640" stroke-dasharray="4 10"/>' +
        '</g>' +
        '<g fill="#FDE68A"><circle cx="114" cy="46" r="3"/><circle cx="280" cy="52" r="2.6"/><circle cx="446" cy="46" r="3"/></g>' +
      '</svg>',
    tricolor_waves:
      '<svg viewBox="0 0 640 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<g fill="none" stroke="#FDE68A" stroke-width="2">' +
          '<path d="M0 40c80-26 160-26 240 0s160 26 240 0 120-22 160-14"/>' +
          '<path d="M0 82c80-26 160-26 240 0s160 26 240 0 120-22 160-14" opacity=".72"/>' +
          '<path d="M0 124c80-26 160-26 240 0s160 26 240 0 120-22 160-14" opacity=".45"/>' +
        '</g>' +
        '<g fill="#FDE68A"><circle cx="120" cy="30" r="2.6"/><circle cx="360" cy="72" r="2.6"/><circle cx="560" cy="114" r="2.6"/></g>' +
      '</svg>',
    starfield:
      '<svg viewBox="0 0 640 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<g fill="#FDE68A">' +
          '<circle cx="40" cy="30" r="1.8"/><circle cx="110" cy="118" r="2.2"/><circle cx="180" cy="52" r="1.6"/><circle cx="250" cy="140" r="1.8"/>' +
          '<circle cx="318" cy="26" r="2.4"/><circle cx="382" cy="96" r="1.7"/><circle cx="446" cy="46" r="2"/><circle cx="512" cy="126" r="1.8"/>' +
          '<circle cx="574" cy="62" r="2.2"/><circle cx="612" cy="140" r="1.5"/><circle cx="144" cy="80" r="1.2"/><circle cx="480" cy="12" r="1.3"/>' +
        '</g>' +
        '<g fill="none" stroke="#FDE68A" stroke-width="1" opacity=".8">' +
          '<path d="M318 10l3 9 9 3-9 3-3 9-3-9-9-3 9-3zM574 50l2.4 7 7 2.4-7 2.4-2.4 7-2.4-7-7-2.4 7-2.4z"/>' +
        '</g>' +
      '</svg>',
    leaf_lattice:
      '<svg viewBox="0 0 640 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<g fill="none" stroke="#FDE68A" stroke-width="1.2">' +
          '<path d="M40 160C90 96 150 60 220 20M120 160c40-54 90-84 150-116M200 160c40-54 90-84 150-116"/>' +
          '<path d="M280 160c40-54 90-84 150-116M380 160c40-54 90-84 150-116M480 160c40-54 90-84 150-116"/>' +
          '<path d="M70 110c-14-10-28-12-44-10M120 82c-10-14-12-28-10-44M236 58c14-8 28-8 42-4M336 92c10-12 14-26 12-42"/>' +
        '</g>' +
      '</svg>',
    none: ''
  },

  emblems: {
    kalash:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M26 22h16v6H26z" fill="url(#sdGold)"/>' +
        '<path d="M22 28h24c6 8 7 18 2 26-4 6-24 6-28 0-5-8-4-18 2-26z" fill="url(#sdGold)"/>' +
        '<path d="M24 38c6 4 14 4 20 0" stroke="#7C2D12" stroke-width="1.4" fill="none" opacity=".55"/>' +
        '<path d="M28 24c-5-5-3-12 2-15 2 5 1 10 4 13M34 24c0-6 4-9 8-9-1 5-3 8-6 10" fill="url(#sdGoldLite)"/>' +
        '<circle cx="34" cy="12" r="4" fill="url(#sdGoldLite)"/>' +
        '<path d="M34 8v-2" stroke="#FEF3C7" stroke-width="1.4" stroke-linecap="round"/>' +
        '<path d="M20 54h28" stroke="#FEF3C7" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>' +
      '</g></svg>',
    diya:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<circle cx="34" cy="28" r="16" fill="#FDE68A" opacity=".18"/>' +
        '<path d="M34 8c7 8 6 16 0 21-6-5-7-13 0-21z" fill="url(#sdGoldLite)"/>' +
        '<path d="M34 15c3 4 3 8 0 10-3-2-3-6 0-10z" fill="#FEF3C7"/>' +
        '<path d="M16 34h36c-2 12-10 19-18 19s-16-7-18-19z" fill="url(#sdGold)"/>' +
        '<path d="M12 32h44" stroke="#FEF3C7" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M21 44c8 4 18 4 26 0" stroke="#7C2D12" stroke-width="1.4" fill="none" opacity=".5"/>' +
      '</g></svg>',
    crescent:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M40 10a24 24 0 1 0 14 36A19 19 0 0 1 40 10z" fill="url(#sdGold)"/>' +
        '<path d="M52 16l2.6 5.8 6 2.6-6 2.6L52 33l-2.6-6-6-2.6 6-2.6z" fill="url(#sdGoldLite)"/>' +
        '<path d="M54 40l1.6 3.6 3.8 1.6-3.8 1.6L54 52l-1.6-3.6-3.8-1.6 3.8-1.6z" fill="#FEF3C7"/>' +
        '<circle cx="18" cy="18" r="1.6" fill="#FEF3C7"/><circle cx="14" cy="46" r="1.3" fill="#FEF3C7"/>' +
      '</g></svg>',
    star:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 6l6.4 18.6L60 31l-19.6 6.4L34 62l-6.4-24.6L8 31l19.6-6.4z" fill="url(#sdGold)"/>' +
        '<path d="M34 14l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#FEF3C7" opacity=".75"/>' +
        '<circle cx="34" cy="31" r="3" fill="#fff" opacity=".9"/>' +
        '<path d="M54 8l1.6 4 4 1.6-4 1.6L54 19l-1.6-3.8-4-1.6 4-1.6z" fill="#FEF3C7"/>' +
      '</g></svg>',
    chakra:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<circle cx="34" cy="34" r="24" fill="none" stroke="url(#sdGold)" stroke-width="4"/>' +
        '<circle cx="34" cy="34" r="6" fill="url(#sdGoldLite)"/>' +
        '<g stroke="url(#sdGold)" stroke-width="2" stroke-linecap="round">' +
          '<path d="M34 12v10M34 46v10M12 34h10M46 34h10M18.4 18.4l7 7M42.6 42.6l7 7M49.6 18.4l-7 7M25.4 42.6l-7 7"/>' +
        '</g>' +
        '<circle cx="34" cy="34" r="2.4" fill="#FEF3C7"/>' +
      '</g></svg>',
    kite:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 6l20 22-20 26L14 28z" fill="url(#sdGold)"/>' +
        '<path d="M34 6v48M14 28h40" stroke="#7C2D12" stroke-width="1.2" opacity=".5"/>' +
        '<path d="M34 54c-3 5 2 8 6 6s9 1 7 6" fill="none" stroke="#FDE68A" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M41 60l4-2-2-4M48 64l4-1-1-4" fill="#FDE68A"/>' +
      '</g></svg>',
    tree:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 6l11 16h-6l13 18h-7l14 18H9l14-18h-7l13-18h-6z" fill="url(#sdGold)"/>' +
        '<path d="M34 6l11 16h-6l13 18h-7l14 18H34z" fill="#FEF3C7" opacity=".22"/>' +
        '<rect x="30" y="58" width="8" height="8" rx="2" fill="url(#sdGoldLite)"/>' +
        '<circle cx="27" cy="28" r="2.2" fill="#FEF3C7"/><circle cx="42" cy="40" r="2.2" fill="#FEF3C7"/><circle cx="30" cy="48" r="2" fill="#FEF3C7"/>' +
      '</g></svg>',
    mango:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M38 14c12 2 20 12 20 24 0 12-9 20-21 20-13 0-23-9-23-21 0-13 11-25 24-23z" fill="url(#sdGold)"/>' +
        '<path d="M38 14c-8-6-16-6-22-2 5 5 11 7 18 6" fill="url(#sdGoldLite)"/>' +
        '<path d="M40 26c4 4 5 10 3 15" stroke="#7C2D12" stroke-width="1.4" fill="none" opacity=".45"/>' +
        '<circle cx="28" cy="34" r="4" fill="#FEF3C7" opacity=".5"/>' +
      '</g></svg>',
    flower:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<g fill="url(#sdGold)">' +
          '<ellipse cx="34" cy="18" rx="8" ry="13"/><ellipse cx="34" cy="50" rx="8" ry="13"/>' +
          '<ellipse cx="18" cy="34" rx="13" ry="8"/><ellipse cx="50" cy="34" rx="13" ry="8"/>' +
          '<ellipse cx="22.5" cy="22.5" rx="7" ry="11" transform="rotate(-45 22.5 22.5)"/>' +
          '<ellipse cx="45.5" cy="22.5" rx="7" ry="11" transform="rotate(45 45.5 22.5)"/>' +
          '<ellipse cx="22.5" cy="45.5" rx="7" ry="11" transform="rotate(45 22.5 45.5)"/>' +
          '<ellipse cx="45.5" cy="45.5" rx="7" ry="11" transform="rotate(-45 45.5 45.5)"/>' +
        '</g>' +
        '<circle cx="34" cy="34" r="9" fill="url(#sdGoldLite)"/>' +
        '<circle cx="34" cy="34" r="3.4" fill="#FEF3C7"/>' +
      '</g></svg>',
    book:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M8 14c9-4 17-3 26 3v38c-9-6-17-7-26-3z" fill="url(#sdGold)"/>' +
        '<path d="M60 14c-9-4-17-3-26 3v38c9-6 17-7 26-3z" fill="url(#sdGoldLite)"/>' +
        '<path d="M34 17v38" stroke="#7C2D12" stroke-width="1.4" opacity=".45"/>' +
        '<path d="M14 24c5-1 9 0 13 2M14 32c5-1 9 0 13 2M41 26c4-2 8-3 13-2M41 34c4-2 8-3 13-2" stroke="#7C2D12" stroke-width="1.2" fill="none" opacity=".4"/>' +
      '</g></svg>',
    heart:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 58S8 43 8 25c0-9 7-15 15-15 6 0 9 3 11 7 2-4 5-7 11-7 8 0 15 6 15 15 0 18-26 33-26 33z" fill="url(#sdGold)"/>' +
        '<path d="M20 20c3-2 6-1 7 1" stroke="#FEF3C7" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8"/>' +
      '</g></svg>',
    stethoscope:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)" fill="none" stroke="url(#sdGold)" stroke-width="4" stroke-linecap="round">' +
        '<path d="M20 10v16a12 12 0 0 0 24 0V10"/>' +
        '<path d="M32 38v8a10 10 0 0 0 20 0v-6"/>' +
        '<circle cx="20" cy="9" r="3" fill="url(#sdGoldLite)" stroke="none"/>' +
        '<circle cx="44" cy="9" r="3" fill="url(#sdGoldLite)" stroke="none"/>' +
        '<circle cx="52" cy="36" r="6" fill="url(#sdGoldLite)" stroke="#7C2D12" stroke-width="1.2"/>' +
      '</g></svg>',
    sheaf:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)" stroke="url(#sdGold)" stroke-width="2.4" stroke-linecap="round" fill="none">' +
        '<path d="M24 58c-2-16 0-30 4-44M34 58V8M44 58c2-16 0-30-4-44"/>' +
        '<path d="M28 20l-7-5M28 28l-8-4M28 36l-8-4M40 20l7-5M40 28l8-4M40 36l8-4"/>' +
        '<path d="M22 48c8-3 16-3 24 0" stroke-width="3"/>' +
      '</g><g fill="url(#sdGoldLite)"><ellipse cx="28" cy="15" rx="2.6" ry="5" transform="rotate(-18 28 15)"/><ellipse cx="40" cy="15" rx="2.6" ry="5" transform="rotate(18 40 15)"/><circle cx="34" cy="9" r="3"/></g></svg>',
    tricolor:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M10 12c10-5 18 5 28 0s14 0 20 2v14c-6-2-10-7-20-2s-18-5-28 0z" fill="#F97316"/>' +
        '<path d="M10 26c10-5 18 5 28 0s14 0 20 2v14c-6-2-10-7-20-2s-18-5-28 0z" fill="#FEF3C7"/>' +
        '<path d="M10 40c10-5 18 5 28 0s14 0 20 2v14c-6-2-10-7-20-2s-18-5-28 0z" fill="#15803D"/>' +
        '<circle cx="34" cy="33" r="4.4" fill="none" stroke="#1E3A8A" stroke-width="1.5"/>' +
        '<path d="M34 33V12" stroke="url(#sdGold)" stroke-width="3" stroke-linecap="round"/>' +
      '</g></svg>',
    cross:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M28 8h12v16h16v12H40v24H28V36H12V24h16z" fill="url(#sdGold)"/>' +
        '<path d="M34 6v56M10 30h48" stroke="#FEF3C7" stroke-width="1" opacity=".5"/>' +
        '<circle cx="34" cy="34" r="4" fill="#FEF3C7" opacity=".55"/>' +
      '</g></svg>',
    sun:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<circle cx="34" cy="34" r="14" fill="url(#sdGold)"/>' +
        '<g stroke="url(#sdGoldLite)" stroke-width="3" stroke-linecap="round">' +
          '<path d="M34 6v8M34 54v8M6 34h8M54 34h8M14 14l6 6M48 48l6 6M54 14l-6 6M20 48l-6 6"/>' +
        '</g>' +
        '<circle cx="29" cy="30" r="3" fill="#FEF3C7" opacity=".65"/>' +
      '</g></svg>',
    lamp:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 4v8" stroke="url(#sdGold)" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M20 18h28l-4 7H24z" fill="url(#sdGold)"/>' +
        '<rect x="18" y="25" width="32" height="28" rx="8" fill="url(#sdGold)"/>' +
        '<rect x="24" y="31" width="20" height="16" rx="5" fill="#FEF3C7" opacity=".9"/>' +
        '<path d="M28 57h12l-2 5H30z" fill="url(#sdGoldLite)"/>' +
        '<circle cx="34" cy="39" r="3.4" fill="#D97706"/>' +
      '</g></svg>',
    sparkle:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M30 10l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="url(#sdGold)"/>' +
        '<path d="M50 38l3.4 8.6L62 50l-8.6 3.4L50 62l-3.4-8.6L38 50l8.6-3.4z" fill="url(#sdGoldLite)"/>' +
        '<path d="M18 38l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FEF3C7"/>' +
      '</g></svg>',
    ballot:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M12 26h44v34H12z" fill="url(#sdGold)"/>' +
        '<path d="M22 26V12h24v14" fill="none" stroke="url(#sdGoldLite)" stroke-width="3"/>' +
        '<path d="M22 8h24v18H22z" fill="#FEF3C7" opacity=".9"/>' +
        '<path d="M28 18l4 4 8-9" fill="none" stroke="#B45309" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M12 36h44" stroke="#7C2D12" stroke-width="1.4" opacity=".4"/>' +
      '</g></svg>',
    flag:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M18 8v52" stroke="url(#sdGold)" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M20 10c10-4 16 4 26 0 4-2 8-2 12 0v12c-4-2-8-2-12 0-10 4-16-4-26 0z" fill="#F97316"/>' +
        '<path d="M20 22c10-4 16 4 26 0 4-2 8-2 12 0v12c-4-2-8-2-12 0-10 4-16-4-26 0z" fill="#FEF3C7"/>' +
        '<path d="M20 34c10-4 16 4 26 0 4-2 8-2 12 0v12c-4-2-8-2-12 0-10 4-16-4-26 0z" fill="#15803D"/>' +
        '<circle cx="34" cy="28" r="3.4" fill="none" stroke="#1E3A8A" stroke-width="1.2"/>' +
      '</g></svg>',
    leaf:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M54 12C30 10 12 22 12 40c0 8 6 14 14 14 18 0 28-18 28-42z" fill="url(#sdGold)"/>' +
        '<path d="M18 52c8-14 18-22 32-32" stroke="#7C2D12" stroke-width="1.5" fill="none" opacity=".5"/>' +
        '<path d="M28 40c-1-6 1-10 4-14M34 34c5 0 8-2 10-5" stroke="#7C2D12" stroke-width="1.2" fill="none" opacity=".4"/>' +
      '</g></svg>',
    pinwheel:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 34V8c0-4 8-4 8 2s-8 10-8 24z" fill="url(#sdGold)"/>' +
        '<path d="M34 34h26c4 0 4 8-2 8s-10-8-24-8z" fill="url(#sdGoldLite)"/>' +
        '<path d="M34 34v26c0 4-8 4-8-2s8-10 8-24z" fill="url(#sdGold)"/>' +
        '<path d="M34 34H8c-4 0-4-8 2-8s10 8 24 8z" fill="url(#sdGoldLite)"/>' +
        '<circle cx="34" cy="34" r="4" fill="#FEF3C7"/>' +
        '<path d="M34 38v20" stroke="#FEF3C7" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
      '</g></svg>',
    gear:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)" fill="url(#sdGold)">' +
        '<path d="M29 6h10l1.4 7 5.2 2.2 6-3.6 7 7-3.6 6 2.2 5.2 7 1.4v10l-7 1.4-2.2 5.2 3.6 6-7 7-6-3.6-5.2 2.2L39 62H29l-1.4-7-5.2-2.2-6 3.6-7-7 3.6-6L10.8 38 4 36.6v-10l7-1.4 2.2-5.2-3.6-6 7-7 6 3.6 5.2-2.2z"/>' +
        '<circle cx="34" cy="34" r="10" fill="#FEF3C7" opacity=".9"/>' +
        '<circle cx="34" cy="34" r="4" fill="#B45309"/>' +
      '</g></svg>',
    pen:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M46 6l16 16-34 34-18 4 4-18z" fill="url(#sdGold)"/>' +
        '<path d="M42 14l12 12M14 60l8-8" stroke="#7C2D12" stroke-width="1.4" opacity=".5"/>' +
        '<path d="M10 60l8-8 4 4z" fill="#FEF3C7"/>' +
      '</g></svg>',
    letters:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<text x="34" y="48" text-anchor="middle" font-family="Noto Sans Telugu, Noto Sans, sans-serif" font-size="42" font-weight="700" fill="url(#sdGold)">అ</text>' +
        '<path d="M14 22c8-6 16-8 26-7M38 54c8 1 14-2 18-7" stroke="#FEF3C7" stroke-width="1.6" fill="none" opacity=".55"/>' +
      '</g></svg>',
    map:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 6c12 0 21 8 21 18 0 8-6 13-10 20-4 6-6 12-11 18-5-6-7-12-11-18-4-7-10-12-10-20 0-10 9-18 21-18z" fill="url(#sdGold)"/>' +
        '<circle cx="34" cy="25" r="7" fill="#FEF3C7" opacity=".85"/>' +
        '<circle cx="34" cy="25" r="3" fill="#B45309"/>' +
      '</g></svg>',
    calendar:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<rect x="10" y="14" width="48" height="46" rx="7" fill="url(#sdGold)"/>' +
        '<rect x="10" y="14" width="48" height="14" rx="7" fill="url(#sdGoldLite)"/>' +
        '<path d="M22 8v12M46 8v12" stroke="#FEF3C7" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M20 38h8M30 38h8M40 38h8M20 48h8M30 48h8M40 48h8" stroke="#7C2D12" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>' +
      '</g></svg>',
    ring:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<circle cx="34" cy="40" r="18" fill="none" stroke="url(#sdGold)" stroke-width="5"/>' +
        '<path d="M34 6l10 12-10 9-10-9z" fill="url(#sdGoldLite)"/>' +
        '<path d="M34 9l5 8-5 5-5-5z" fill="#FEF3C7"/>' +
        '<path d="M20 34l4 4M48 44l4 4" stroke="#FEF3C7" stroke-width="1.6" opacity=".6"/>' +
      '</g></svg>',
    gada:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 58V26" stroke="url(#sdGold)" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="34" cy="17" r="12" fill="url(#sdGold)"/>' +
        '<path d="M34 5v24M22 17h24M25 8l18 18M43 8L25 26" stroke="#7C2D12" stroke-width="1.1" opacity=".45"/>' +
        '<circle cx="34" cy="17" r="4" fill="#FEF3C7"/>' +
      '</g></svg>',
    bow:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)" fill="none" stroke="url(#sdGold)" stroke-width="3" stroke-linecap="round">' +
        '<path d="M18 6c20 12 20 44 0 56"/>' +
        '<path d="M18 6v56" stroke-width="1.2" opacity=".7"/>' +
        '<path d="M16 34h40M46 24l12 10-12 10"/>' +
        '<path d="M50 18l8 6-8 6" fill="url(#sdGoldLite)" stroke="none"/>' +
      '</g></svg>',
    lotus:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M34 12c7 8 10 17 8 26H26c-2-9 1-18 8-26z" fill="url(#sdGold)"/>' +
        '<path d="M14 24c9 2 15 8 17 18H12c-3-7-2-13 2-18zM54 24c-9 2-15 8-17 18h19c3-7 2-13-2-18z" fill="url(#sdGoldLite)"/>' +
        '<path d="M8 40c6-3 12-3 18 0 4 6 5 10 5 16-12 2-20-4-23-16zM60 40c-6-3-12-3-18 0-4 6-5 10-5 16 12 2 20-4 23-16z" fill="url(#sdGold)"/>' +
        '<circle cx="34" cy="40" r="6" fill="#FEF3C7" opacity=".8"/>' +
      '</g></svg>',
    rakhi:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M4 34c10-8 20-8 30 0s20 8 30 0M4 44c10-8 20-8 30 0s20 8 30 0" stroke="url(#sdGold)" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="34" cy="38" r="12" fill="url(#sdGoldLite)"/>' +
        '<circle cx="34" cy="38" r="7" fill="#B45309"/>' +
        '<path d="M34 22c3-5 8-6 12-3-3 5-8 6-12 3z" fill="#FEF3C7"/>' +
        '<circle cx="34" cy="38" r="2.6" fill="#FEF3C7"/>' +
      '</g></svg>',
    flute:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M12 54L52 14" stroke="url(#sdGold)" stroke-width="7" stroke-linecap="round"/>' +
        '<g fill="#7C2D12" opacity=".6"><circle cx="26" cy="40" r="1.8"/><circle cx="34" cy="32" r="1.8"/><circle cx="42" cy="24" r="1.8"/><circle cx="20" cy="46" r="1.8"/></g>' +
        '<path d="M48 10l10 10-4 4-10-10z" fill="url(#sdGoldLite)"/>' +
        '<path d="M10 56l6-6" stroke="#FEF3C7" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g></svg>',
    om:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<text x="34" y="54" text-anchor="middle" font-family="Noto Sans Telugu, Noto Sans, serif" font-size="46" font-weight="700" fill="url(#sdGold)">ఓం</text>' +
      '</g></svg>',
    bathukamma:
      '<svg viewBox="0 0 68 68" aria-hidden="true"><g filter="url(#sdGoldShadow)">' +
        '<path d="M16 58h36l-4-8H20z" fill="url(#sdGold)"/>' +
        '<path d="M20 50h28l-4-8H24z" fill="url(#sdGoldLite)"/>' +
        '<path d="M24 42h20l-3-8H27z" fill="url(#sdGold)"/>' +
        '<circle cx="34" cy="30" r="7" fill="url(#sdGoldLite)"/>' +
        '<circle cx="22" cy="24" r="5" fill="url(#sdGold)"/><circle cx="46" cy="24" r="5" fill="url(#sdGoldLite)"/>' +
        '<circle cx="34" cy="16" r="4.6" fill="#FEF3C7"/>' +
        '<circle cx="16" cy="34" r="3.4" fill="#FDE68A"/><circle cx="52" cy="34" r="3.4" fill="#FDE68A"/>' +
      '</g></svg>'
  },

  decor: {
    lanterns:
      '<svg viewBox="0 0 168 64" aria-hidden="true">' +
        '<path d="M6 6h156" stroke="#FDE68A" stroke-width="1.2" opacity=".55"/>' +
        '<g class="sd-sway">' +
          '<path d="M32 6v10" stroke="#FDE68A" stroke-width="1.2"/>' +
          '<path d="M24 16h16l-2.4 4H26.4z" fill="url(#sdGold)"/>' +
          '<rect x="24" y="20" width="16" height="20" rx="5" fill="url(#sdGold)"/>' +
          '<rect x="28" y="24" width="8" height="12" rx="3" fill="#FEF3C7" opacity=".92"/>' +
          '<path d="M26 40h12l-2 4H28z" fill="url(#sdGoldLite)"/>' +
          '<path d="M30 44v6M34 44v9M38 44v6" stroke="#FDE68A" stroke-width="1.2" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="sd-sway-b">' +
          '<path d="M84 6v6" stroke="#FDE68A" stroke-width="1.2"/>' +
          '<path d="M76 12h16l-2.4 4H78.4z" fill="url(#sdGoldLite)"/>' +
          '<rect x="76" y="16" width="16" height="22" rx="5" fill="url(#sdGoldLite)"/>' +
          '<rect x="80" y="20" width="8" height="14" rx="3" fill="#FEF3C7" opacity=".92"/>' +
          '<path d="M78 38h12l-2 4H80z" fill="url(#sdGold)"/>' +
          '<path d="M82 42v7M86 42v10M90 42v7" stroke="#FDE68A" stroke-width="1.2" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="sd-sway">' +
          '<path d="M136 6v10" stroke="#FDE68A" stroke-width="1.2"/>' +
          '<path d="M128 16h16l-2.4 4h-11.2z" fill="url(#sdGold)"/>' +
          '<rect x="128" y="20" width="16" height="20" rx="5" fill="url(#sdGold)"/>' +
          '<rect x="132" y="24" width="8" height="12" rx="3" fill="#FEF3C7" opacity=".92"/>' +
          '<path d="M130 40h12l-2 4h-8z" fill="url(#sdGoldLite)"/>' +
          '<path d="M134 44v6M138 44v9M142 44v6" stroke="#FDE68A" stroke-width="1.2" stroke-linecap="round"/>' +
        '</g>' +
      '</svg>',
    kites:
      '<svg viewBox="0 0 168 64" aria-hidden="true">' +
        '<g class="sd-sway">' +
          '<path d="M44 4l18 18-18 22-18-22z" fill="url(#sdGold)"/>' +
          '<path d="M44 4v40M26 22h36" stroke="#7C2D12" stroke-width="1" opacity=".45"/>' +
          '<path d="M44 44c-2 5 2 7 6 5s8 0 7 5" stroke="#FDE68A" stroke-width="1.2" fill="none"/>' +
        '</g>' +
        '<g class="sd-sway-b">' +
          '<path d="M112 8l14 14-14 17-14-17z" fill="url(#sdGoldLite)"/>' +
          '<path d="M112 8v31M98 22h28" stroke="#7C2D12" stroke-width="1" opacity=".4"/>' +
          '<path d="M112 39c-2 5 2 6 5 4" stroke="#FDE68A" stroke-width="1.2" fill="none"/>' +
        '</g>' +
        '<g fill="#FEF3C7"><circle cx="76" cy="14" r="1.4"/><circle cx="88" cy="48" r="1.2"/><circle cx="144" cy="40" r="1.4"/></g>' +
      '</svg>',
    diyas:
      '<svg viewBox="0 0 168 64" aria-hidden="true">' +
        '<path d="M0 7c28 13 56 13 84 0s56-13 84 0" fill="none" stroke="#FDE68A" stroke-width="1.2" opacity=".5"/>' +
        '<g fill="#FDE68A" opacity=".7"><circle cx="20" cy="13" r="1.8"/><circle cx="48" cy="17" r="1.8"/><circle cx="84" cy="18" r="1.8"/><circle cx="120" cy="17" r="1.8"/><circle cx="148" cy="13" r="1.8"/></g>' +
        '<g class="sd-spark">' +
          '<circle cx="30" cy="32" r="17" fill="#FDE68A" opacity=".16"/>' +
          '<circle cx="84" cy="28" r="19" fill="#FDE68A" opacity=".18"/>' +
          '<circle cx="138" cy="32" r="17" fill="#FDE68A" opacity=".16"/>' +
        '</g>' +
        '<g fill="url(#sdGold)">' +
          '<path d="M14 40h32c-1.8 9-7.2 13.5-16 13.5S15.8 49 14 40z"/>' +
          '<path d="M68 36h32c-1.8 9-7.2 13.5-16 13.5S69.8 45 68 36z"/>' +
          '<path d="M122 40h32c-1.8 9-7.2 13.5-16 13.5S123.8 49 122 40z"/>' +
        '</g>' +
        '<g fill="url(#sdGoldLite)">' +
          '<path d="M30 22c4.6 5.6 4.6 10.4 0 13.6-4.6-3.2-4.6-8 0-13.6z"/>' +
          '<path d="M84 18c4.6 5.6 4.6 10.4 0 13.6-4.6-3.2-4.6-8 0-13.6z"/>' +
          '<path d="M138 22c4.6 5.6 4.6 10.4 0 13.6-4.6-3.2-4.6-8 0-13.6z"/>' +
        '</g>' +
        '<g fill="#FEF3C7">' +
          '<path d="M30 25.5c2.2 3.2 2.2 5.6 0 7.8-2.2-2.2-2.2-4.6 0-7.8z"/>' +
          '<path d="M84 21.5c2.2 3.2 2.2 5.6 0 7.8-2.2-2.2-2.2-4.6 0-7.8z"/>' +
          '<path d="M138 25.5c2.2 3.2 2.2 5.6 0 7.8-2.2-2.2-2.2-4.6 0-7.8z"/>' +
        '</g>' +
        '<g fill="#FDE68A" opacity=".9"><circle cx="60" cy="30" r="1.5"/><circle cx="114" cy="34" r="1.5"/><circle cx="30" cy="56" r="1.3"/><circle cx="138" cy="56" r="1.3"/></g>' +
      '</svg>',
    toran:
      '<svg viewBox="0 0 168 64" aria-hidden="true">' +
        '<path d="M0 10c28 18 56 18 84 0s56-18 84 0" fill="none" stroke="url(#sdGold)" stroke-width="2"/>' +
        '<g fill="url(#sdGold)">' +
          '<circle cx="18" cy="16" r="6"/><circle cx="46" cy="23" r="6"/><circle cx="74" cy="26" r="6"/>' +
          '<circle cx="102" cy="26" r="6"/><circle cx="130" cy="23" r="6"/><circle cx="158" cy="16" r="6"/>' +
        '</g>' +
        '<g fill="#FEF3C7">' +
          '<circle cx="18" cy="16" r="2.4"/><circle cx="46" cy="23" r="2.4"/><circle cx="74" cy="26" r="2.4"/>' +
          '<circle cx="102" cy="26" r="2.4"/><circle cx="130" cy="23" r="2.4"/><circle cx="158" cy="16" r="2.4"/>' +
        '</g>' +
        '<g class="sd-sway">' +
          '<path d="M60 30v10M84 32v12M108 30v10" stroke="#FDE68A" stroke-width="1.2"/>' +
          '<path d="M56 40h8l-1.4 3H57.4zM80 44h8l-1.4 3h-5.2zM104 40h8l-1.4 3h-5.2z" fill="url(#sdGoldLite)"/>' +
        '</g>' +
      '</svg>',
    tri_ribbons:
      '<svg viewBox="0 0 168 64" aria-hidden="true">' +
        '<g class="sd-sway">' +
          '<path d="M8 12c30 16 62 16 92 0s46-10 60-2" fill="none" stroke="#F97316" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M8 26c30 16 62 16 92 0s46-10 60-2" fill="none" stroke="#FEF3C7" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M8 40c30 16 62 16 92 0s46-10 60-2" fill="none" stroke="#15803D" stroke-width="4" stroke-linecap="round"/>' +
        '</g>' +
        '<g fill="#FDE68A"><circle cx="34" cy="52" r="1.8"/><circle cx="84" cy="54" r="1.6"/><circle cx="136" cy="52" r="1.8"/></g>' +
      '</svg>',
    sparkles:
      '<svg viewBox="0 0 168 64" aria-hidden="true">' +
        '<g class="sd-spark" fill="url(#sdGold)">' +
          '<path d="M38 6l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/>' +
          '<path d="M118 20l3.4 8.6 8.6 3.4-8.6 3.4-3.4 8.6-3.4-8.6-8.6-3.4 8.6-3.4z"/>' +
          '<path d="M80 38l2.6 6.4 6.4 2.6-6.4 2.6L80 56l-2.6-6.4L71 47l6.4-2.6z"/>' +
        '</g>' +
        '<g fill="#FEF3C7"><circle cx="62" cy="22" r="1.6"/><circle cx="142" cy="46" r="1.6"/><circle cx="100" cy="12" r="1.2"/></g>' +
      '</svg>',
    sheaves:
      '<svg viewBox="0 0 168 64" aria-hidden="true">' +
        '<g class="sd-sway" stroke="url(#sdGold)" stroke-width="2" stroke-linecap="round" fill="none">' +
          '<path d="M50 62c-4-20-2-34 6-48M72 62V8M94 62c4-20 2-34-6-48"/>' +
          '<path d="M56 20l-8-4M56 30l-9-4M56 40l-9-4M66 20l8-4M66 30l9-4M66 40l9-4"/>' +
        '</g>' +
        '<g class="sd-sway-b" stroke="url(#sdGoldLite)" stroke-width="2" stroke-linecap="round" fill="none">' +
          '<path d="M120 62c-3-16-1-28 5-40M140 62V14M160 62c3-16 1-28-5-40"/>' +
        '</g>' +
        '<g fill="#FDE68A" opacity=".85"><circle cx="34" cy="54" r="1.6"/><circle cx="112" cy="56" r="1.6"/></g>' +
      '</svg>',
    bells:
      '<svg viewBox="0 0 168 64" aria-hidden="true">' +
        '<g class="sd-sway">' +
          '<path d="M34 8c0 14-8 22-8 32h32c0-10-8-18-8-32z" fill="url(#sdGold)"/>' +
          '<circle cx="42" cy="48" r="4" fill="#FEF3C7"/>' +
          '<path d="M42 4v4" stroke="#FDE68A" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>' +
        '<g class="sd-sway-b">' +
          '<path d="M94 12c0 12-7 19-7 27h28c0-8-7-15-7-27z" fill="url(#sdGoldLite)"/>' +
          '<circle cx="101" cy="46" r="3.4" fill="#FEF3C7"/>' +
          '<path d="M101 8v4" stroke="#FDE68A" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>' +
        '<g fill="#FEF3C7"><circle cx="136" cy="18" r="2"/><circle cx="150" cy="38" r="1.6"/><circle cx="128" cy="48" r="1.4"/></g>' +
      '</svg>',
    none: ''
  }
};

var SPECIAL_DAYS_REGISTRY = [
  /* ---------------------------------------------------------------------
     Harvest — Telugu agricultural & new-year festivals
     --------------------------------------------------------------------- */
  {
    slug: 'bhogi',
    date: '01-13',
    theme: 'theme-harvest',
    pattern: 'muggu_grid',
    emblem: 'kalash',
    decor: 'kites',
    slides: [
      {
        eyebrow: 'భోగి శుభాకాంక్షలు • Happy Bhogi',
        title: 'పాతది వదిలి, కొత్త ఆశలతో భోగి సంబరం',
        subtitle: 'పాత సంవత్సరపు బాధలను పోగొట్టి, కొత్త అవకాశాలను ఆహ్వానించే సమయం ఇది.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ కుటుంబానికి ఆయురారోగ్యాలు, ఆర్థిక బలం',
        subtitle: 'పండుగ సంబరాలతో పాటు, మీ ఆర్థిక లక్ష్యాలకు మేము తోడుగా ఉంటాము.'
      }
    ]
  },
  {
    slug: 'makara-sankranti',
    date: '01-14',
    theme: 'theme-harvest',
    pattern: 'rangoli_rings',
    emblem: 'kite',
    decor: 'kites',
    slides: [
      {
        eyebrow: 'మకర సంక్రాంతి శుభాకాంక్షలు • Happy Makara Sankranti',
        title: 'సూర్యుడి చలనం మీ జీవితంలో కొత్త వెలుగు తీసుకురావాలి',
        subtitle: 'గాలిపటాలు ఎగురుతూ, పంటలు పండుతూ, మీ ఇంట సుఖసంతోషాలు నిండాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కొత్త సంవత్సరం, కొత్త ఆర్థిక ప్రణాళిక',
        subtitle: 'ఇల్లు, వ్యాపారం, విద్య — మీ ప్రతి కలకు సరైన రుణ మార్గాన్ని చూపిస్తాము.'
      }
    ]
  },
  {
    slug: 'kanuma',
    date: '01-15',
    theme: 'theme-harvest',
    pattern: 'leaf_lattice',
    emblem: 'sheaf',
    decor: 'sheaves',
    slides: [
      {
        eyebrow: 'కనుమ శుభాకాంక్షలు • Happy Kanuma',
        title: 'పశుసంపద, వ్యవసాయ శ్రమకు కృతజ్ఞతలు',
        subtitle: 'రైతుల కష్టానికి తగిన ఫలితం దక్కాలని, పంటలు సమృద్ధిగా పండాలని కోరుకుంటున్నాము.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'వ్యవసాయం, చిన్న వ్యాపారానికి ఆర్థిక చేయూత',
        subtitle: 'మీ పని పెట్టుబడితో వృద్ధి చెందాలి — సరైన రుణ ఎంపికలో మేము తోడు.'
      }
    ]
  },
  {
    slug: 'pongal',
    date: '01-15',
    theme: 'theme-harvest',
    pattern: 'leaf_lattice',
    emblem: 'sheaf',
    decor: 'sheaves',
    slides: [
      {
        eyebrow: 'పొంగల్ శుభాకాంక్షలు • Happy Pongal',
        title: 'పొంగుతున్న పాలు మీ ఇంట సమృద్ధిని పెంచాలి',
        subtitle: 'కుటుంబం, పంట, ఆరోగ్యం — అన్నీ పండుగలా వెలుగొందాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'సమృద్ధి అంటే సరైన ఆర్థిక అలవాట్లు',
        subtitle: 'పొదుపు, బీమా, రుణం — మీ కుటుంబ భవిష్యత్తును మేము కలిసి ప్లాన్ చేస్తాము.'
      }
    ]
  },
  {
    slug: 'ugadi',
    date: '2026-03-19',
    theme: 'theme-harvest',
    pattern: 'muggu_grid',
    emblem: 'kalash',
    decor: 'toran',
    slides: [
      {
        eyebrow: 'ఉగాది శుభాకాంక్షలు • Happy Ugadi',
        title: 'శ్రీ పరాభవ నామ సంవత్సర ఉగాది శుభాకాంక్షలు',
        subtitle: 'షడ్రుచుల సమ్మేళనంతో ఈ నూతన సంవత్సరం మీ కుటుంబానికి ఆయురారోగ్య, ఆర్థిక ఐశ్వర్యాలను అందించాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కొత్త ఆశలు, కొత్త ఆర్థిక లక్ష్యాలకు శుభారంభం',
        subtitle: 'మీ కలల ఇంటికి మరియు వ్యాపార అభివృద్ధికి మేము ఎల్లప్పుడూ తోడుగా ఉంటాము.'
      }
    ]
  },
  {
    slug: 'baisakhi',
    date: '04-13',
    theme: 'theme-harvest',
    pattern: 'leaf_lattice',
    emblem: 'sheaf',
    decor: 'sheaves',
    slides: [
      {
        eyebrow: 'బైసాఖీ శుభాకాంక్షలు • Happy Baisakhi',
        title: 'కొత్త పంట, కొత్త ఆర్థిక సంవత్సరానికి శుభారంభం',
        subtitle: 'చేతికి చిక్కిన పంటలా, మీ కష్టానికి తగిన ఫలితం మీ చేతికి చిక్కాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ వ్యాపార వృద్ధికి బలమైన ఆర్థిక భాగస్వామ్యం',
        subtitle: 'వ్యాపార విస్తరణకు అవసరమైన రుణాన్ని సులభంగా ప్లాన్ చేసుకోండి.'
      }
    ]
  },
  {
    slug: 'akshaya-tritiya',
    date: '2026-04-19',
    theme: 'theme-harvest',
    pattern: 'rangoli_rings',
    emblem: 'kalash',
    decor: 'toran',
    slides: [
      {
        eyebrow: 'అక్షయ తృతీయ శుభాకాంక్షలు • Happy Akshaya Tritiya',
        title: 'అక్షయ తృతీయ — మీ సంపద అక్షయంగా వర్ధిల్లాలి',
        subtitle: 'ఈ శుభ దినాన ప్రారంభించిన ప్రతి పెట్టుబడి, ప్రతి ఆర్థిక నిర్ణయం ఫలించాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ఇంటి కొనుగోలుకు ఇది శుభ సమయం',
        subtitle: 'హోమ్ లోన్ ఎంపిక, పత్రాల తనిఖీ, ఆమోదం — ప్రతి దశలో మేము మీతో.'
      }
    ]
  },
  {
    slug: 'guru-purnima',
    date: '2026-07-29',
    theme: 'theme-harvest',
    pattern: 'temple_arch',
    emblem: 'lotus',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'గురు పూర్ణిమ శుభాకాంక్షలు • Happy Guru Purnima',
        title: 'గురువులకు కృతజ్ఞతలు; జ్ఞానం మీ మార్గాన్ని వెలిగించాలి',
        subtitle: 'మార్గదర్శనం ఇచ్చిన ప్రతి గురువుకు ఈ రోజు హృదయపూర్వక నమస్కారం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'సరైన ఆర్థిక జ్ఞానమే మంచి మార్గదర్శి',
        subtitle: 'రుణ నిబంధనలు, వడ్డీ, తిరిగి చెల్లింపు — స్పష్టంగా వివరిస్తాము.'
      }
    ]
  },
  {
    slug: 'onam',
    date: '2026-08-26',
    theme: 'theme-harvest',
    pattern: 'leaf_lattice',
    emblem: 'flower',
    decor: 'toran',
    slides: [
      {
        eyebrow: 'ఓణం శుభాకాంక్షలు • Happy Onam',
        title: 'పూల పర్ణాలు, ఓణసద్యం మీ ఇంట సమృద్ధిని తీసుకురావాలి',
        subtitle: 'మహాబలి రాజ్యంలా, మీ ఇంట సమానత్వం, సంతోషం నిండాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'పండుగ సమృద్ధి, సరైన ఆర్థిక ప్రణాళికతో',
        subtitle: 'మీ కుటుంబ లక్ష్యాలకు అనుగుణమైన రుణ పరిష్కారం మేము అందిస్తాము.'
      }
    ]
  },

  /* ---------------------------------------------------------------------
     Royal — temple, harvest-of-light and devotional festivals
     --------------------------------------------------------------------- */
  {
    slug: 'maha-shivaratri',
    date: '2026-02-15',
    theme: 'theme-royal',
    pattern: 'temple_arch',
    emblem: 'om',
    decor: 'bells',
    slides: [
      {
        eyebrow: 'మహా శివరాత్రి శుభాకాంక్షలు • Happy Maha Shivaratri',
        title: 'ఓం నమః శివాయ — శివుడి ఆశీర్వాదం మీతో ఉండాలి',
        subtitle: 'ఉపవాసం, జాగరణతో పాటు, మీ మనసు శాంతితో నిండాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ధైర్యం, స్థిరత్వం మీ ఆర్థిక నిర్ణయాల్లో ఉండాలి',
        subtitle: 'ఆర్థిక ఒత్తిడి ఉన్నా, సరైన మార్గాన్ని చూపడం మా బాధ్యత.'
      }
    ]
  },
  {
    slug: 'holi',
    date: '2026-03-03',
    theme: 'theme-royal',
    pattern: 'rangoli_rings',
    emblem: 'flower',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'హోలీ శుభాకాంక్షలు • Happy Holi',
        title: 'రంగుల సంబరంలో మీ జీవితం రంగులమయం కావాలి',
        subtitle: 'పాత కోపాలు, గత సంవత్సరపు ఒత్తిడి — అన్నీ రంగుల్లో కలిసిపోవాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కొత్త సంవత్సరం, కొత్త ఆర్థిక రంగులు',
        subtitle: 'మీ లక్ష్యాలకు తగిన రుణ ఎంపికతో ఆర్థిక జీవితాన్ని రంగులమయం చేయండి.'
      }
    ]
  },
  {
    slug: 'rama-navami',
    date: '2026-03-26',
    theme: 'theme-royal',
    pattern: 'temple_arch',
    emblem: 'bow',
    decor: 'toran',
    slides: [
      {
        eyebrow: 'శ్రీరామ నవమి శుభాకాంక్షలు • Sri Rama Navami',
        title: 'శ్రీ రామచంద్రుడి కృప మీ కుటుంబానికి రక్షణగా ఉండాలి',
        subtitle: 'ధర్మం, సత్యం, కుటుంబ బంధం — శ్రీరాముడి ఆదర్శాలు మీ ఇంట నిలవాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ కుటుంబ భవిష్యత్తుకు సురక్షిత ఆర్థిక మార్గం',
        subtitle: 'ఇల్లు, విద్య, వ్యాపారం — ప్రతి అవసరానికి నమ్మకమైన మార్గదర్శనం.'
      }
    ]
  },
  {
    slug: 'hanuman-jayanti',
    date: '2026-04-01',
    theme: 'theme-royal',
    pattern: 'temple_arch',
    emblem: 'gada',
    decor: 'bells',
    slides: [
      {
        eyebrow: 'హనుమాన్ జయంతి శుభాకాంక్షలు • Hanuman Jayanti',
        title: 'ఆంజనేయుడి బలం, భక్తి మీకు ధైర్యాన్ని ఇవ్వాలి',
        subtitle: 'ఎంత కష్టమైనా మనసు నిలకడగా ఉంటే, విజయం తథ్యం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ఆర్థిక ఇబ్బందులను ధైర్యంగా ఎదుర్కోండి',
        subtitle: 'ఒక్క లెండర్ తిరస్కరించినా, మరో మంచి అవకాశం ఉంటుంది — మేము చూపిస్తాము.'
      }
    ]
  },
  {
    slug: 'varalakshmi-vratham',
    date: '2026-08-21',
    theme: 'theme-royal',
    pattern: 'rangoli_rings',
    emblem: 'lotus',
    decor: 'toran',
    slides: [
      {
        eyebrow: 'వరలక్ష్మీ వ్రతం శుభాకాంక్షలు • Varalakshmi Vratham',
        title: 'అమ్మవారి ఆశీర్వాదంతో ఇంట సిరిసంపదలు',
        subtitle: 'కలశం, పూలు, దీపం — ఈ వ్రతం మీ ఇంట శుభాన్ని నింపాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'సిరిసంపదలకు సరైన పొదుపు మార్గం',
        subtitle: 'మీ ఆదాయానికి తగిన పొదుపు, పెట్టుబడి ప్రణాళికను కలిసి రూపొందిద్దాం.'
      }
    ]
  },
  {
    slug: 'raksha-bandhan',
    date: '2026-08-28',
    theme: 'theme-royal',
    pattern: 'rangoli_rings',
    emblem: 'rakhi',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'రాఖీ పండుగ శుభాకాంక్షలు • Happy Raksha Bandhan',
        title: 'అన్నదమ్ముల బంధం, రక్షణ భావం ఎప్పుడూ నిలవాలి',
        subtitle: 'రాఖీ చుట్టూ చుట్టిన ప్రేమ, ఏ దూరంలోనూ తగ్గకూడదు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కుటుంబాన్ని రక్షించే ఆర్థిక నిర్ణయాలు',
        subtitle: 'బీమా, అత్యవసర నిధి, రుణ ప్రణాళిక — కుటుంబ భద్రతకు మా సలహా.'
      }
    ]
  },
  {
    slug: 'krishna-janmashtami',
    date: '2026-09-04',
    theme: 'theme-royal',
    pattern: 'starfield',
    emblem: 'flute',
    decor: 'bells',
    slides: [
      {
        eyebrow: 'శ్రీకృష్ణ జన్మాష్టమి శుభాకాంక్షలు • Happy Janmashtami',
        title: 'శ్రీకృష్ణుడి ఆశీర్వాదం మీ ఇంట ఆనందాన్ని నింపాలి',
        subtitle: 'ఉయ్యాల, వేణువు, వెన్న — బాలకృష్ణుడి లీలలు మీ ఇంట సంబరం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కృష్ణుడి లాగా తెలివైన ఆర్థిక నిర్ణయాలు',
        subtitle: 'సరైన సమయంలో సరైన రుణం తీసుకోవడం ఎలా అనేది మేము వివరిస్తాము.'
      }
    ]
  },
  {
    slug: 'vinayaka-chavithi',
    date: '2026-09-14',
    theme: 'theme-royal',
    pattern: 'temple_arch',
    emblem: 'om',
    decor: 'toran',
    slides: [
      {
        eyebrow: 'వినాయక చవితి శుభాకాంక్షలు • Happy Vinayaka Chavithi',
        title: 'గణేశుడి ఆశీర్వాదంతో మీ విఘ్నాలు తొలగాలి',
        subtitle: 'కొత్త పనులు, కొత్త ప్రయాణాలు — అన్నింటికీ విఘ్నేశ్వరుడి ఆశీర్వాదం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కొత్త ఇల్లు, కొత్త వ్యాపారానికి శుభారంభం',
        subtitle: 'గృహ రుణం, వ్యాపార రుణం — మొదటి అడుగు నుంచి మేము తోడు.'
      }
    ]
  },
  {
    slug: 'bathukamma',
    date: '2026-10-11',
    theme: 'theme-royal',
    pattern: 'rangoli_rings',
    emblem: 'bathukamma',
    decor: 'toran',
    slides: [
      {
        eyebrow: 'బతుకమ్మ పండుగ శుభాకాంక్షలు • Bathukamma',
        title: 'పూల సౌందర్యంతో మీ బతుకు పండుగా మారాలి',
        subtitle: 'తెలంగాణ ఆడపడుచుల ఆటపాటలు, పూల బతుకమ్మలతో ఇంట సంబరం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మహిళల ఆర్థిక స్వాతంత్ర్యానికి మా చేయూత',
        subtitle: 'చిన్న వ్యాపారం, స్వయం సహాయక సంఘాలు — మహిళా రుణ మార్గాలు అందుబాటులో.'
      }
    ]
  },
  {
    slug: 'vijayadashami',
    date: '2026-10-20',
    theme: 'theme-royal',
    pattern: 'temple_arch',
    emblem: 'bow',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'విజయదశమి శుభాకాంక్షలు • Happy Dussehra',
        title: 'విజయం మీ చెంతకు — శుభాకాంక్షలు',
        subtitle: 'తొమ్మిది రోజుల దేవీ ఆరాధన తర్వాత, కుటుంబానికి విజయాలు కలగాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ ఆర్థిక లక్ష్యాలపై విజయం సాధించండి',
        subtitle: 'సరైన ప్రణాళిక, సరైన రుణం — లక్ష్యం నుంచి మిమ్మల్ని ఆపేది ఏమీ ఉండదు.'
      }
    ]
  },
  {
    slug: 'deepavali',
    date: '2026-11-08',
    theme: 'theme-emerald',
    pattern: 'diya_glow',
    emblem: 'diya',
    decor: 'diyas',
    slides: [
      {
        eyebrow: 'దీపావళి శుభాకాంక్షలు • Happy Diwali',
        title: 'దీపాల వెలుగులో మీ ఇల్లు, మీ లక్ష్యాలు వెలుగొందాలి',
        subtitle: 'లక్ష్మీ దేవి కృపతో, మీ కుటుంబానికి ఆరోగ్యం, సంపద, ఆనందం నిండాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ఈ దీపావళికి కొత్త ఇల్లు, కొత్త ఆర్థిక ప్రారంభం',
        subtitle: 'హోమ్ లోన్, బ్యాలెన్స్ ట్రాన్స్ఫర్, వ్యాపార రుణం — పండుగ ఆఫర్లతో మీకు తోడు.'
      }
    ]
  },
  {
    slug: 'karthika-purnima',
    date: '2026-11-24',
    theme: 'theme-royal',
    pattern: 'starfield',
    emblem: 'lamp',
    decor: 'diyas',
    slides: [
      {
        eyebrow: 'కార్తీక పౌర్ణమి శుభాకాంక్షలు • Karthika Purnima',
        title: 'కార్తీక దీపాల వెలుగు మీ జీవితంలో చీకటిని తొలగించాలి',
        subtitle: 'నదీ స్నానం, దీప దానం — ఈ పుణ్య కాలం మీ కుటుంబానికి శుభం చేకూర్చాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'స్పష్టమైన మార్గం, ప్రకాశవంతమైన భవిష్యత్తు',
        subtitle: 'మీ రుణానికి సరైన పరిష్కారం కనుగొనడం మా పని — దాచిన ఛార్జీలు లేకుండా.'
      }
    ]
  },

  /* ---------------------------------------------------------------------
     Emerald — Islamic observances
     --------------------------------------------------------------------- */
  {
    slug: 'eid-al-fitr',
    date: '2026-03-20',
    theme: 'theme-emerald',
    pattern: 'starfield',
    emblem: 'crescent',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'ఈద్ ముబారక్ • Eid Mubarak',
        title: 'రంజాన్ మాసం ముగిసిన సంబరం — కుటుంబ సమేత శుభాకాంక్షలు',
        subtitle: 'ఉపవాసం, ప్రార్థన, దానం — ఈ పవిత్ర మాసం మీ హృదయాన్ని శుద్ధి చేయాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ కుటుంబ సంబరాలకు సురక్షిత ఆర్థిక సన్నాహం',
        subtitle: 'పండుగ ఖర్చులు, పొదుపు, రుణం — అన్నింటినీ ముందే ప్లాన్ చేసుకోండి.'
      }
    ]
  },
  {
    slug: 'eid-al-adha',
    date: '2026-05-27',
    theme: 'theme-emerald',
    pattern: 'starfield',
    emblem: 'star',
    decor: 'lanterns',
    slides: [
      {
        eyebrow: 'ఈద్-ఉల్-అదా ముబారక్ • Eid-ul-Adha',
        title: 'త్యాగం, దానం మీ జీవితాన్ని ధన్యం చేయాలి',
        subtitle: 'బక్రీద్ సంబరంలో కుటుంబం, పొరుగువారు, అవసరమైన వారు అందరూ భాగస్వాములు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'సమాజానికి తోడుగా, మీకూ తోడుగా',
        subtitle: 'చిన్న వ్యాపారులకు, కుటుంబాలకు సరైన రుణ మార్గాన్ని చూపిస్తాము.'
      }
    ]
  },
  {
    slug: 'milad-un-nabi',
    date: '2026-08-25',
    theme: 'theme-emerald',
    pattern: 'temple_arch',
    emblem: 'crescent',
    decor: 'lanterns',
    slides: [
      {
        eyebrow: 'మీలాద్-ఉన్-నబీ శుభాకాంక్షలు • Milad-un-Nabi',
        title: 'ప్రవక్త ఆదర్శాలు మీకు మార్గదర్శకం కావాలి',
        subtitle: 'కరుణ, న్యాయం, సత్యం — ఈ ఆదర్శాలు మీ రోజువారీ జీవితంలో నిలవాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'న్యాయమైన, పారదర్శకమైన రుణ ప్రక్రియ',
        subtitle: 'మీకు అర్హత ఉన్న అవకాశాలను స్పష్టంగా వివరించడమే మా విధానం.'
      }
    ]
  },
  {
    slug: 'muharram',
    date: '2026-06-16',
    theme: 'theme-emerald',
    pattern: 'starfield',
    emblem: 'star',
    decor: 'lanterns',
    slides: [
      {
        eyebrow: 'ముహర్రం శుభాకాంక్షలు • Muharram',
        title: 'ధైర్యం, సహనం, న్యాయం — మీతో ఉండాలి',
        subtitle: 'ఈ పవిత్ర మాసంలో ప్రార్థన, స్మరణ, దానం మీ మనసుకు శాంతిని ఇవ్వాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కుటుంబ ఆర్థిక భద్రతకు నిలకడైన మార్గం',
        subtitle: 'అత్యవసర నిధి, బీమా, రుణ ప్లానింగ్ — మేము కలిసి సిద్ధం చేస్తాము.'
      }
    ]
  },

  /* ---------------------------------------------------------------------
     Tricolor — national and Andhra Pradesh observances
     --------------------------------------------------------------------- */
  {
    slug: 'national-voters-day',
    date: '01-25',
    theme: 'theme-tricolor',
    pattern: 'tricolor_waves',
    emblem: 'ballot',
    decor: 'tri_ribbons',
    slides: [
      {
        eyebrow: 'జాతీయ ఓటర్ల దినోత్సవం • National Voters’ Day',
        title: 'మీ ఓటు మీ హక్కు, మీ శక్తి',
        subtitle: 'ప్రజాస్వామ్యంలో ప్రతి ఓటు విలువైనది — మీ ఓటును నమోదు చేసుకోండి, వినియోగించుకోండి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'సమాచారం ఉంటే సరైన నిర్ణయం ఉంటుంది',
        subtitle: 'రుణ షరతులు, వడ్డీ, ఛార్జీలు — తేలిగ్గా అర్థమయ్యేలా వివరిస్తాము.'
      }
    ]
  },
  {
    slug: 'republic-day',
    date: '01-26',
    theme: 'theme-tricolor',
    pattern: 'tricolor_waves',
    emblem: 'tricolor',
    decor: 'tri_ribbons',
    slides: [
      {
        eyebrow: 'గణతంత్ర దినోత్సవ శుభాకాంక్షలు • Happy Republic Day',
        title: 'భారత రాజ్యాంగం, ప్రజాస్వామ్యం మీకు శుభాకాంక్షలు',
        subtitle: 'సమానత్వం, స్వేచ్ఛ, సోదరభావం — మన రాజ్యాంగ ఆదర్శాలు ఎప్పుడూ నిలవాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ప్రతి కుటుంబానికి ఆర్థిక అవకాశం',
        subtitle: 'మీ నమ్మకమే మా బాధ్యత — పారదర్శక సేవతో మీ పక్కన నిలుస్తాము.'
      }
    ]
  },
  {
    slug: 'ambedkar-jayanti',
    date: '04-14',
    theme: 'theme-tricolor',
    pattern: 'tricolor_waves',
    emblem: 'book',
    decor: 'tri_ribbons',
    slides: [
      {
        eyebrow: 'అంబేద్కర్ జయంతి • Ambedkar Jayanti',
        title: 'సమానత్వం, విద్య, ఆత్మగౌరవం మీ బలం',
        subtitle: 'డా. బి. ఆర్. అంబేద్కర్ ఆదర్శాలు ప్రతి తరానికి మార్గదర్శకం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'అందరికీ అందుబాటులో ఆర్థిక సేవలు',
        subtitle: 'భాష, ప్రాంతం, ఉద్యోగం — ఏదీ మీ రుణ అవకాశానికి అడ్డం కాకూడదు.'
      }
    ]
  },
  {
    slug: 'independence-day',
    date: '08-15',
    theme: 'theme-tricolor',
    pattern: 'tricolor_waves',
    emblem: 'flag',
    decor: 'tri_ribbons',
    slides: [
      {
        eyebrow: 'స్వాతంత్ర దినోత్సవ శుభాకాంక్షలు • Happy Independence Day',
        title: 'స్వాతంత్ర్యం, స్వావలంబన — మన గర్వం',
        subtitle: 'స్వాతంత్ర్య సమరయోధుల త్యాగానికి ఈ రోజు హృదయపూర్వక నమస్కారం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ఆర్థిక స్వాతంత్ర్యం మీ చేతుల్లో',
        subtitle: 'సరైన రుణ ప్రణాళికతో మీ లక్ష్యాలను మీరే సాధించుకోండి.'
      }
    ]
  },
  {
    slug: 'telugu-language-day',
    date: '08-29',
    theme: 'theme-tricolor',
    pattern: 'tricolor_waves',
    emblem: 'letters',
    decor: 'toran',
    slides: [
      {
        eyebrow: 'తెలుగు భాషా దినోత్సవం • Telugu Language Day',
        title: 'తెలుగు మన భాష, మన గర్వం',
        subtitle: 'అమ్మ భాషలో మాట్లాడుకుంటే, ప్రతి విషయం ఇంకా సులభంగా అర్థమవుతుంది.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ భాషలో, మీకు అర్థమయ్యేలా',
        subtitle: 'తెలుగులో పూర్తి సమాచారం — రుణ ప్రక్రియలో ఎక్కడా సందేహం లేకుండా.'
      }
    ]
  },
  {
    slug: 'gandhi-jayanti',
    date: '10-02',
    theme: 'theme-tricolor',
    pattern: 'tricolor_waves',
    emblem: 'sun',
    decor: 'tri_ribbons',
    slides: [
      {
        eyebrow: 'గాంధీ జయంతి • Gandhi Jayanti',
        title: 'అహింస, సత్యం మీ జీవితంలో మార్గదీపం కావాలి',
        subtitle: 'మహాత్మా గాంధీ ఆదర్శాలు ఈ రోజు మనందరికీ స్ఫూర్తి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'నిజాయితీ, పారదర్శకత — మా ప్రతి లావాదేవీలో',
        subtitle: 'దాచిన ఛార్జీలు లేవు, అస్పష్ట షరతులు లేవు — మీకు పూర్తి స్పష్టత.'
      }
    ]
  },
  {
    slug: 'ap-formation-day',
    date: '11-01',
    theme: 'theme-tricolor',
    pattern: 'tricolor_waves',
    emblem: 'map',
    decor: 'tri_ribbons',
    slides: [
      {
        eyebrow: 'ఆంధ్రప్రదేశ్ అవతరణ దినోత్సవం • AP Formation Day',
        title: 'ఆంధ్రప్రదేశ్ అభివృద్ధికి మీరు కూడా భాగం',
        subtitle: 'చిత్తూరు నుంచి రాష్ట్రమంతటా — మన ప్రజల కలలకు మేము తోడు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'స్థానిక వ్యాపారాలకు, స్థానిక కుటుంబాలకు చేయూత',
        subtitle: 'మన ఊరు, మన ప్రజలు — మన ఆర్థిక ప్రయాణం కలిసే.'
      }
    ]
  },

  /* ---------------------------------------------------------------------
     Sapphire — milestones, new beginnings and global days
     --------------------------------------------------------------------- */
  {
    slug: 'new-year',
    date: '01-01',
    theme: 'theme-sapphire',
    pattern: 'starfield',
    emblem: 'sparkle',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'నూతన సంవత్సర శుభాకాంక్షలు • Happy New Year',
        title: 'కొత్త సంవత్సరంలో కొత్త లక్ష్యాలు, కొత్త విజయాలు',
        subtitle: 'గత సంవత్సరపు అనుభవంతో, ఈ సంవత్సరం మరింత బలంగా ముందుకు సాగండి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'సంవత్సరం మొదటి రోజే మీ ఆర్థిక ప్రణాళిక',
        subtitle: 'ఆదాయం, ఖర్చు, పొదుపు — స్పష్టమైన బడ్జెట్‌తో సంవత్సరాన్ని ప్రారంభించండి.'
      }
    ]
  },
  {
    slug: 'financial-new-year',
    date: '04-01',
    theme: 'theme-sapphire',
    pattern: 'starfield',
    emblem: 'calendar',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'ఆర్థిక సంవత్సర ప్రారంభం • Financial New Year',
        title: 'కొత్త ఆర్థిక సంవత్సరం — కొత్త ఆర్థిక అలవాట్లు',
        subtitle: 'పన్ను ప్రణాళిక, పొదుపు, పెట్టుబడి — ఏప్రిల్‌లోనే మంచి ప్రారంభం చేయండి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ బడ్జెట్ బలంగా ఉంటే ఏడాది సులభంగా ఉంటుంది',
        subtitle: 'మీ బడ్జెట్, మీ పొదుపు, మీ లక్ష్యాలు — ఈ ఏడాది బలంగా ఉండాలి.'
      }
    ]
  },
  {
    slug: 'good-friday',
    date: '2026-04-03',
    theme: 'theme-sapphire',
    pattern: 'temple_arch',
    emblem: 'cross',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'గుడ్ ఫ్రైడే • Good Friday',
        title: 'శాంతి, క్షమాభావం మీ హృదయంలో నిండాలి',
        subtitle: 'ఈ పవిత్ర దినం ప్రార్థన, ధ్యానం, కుటుంబ సమయానికి కేటాయించండి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కుటుంబ శాంతికి ఆర్థిక స్థిరత్వం తోడు',
        subtitle: 'అనవసర ఆర్థిక ఒత్తిడిని తగ్గించుకోవడానికి సరైన రుణ మార్గం ఎంచుకోండి.'
      }
    ]
  },
  {
    slug: 'christmas',
    date: '12-25',
    theme: 'theme-sapphire',
    pattern: 'starfield',
    emblem: 'star',
    decor: 'bells',
    slides: [
      {
        eyebrow: 'క్రిస్మస్ శుభాకాంక్షలు • Merry Christmas',
        title: 'క్రిస్మస్ ఆనందం మీ ఇంట నిండాలి',
        subtitle: 'కేక్, క్యారల్స్, కుటుంబ సమావేశం — ఈ పండుగ మీకు ఆనందం అందించాలి.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కొత్త సంవత్సరానికి సిద్ధమవ్వండి',
        subtitle: 'సంవత్సరాంత ఖర్చులు, పొదుపు, రుణ ప్లాన్ — ముందే సన్నద్ధం అవ్వండి.'
      }
    ]
  },
  {
    slug: 'anniversary',
    date: '06-18',
    theme: 'theme-sapphire',
    pattern: 'starfield',
    emblem: 'ring',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'సోభాకృత స్థాపన దినోత్సవం • Sobhakrita Anniversary',
        title: 'మీ నమ్మకమే మా ప్రయాణం, మీ విజయమే మా పండుగ',
        subtitle: 'ఇన్నాళ్లు మాపై నమ్మకం ఉంచిన ప్రతి కుటుంబానికి, ప్రతి వ్యాపారానికి హృదయపూర్వక ధన్యవాదాలు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ఇంకా ఎన్నో కుటుంబాల కలలకు తోడుగా',
        subtitle: 'మరింత మెరుగైన సేవ, మరింత పారదర్శకత — మా తదుపరి అధ్యాయం మీతోనే.'
      }
    ]
  },

  /* ---------------------------------------------------------------------
     Gratitude — days of respect for people who carry society
     --------------------------------------------------------------------- */
  {
    slug: 'womens-day',
    date: '03-08',
    theme: 'theme-gratitude',
    pattern: 'rangoli_rings',
    emblem: 'heart',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'అంతర్జాతీయ మహిళా దినోత్సవం • International Women’s Day',
        title: 'మహిళల శక్తికి, సహనానికి నమస్కారం',
        subtitle: 'ఇంటిని, వ్యాపారాన్ని, సమాజాన్ని ముందుకు నడిపిస్తున్న ప్రతి మహిళకు శుభాకాంక్షలు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మహిళా వ్యాపారులకు ఆర్థిక స్వాతంత్ర్యం',
        subtitle: 'మహిళా రుణాలు, స్వయం సహాయక సంఘాలు — మీ ఆర్థిక ప్రయాణానికి తోడు.'
      }
    ]
  },
  {
    slug: 'labour-day',
    date: '05-01',
    theme: 'theme-gratitude',
    pattern: 'muggu_grid',
    emblem: 'gear',
    decor: 'sheaves',
    slides: [
      {
        eyebrow: 'అంతర్జాతీయ కార్మిక దినోత్సవం • International Labour Day',
        title: 'మీ శ్రమ మా అభివృద్ధికి ఆధారం',
        subtitle: 'రోజూ కష్టపడే ప్రతి కార్మికుడికి, ప్రతి ఉద్యోగికి హృదయపూర్వక కృతజ్ఞతలు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'కష్టార్జితానికి తగిన ఆర్థిక భద్రత',
        subtitle: 'సరైన పొదుపు, బీమా, రుణ ప్రణాళికతో మీ శ్రమ ఫలించాలి.'
      }
    ]
  },
  {
    slug: 'environment-day',
    date: '06-05',
    theme: 'theme-gratitude',
    pattern: 'leaf_lattice',
    emblem: 'leaf',
    decor: 'sheaves',
    slides: [
      {
        eyebrow: 'ప్రపంచ పర్యావరణ దినోత్సవం • World Environment Day',
        title: 'ఆకుపచ్చని భవిష్యత్తు కోసం ఈ రోజు ఒక మొక్క నాటండి',
        subtitle: 'మన భూమి, మన బాధ్యత — చిన్న ప్రయత్నం పెద్ద మార్పును తీసుకురాగలదు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ఇంటి నిర్మాణంలో పర్యావరణ శ్రద్ధ',
        subtitle: 'సరైన ఇంటి రుణంతో పాటు, సురక్షితమైన, పర్యావరణ హిత నిర్ణయాలు తీసుకోండి.'
      }
    ]
  },
  {
    slug: 'doctors-day',
    date: '07-01',
    theme: 'theme-gratitude',
    pattern: 'muggu_grid',
    emblem: 'stethoscope',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'జాతీయ వైద్యుల దినోత్సవం • National Doctors’ Day',
        title: 'ఆరోగ్యాన్ని కాపాడే ప్రతి వైద్యుడికి నమస్కారం',
        subtitle: 'డా. బి. సి. రాయ్ స్మరణలో, రాత్రింబవళ్లు సేవ చేసే వైద్యులకు కృతజ్ఞతలు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'ఆరోగ్య ఖర్చులకు ఆర్థిక సన్నాహం',
        subtitle: 'అత్యవసర వైద్య ఖర్చులకు సిద్ధంగా ఉండేలా పొదుపు, బీమా ప్లాన్ చేసుకోండి.'
      }
    ]
  },
  {
    slug: 'teachers-day',
    date: '09-05',
    theme: 'theme-gratitude',
    pattern: 'temple_arch',
    emblem: 'book',
    decor: 'bells',
    slides: [
      {
        eyebrow: 'ఉపాధ్యాయ దినోత్సవం • Teachers’ Day',
        title: 'గురువుల మాట మీ జీవితాన్ని దారి తీస్తుంది',
        subtitle: 'డా. సర్వేపల్లి రాధాకృష్ణన్ స్మరణలో, మనకు నేర్పిన ప్రతి గురువుకు నమస్కారం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'విద్యకు ఆర్థిక అడ్డంకి ఉండకూడదు',
        subtitle: 'విద్యా రుణాలు, ఇంటి బడ్జెట్ ప్లానింగ్ — మీ పిల్లల భవిష్యత్తుకు మేము తోడు.'
      }
    ]
  },
  {
    slug: 'engineers-day',
    date: '09-15',
    theme: 'theme-gratitude',
    pattern: 'muggu_grid',
    emblem: 'pen',
    decor: 'sparkles',
    slides: [
      {
        eyebrow: 'ఇంజనీర్స్ దినోత్సవం • Engineers’ Day',
        title: 'సృజనశీలతకు, నిర్మాణానికి నమస్కారం',
        subtitle: 'సర్ ఎం. విశ్వేశ్వరయ్య స్మరణలో, మన దేశాన్ని నిర్మిస్తున్న ఇంజనీర్లకు శుభాకాంక్షలు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ ప్రాజెక్టుకు సరైన ఆర్థిక నిర్మాణం',
        subtitle: 'హోమ్ లోన్, వ్యాపార రుణం — మీ ప్రాజెక్టు బడ్జెట్‌కు సరిపోయే పరిష్కారం.'
      }
    ]
  },
  {
    slug: 'childrens-day',
    date: '11-14',
    theme: 'theme-gratitude',
    pattern: 'rangoli_rings',
    emblem: 'pinwheel',
    decor: 'kites',
    slides: [
      {
        eyebrow: 'బాలల దినోత్సవం • Children’s Day',
        title: 'పిల్లల నవ్వులే మీ ఇంట అసలైన సంపద',
        subtitle: 'పండిట్ జవహర్‌లాల్ నెహ్రూ ప్రేమతో, ప్రతి బాలుడికి, ప్రతి బాలికకు ఆనందమయ భవిష్యత్తు.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'మీ పిల్లల కలలకు ఈ రోజే పునాది',
        subtitle: 'విద్యా పొదుపు, భవిష్యత్ నిధి — ఇప్పుడు మొదలుపెడితే ముందు సిద్ధం.'
      }
    ]
  },
  {
    slug: 'farmers-day',
    date: '12-23',
    theme: 'theme-gratitude',
    pattern: 'leaf_lattice',
    emblem: 'sheaf',
    decor: 'sheaves',
    slides: [
      {
        eyebrow: 'జాతీయ రైతు దినోత్సవం • National Farmers’ Day',
        title: 'అన్నదాతలకు హృదయపూర్వక కృతజ్ఞతలు',
        subtitle: 'చౌదరి చరణ్ సింగ్ స్మరణలో, మనకు అన్నం పెట్టే ప్రతి రైతుకు నమస్కారం.'
      },
      {
        eyebrow: 'Sobhakrita Fintech Solutions',
        title: 'వ్యవసాయానికి, రైతు కుటుంబానికి చేయూత',
        subtitle: 'పంట రుణం, పరికరాల రుణం, కుటుంబ అవసరాలు — సరైన మార్గాన్ని చూపిస్తాము.'
      }
    ]
  }
];

/* extra slugs for easy QA preview, e.g. ?festival=diwali */
var SPECIAL_DAYS_ALIASES = {
  diwali: 'deepavali',
  deepavali: 'deepavali',
  'navaratri': 'bathukamma',
  dussehra: 'vijayadashami',
  sankranti: 'makara-sankranti',
  'bakrid': 'eid-al-adha',
  'eid': 'eid-al-fitr',
  'rakhi': 'raksha-bandhan',
  janmashtami: 'krishna-janmashtami',
  vinayaka: 'vinayaka-chavithi',
  'gandhi': 'gandhi-jayanti',
  'independence': 'independence-day',
  'republic': 'republic-day'
};

/* --------------------------------------------------------------------------
   Festive frame artwork
   Generated once at load: marigold garlands, mango-leaf toran and bells that
   turn the card into an illustrated greeting. Text is never baked in.
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   Festive frame artwork — compact greeting banner
   Cream sky with fireworks, a deep arch, a marigold garland hugging the dome,
   hanging lanterns and a diya row. Generated once at load; copy is never baked
   into the art so every day/language stays dynamic.
   -------------------------------------------------------------------------- */
var SD_ART = (function () {
  function r1(v) { return Math.round(v * 100) / 100; }

  /* one round marigold bloom */
  function marigold(cx, cy, r, tone) {
    var out = '<g>';
    for (var i = 0; i < 8; i++) {
      var a = (Math.PI / 4) * i;
      out += '<circle cx="' + r1(cx + Math.cos(a) * r * 0.62) + '" cy="' + r1(cy + Math.sin(a) * r * 0.62) +
        '" r="' + r1(r * 0.42) + '" fill="' + (tone || 'url(#sdMarigold)') + '"/>';
    }
    out += '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r * 0.5) + '" fill="#F59E0B"/>';
    out += '<circle cx="' + r1(cx - r * 0.1) + '" cy="' + r1(cy - r * 0.14) + '" r="' + r1(r * 0.22) + '" fill="#FCD34D"/>';
    return out + '</g>';
  }

  /* mango leaf, point down */
  function leaf(x, y, rot, s) {
    return '<g transform="translate(' + r1(x) + ' ' + r1(y) + ') rotate(' + r1(rot) + ') scale(' + r1(s) + ')">' +
      '<path d="M0 0C6 8 7 20 0 31-7 20-6 8 0 0Z" fill="url(#sdLeaf)"/>' +
      '<path d="M0 4V27" stroke="#FEF3C7" stroke-width="0.7" opacity="0.3"/>' +
      '</g>';
  }

  /* four point star */
  function star(x, y, s, tone) {
    return '<path d="M' + r1(x) + ' ' + r1(y - s) + 'L' + r1(x + s * 0.3) + ' ' + r1(y) +
      'L' + r1(x) + ' ' + r1(y + s) + 'L' + r1(x - s * 0.3) + ' ' + r1(y) + 'Z" fill="' + tone + '"/>';
  }

  /* firework burst */
  function burst(x, y, r, tone, rays) {
    var n = rays || 12;
    var out = '<g transform="translate(' + r1(x) + ' ' + r1(y) + ')" stroke-linecap="round">';
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 / n) * i + 0.18;
      var ri = r * 0.4;
      var ro = r * (i % 2 ? 0.72 : 1);
      out += '<line x1="' + r1(Math.cos(a) * ri) + '" y1="' + r1(Math.sin(a) * ri) +
        '" x2="' + r1(Math.cos(a) * ro) + '" y2="' + r1(Math.sin(a) * ro) +
        '" stroke="' + tone + '" stroke-width="' + r1(Math.max(1.1, r * 0.055)) + '"/>';
      out += '<circle cx="' + r1(Math.cos(a) * ro * 1.12) + '" cy="' + r1(Math.sin(a) * ro * 1.12) +
        '" r="' + r1(Math.max(0.9, r * 0.045)) + '" fill="' + tone + '" stroke="none"/>';
    }
    out += '<circle r="' + r1(r * 0.11) + '" fill="#fff4d6" stroke="none"/>';
    return out + '</g>';
  }

  /* the cream sky either side of the arch; the right side is mirrored in CSS */
  function fireworks() {
    var out = '<svg viewBox="0 0 320 156" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">';
    out += burst(74, 42, 38, '#d99b3c', 14);
    out += burst(176, 96, 22, '#1f7f6b', 12);
    out += burst(46, 122, 14, '#dd7a2e', 10);
    out += burst(252, 26, 16, '#c98a34', 10);
    out += burst(258, 112, 26, '#d99b3c', 14);
    out += star(140, 26, 5, '#c08a3e') + star(206, 60, 4, '#2a8f78') + star(112, 66, 3.4, '#c08a3e');
    out += star(96, 88, 3, '#dd7a2e') + star(222, 140, 4, '#c08a3e') + star(156, 128, 3, '#2a8f78');
    out += '<g fill="#c9a26a" opacity=".75">' +
      '<circle cx="120" cy="46" r="1.5"/><circle cx="238" cy="78" r="1.5"/>' +
      '<circle cx="66" cy="82" r="1.3"/><circle cx="188" cy="26" r="1.3"/>' +
      '<circle cx="284" cy="62" r="1.3"/><circle cx="34" cy="60" r="1.2"/>' +
      '</g>';
    return out + '</svg>';
  }

  /* marigold garland hugging the inside of the arch, plus side strands */
  function archGarland() {
    var W = 700, H = 138, cx = W / 2, cy = H / 2;
    var rx = cx - 24, ry = cy - 24;
    var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">';

    /* double gold outline that follows the arch and runs down to the base */
    out += '<path d="M12 ' + H + 'V' + cy + 'A' + (cx - 12) + ' ' + (cy - 12) + ' 0 0 1 ' + (W - 12) + ' ' + cy + 'V' + H +
      '" fill="none" stroke="#c89a4b" stroke-width="1.2" opacity=".5"/>';
    out += '<path d="M20 ' + H + 'V' + cy + 'A' + (cx - 20) + ' ' + (cy - 20) + ' 0 0 1 ' + (W - 20) + ' ' + cy + 'V' + H +
      '" fill="none" stroke="#f6dfae" stroke-width="0.7" opacity=".24"/>';

    /* marigolds + leaves along the dome */
    var steps = 22, i;
    for (i = 0; i <= steps; i++) {
      var th = Math.PI * (1 - i / steps);
      var x = cx + rx * Math.cos(th);
      var y = cy - ry * Math.sin(th);
      var edge = Math.abs(i - steps / 2) / (steps / 2);
      if (i % 2 === 0) {
        out += leaf(x - 8, y + 9, -118, 0.7);
        out += leaf(x + 8, y + 9, 118, 0.7);
      }
      out += marigold(x, y, 12.4 - edge * 2.4);
    }

    /* short strands falling down the arch sides */
    for (var k = 0; k < 3; k++) {
      var ly = cy + 14 + k * 21;
      var lr = 9.4 - k * 1;
      out += marigold(18, Math.min(ly, H - 10), lr);
      out += marigold(W - 18, Math.min(ly, H - 10), lr);
    }

    /* a little sparkle inside the dark niche */
    out += '<g fill="#FDE68A" opacity=".55">' +
      '<circle cx="120" cy="52" r="1.6"/><circle cx="580" cy="46" r="1.4"/>' +
      '<circle cx="176" cy="88" r="1.2"/><circle cx="524" cy="92" r="1.2"/>' +
      '</g>';
    return out + '</svg>';
  }

  /* hanging lantern */
  function lantern() {
    var out = '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false">';
    out += '<circle cx="22" cy="24" r="21" fill="url(#sdGlow)"/>';
    out += '<path d="M22 0v7" stroke="#d9a552" stroke-width="1.3"/>';
    out += '<path d="M12 8h20" stroke="#e6b25c" stroke-width="2.8" stroke-linecap="round"/>';
    out += '<path d="M13 11h18l4 8-4 15H13l-4-15z" fill="url(#sdMarigold)"/>';
    out += '<path d="M13 11h18" stroke="#FEF3C7" stroke-width="1.2" opacity=".85"/>';
    out += '<path d="M10.6 30h22.8" stroke="#FEF3C7" stroke-width="1.1" opacity=".7"/>';
    out += '<circle cx="22" cy="20" r="4.6" fill="#FDE68A" opacity=".9"/>';
    out += '<path d="M22 12v16" stroke="#7c2d12" stroke-width="0.7" opacity=".22"/>';
    out += '<path d="M13 34h18l-3 4H16z" fill="#b45309"/>';
    out += '<path d="M22 38v8" stroke="#d9a552" stroke-width="1.1"/>';
    out += '<circle cx="22" cy="48" r="2.2" fill="#e6b25c"/>';
    out += '<path d="M19 50l3 7 3-7" fill="none" stroke="#d9a552" stroke-width="1" opacity=".8"/>';
    return out + '</svg>';
  }

  return {
    fireworks: fireworks(),
    archGarland: archGarland(),
    lantern: lantern()
  };
})();

if (typeof window !== 'undefined') {
  window.THEME_PRESETS = THEME_PRESETS;
  window.SD_GOLD_DEFS = SD_GOLD_DEFS;
  window.SD_ART = SD_ART;
  window.SVG_LIBRARY = SVG_LIBRARY;
  window.SPECIAL_DAYS_REGISTRY = SPECIAL_DAYS_REGISTRY;
  window.SPECIAL_DAYS_ALIASES = SPECIAL_DAYS_ALIASES;
}
