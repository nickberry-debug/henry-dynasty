// Game simulation engine — at-bat by at-bat
const Sim = {

  // Quick simulate (no play list)
  quickSim(league, game) {
    const result = Sim.runGame(league, game, { recordPlays: false });
    Sim.applyGame(league, game, result);
    return result;
  },

  // Live simulate — returns full play list to be played back in UI
  liveSim(league, game) {
    const result = Sim.runGame(league, game, { recordPlays: true });
    Sim.applyGame(league, game, result);
    return result;
  },

  applyGame(league, game, result) {
    game.played = true;
    game.score = { home: result.homeRuns, away: result.awayRuns };
    // Only store linescore arrays (small) — drop verbose innings list
    game.linescore = {
      home: result.linescore.home, away: result.linescore.away,
      homeH: result.linescore.homeH, awayH: result.linescore.awayH
    };
    Sim.commitGameStats(league, game, result);
    League.applyGameResult(league, game);
  },

  // Returns: { homeRuns, awayRuns, innings, plays[], playerStats, linescore }
  runGame(league, game, opts = {}) {
    const home = League.getTeam(league, game.home);
    const away = League.getTeam(league, game.away);
    const homeRoster = League.rosterOf(league, home.id);
    const awayRoster = League.rosterOf(league, away.id);

    const result = {
      homeId: home.id, awayId: away.id,
      homeRuns: 0, awayRuns: 0,
      innings: [], plays: [],
      playerStats: {},
      linescore: { home: [], away: [], homeH: 0, awayH: 0, homeE: 0, awayE: 0 }
    };

    const homeLineup = Sim.lineup(homeRoster);
    const awayLineup = Sim.lineup(awayRoster);
    const homePitchers = homeRoster.filter(p => p.isPitcher && !p.injury);
    const awayPitchers = awayRoster.filter(p => p.isPitcher && !p.injury);
    let homeP = homePitchers.find(p => p.position === "SP") || homePitchers[0];
    let awayP = awayPitchers.find(p => p.position === "SP") || awayPitchers[0];

    if (!homeP || !awayP) {
      // Degenerate case: forfeit-ish
      result.homeRuns = 1; result.awayRuns = 0;
      return result;
    }

    const stats = (p) => {
      if (!result.playerStats[p.id]) {
        result.playerStats[p.id] = {
          hitting: { ab: 0, h: 0, "2b": 0, "3b": 0, hr: 0, r: 0, rbi: 0, bb: 0, k: 0, sb: 0 },
          pitching: { ip: 0, outs: 0, h: 0, er: 0, bb: 0, k: 0, hr: 0, gs: 0, w: 0, l: 0, sv: 0 }
        };
      }
      return result.playerStats[p.id];
    };
    stats(homeP).pitching.gs = 1;
    stats(awayP).pitching.gs = 1;

    let inning = 1, top = true;
    let homeIdx = 0, awayIdx = 0;

    while (true) {
      const lineup = top ? awayLineup : homeLineup;
      const getIdx = () => top ? awayIdx : homeIdx;
      const incIdx = () => { if (top) awayIdx = (awayIdx + 1) % lineup.length; else homeIdx = (homeIdx + 1) % lineup.length; };
      const pitcher = top ? homeP : awayP;

      let outs = 0;
      let bases = [null, null, null];
      let runs = 0;
      const halfPlays = [];

      while (outs < 3) {
        const batter = lineup[getIdx()];
        const bStats = stats(batter);
        const pStats = stats(pitcher);
        const ab = Sim.atBat(batter, pitcher);
        bStats.hitting.ab++;
        let playKind = "";
        let playText = "";

        if (ab.result === "K") {
          outs++; bStats.hitting.k++; pStats.pitching.k++; pStats.pitching.outs++;
          playKind = "k"; playText = `${batter.name} strikes out${Math.random() < 0.5 ? ' swinging' : ' looking'}.`;
        } else if (ab.result === "BB") {
          pStats.pitching.bb++; bStats.hitting.bb++;
          const scored = Sim.advanceRunners(bases, batter, 1, true);
          if (scored) { pStats.pitching.er += scored; bStats.hitting.rbi += scored; }
          runs += scored;
          playKind = "event"; playText = `${batter.name} walks.${scored ? ` ${scored} run scores.` : ''}`;
        } else if (ab.result === "HBP") {
          const scored = Sim.advanceRunners(bases, batter, 1, true);
          runs += scored;
          if (scored) { pStats.pitching.er += scored; bStats.hitting.rbi += scored; }
          playKind = "event"; playText = `${batter.name} is hit by the pitch!`;
        } else if (ab.result === "OUT") {
          outs++; pStats.pitching.outs++;
          // Sac fly chance from 3rd
          let extra = "";
          if (ab.outType.includes("fl") && bases[2] && outs < 3 && Math.random() < 0.55) {
            runs++; pStats.pitching.er++; bStats.hitting.rbi++;
            const scorer = bases[2]; stats(scorer).hitting.r++;
            bases[2] = null;
            extra = ` ${scorer.name} tags up and scores.`;
          }
          playKind = "out"; playText = `${batter.name} ${ab.outType}.${extra}`;
        } else {
          // Hit
          bStats.hitting.h++; pStats.pitching.h++;
          if (ab.result === "HR") { bStats.hitting.hr++; pStats.pitching.hr++; bStats.hitting.r++; }
          if (ab.result === "2B") bStats.hitting["2b"]++;
          if (ab.result === "3B") bStats.hitting["3b"]++;
          const bases_ = ab.result === "1B" ? 1 : ab.result === "2B" ? 2 : ab.result === "3B" ? 3 : 4;
          // Capture runners on base so we can credit runs
          const runnersOnBeforeHit = bases.filter(Boolean);
          const scored = Sim.advanceRunners(bases, batter, bases_, false);
          runs += scored;
          // Credit RBI to batter & R to scorers (already credit batter R for HR above)
          if (ab.result === "HR") {
            runnersOnBeforeHit.forEach(r => stats(r).hitting.r++);
            bStats.hitting.rbi += scored; // batter + runners
          } else {
            bStats.hitting.rbi += scored;
            // Approximate which runners scored: assume the earlier ones
            for (let i = 0; i < scored; i++) {
              if (runnersOnBeforeHit[i]) stats(runnersOnBeforeHit[i]).hitting.r++;
            }
          }
          pStats.pitching.er += scored;
          const verb = ab.result === "HR" ? "launches a HOME RUN" :
                       ab.result === "3B" ? "rips a triple" :
                       ab.result === "2B" ? "doubles into the gap" :
                       "lines a single";
          playKind = ab.result === "HR" ? "hr" : "hit";
          playText = `${batter.name} ${verb}!${scored ? ` ${scored} run${scored > 1 ? 's' : ''} score${scored === 1 ? 's' : ''}.` : ''}`;
        }
        incIdx();

        if (opts.recordPlays) {
          halfPlays.push({
            inning, top, outs, runs,
            bases: bases.map(b => b ? b.name : null),
            text: playText, kind: playKind,
            scoreHome: result.homeRuns + (top ? 0 : runs),
            scoreAway: result.awayRuns + (top ? runs : 0),
            batter: batter.name,
            pitcher: pitcher.name
          });
        }
      }

      // End of half
      if (top) { result.awayRuns += runs; result.linescore.away.push(runs); }
      else { result.homeRuns += runs; result.linescore.home.push(runs); }
      result.innings.push({ inning, top, runs });
      if (opts.recordPlays) {
        halfPlays.push({
          inning, top, outs: 3, runs,
          bases: [null, null, null],
          text: `End of ${top ? "top" : "bottom"} ${inning}. ${top ? away.abbreviation : home.abbreviation} ${runs} run${runs !== 1 ? 's' : ''}.`,
          kind: "end",
          scoreHome: result.homeRuns, scoreAway: result.awayRuns
        });
      }
      result.plays.push(...halfPlays);

      // Game end check
      if (!top && inning >= 9 && result.homeRuns !== result.awayRuns) break;
      if (top && inning >= 9 && result.homeRuns > result.awayRuns) break;
      if (inning >= 15) break;
      if (!top) inning++;
      top = !top;

      // Pitcher fatigue check
      const cur = top ? homeP : awayP;
      const ipFloat = (stats(cur).pitching.outs / 3);
      const isStarter = cur.position === "SP";
      const stam = cur.ratings.stamina || 60;
      const limit = isStarter ? (5.5 + (stam - 60) / 30) : 1.5;
      if (ipFloat >= limit) {
        const pool = (top ? homePitchers : awayPitchers).filter(x => x.id !== cur.id && !x.injury);
        // Choose CP if late innings + lead <= 3, else RP
        const margin = Math.abs(result.homeRuns - result.awayRuns);
        let next;
        if (inning >= 9 && margin <= 3) {
          next = pool.find(x => x.position === "CP") || pool.find(x => x.position === "RP") || pool[0];
        } else {
          next = pool.find(x => x.position === "RP") || pool.find(x => x.position === "CP") || pool[0];
        }
        if (next) {
          if (top) homeP = next; else awayP = next;
        }
      }
    }

    // Convert outs -> IP for each pitcher
    Object.values(result.playerStats).forEach(s => {
      if (s.pitching && s.pitching.outs != null) {
        s.pitching.ip = Math.round((s.pitching.outs / 3) * 10) / 10;
      }
    });

    // Assign W/L/SV
    const winningHome = result.homeRuns > result.awayRuns;
    const winSP = winningHome ? homePitchers.find(p => p.position === "SP") : awayPitchers.find(p => p.position === "SP");
    const loseSP = winningHome ? awayPitchers.find(p => p.position === "SP") : homePitchers.find(p => p.position === "SP");
    if (winSP && result.playerStats[winSP.id]) result.playerStats[winSP.id].pitching.w = 1;
    if (loseSP && result.playerStats[loseSP.id]) result.playerStats[loseSP.id].pitching.l = 1;
    const margin = Math.abs(result.homeRuns - result.awayRuns);
    if (margin <= 3) {
      const closer = (winningHome ? homePitchers : awayPitchers).find(p => p.position === "CP");
      if (closer && result.playerStats[closer.id] && result.playerStats[closer.id].pitching.outs > 0) {
        result.playerStats[closer.id].pitching.sv = 1;
      }
    }

    // Linescore hits
    Object.entries(result.playerStats).forEach(([pid, s]) => {
      if (!s.hitting) return;
      const p = League.getPlayer(league, pid);
      if (!p) return;
      if (p.teamId === home.id) result.linescore.homeH += s.hitting.h;
      else if (p.teamId === away.id) result.linescore.awayH += s.hitting.h;
    });

    return result;
  },

  lineup(roster) {
    const healthy = roster.filter(p => !p.injury);
    const fielders = healthy.filter(p => !p.isPitcher);
    fielders.sort((a, b) => b.overall - a.overall);
    return fielders.slice(0, 9);
  },

  atBat(batter, pitcher) {
    const contact = batter.ratings.contact || 50;
    const power = batter.ratings.power || 50;
    const discipline = batter.ratings.discipline || 50;
    const speed = batter.ratings.speed || 50;
    const velocity = pitcher.ratings.velocity || 50;
    const control = pitcher.ratings.control || 50;
    const movement = pitcher.ratings.movement || 50;

    const stuff = (velocity + movement) / 2;
    const eye = (discipline + contact) / 2;

    const kPct = U.clamp(0.18 + (stuff - eye) * 0.0032 + U.rand(-0.04, 0.04), 0.10, 0.42);
    const bbPct = U.clamp(0.085 + (eye - control) * 0.0028 + U.rand(-0.02, 0.02), 0.03, 0.18);
    const hbpPct = 0.008;

    const r1 = Math.random();
    if (r1 < kPct) return { result: "K" };
    if (r1 < kPct + bbPct) return { result: "BB" };
    if (r1 < kPct + bbPct + hbpPct) return { result: "HBP" };

    const babip = U.clamp(0.295 + (contact - stuff) * 0.0014 + U.rand(-0.03, 0.03), 0.22, 0.38);
    const bipRoll = Math.random();
    if (bipRoll > babip) {
      const o = Math.random();
      if (o < 0.42) return { result: "OUT", outType: "grounds out" };
      if (o < 0.82) return { result: "OUT", outType: "flies out" };
      return { result: "OUT", outType: "lines out" };
    }
    const hrPct = U.clamp((power - 55) * 0.0022 + 0.055, 0.015, 0.25);
    const trpPct = U.clamp((speed - 55) * 0.0012 + 0.018, 0.005, 0.06);
    const dblPct = 0.20;
    const hitRoll = Math.random();
    if (hitRoll < hrPct) return { result: "HR" };
    if (hitRoll < hrPct + trpPct) return { result: "3B" };
    if (hitRoll < hrPct + trpPct + dblPct) return { result: "2B" };
    return { result: "1B" };
  },

  advanceRunners(bases, batter, basesGained, isWalk) {
    let scored = 0;
    if (isWalk) {
      if (bases[0]) {
        if (bases[1]) {
          if (bases[2]) { scored++; }
          bases[2] = bases[1];
        }
        bases[1] = bases[0];
      }
      bases[0] = batter;
      return scored;
    }
    if (basesGained === 4) {
      for (let i = 0; i < 3; i++) { if (bases[i]) { scored++; bases[i] = null; } }
      scored++;
      return scored;
    }
    const nb = [null, null, null];
    if (bases[2]) scored++;
    if (bases[1]) {
      if (basesGained >= 2) scored++;
      else if (Math.random() < 0.5) scored++;
      else nb[2] = bases[1];
    }
    if (bases[0]) {
      if (basesGained === 3) scored++;
      else if (basesGained === 2) {
        if (Math.random() < 0.5) scored++; else nb[2] = bases[0];
      } else {
        nb[1] = bases[0];
      }
    }
    if (basesGained === 1) nb[0] = batter;
    if (basesGained === 2) nb[1] = batter;
    if (basesGained === 3) nb[2] = batter;
    bases[0] = nb[0]; bases[1] = nb[1]; bases[2] = nb[2];
    return scored;
  },

  commitGameStats(league, game, result) {
    Object.keys(result.playerStats).forEach(pid => {
      const p = League.getPlayer(league, pid);
      if (!p) return;
      const acc = result.playerStats[pid];
      const ps = p.seasonStats;
      if (p.isPitcher) {
        ps.g++;
        ps.gs += acc.pitching.gs || 0;
        ps.ip = Math.round((ps.ip + (acc.pitching.outs / 3)) * 10) / 10;
        ps.h += acc.pitching.h;
        ps.er += acc.pitching.er;
        ps.bb += acc.pitching.bb;
        ps.k += acc.pitching.k;
        ps.hr += acc.pitching.hr;
        ps.w += acc.pitching.w || 0;
        ps.l += acc.pitching.l || 0;
        ps.sv += acc.pitching.sv || 0;
        ps.era = ps.ip > 0 ? (ps.er * 9) / ps.ip : 0;
      } else {
        ps.g++;
        ps.ab += acc.hitting.ab;
        ps.h += acc.hitting.h;
        ps.hr += acc.hitting.hr;
        ps.rbi += acc.hitting.rbi;
        ps.r += acc.hitting.r;
        ps.bb += acc.hitting.bb;
        ps.k += acc.hitting.k;
        ps.sb += acc.hitting.sb;
        ps["2b"] += acc.hitting["2b"];
        ps["3b"] += acc.hitting["3b"];
        ps.avg = ps.ab > 0 ? ps.h / ps.ab : 0;
        const pa = ps.ab + ps.bb;
        ps.obp = pa > 0 ? (ps.h + ps.bb) / pa : 0;
        ps.slg = ps.ab > 0 ? (ps.h + ps["2b"] + 2 * ps["3b"] + 3 * ps.hr) / ps.ab : 0;
      }
    });
  }
};
