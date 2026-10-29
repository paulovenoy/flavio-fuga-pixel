/**
 * 16-Bit Neo-Retro Pixel Art Procedural Sprite Engine (Deluxe & Memes)
 * High-definition pixel matrices with rich shading, specular highlights and authentic retro palettes.
 */

class SpriteEngine {
  constructor() {
    this.cache = {};
  }

  /**
   * Helper to build an offscreen canvas from a pixel matrix.
   */
  createPixelCanvas(rows, colorMap, scale = 2) {
    const h = rows.length;
    const w = rows[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const char = rows[y][x];
        if (char && char !== '.' && colorMap[char]) {
          ctx.fillStyle = colorMap[char];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  // --- 1. JATO 01 DELUXE (Flávio's Luxury Escape Jet - 16-Bit Realism) ---
  getFlavioJet() {
    if (this.cache.flavioJet) return this.cache.flavioJet;
    const map = {
      'W': '#ffffff', // Pure white gloss
      'L': '#e2e8f0', // Off-white fuselage
      'M': '#cbd5e1', // Fuselage midtone
      'D': '#64748b', // Dark metal shadow
      'G': '#fde047', // 24k Gold trim highlight
      'Y': '#eab308', // Gold midtone
      'O': '#a16207', // Gold deep shadow
      'E': '#15803d', // Brazil emerald green
      'T': '#22c55e', // Brazil light green
      'C': '#38bdf8', // Cockpit glass cyan
      'B': '#0284c7', // Cockpit glass deep
      'S': '#fcd34d', // Flávio skin tone
      'H': '#1c1917', // Dark hair
      'K': '#0f172a', // Aviator sunglasses
      'R': '#ef4444', // Red beacon light
      'A': '#f97316'  // Jet afterburner flare
    };

    const rows = [
      "................RR........................",
      "................LL........................",
      "............HHHHLLLL......................",
      "...........HHSSKLLLLLL....................",
      "..........HHSSKKLLLLLLLL..................",
      ".........GGGGGBBCLLLLLLLLLG...............",
      "........YYGGGGCCCBLLLLLLLLLLG.............",
      "......DDDDYYYYCCCCBBLLLLLLLLLLG...........",
      ".....DDDDDDYYMMMMMCCCBBLLLLLLLLLG.........",
      "....AADDDDDWWWWWWWWWWWWWWWWWWWWWLLG.......",
      "...AAADDDDDYYYYYYYYYYYYYYYYYYYYYYYYLLG....",
      "..AAAADDDDGEEEEEEEEEEEEEEEEEEEEEEEEMMLG...",
      "....AADDDDGTTTTTTTTTTTTTTTTTTTTTTTMDDDL...",
      "......DDDDGGGGGGGGGGGGGGGGGGGGGGGGMDDDL...",
      ".........LLLLLLLLLLLLLLLLLLLLLLLLLMDD.....",
      "............MMMM.....MMMM................."
    ];

    this.cache.flavioJet = this.createPixelCanvas(rows, map, 2.6);
    return this.cache.flavioJet;
  }

  // --- 2. BOSS: MARECHAL JANONES (Comandante do Exército Digital do Lula) ---
  getMarechalJanones() {
    if (this.cache.janones) return this.cache.janones;
    const map = {
      'C': '#365314', // Camo beret dark green
      'B': '#4d7c0f', // Camo beret mid green
      'R': '#dc2626', // Red star on beret (PT/Exército do Lula)
      'S': '#fbcfe8', // Skin tone
      'D': '#f472b6', // Skin shadow
      'H': '#18181b', // Hair / beard
      'F': '#15803d', // Military uniform green
      'L': '#166534', // Uniform shadow
      'G': '#facc15', // Gold epaulets & medals
      'P': '#1e3a8a', // Smartphone casing
      'W': '#ffffff', // Phone screen flash / Megaphone body
      'M': '#64748b', // Megaphone metal
      'K': '#09090b', // Megaphone mouth
      'T': '#713f12', // Armored pulpit metal
      'Y': '#ca8a04', // Warning hazard stripe
      'X': '#ef4444'  // Flashing siren red
    };

    const rows = [
      ".......CCCCC.................",
      "......CBBBBBBC...............",
      ".....CBBBRBBBBC..............",
      ".....CBBBBBBBBC..............",
      "......HSSSSSH................",
      "......HSSKSSH................",
      "......HDDDDDH....WWWWWW......",
      ".......FGGGF....WKKKKKKW.....",
      "....PPFFGGGFMMMMWKKKKKKW.....",
      "...PWPFLFFFF.....WWWWWW......",
      "...PWPFLFFFF.................",
      "...PWPFLFFFF.................",
      "...XTTYYYYYYYYTTX............",
      "...TTTTTTTTTTTTTT............",
      "....TTTTTTTTTTTT............."
    ];

    this.cache.janones = this.createPixelCanvas(rows, map, 3.2);
    return this.cache.janones;
  }

  // --- 3. JANONES ATTACK: PRINT VAZADO / TWEET BOMBA ---
  getPrintTweet() {
    if (this.cache.printTweet) return this.cache.printTweet;
    const map = {
      'B': '#0284c7', // Twitter blue border
      'W': '#ffffff', // White screenshot background
      'R': '#ef4444', // "URGENTE / BOMBA!" banner
      'Y': '#facc15', // Bomb icon yellow
      'D': '#1e293b'  // Text lines
    };

    const rows = [
      "BBBBBBBBBBBBBB",
      "BRRRRRRRRRRRRB",
      "BRRYYYYYYYYRRB",
      "BWWWWWWWWWWWWB",
      "BWDDDDDDDDDDWB",
      "BWDDDDDDDDDDWB",
      "BWDDDDDDDDDDWB",
      "BBBBBBBBBBBBBB"
    ];

    this.cache.printTweet = this.createPixelCanvas(rows, map, 2.5);
    return this.cache.printTweet;
  }

  // --- 4. JANONES ATTACK: POTE DE DANONE VOADOR ---
  getDanoneCup() {
    if (this.cache.danone) return this.cache.danone;
    const map = {
      'R': '#dc2626', // Red yogurt cup
      'W': '#ffffff', // White yogurt label
      'B': '#2563eb', // Blue brand banner
      'Y': '#fef08a'  // Sweet cream highlight
    };

    const rows = [
      "..YYYYYYYY..",
      ".RRRRRRRRRR.",
      ".RWWWWWWWWR.",
      ".RWBBBBBBWR.",
      ".RWWWWWWWWR.",
      "..RRRRRRRR..",
      "...RRRRRR..."
    ];

    this.cache.danone = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.danone;
  }

  // --- 5. CAÇA DA FAB (Aeronáutica Interceptadora - Fase 2) ---
  getFabJet() {
    if (this.cache.fabJet) return this.cache.fabJet;
    const map = {
      'G': '#475569', // Slate gray camo
      'D': '#1e293b', // Deep gray
      'C': '#38bdf8', // Cockpit
      'E': '#15803d', // Green-yellow Brazilian fin
      'Y': '#eab308',
      'R': '#ef4444'  // Strobe beacon
    };

    const rows = [
      "............EE................",
      "...........EYE................",
      "....DDDDD...EE................",
      "...DGGGGDDDDDDDD..............",
      "..DGGCCCCCCGGGGDDDD...........",
      ".DGGGGGGGGGGGGGGGGGDDDDD......",
      "DDGGGGGGGGGGGGGGGGGGGGGGDDD...",
      ".DGGGGGGGGGGGGGGGGGGGGDD......",
      "...DDDDDDGGGGDDDDDDDD.........",
      ".........R..R................."
    ];

    this.cache.fabJet = this.createPixelCanvas(rows, map, 2.6);
    return this.cache.fabJet;
  }

  // --- 6. PATRIOT DO CAMINHÃO (16-Bit Realism) ---
  getPatriotaCaminhao() {
    if (this.cache.patriota) return this.cache.patriota;
    const map = {
      'G': '#15803d',
      'L': '#22c55e',
      'Y': '#eab308',
      'C': '#00f2fe',
      'S': '#fcd34d',
      'H': '#78350f',
      'J': '#16a34a',
      'B': '#1d4ed8',
      'W': '#ffffff',
      'T': '#0f172a',
      'M': '#94a3b8'
    };

    const rows = [
      "......GGGGGGGGGG......",
      "....GGLLLLLLLLLLGG....",
      "...GLLCCCCCCCCCCLLG...",
      "...GLC..HHHH..CCLLG...",
      "...GLC.SSWWSS.CCLLG...",
      "...GLC.JJJJJJ.CCLLG...",
      "...GLC.S.BB.S.CCLLG...",
      "..GGLLCCCCCCCCCCLLGG..",
      "..GGYYYYYYYYYYYYYYGG..",
      "..TTMMMMMMMMMMMMMMTT..",
      "..TTTTTTTTTTTTTTTTTT.."
    ];

    this.cache.patriota = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.patriota;
  }

  // --- 7. LARANJA REALISTA (3D Shaded Orange) ---
  getOrange() {
    if (this.cache.orange) return this.cache.orange;
    const map = {
      'L': '#fed7aa',
      'O': '#fb923c',
      'M': '#f97316',
      'D': '#ea580c',
      'K': '#9a3412',
      'G': '#16a34a',
      'S': '#15803d'
    };

    const rows = [
      "......GGS...",
      "....GGGGGS..",
      "...MOOOOOOM.",
      "..MOLLLOOOOM",
      ".MOLLLLOOOOOD",
      ".MOOOOOOOOOOD",
      ".MMOOOOOOOODK",
      "..MDDDDDDDDK.",
      "....KKKKKK..."
    ];

    this.cache.orange = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.orange;
  }

  // --- 8. CAIXA DE BOMBOM KOPENHAGEN DELUXE ---
  getChocolate() {
    if (this.cache.chocolate) return this.cache.chocolate;
    const map = {
      'V': '#831843',
      'D': '#4c0519',
      'G': '#fde047',
      'Y': '#ca8a04',
      'C': '#271206',
      'W': '#ffffff'
    };

    const rows = [
      "....YYGGGGYY....",
      "...GGWWGGWWGG...",
      "..VVVVVVGGVVVV..",
      ".VVCCCDDGGCCCVD.",
      ".VVCCCCCGGCCCVD.",
      ".GGGGGGGGGGGGGG.",
      ".VVCCCCCGGCCCVD.",
      ".VVCCCDDGGCCCVD.",
      "..DDDDDDYYDDDD.."
    ];

    this.cache.chocolate = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.chocolate;
  }

  // --- 9. JOIAS DAS ARÁBIAS (Meme Exclusivo Super Coletável) ---
  getJoiasArabia() {
    if (this.cache.joias) return this.cache.joias;
    const map = {
      'G': '#fde047', // 24k Gold casing
      'Y': '#ca8a04', // Gold shadow
      'D': '#00f2fe', // Sparkling diamonds
      'W': '#ffffff', // Specular flash
      'R': '#dc2626', // Ruby gems
      'E': '#15803d'  // Emerald gems
    };

    const rows = [
      "....WWGGGGWW....",
      "...GGDDDDDDGG...",
      "..GGDDWDDDWDDGG..",
      ".GGDRRRDEEERDGG.",
      ".GGDRWRDEWERDGG.",
      ".GGGGGGGGGGGGGG.",
      ".YYDDRRDDEEDDYY.",
      "..YYDDDDDDDDYY..",
      "....YYYYYYYY...."
    ];

    this.cache.joias = this.createPixelCanvas(rows, map, 3.0);
    return this.cache.joias;
  }

  // --- 10. PASSAPORTE DIPLOMÁTICO (Foro Privilegiado) ---
  getPassport() {
    if (this.cache.passport) return this.cache.passport;
    const map = {
      'B': '#172554',
      'M': '#1e3a8a',
      'G': '#fde047',
      'Y': '#eab308',
      'W': '#f8fafc'
    };

    const rows = [
      ".BBBBBBBBB.",
      ".BMGGGGGGMB.",
      ".BMGYGGYGMB.",
      ".BMGGGGGGMB.",
      ".BMMMMMMMMB.",
      ".BM.GGGG.MB.",
      ".BMMMMMMMMB.",
      ".BBBBBBBBBB.",
      "WWWWWWWWWWWW"
    ];

    this.cache.passport = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.passport;
  }

  // --- 11. PICANHA & CERVEJINHA (Coletável Cômico) ---
  getPicanha() {
    if (this.cache.picanha) return this.cache.picanha;
    const map = {
      'F': '#fef08a', // Gordurinha da picanha
      'R': '#b91c1c', // Carne nobre
      'D': '#7f1d1d', // Sombra da carne
      'G': '#eab308'  // Cerveja gelada
    };

    const rows = [
      "...FFFFFFFFFF...",
      "..FRRRRRRRRRRF..",
      ".FRRRRRRRRRRRRF.",
      ".FRRRRRRRRRRRRD.",
      "..DRRRRRRRRRRD..",
      "...DDDDDDDDDD..."
    ];

    this.cache.picanha = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.picanha;
  }

  // --- 12. DRONE DA PF ---
  getPfDrone() {
    if (this.cache.pfDrone) return this.cache.pfDrone;
    const map = {
      'B': '#0f172a',
      'M': '#334155',
      'S': '#cbd5e1',
      'R': '#ef4444',
      'L': '#3b82f6',
      'C': '#00f2fe',
      'Y': '#f59e0b'
    };

    const rows = [
      "SS....RR....SS",
      ".SSSS.LL.SSSS.",
      "...BBBBBBBB...",
      "..BYYYYYYYYB..",
      "..BBMMMMMMBB..",
      ".....CCCC.....",
      "....CCCCCC...."
    ];

    this.cache.pfDrone = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.pfDrone;
  }

  // --- 13. MARTELO DO STF & TOGA ---
  getGavelToga() {
    if (this.cache.gavelToga) return this.cache.gavelToga;
    const map = {
      'W': '#78350f',
      'L': '#b45309',
      'T': '#09090b',
      'C': '#ffffff',
      'R': '#dc2626'
    };

    const rows = [
      "....WWWW....",
      "...WLLLLW...",
      "...WLLLLW...",
      "....WWWW....",
      ".....WW.....",
      "....TTTT....",
      "...TCTTTT...",
      "..TTTRTTTT..",
      ".TTTTTTTTTT."
    ];

    this.cache.gavelToga = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.gavelToga;
  }

  // --- 14. TORNOZELEIRA ELETRÔNICA ---
  getAnkleMonitor() {
    if (this.cache.ankleMonitor) return this.cache.ankleMonitor;
    const map = {
      'K': '#18181b',
      'G': '#22c55e',
      'R': '#ef4444',
      'W': '#e2e8f0',
      'C': '#64748b'
    };

    const rows = [
      "WW..........WW",
      "WWWW.KKKK.WWWW",
      ".WWWKKGGRKWWW.",
      "...KCCCCCCK...",
      "...KKKKKKKK..."
    ];

    this.cache.ankleMonitor = this.createPixelCanvas(rows, map, 2.8);
    return this.cache.ankleMonitor;
  }

  // --- 15. DONALD TRUMP (Mar-a-Lago Welcome) ---
  getTrump() {
    if (this.cache.trump) return this.cache.trump;
    const map = {
      'H': '#fde047',
      'Y': '#eab308',
      'S': '#fed7aa',
      'D': '#fb923c',
      'R': '#dc2626',
      'L': '#ef4444',
      'N': '#1e3a8a',
      'B': '#0f172a',
      'W': '#ffffff'
    };

    const rows = [
      "...HHHHHHH....",
      "..HYYYYYYYH...",
      "..HYSSSSSYH...",
      "...SSSSSSSS...",
      "...SWWWWWWS...",
      "..NNNRLLRNNN..",
      "..NNNRLLRNNN..",
      "..SSSSSSSSSS..",
      "...NNRLLRNN...",
      "...NNRLLRNN...",
      "...BBRLLRBB...",
      "...BB....BB..."
    ];

    this.cache.trump = this.createPixelCanvas(rows, map, 4.0);
    return this.cache.trump;
  }

  // --- 16. MANSÃO MAR-A-LAGO ---
  getMansion() {
    if (this.cache.mansion) return this.cache.mansion;
    const map = {
      'P': '#fed7aa',
      'R': '#c2410c',
      'G': '#15803d',
      'L': '#22c55e',
      'T': '#78350f',
      'W': '#ffffff',
      'Y': '#fde047',
      'U': '#ef4444'
    };

    const rows = [
      "...G...........RRRRRRRRRRRRRRRRR...........G...",
      "..GLG.........RPPPPPPPPPPPPPPPPPR..........GLG..",
      ".GLLLG.......RPPPPPWWWWWWWWWWPPPR........GLLLG.",
      "...T........RPPPPWWWWWWWWWWWWWWPPR.........T...",
      "...T.......RPPPPWWWWWWWWWWWWWWWWPPR........T...",
      "...T.......PPPPPPPPPPPPPPPPPPPPPPPP........T...",
      "...T.......PPWWPPWWPPWWPPWWPPWWPPWW........T...",
      "...T.......PPWWPPWWPPWWPPWWPPWWPPWW........T...",
      "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"
    ];

    this.cache.mansion = this.createPixelCanvas(rows, map, 4.2);
    return this.cache.mansion;
  }
}

// Global Sprite Engine Instance
window.sprites = new SpriteEngine();
