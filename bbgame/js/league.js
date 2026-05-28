// League state management: building, season, schedule, free agents, draft, playoffs
const League = {
  createNew(opts = {}) {
    const numTeams = opts.numTeams || 30;
    const gamesPerSeason = opts.gamesPerSeason || 162;
    const seasonYear = opts.startYear || 2026;

    const teams = GEN.league(numTeams);
    // Generate rosters
    const players = [];
    teams.forEach(t => {
      const roster = GEN.roster(t.id, t);
      roster.forEach(p => { delete p.team; players.push(p); });
    });

    // Generate 50-year history
    const history = GEN.history(teams, seasonYear);

    // Free agents (some leftover veterans + minor leaguers)
    const freeAgents = [];
    for (let i = 0; i < numTeams * 4; i++) {
      const p = GEN.player({});
      freeAgents.push(p);
    }

    // Generate schedule
    const schedule = League.buildSchedule(teams, gamesPerSeason);

    const league = {
      year: seasonYear,
      day: 0,
      gamesPerSeason,
      teams,
      players,
      freeAgents,
      retiredPlayers: [],
      schedule,
      history,
      settings: {
        salaryCapOn: true,
        salaryCap: 230_000_000,
        playoffRounds: 3, // Wild Card, Division, LCS, World Series — we'll use 4 rounds (8 teams per conf -> 2 rounds + finals OR custom)
        playoffTeamsPerConference: 4,
        simSpeed: "normal",
        injuryRate: 0.5
      },
      phase: "regular", // regular | playoffs | offseason | draft | freeagency
      playoffs: null,
      draft: null,
      seasonAwards: null,
      newsLog: []
    };
    return league;
  },

  buildSchedule(teams, gamesPerSeason) {
    // Build a schedule of N games per team, round robin distributed across days.
    // Each "day" we generate games (~half the teams playing).
    const schedule = []; // [{day, gameId, home, away, played, score: {home, away}}]
    const totalGameDays = Math.ceil(gamesPerSeason * 1.05); // some off-days
    const matchups = [];

    // Build games per team
    const remaining = {};
    teams.forEach(t => remaining[t.id] = gamesPerSeason);

    // Generate pairings — for simplicity, randomly schedule until everyone has enough
    let gameId = 0;
    for (let d = 0; d < totalGameDays; d++) {
      // Each day, attempt to pair up teams that still need games
      const available = teams.filter(t => remaining[t.id] > 0).map(t => t.id);
      // shuffle
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }
      const used = new Set();
      for (let i = 0; i < available.length; i++) {
        const a = available[i];
        if (used.has(a)) continue;
        // Find a partner
        for (let j = i + 1; j < available.length; j++) {
          const b = available[j];
          if (used.has(b)) continue;
          // Schedule game
          const homeFirst = Math.random() < 0.5;
          schedule.push({
            id: "g" + (gameId++),
            day: d,
            home: homeFirst ? a : b,
            away: homeFirst ? b : a,
            played: false,
            score: null,
            innings: null,
            isPlayoff: false
          });
          remaining[a]--; remaining[b]--;
          used.add(a); used.add(b);
          break;
        }
      }
      // Stop if everyone is done
      if (teams.every(t => remaining[t.id] <= 0)) break;
    }
    return schedule;
  },

  // Get team by id
  getTeam(league, id) { return league.teams.find(t => t.id === id); },
  getPlayer(league, id) {
    return league.players.find(p => p.id === id) ||
           league.freeAgents.find(p => p.id === id) ||
           league.retiredPlayers.find(p => p.id === id);
  },
  rosterOf(league, teamId) {
    return league.players.filter(p => p.teamId === teamId);
  },

  // Daily injury check and free-agent pool churn
  dailyTick(league) {
    // Random injuries
    league.players.forEach(p => {
      if (p.injury) {
        p.injury.daysOut--;
        if (p.injury.daysOut <= 0) { p.injury = null; }
        return;
      }
      const durability = (p.ratings.durability || 60);
      const traitMod = p.trait === "Iron Man" ? 0.25 : (p.trait === "Injury Prone" || p.trait === "Glass Cannon") ? 2.2 : 1;
      const chance = (0.0005 * (100 - durability) / 60) * league.settings.injuryRate * traitMod;
      if (Math.random() < chance) {
        const inj = U.choice(DATA.injuries);
        p.injury = {
          name: inj.name,
          daysOut: U.irand(inj.days[0], inj.days[1]),
          dlType: inj.days[1] >= 60 ? "60-day" : inj.days[1] >= 15 ? "15-day" : "10-day"
        };
        league.newsLog.unshift({
          day: league.day, year: league.year,
          msg: `${p.name} placed on the ${p.injury.dlType} IL with ${p.injury.name}.`
        });
      }
    });
    if (league.newsLog.length > 200) league.newsLog.length = 200;
  },

  // Get game(s) on a specific day
  gamesOnDay(league, day) {
    return league.schedule.filter(g => g.day === day);
  },

  // Find next unplayed day
  nextUnplayedDay(league) {
    const day = league.schedule
      .filter(g => !g.played)
      .reduce((min, g) => Math.min(min, g.day), Infinity);
    return day === Infinity ? null : day;
  },

  isRegularSeasonComplete(league) {
    return league.schedule.every(g => g.played);
  },

  // Award updates after a game
  applyGameResult(league, game) {
    const home = League.getTeam(league, game.home);
    const away = League.getTeam(league, game.away);
    home.runsScored += game.score.home; home.runsAllowed += game.score.away;
    away.runsScored += game.score.away; away.runsAllowed += game.score.home;
    if (game.score.home > game.score.away) { home.wins++; away.losses++; }
    else { away.wins++; home.losses++; }
  },

  // ---- Standings ----
  standings(league) {
    const sorted = [...league.teams].sort((a, b) => {
      const wa = a.wins / Math.max(1, a.wins + a.losses);
      const wb = b.wins / Math.max(1, b.wins + b.losses);
      if (wb !== wa) return wb - wa;
      return (b.runsScored - b.runsAllowed) - (a.runsScored - a.runsAllowed);
    });
    return sorted;
  },

  // ---- Playoffs ----
  startPlayoffs(league, customSeeds = null) {
    const perConf = league.settings.playoffTeamsPerConference || 4;
    let confA, confB;
    if (customSeeds && customSeeds.American && customSeeds.National) {
      confA = customSeeds.American.map(id => League.getTeam(league, id));
      confB = customSeeds.National.map(id => League.getTeam(league, id));
    } else {
      const standings = League.standings(league);
      confA = standings.filter(t => t.conference === "American").slice(0, perConf);
      confB = standings.filter(t => t.conference === "National").slice(0, perConf);
    }
    confA.forEach((t, i) => t.playoffSeed = i + 1);
    confB.forEach((t, i) => t.playoffSeed = i + 1);

    const buildRound = (teams) => {
      const matches = [];
      for (let i = 0; i < teams.length / 2; i++) {
        matches.push({
          high: teams[i].id, low: teams[teams.length - 1 - i].id,
          wins: { high: 0, low: 0 }, games: [], winner: null,
          bestOf: i === 0 ? 5 : 5
        });
      }
      return matches;
    };

    league.playoffs = {
      round: 0,
      rounds: [
        { name: "Division Series", A: buildRound(confA), B: buildRound(confB) },
        { name: "Conference Final", A: [], B: [] },
        { name: "World Series", A: [] }
      ]
    };
    league.phase = "playoffs";
  },

  // After a playoff round, advance winners
  advancePlayoffs(league) {
    const po = league.playoffs;
    const round = po.rounds[po.round];
    // Check if all matches of current round are done
    const matches = [...(round.A || []), ...(round.B || [])];
    const finished = matches.every(m => m.winner);
    if (!finished) return false;

    if (po.round === 0) {
      // Division Series complete -> Conference Final
      const aWinners = round.A.map(m => League.getTeam(league, m.winner));
      const bWinners = round.B.map(m => League.getTeam(league, m.winner));
      // Reseed by playoffSeed
      aWinners.sort((a, b) => a.playoffSeed - b.playoffSeed);
      bWinners.sort((a, b) => a.playoffSeed - b.playoffSeed);
      const buildR = (teams) => {
        const arr = [];
        for (let i = 0; i < teams.length / 2; i++) {
          arr.push({
            high: teams[i].id, low: teams[teams.length - 1 - i].id,
            wins: { high: 0, low: 0 }, games: [], winner: null, bestOf: 7
          });
        }
        return arr;
      };
      po.rounds[1].A = buildR(aWinners);
      po.rounds[1].B = buildR(bWinners);
      po.round = 1;
    } else if (po.round === 1) {
      const aChamp = po.rounds[1].A[0].winner;
      const bChamp = po.rounds[1].B[0].winner;
      po.rounds[2].A = [{
        high: aChamp, low: bChamp,
        wins: { high: 0, low: 0 }, games: [], winner: null, bestOf: 7
      }];
      po.round = 2;
    } else {
      // World Series done — finish
      const champ = po.rounds[2].A[0].winner;
      const runner = po.rounds[2].A[0].high === champ ? po.rounds[2].A[0].low : po.rounds[2].A[0].high;
      league.history.unshift({
        year: league.year,
        champion: champ,
        runnerUp: runner,
        mvp: League.computeSeasonMVP(league)?.name || GEN.playerName(),
        cy: League.computeCyYoung(league)?.name || GEN.playerName(),
        roy: League.computeROY(league)?.name || GEN.playerName(),
        hrLeader: League.statLeader(league, "hr"),
        battingLeader: League.statLeader(league, "avg", 200),
        eraLeader: League.statLeader(league, "era", 0, true)
      });
      League.endSeason(league);
      return true;
    }
    return false;
  },

  // Compute current MVP based on season stats
  computeSeasonMVP(league) {
    const hitters = league.players.filter(p => !p.isPitcher && p.seasonStats.ab >= 200);
    if (!hitters.length) return null;
    return hitters.sort((a, b) => {
      const sa = a.seasonStats; const sb = b.seasonStats;
      return (sb.hr * 4 + sb.rbi * 1.5 + sb.avg * 200 + sb.r) - (sa.hr * 4 + sa.rbi * 1.5 + sa.avg * 200 + sa.r);
    })[0];
  },
  computeCyYoung(league) {
    const ps = league.players.filter(p => p.isPitcher && p.seasonStats.ip >= 60);
    if (!ps.length) return null;
    return ps.sort((a, b) => {
      const sa = a.seasonStats; const sb = b.seasonStats;
      const va = (sa.w * 10) + sa.k * 0.5 - sa.era * 12 + sa.sv * 2.5;
      const vb = (sb.w * 10) + sb.k * 0.5 - sb.era * 12 + sb.sv * 2.5;
      return vb - va;
    })[0];
  },
  computeROY(league) {
    const candidates = league.players.filter(p => p.yearsExp <= 1);
    if (!candidates.length) return null;
    return candidates.sort((a, b) => {
      const sa = a.seasonStats; const sb = b.seasonStats;
      const va = a.isPitcher ? (sa.w * 8 - sa.era * 10 + sa.k * 0.4) : (sa.hr * 3 + sa.rbi + sa.avg * 200);
      const vb = b.isPitcher ? (sb.w * 8 - sb.era * 10 + sb.k * 0.4) : (sb.hr * 3 + sb.rbi + sb.avg * 200);
      return vb - va;
    })[0];
  },
  computeGoldGlove(league) {
    const fs = league.players.filter(p => !p.isPitcher);
    return fs.sort((a, b) => (b.ratings.fielding + b.ratings.arm) - (a.ratings.fielding + a.ratings.arm))[0];
  },
  computeBestHitter(league) {
    const hitters = league.players.filter(p => !p.isPitcher && p.seasonStats.ab >= 200);
    return hitters.sort((a, b) => b.seasonStats.avg - a.seasonStats.avg)[0];
  },
  computeBestPitcher(league) { return League.computeCyYoung(league); },
  computeHRChamp(league) {
    return [...league.players].sort((a, b) => b.seasonStats.hr - a.seasonStats.hr)[0];
  },

  statLeader(league, key, minAb = 100, lowIsBetter = false) {
    const list = league.players.filter(p => {
      const s = p.seasonStats;
      if (key === "era") return p.isPitcher && s.ip >= 60;
      if (key === "avg") return !p.isPitcher && s.ab >= minAb;
      return !p.isPitcher;
    });
    if (!list.length) return null;
    list.sort((a, b) => lowIsBetter ? a.seasonStats[key] - b.seasonStats[key] : b.seasonStats[key] - a.seasonStats[key]);
    const top = list[0];
    return { name: top.name, [key]: top.seasonStats[key], teamId: top.teamId };
  },

  // End of season: awards, retirements, contract decrement, draft prep
  endSeason(league) {
    const mvp = League.computeSeasonMVP(league);
    const cy = League.computeCyYoung(league);
    const roy = League.computeROY(league);
    const gg = League.computeGoldGlove(league);
    const bh = League.computeBestHitter(league);
    const bp = League.computeBestPitcher(league);
    const hrc = League.computeHRChamp(league);
    league.seasonAwards = { mvp, cy, roy, gg, bh, bp, hrc };
    [mvp, cy, roy, gg, bh, bp, hrc].forEach((p, idx) => {
      if (p && p.awards) {
        const types = ["MVP","Cy Young","Rookie of the Year","Gold Glove","Batting Title","Pitcher of the Year","HR Champ"];
        p.awards.push({ year: league.year, type: types[idx] });
      }
    });

    // Persist team histories
    league.teams.forEach(t => {
      t.history.unshift({ year: league.year, w: t.wins, l: t.losses, finish: t.playoffSeed || null });
    });

    // Retire old / decline players
    const retiring = [];
    league.players.forEach(p => {
      p.age++;
      p.yearsExp++;
      // Decline ratings post-30
      if (p.age > 30) {
        const decay = (p.age - 30) * 0.6 + U.rand(0, 1.2);
        Object.keys(p.ratings).forEach(k => {
          p.ratings[k] = U.clamp(p.ratings[k] - decay - U.rand(-0.5, 0.5), 20, 99);
        });
      } else if (p.age < 28) {
        const grow = U.rand(0, 2);
        Object.keys(p.ratings).forEach(k => {
          if (Math.random() < 0.5) p.ratings[k] = U.clamp(p.ratings[k] + grow, 20, p.potential);
        });
      }
      p.overall = p.isPitcher
        ? Math.round((p.ratings.velocity + p.ratings.control + p.ratings.movement + p.ratings.stamina) / 4)
        : Math.round((p.ratings.contact * 1.1 + p.ratings.power + p.ratings.discipline + p.ratings.speed * 0.8 + p.ratings.fielding * 0.8) / 4.7);
      p.contractYears--;

      // Archive season stats
      const arc = p.isPitcher ? p.careerStats.pitching : p.careerStats.hitting;
      arc.push({ year: league.year, age: p.age, ...p.seasonStats });
      p.seasonStats = GEN.emptySeasonStats(p.isPitcher);

      // Retirement check
      const retireChance = p.age >= 36 ? (p.age - 35) * 0.18 + (60 - p.overall) * 0.015 : 0;
      if (p.age >= 42 || Math.random() < retireChance) {
        p.retired = true;
        // HOF check
        const careerHR = (p.careerStats.hitting || []).reduce((s, y) => s + (y.hr || 0), 0);
        const careerH = (p.careerStats.hitting || []).reduce((s, y) => s + (y.h || 0), 0);
        const careerW = (p.careerStats.pitching || []).reduce((s, y) => s + (y.w || 0), 0);
        const careerK = (p.careerStats.pitching || []).reduce((s, y) => s + (y.k || 0), 0);
        p.hof = p.isPitcher ? (careerW >= 200 || careerK >= 2500 || (p.awards || []).length >= 4)
                            : (careerH >= 2500 || careerHR >= 400 || (p.awards || []).length >= 4);
        retiring.push(p);
      }

      // Contracts expiring -> free agent
      if (!p.retired && p.contractYears <= 0) {
        p.teamId = null;
        p.contractYears = 0;
      }
    });
    retiring.forEach(p => {
      league.players = league.players.filter(x => x.id !== p.id);
      league.retiredPlayers.push(p);
      league.newsLog.unshift({
        day: league.day, year: league.year,
        msg: `${p.name} announces retirement${p.hof ? ' — Hall of Fame candidate!' : '.'}`
      });
    });

    // Move FA expired to FA pool list
    const newlyFA = league.players.filter(p => p.teamId === null);
    newlyFA.forEach(p => {
      league.players = league.players.filter(x => x.id !== p.id);
      league.freeAgents.push(p);
    });

    // Generate draft prospects
    league.draft = {
      year: league.year + 1,
      round: 1,
      pick: 1,
      pickOrder: League.draftOrder(league),
      currentOrder: 0,
      prospects: [],
      completed: false,
      results: []
    };
    for (let i = 0; i < league.teams.length * 5; i++) {
      const p = GEN.player({ age: U.irand(18, 22) });
      p.yearsExp = 0;
      p.teamId = null;
      p.prospect = true;
      league.draft.prospects.push(p);
    }
    // Sort prospects by overall
    league.draft.prospects.sort((a, b) => b.overall - a.overall);

    // Advance year
    league.year++;
    league.day = 0;

    // Reset teams
    league.teams.forEach(t => {
      t.wins = 0; t.losses = 0; t.runsScored = 0; t.runsAllowed = 0; t.playoffSeed = null;
    });

    league.phase = "offseason";
    league.playoffs = null;
  },

  // Draft order = reverse of standings
  draftOrder(league) {
    const standings = League.standings(league);
    return standings.slice().reverse().map(t => t.id);
  },

  // CPU drafts
  cpuDraftPick(league, teamId) {
    if (!league.draft.prospects.length) return null;
    const roster = League.rosterOf(league, teamId);
    const pitcherCount = roster.filter(p => p.isPitcher).length;
    const needsPitcher = pitcherCount < 12;
    const top = league.draft.prospects.slice(0, 8);
    let chosen;
    if (needsPitcher) chosen = top.find(p => p.isPitcher) || top[0];
    else chosen = top.find(p => !p.isPitcher) || top[0];
    league.draft.prospects = league.draft.prospects.filter(p => p.id !== chosen.id);
    chosen.teamId = teamId;
    chosen.contractYears = 4;
    chosen.salary = 720_000;
    league.players.push(chosen);
    const pickNum = league.draft.results.length + 1;
    league.draft.results.push({ teamId, playerId: chosen.id, round: Math.ceil(pickNum / league.teams.length), pick: pickNum });
    return chosen;
  },

  startSeason(league) {
    // Generate schedule for new year
    league.schedule = League.buildSchedule(league.teams, league.gamesPerSeason);
    league.day = 0;
    league.phase = "regular";
  },

  signFreeAgent(league, playerId, teamId, years = 3) {
    const idx = league.freeAgents.findIndex(p => p.id === playerId);
    if (idx === -1) return false;
    const p = league.freeAgents[idx];
    const team = League.getTeam(league, teamId);
    if (league.settings.salaryCapOn) {
      const payroll = League.rosterOf(league, teamId).reduce((s, x) => s + x.salary, 0);
      if (payroll + p.salary > league.settings.salaryCap) return "cap";
    }
    league.freeAgents.splice(idx, 1);
    p.teamId = teamId;
    p.contractYears = years;
    league.players.push(p);
    return true;
  },

  releasePlayer(league, playerId) {
    const idx = league.players.findIndex(p => p.id === playerId);
    if (idx === -1) return false;
    const p = league.players[idx];
    p.teamId = null;
    league.players.splice(idx, 1);
    league.freeAgents.push(p);
    return true;
  }
};
