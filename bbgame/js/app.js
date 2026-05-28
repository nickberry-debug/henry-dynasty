// Main application controller
const App = {
  state: { league: null },

  init() {
    const saved = Storage.load();
    if (saved && saved.league) {
      App.state.league = saved.league;
    } else {
      App.state.league = League.createNew({ numTeams: 30, gamesPerSeason: 162 });
      Storage.save(App.state);
    }
    UI.init(App.state);
    UI.render();
    setTimeout(() => {
      document.getElementById("splash").classList.add("hidden");
      document.getElementById("app").classList.remove("hidden");
    }, 800);
  },

  save() {
    Storage.save(App.state);
  },

  newLeague(opts) {
    App.state.league = League.createNew(opts);
    Storage.save(App.state);
    UI.go("dashboard");
  },

  // Sim one day
  simDay() {
    const lg = App.state.league;
    if (lg.phase === "regular") {
      if (League.isRegularSeasonComplete(lg)) {
        UI.toast("Regular season complete. Go to Playoffs.");
        return;
      }
      const games = League.gamesOnDay(lg, lg.day);
      games.forEach(g => { if (!g.played) Sim.quickSim(lg, g); });
      League.dailyTick(lg);
      lg.day++;
      if (League.isRegularSeasonComplete(lg)) {
        lg.newsLog.unshift({ day: lg.day, year: lg.year, msg: "Regular season ends! Playoffs await." });
        UI.toast("Regular season complete! Open Playoffs to begin postseason.");
      }
      App.save();
      UI.render();
    } else if (lg.phase === "playoffs") {
      App.simPlayoffRound();
    } else if (lg.phase === "offseason") {
      UI.toast("Run the draft & free agency, then start a new season in Settings.");
      UI.go("draft");
    }
  },

  simN(n) {
    const lg = App.state.league;
    if (lg.phase === "regular") {
      for (let i = 0; i < n; i++) {
        if (League.isRegularSeasonComplete(lg)) break;
        const games = League.gamesOnDay(lg, lg.day);
        games.forEach(g => { if (!g.played) Sim.quickSim(lg, g); });
        League.dailyTick(lg);
        lg.day++;
      }
      App.save();
      UI.render();
      if (League.isRegularSeasonComplete(lg)) UI.toast("Regular season complete!");
    } else if (lg.phase === "playoffs") {
      for (let i = 0; i < n / 7; i++) App.simPlayoffRound();
    }
  },

  // ---- Playoffs ----
  startPlayoffsCustom() {
    const lg = App.state.league;
    // Read seeds from DOM
    const customSeeds = { American: [], National: [] };
    const perConf = lg.settings.playoffTeamsPerConference || 4;
    ["American","National"].forEach(conf => {
      const standings = League.standings(lg).filter(t => t.conference === conf).slice(0, perConf);
      customSeeds[conf] = standings.map(t => t.id);
    });
    // If user manually changed seed positions, respect them
    const seedEdits = document.querySelectorAll(".seed-edit");
    if (seedEdits.length > 0) {
      const order = { American: {}, National: {} };
      seedEdits.forEach(s => {
        const conf = s.dataset.conf;
        const teamId = s.dataset.team;
        const pos = parseInt(s.value, 10);
        order[conf][pos] = teamId;
      });
      ["American","National"].forEach(conf => {
        const arr = [];
        for (let i = 0; i < perConf; i++) if (order[conf][i]) arr.push(order[conf][i]);
        if (arr.length === perConf) customSeeds[conf] = arr;
      });
    }
    League.startPlayoffs(lg, customSeeds);
    App.save();
    UI.render();
  },

  simPlayoffRound() {
    const lg = App.state.league;
    if (!lg.playoffs) return;
    const po = lg.playoffs;
    const round = po.rounds[po.round];
    const matches = [...(round.A || []), ...(round.B || [])];
    matches.forEach(m => {
      if (m.winner) return;
      while (m.wins.high < Math.ceil(m.bestOf / 2) && m.wins.low < Math.ceil(m.bestOf / 2)) {
        const game = {
          id: "po_" + U.uuid(),
          home: Math.random() < 0.5 ? m.high : m.low,
          away: 0,
          played: false, score: null, innings: null, isPlayoff: true
        };
        game.away = game.home === m.high ? m.low : m.high;
        Sim.quickSim(lg, game);
        m.games.push(game);
        if (game.score.home > game.score.away) {
          if (game.home === m.high) m.wins.high++; else m.wins.low++;
        } else {
          if (game.away === m.high) m.wins.high++; else m.wins.low++;
        }
      }
      m.winner = m.wins.high > m.wins.low ? m.high : m.low;
    });
    const advanced = League.advancePlayoffs(lg);
    App.save();
    UI.render();
    if (advanced) UI.toast(`${lg.year - 1} season complete! Welcome to ${lg.year}.`);
  },

  simAllPlayoffs() {
    const lg = App.state.league;
    while (lg.playoffs) App.simPlayoffRound();
    App.save();
    UI.render();
  },

  // ---- Draft ----
  userDraftPick(playerId) {
    const lg = App.state.league;
    if (!lg.draft) return;
    const d = lg.draft;
    const teamSel = document.getElementById("draft-team");
    const teamId = teamSel ? teamSel.value : d.pickOrder[d.currentOrder % d.pickOrder.length];
    const idx = d.prospects.findIndex(p => p.id === playerId);
    if (idx === -1) return;
    const chosen = d.prospects.splice(idx, 1)[0];
    chosen.teamId = teamId; chosen.contractYears = 4; chosen.salary = 720_000;
    lg.players.push(chosen);
    const pickNum = d.results.length + 1;
    d.results.push({ teamId, playerId, round: Math.ceil(pickNum / lg.teams.length), pick: pickNum });
    d.currentOrder++;
    if (d.currentOrder >= d.pickOrder.length * 5) d.completed = true;
    App.save();
    UI.render();
  },

  cpuDraftOne() {
    const lg = App.state.league;
    if (!lg.draft) return;
    const d = lg.draft;
    const teamId = d.pickOrder[d.currentOrder % d.pickOrder.length];
    const pick = League.cpuDraftPick(lg, teamId);
    if (pick) {
      d.currentOrder++;
      if (d.currentOrder >= d.pickOrder.length * 5) d.completed = true;
    }
    App.save();
    UI.render();
  },

  simDraftAll() {
    const lg = App.state.league;
    if (!lg.draft) return;
    while (lg.draft.currentOrder < lg.draft.pickOrder.length * 5 && lg.draft.prospects.length > 0) {
      const teamId = lg.draft.pickOrder[lg.draft.currentOrder % lg.draft.pickOrder.length];
      League.cpuDraftPick(lg, teamId);
      lg.draft.currentOrder++;
    }
    lg.draft.completed = true;
    App.save();
    UI.render();
  },

  finishDraft() {
    const lg = App.state.league;
    if (!lg.draft) return;
    // Remaining prospects become free agents
    lg.draft.prospects.forEach(p => { p.teamId = null; lg.freeAgents.push(p); });
    lg.draft.prospects = [];
    lg.draft = null;
    // CPU free agency: each team fills empty roster spots until size >= 26
    lg.teams.forEach(t => {
      const roster = League.rosterOf(lg, t.id);
      let needed = Math.max(0, 26 - roster.length);
      while (needed > 0 && lg.freeAgents.length > 0) {
        lg.freeAgents.sort((a, b) => b.overall - a.overall);
        const p = lg.freeAgents.shift();
        if (lg.settings.salaryCapOn) {
          const payroll = League.rosterOf(lg, t.id).reduce((s, x) => s + x.salary, 0);
          if (payroll + p.salary > lg.settings.salaryCap) { lg.freeAgents.push(p); needed--; continue; }
        }
        p.teamId = t.id; p.contractYears = U.irand(1, 4);
        lg.players.push(p);
        needed--;
      }
    });
    // Restart season
    League.startSeason(lg);
    App.save();
    UI.go("dashboard");
    UI.toast(`Welcome to ${lg.year} season!`);
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
