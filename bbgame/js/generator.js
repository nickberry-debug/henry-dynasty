// Procedural generators: teams, logos, players, avatars
const GEN = {
  // Generate team name from city + mascot
  teamName(usedNames) {
    for (let i = 0; i < 200; i++) {
      const city = U.choice(DATA.cities);
      const mascot = U.choice(DATA.mascots);
      const key = city + " " + mascot;
      if (!usedNames.has(key)) { usedNames.add(key); return { city, mascot }; }
    }
    return { city: U.choice(DATA.cities), mascot: U.choice(DATA.mascots) };
  },

  teamColors() {
    return U.choice(DATA.colorSets);
  },

  // SVG logo: deterministic-ish from team name
  logoSVG(team, size = 64) {
    const [c1, c2] = team.colors;
    const initial = team.mascot[0].toUpperCase();
    const sym = team.symbol || U.choice(DATA.logoSymbols);
    const seed = Math.abs(U.hashStr(team.city + team.mascot));
    const variant = seed % 6;

    // Inner symbol SVG fragment
    let symbolFrag = "";
    switch (sym) {
      case "star":
        symbolFrag = `<polygon points="32,12 38,26 53,26 41,35 45,50 32,42 19,50 23,35 11,26 26,26" fill="${c2}" stroke="#fff" stroke-width="1.5"/>`;
        break;
      case "diamond":
        symbolFrag = `<polygon points="32,10 52,32 32,54 12,32" fill="${c2}" stroke="#fff" stroke-width="1.5"/><circle cx="32" cy="32" r="6" fill="${c1}"/>`;
        break;
      case "bat":
        symbolFrag = `<g transform="translate(32,32) rotate(${(seed % 90) - 45})"><rect x="-2.5" y="-22" width="5" height="40" rx="2" fill="#d6a14a" stroke="#3a2410" stroke-width="1"/><circle cx="0" cy="-22" r="4" fill="${c2}" stroke="#fff" stroke-width="1"/></g>`;
        break;
      case "ball":
        symbolFrag = `<circle cx="32" cy="32" r="14" fill="#fff" stroke="${c2}" stroke-width="2"/><path d="M22 24 Q32 28 42 24" stroke="${c2}" stroke-width="1.4" fill="none"/><path d="M22 40 Q32 36 42 40" stroke="${c2}" stroke-width="1.4" fill="none"/>`;
        break;
      case "letter":
        symbolFrag = `<text x="32" y="42" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="32" fill="${c2}" stroke="#fff" stroke-width="0.6">${initial}</text>`;
        break;
      case "crown":
        symbolFrag = `<path d="M14 38 L20 22 L26 34 L32 18 L38 34 L44 22 L50 38 Z" fill="${c2}" stroke="#fff" stroke-width="1.5"/><rect x="14" y="38" width="36" height="6" fill="${c2}" stroke="#fff" stroke-width="1.5"/>`;
        break;
      case "shield":
        symbolFrag = `<path d="M32 14 L52 20 L52 36 Q52 50 32 54 Q12 50 12 36 L12 20 Z" fill="${c2}" stroke="#fff" stroke-width="1.5"/><text x="32" y="40" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="18" fill="${c1}" font-weight="900">${initial}</text>`;
        break;
      case "flame":
        symbolFrag = `<path d="M32 12 C 22 22, 18 30, 22 40 C 14 42, 18 52, 32 54 C 46 52, 50 42, 42 40 C 46 30, 42 22, 32 12 Z" fill="${c2}" stroke="#fff" stroke-width="1.5"/>`;
        break;
      case "bolt":
        symbolFrag = `<polygon points="34,10 18,34 28,34 22,54 46,28 36,28 42,10" fill="${c2}" stroke="#fff" stroke-width="1.4"/>`;
        break;
      case "claw":
        symbolFrag = `<g fill="${c2}" stroke="#fff" stroke-width="1.2">
          <path d="M14 38 Q18 18 26 16 Q22 28 22 40 Z"/>
          <path d="M24 42 Q28 18 36 16 Q32 30 32 44 Z"/>
          <path d="M34 42 Q38 18 46 18 Q42 32 42 44 Z"/>
        </g>`;
        break;
      case "wing":
        symbolFrag = `<path d="M12 36 Q22 18 32 32 Q42 18 52 36 Q42 42 32 36 Q22 42 12 36 Z" fill="${c2}" stroke="#fff" stroke-width="1.4"/>`;
        break;
      case "wave":
        symbolFrag = `<path d="M10 38 Q18 30 26 38 T 42 38 T 58 38 V52 H10 Z" fill="${c2}" stroke="#fff" stroke-width="1.4"/>`;
        break;
      case "mountain":
        symbolFrag = `<polygon points="10,50 24,24 30,34 42,16 54,50" fill="${c2}" stroke="#fff" stroke-width="1.4"/><circle cx="42" cy="22" r="3" fill="#fff"/>`;
        break;
      case "sun":
        symbolFrag = `<circle cx="32" cy="32" r="10" fill="${c2}"/><g stroke="${c2}" stroke-width="3" stroke-linecap="round">
          <line x1="32" y1="12" x2="32" y2="18"/><line x1="32" y1="46" x2="32" y2="52"/>
          <line x1="12" y1="32" x2="18" y2="32"/><line x1="46" y1="32" x2="52" y2="32"/>
          <line x1="18" y1="18" x2="22" y2="22"/><line x1="42" y1="42" x2="46" y2="46"/>
          <line x1="18" y1="46" x2="22" y2="42"/><line x1="42" y1="22" x2="46" y2="18"/>
        </g>`;
        break;
      case "moon":
        symbolFrag = `<path d="M40 14 A18 18 0 1 0 40 50 A14 14 0 1 1 40 14 Z" fill="${c2}" stroke="#fff" stroke-width="1.4"/>`;
        break;
      case "skull":
        symbolFrag = `<path d="M32 14 C 18 14 14 28 16 38 L20 46 H44 L48 38 C 50 28 46 14 32 14 Z" fill="${c2}" stroke="#fff" stroke-width="1.4"/>
        <circle cx="24" cy="32" r="3" fill="${c1}"/><circle cx="40" cy="32" r="3" fill="${c1}"/>`;
        break;
      case "anchor":
        symbolFrag = `<circle cx="32" cy="18" r="4" fill="none" stroke="${c2}" stroke-width="2.5"/><line x1="32" y1="22" x2="32" y2="50" stroke="${c2}" stroke-width="3"/>
        <line x1="24" y1="28" x2="40" y2="28" stroke="${c2}" stroke-width="3"/>
        <path d="M16 44 Q24 56 32 50 Q40 56 48 44" stroke="${c2}" stroke-width="3" fill="none"/>`;
        break;
      case "feather":
        symbolFrag = `<path d="M20 50 Q22 22 44 14 Q42 36 28 46 Z" fill="${c2}" stroke="#fff" stroke-width="1.2"/>`;
        break;
      case "compass":
        symbolFrag = `<circle cx="32" cy="32" r="16" fill="${c2}" stroke="#fff" stroke-width="1.4"/>
        <polygon points="32,18 36,32 32,46 28,32" fill="#fff"/><polygon points="18,32 32,28 46,32 32,36" fill="${c1}" opacity="0.6"/>`;
        break;
      case "gem":
        symbolFrag = `<polygon points="32,12 50,26 38,52 26,52 14,26" fill="${c2}" stroke="#fff" stroke-width="1.4"/>
        <line x1="14" y1="26" x2="50" y2="26" stroke="#fff" stroke-width="1"/><line x1="32" y1="12" x2="38" y2="52" stroke="#fff" stroke-width="1"/>
        <line x1="32" y1="12" x2="26" y2="52" stroke="#fff" stroke-width="1"/>`;
        break;
    }

    let outer = "";
    if (variant === 0) outer = `<circle cx="32" cy="32" r="30" fill="${c1}" stroke="#fff" stroke-width="2"/>`;
    else if (variant === 1) outer = `<rect x="2" y="2" width="60" height="60" rx="14" fill="${c1}" stroke="#fff" stroke-width="2"/>`;
    else if (variant === 2) outer = `<polygon points="32,2 62,18 62,46 32,62 2,46 2,18" fill="${c1}" stroke="#fff" stroke-width="2"/>`;
    else if (variant === 3) outer = `<circle cx="32" cy="32" r="30" fill="${c1}"/><circle cx="32" cy="32" r="26" fill="none" stroke="${c2}" stroke-width="2"/>`;
    else if (variant === 4) outer = `<path d="M32 2 L62 32 L32 62 L2 32 Z" fill="${c1}" stroke="#fff" stroke-width="2"/>`;
    else outer = `<rect x="2" y="2" width="60" height="60" rx="6" fill="${c1}" stroke="${c2}" stroke-width="3"/>`;

    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      ${outer}
      ${symbolFrag}
    </svg>`;
  },

  // Generate player name
  playerName() {
    return U.choice(DATA.firstNames) + " " + U.choice(DATA.lastNames);
  },

  // Generate avatar SVG
  avatarSVG(player, size = 40) {
    const seed = Math.abs(U.hashStr(player.id || (player.name + player.born)));
    const skinTones = ["#f5d0b0","#e0b58a","#c89870","#a87650","#8b5a3c","#6b3e25","#4f2e1d"];
    const hairColors = ["#1a1a1a","#3a2410","#6b4423","#a36a3a","#d8a657","#dcdcdc"];
    const beardChance = (seed % 100) > 65;
    const skin = skinTones[seed % skinTones.length];
    const hair = hairColors[(seed >> 4) % hairColors.length];
    const eyeStyle = seed % 3;
    const noseStyle = (seed >> 2) % 3;
    const capColors = player.team ? player.team.colors : ["#222","#fff"];
    const facialHair = beardChance ? `<path d="M22 38 Q32 44 42 38 Q40 42 32 44 Q24 42 22 38 Z" fill="${hair}"/>` : "";

    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" class="avatar-portrait">
      <defs>
        <radialGradient id="bg_${seed}" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stop-color="#2a3346"/>
          <stop offset="100%" stop-color="#0d1118"/>
        </radialGradient>
      </defs>
      <rect width="64" height="64" fill="url(#bg_${seed})"/>
      <!-- shoulders/jersey -->
      <path d="M4 64 Q4 50 16 46 L48 46 Q60 50 60 64 Z" fill="${capColors[0]}" stroke="${capColors[1]}" stroke-width="1"/>
      <!-- neck -->
      <rect x="28" y="40" width="8" height="8" fill="${skin}"/>
      <!-- head -->
      <ellipse cx="32" cy="30" rx="13" ry="15" fill="${skin}"/>
      <!-- hair -->
      <path d="M19 24 Q20 14 32 13 Q44 14 45 24 L45 28 Q40 22 32 22 Q24 22 19 28 Z" fill="${hair}"/>
      <!-- cap -->
      <path d="M16 22 Q20 12 32 11 Q44 12 48 22 L48 26 L16 26 Z" fill="${capColors[0]}" stroke="${capColors[1]}" stroke-width="1"/>
      <ellipse cx="44" cy="26" rx="10" ry="3" fill="${capColors[0]}" stroke="${capColors[1]}" stroke-width="1"/>
      <text x="32" y="22" font-family="Arial Black,sans-serif" font-weight="900" font-size="8" fill="${capColors[1]}" text-anchor="middle">${player.team ? player.team.mascot[0].toUpperCase() : ""}</text>
      <!-- eyes -->
      ${eyeStyle === 0
        ? `<circle cx="26" cy="31" r="1.4" fill="#111"/><circle cx="38" cy="31" r="1.4" fill="#111"/>`
        : eyeStyle === 1
        ? `<rect x="24.5" y="30" width="3" height="1.2" fill="#111"/><rect x="36.5" y="30" width="3" height="1.2" fill="#111"/>`
        : `<ellipse cx="26" cy="31" rx="1.2" ry="1.6" fill="#111"/><ellipse cx="38" cy="31" rx="1.2" ry="1.6" fill="#111"/>`}
      <!-- nose -->
      ${noseStyle === 0
        ? `<path d="M32 32 L30 36 L34 36 Z" fill="rgba(0,0,0,0.15)"/>`
        : noseStyle === 1
        ? `<path d="M30 33 Q32 38 34 33" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>`
        : `<line x1="32" y1="33" x2="32" y2="37" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>`}
      <!-- mouth -->
      <path d="M28 40 Q32 42 36 40" stroke="#5a2222" stroke-width="1.4" fill="none"/>
      ${facialHair}
    </svg>`;
  },

  // Generate a player with realistic distribution
  player(opts = {}) {
    const age = opts.age != null ? opts.age : U.irand(19, 39);
    const isPitcher = opts.isPitcher != null ? opts.isPitcher : Math.random() < 0.42;
    const pos = opts.position || (isPitcher ? U.weighted(["SP","RP","CP"], [55, 35, 10]) : U.weighted(DATA.fieldPositions, [10,10,10,10,12,10,10,10]));
    const name = opts.name || GEN.playerName();
    const bats = U.weighted(DATA.hands, [50,30,5,5,5,3,2]);
    const throws = isPitcher ? U.weighted(["R","L"], [70, 30]) : U.weighted(["R","L"], [85, 15]);

    // Skill: based on age curve, with random base talent
    const baseTalent = U.clamp(U.gauss(58, 14), 25, 99);
    // Peak around age 28
    const ageMod = 1 - Math.pow((age - 28) / 18, 2) * 0.4;
    const skillCore = U.clamp(baseTalent * ageMod, 25, 99);

    const r = () => U.clamp(Math.round(skillCore + U.gauss(0, 8)), 25, 99);
    const ratings = isPitcher
      ? {
          velocity: r(), control: r(), movement: r(), stamina: r(),
          fastball: r(), curveball: r(), slider: r(), changeup: r(),
          // dummy hitting
          contact: U.irand(20, 50), power: U.irand(20, 45), speed: U.irand(30, 70),
          fielding: r(), arm: r(), durability: r()
        }
      : {
          contact: r(), power: r(), discipline: r(), speed: r(),
          fielding: r(), arm: r(), durability: r(),
          // dummy pitching
          velocity: U.irand(20, 45), control: U.irand(20, 45), movement: U.irand(20, 45), stamina: U.irand(20, 50)
        };

    const overall = isPitcher
      ? Math.round((ratings.velocity + ratings.control + ratings.movement + ratings.stamina) / 4)
      : Math.round((ratings.contact * 1.1 + ratings.power + ratings.discipline + ratings.speed * 0.8 + ratings.fielding * 0.8) / 4.7);

    const potential = Math.min(99, overall + (age < 25 ? U.irand(0, 15) : age < 28 ? U.irand(0, 6) : 0));

    // Salary based on rating and age
    const yearsExp = U.clamp(age - 20 + U.irand(-2, 2), 0, 22);
    let salary;
    if (yearsExp < 3) salary = U.irand(700_000, 1_200_000);
    else if (yearsExp < 6) salary = Math.round((overall - 50) * U.irand(80_000, 180_000));
    else salary = Math.round(Math.max(0, overall - 55) * U.irand(150_000, 380_000));
    salary = U.clamp(salary, 720_000, 50_000_000);

    const trait = U.choice(DATA.traits);
    const id = U.uuid();

    // Career stats — build retroactive history
    const careerStats = { hitting: [], pitching: [] };
    const startAge = 19 + U.irand(0, 3);
    const seasonsPlayed = U.clamp(age - startAge, 0, 22);
    for (let i = 0; i < seasonsPlayed; i++) {
      const seasonAge = startAge + i;
      const yearRating = U.clamp(overall - Math.abs(seasonAge - 28) * 1.2 + U.gauss(0, 4), 30, 99);
      if (isPitcher) {
        const ip = U.clamp(U.gauss(pos === "SP" ? 170 : pos === "CP" ? 65 : 70, 30), 20, 240);
        const era = U.clamp(8.5 - (yearRating - 30) / 14, 1.8, 7.5) + U.gauss(0, 0.6);
        const wins = pos === "SP" ? U.clamp(Math.round(ip / 30 * (yearRating / 80) + U.gauss(0, 2)), 0, 24)
                  : U.irand(2, 10);
        careerStats.pitching.push({
          year: i, age: seasonAge, ip: Math.round(ip * 10) / 10,
          w: wins, l: U.clamp(Math.round(ip / 35 + U.gauss(0, 2) - wins / 3), 0, 22),
          era: Math.round(era * 100) / 100,
          k: Math.round(ip * (yearRating / 100) * U.rand(0.8, 1.4)),
          bb: Math.round(ip * U.rand(0.18, 0.45)),
          saves: pos === "CP" ? U.irand(15, 45) : pos === "RP" ? U.irand(0, 12) : 0,
          gs: pos === "SP" ? U.irand(20, 33) : 0
        });
      } else {
        const ab = U.clamp(U.gauss(490, 60), 250, 660);
        const avg = U.clamp(0.180 + (yearRating - 30) / 320, 0.190, 0.380) + U.gauss(0, 0.018);
        const hits = Math.round(ab * avg);
        const hr = U.clamp(Math.round(ratings.power / 5 + U.gauss(0, 8)), 0, 60);
        const rbi = U.clamp(Math.round(hits * 0.55 + hr * 1.6 + U.gauss(0, 12)), 10, 160);
        careerStats.hitting.push({
          year: i, age: seasonAge, ab,
          h: hits, hr, rbi,
          avg: Math.round(avg * 1000) / 1000,
          r: Math.round(hits * 0.62 + U.gauss(0, 10)),
          sb: U.clamp(Math.round((ratings.speed - 50) / 4 + U.gauss(0, 6)), 0, 70),
          bb: U.irand(20, 110),
          k: U.irand(60, 220),
          obp: Math.round((avg + U.rand(0.04, 0.09)) * 1000) / 1000,
          slg: Math.round((avg + hr / ab * 3 + U.rand(0.05, 0.18)) * 1000) / 1000
        });
      }
    }

    return {
      id, name,
      position: pos, isPitcher,
      age, born: 0,
      bats, throws,
      height: U.irand(68, 80), // inches
      weight: U.irand(170, 250),
      ratings,
      overall, potential,
      salary,
      contractYears: U.irand(1, 5),
      yearsExp,
      trait,
      injury: null, // {name, daysOut, dlType}
      retired: false,
      hof: false,
      careerStats,
      seasonStats: GEN.emptySeasonStats(isPitcher),
      teamId: null,
      awards: [] // {year, type}
    };
  },

  emptySeasonStats(isPitcher) {
    if (isPitcher) {
      return { g: 0, gs: 0, w: 0, l: 0, sv: 0, ip: 0, h: 0, er: 0, bb: 0, k: 0, hr: 0, era: 0 };
    }
    return { g: 0, ab: 0, h: 0, hr: 0, rbi: 0, r: 0, bb: 0, k: 0, sb: 0, avg: 0, obp: 0, slg: 0, "2b": 0, "3b": 0 };
  },

  // Build a balanced roster of ~26 with reasonable position distribution
  roster(teamId, teamRef) {
    const players = [];
    // 5 SPs, 7 RPs, 1 CP
    const pitchersPlan = [
      ["SP", 5], ["RP", 7], ["CP", 1]
    ];
    pitchersPlan.forEach(([pos, n]) => {
      for (let i = 0; i < n; i++) {
        const p = GEN.player({ position: pos, isPitcher: true });
        p.teamId = teamId; p.team = teamRef;
        players.push(p);
      }
    });
    // 2 C, 1 1B, 1 2B, 1 3B, 1 SS, 1 LF, 1 CF, 1 RF, 1 DH, 5 bench (mixed)
    const fielders = [
      ["C", 2], ["1B", 1], ["2B", 1], ["3B", 1], ["SS", 1],
      ["LF", 1], ["CF", 1], ["RF", 1], ["DH", 1]
    ];
    fielders.forEach(([pos, n]) => {
      for (let i = 0; i < n; i++) {
        const p = GEN.player({ position: pos, isPitcher: false });
        p.teamId = teamId; p.team = teamRef;
        players.push(p);
      }
    });
    // bench
    for (let i = 0; i < 4; i++) {
      const p = GEN.player({ position: U.choice(["UT","1B","2B","SS","3B","LF","CF","RF"]), isPitcher: false });
      p.teamId = teamId; p.team = teamRef;
      players.push(p);
    }
    return players;
  },

  // Build league of N teams
  league(numTeams = 30) {
    const used = new Set();
    const teams = [];
    for (let i = 0; i < numTeams; i++) {
      const { city, mascot } = GEN.teamName(used);
      const colors = GEN.teamColors();
      const symbol = U.choice(DATA.logoSymbols);
      const id = "t" + i;
      const team = {
        id, city, mascot, name: `${city} ${mascot}`,
        colors, symbol,
        abbreviation: GEN.abbr(city, mascot),
        established: 1975 + U.irand(0, 50),
        conference: i % 2 === 0 ? "American" : "National",
        division: Math.floor((i % 16) / 4) % 4, // 0..3 — only used if 16+ teams
        wins: 0, losses: 0,
        runsScored: 0, runsAllowed: 0,
        playoffSeed: null,
        budget: U.irand(180, 280) * 1_000_000,
        history: [], // {year, w, l, finish}
        retiredNumbers: []
      };
      teams.push(team);
    }
    return teams;
  },

  abbr(city, mascot) {
    const c1 = city.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
    const c2 = mascot[0].toUpperCase();
    return c1 + c2;
  },

  // Generate prior 50-season history for league flavor
  history(teams, currentYear) {
    const records = [];
    for (let y = currentYear - DATA.yearsOfHistory; y < currentYear; y++) {
      // Pick a champion + runner-up + awards
      const champion = U.choice(teams);
      let runnerUp = U.choice(teams);
      while (runnerUp.id === champion.id) runnerUp = U.choice(teams);
      const yearRec = {
        year: y,
        champion: champion.id,
        runnerUp: runnerUp.id,
        mvp: GEN.playerName(),
        cy: GEN.playerName(),
        roy: GEN.playerName(),
        hrLeader: { name: GEN.playerName(), hr: U.irand(38, 62) },
        battingLeader: { name: GEN.playerName(), avg: U.rand(0.310, 0.385) },
        eraLeader: { name: GEN.playerName(), era: U.rand(1.92, 2.85) }
      };
      records.push(yearRec);
    }
    return records;
  }
};
