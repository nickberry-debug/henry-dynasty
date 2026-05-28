// UI rendering & view management
const UI = {
  view: "dashboard",
  state: null, // app state reference
  modal: { open: false },
  livePlayback: null, // {plays, idx, intervalId, fast}

  init(state) {
    this.state = state;
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => UI.go(btn.dataset.view));
    });
    document.getElementById("btn-sim-day").addEventListener("click", () => App.simDay());
    document.getElementById("btn-sim-week").addEventListener("click", () => App.simN(7));
    document.getElementById("btn-sim-month").addEventListener("click", () => App.simN(30));
    document.getElementById("modal-close").addEventListener("click", () => UI.closeModal());
    document.getElementById("game-close").addEventListener("click", () => UI.closeGame());
    document.getElementById("game-play").addEventListener("click", () => UI.togglePlayback());
    document.getElementById("game-fast").addEventListener("click", () => UI.fastForward());
    document.getElementById("game-finish").addEventListener("click", () => UI.finishGame());
  },

  go(view) {
    UI.view = view;
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    UI.render();
    window.scrollTo({ top: 0 });
  },

  refreshHeader() {
    const lg = this.state.league;
    const total = lg.schedule.length;
    const played = lg.schedule.filter(g => g.played).length;
    document.getElementById("season-indicator").textContent =
      `${lg.year} — ${lg.phase[0].toUpperCase() + lg.phase.slice(1)} — Day ${lg.day} — ${played}/${total} games`;
  },

  render() {
    UI.refreshHeader();
    const root = document.getElementById("view");
    const lg = this.state.league;
    if (!lg) { root.innerHTML = ""; return; }
    switch (UI.view) {
      case "dashboard": root.innerHTML = UI.renderDashboard(lg); break;
      case "teams": root.innerHTML = UI.renderTeams(lg); UI.wireTeams(); break;
      case "standings": root.innerHTML = UI.renderStandings(lg); UI.wireTeams(); break;
      case "schedule": root.innerHTML = UI.renderSchedule(lg); UI.wireSchedule(); break;
      case "leaders": root.innerHTML = UI.renderLeaders(lg); UI.wireLeaders(); break;
      case "freeagency": root.innerHTML = UI.renderFreeAgency(lg); UI.wireFA(); break;
      case "draft": root.innerHTML = UI.renderDraft(lg); UI.wireDraft(); break;
      case "playoffs": root.innerHTML = UI.renderPlayoffs(lg); UI.wirePlayoffs(); break;
      case "history": root.innerHTML = UI.renderHistory(lg); break;
      case "settings": root.innerHTML = UI.renderSettings(lg); UI.wireSettings(); break;
      default: root.innerHTML = UI.renderDashboard(lg);
    }
  },

  toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(UI._toastT);
    UI._toastT = setTimeout(() => t.classList.remove("show"), 2400);
  },

  openModal(title, body) {
    document.getElementById("modal-title").innerHTML = title;
    document.getElementById("modal-body").innerHTML = body;
    document.getElementById("modal").classList.remove("hidden");
    UI.modal.open = true;
  },
  closeModal() {
    document.getElementById("modal").classList.add("hidden");
    UI.modal.open = false;
  },

  // ===== Dashboard =====
  renderDashboard(lg) {
    const standings = League.standings(lg);
    const top5 = standings.slice(0, 5);
    const remaining = lg.schedule.filter(g => !g.played).length;
    const totalGames = lg.schedule.length;
    const pct = totalGames > 0 ? Math.round(((totalGames - remaining) / totalGames) * 100) : 0;
    const topHR = [...lg.players].sort((a, b) => b.seasonStats.hr - a.seasonStats.hr).slice(0, 5);
    const topAVG = lg.players.filter(p => p.seasonStats.ab >= 50).sort((a, b) => b.seasonStats.avg - a.seasonStats.avg).slice(0, 5);
    const topERA = lg.players.filter(p => p.isPitcher && p.seasonStats.ip >= 15).sort((a, b) => a.seasonStats.era - b.seasonStats.era).slice(0, 5);
    const recentGames = lg.schedule.filter(g => g.played).slice(-6).reverse();
    const news = lg.newsLog.slice(0, 8);

    const teamRow = (t, i) => {
      const winPct = (t.wins / Math.max(1, t.wins + t.losses)).toFixed(3).replace(/^0/, "");
      return `<tr class="clickable" data-team="${t.id}">
        <td>${i + 1}</td>
        <td>${UI.miniLogo(t)}<span style="margin-left:8px;font-weight:700">${t.abbreviation}</span> <span class="muted">${t.name}</span></td>
        <td class="num">${t.wins}</td><td class="num">${t.losses}</td>
        <td class="num">${winPct}</td>
        <td class="num">${t.runsScored - t.runsAllowed >= 0 ? '+' : ''}${t.runsScored - t.runsAllowed}</td>
      </tr>`;
    };

    return `
      <div class="grid cols-3" style="margin-bottom:18px">
        <div class="card">
          <h3>Season Progress</h3>
          <div class="kpi">${pct}%</div>
          <div class="muted" style="font-size:12px;margin-top:4px">${totalGames - remaining} of ${totalGames} games played</div>
          <div class="rating-bar" style="margin-top:8px"><div style="width:${pct}%"></div></div>
        </div>
        <div class="card">
          <h3>Current Year</h3>
          <div class="kpi">${lg.year}</div>
          <div class="muted" style="font-size:12px;margin-top:4px">Day ${lg.day} • Phase: ${lg.phase}</div>
          <div style="margin-top:8px"><span class="chip">${lg.teams.length} teams</span> <span class="chip">${lg.players.length} players</span> <span class="chip">${lg.freeAgents.length} free agents</span></div>
        </div>
        <div class="card">
          <h3>League Cap</h3>
          <div class="kpi">${U.fmtMoney(lg.settings.salaryCap)}</div>
          <div class="muted" style="font-size:12px;margin-top:4px">Salary cap ${lg.settings.salaryCapOn ? "<span class='badge green'>ON</span>" : "<span class='badge red'>OFF</span>"}</div>
        </div>
      </div>

      <div class="grid cols-2" style="margin-bottom:18px">
        <div class="card">
          <div class="section-title"><h2>Top of Standings</h2><div class="sub">click any team</div></div>
          <div class="scroll-wrap"><table class="tbl">
            <thead><tr><th>#</th><th>Team</th><th class="num">W</th><th class="num">L</th><th class="num">PCT</th><th class="num">RD</th></tr></thead>
            <tbody id="dash-standings">${top5.map(teamRow).join("")}</tbody>
          </table></div>
        </div>
        <div class="card">
          <div class="section-title"><h2>League News</h2><div class="sub">latest events</div></div>
          ${news.length === 0 ? '<div class="muted">No news yet — sim some days.</div>' :
            news.map(n => `<div style="padding:6px 0;border-bottom:1px dashed rgba(255,255,255,0.06);font-size:13px"><span class="muted" style="font-size:11px">${lg.year}</span> ${U.esc(n.msg)}</div>`).join("")}
        </div>
      </div>

      <div class="grid cols-3" style="margin-bottom:18px">
        <div class="card">
          <div class="section-title"><h2>HR Leaders</h2><div class="sub">${lg.year}</div></div>
          ${topHR.map(p => `<div class="flex between" style="padding:5px 0;font-size:13px"><span>${U.esc(p.name)} <span class="muted" style="font-size:11px">${UI.teamAbbr(lg, p.teamId)}</span></span><strong>${p.seasonStats.hr}</strong></div>`).join("")}
        </div>
        <div class="card">
          <div class="section-title"><h2>AVG Leaders</h2><div class="sub">min 50 AB</div></div>
          ${topAVG.map(p => `<div class="flex between" style="padding:5px 0;font-size:13px"><span>${U.esc(p.name)} <span class="muted" style="font-size:11px">${UI.teamAbbr(lg, p.teamId)}</span></span><strong>${U.fmtAvg(p.seasonStats.avg)}</strong></div>`).join("")}
        </div>
        <div class="card">
          <div class="section-title"><h2>ERA Leaders</h2><div class="sub">min 15 IP</div></div>
          ${topERA.map(p => `<div class="flex between" style="padding:5px 0;font-size:13px"><span>${U.esc(p.name)} <span class="muted" style="font-size:11px">${UI.teamAbbr(lg, p.teamId)}</span></span><strong>${U.fmtERA(p.seasonStats.era)}</strong></div>`).join("")}
        </div>
      </div>

      <div class="card">
        <div class="section-title"><h2>Recent Results</h2></div>
        ${recentGames.length === 0 ? '<div class="muted">No games played yet.</div>' :
          recentGames.map(g => UI.gameRow(lg, g)).join("")}
      </div>
    `;
  },

  miniLogo(team, size = 22) {
    return `<span class="mini-logo" style="display:inline-block;width:${size}px;height:${size}px;vertical-align:middle">${GEN.logoSVG(team, size)}</span>`;
  },

  teamAbbr(lg, teamId) {
    if (!teamId) return "FA";
    const t = League.getTeam(lg, teamId);
    return t ? t.abbreviation : "FA";
  },

  gameRow(lg, g, opts = {}) {
    const home = League.getTeam(lg, g.home);
    const away = League.getTeam(lg, g.away);
    if (!home || !away) return "";
    const score = g.score;
    const finishedCls = g.played ? "finished" : "";
    const homeWin = score && score.home > score.away;
    return `<div class="game-row ${finishedCls}" data-game="${g.id}">
      <div class="left"><strong>${away.abbreviation}</strong> <span class="muted">${U.esc(away.city)}</span></div>
      ${UI.miniLogo(away, 22)}
      <div class="center vs">
        ${g.played ? `<span class="score-tag">${score.away} – ${score.home}</span>` : `<span class="vs">at</span>`}
      </div>
      ${UI.miniLogo(home, 22)}
      <div class="right"><strong>${home.abbreviation}</strong> <span class="muted">${U.esc(home.city)}</span></div>
    </div>`;
  },

  // ===== Teams =====
  renderTeams(lg) {
    const cards = lg.teams.map(t => {
      const pct = (t.wins / Math.max(1, t.wins + t.losses)).toFixed(3).replace(/^0/, "");
      return `<div class="team-card" data-team="${t.id}">
        <div class="team-logo">${GEN.logoSVG(t, 64)}</div>
        <div class="team-meta">
          <div class="name">${U.esc(t.mascot)}</div>
          <div class="city">${U.esc(t.city)} • ${U.esc(t.abbreviation)}</div>
          <div class="rec"><strong>${t.wins}-${t.losses}</strong> · ${pct} · Est. ${t.established}</div>
        </div>
      </div>`;
    }).join("");
    return `
      <div class="section-title">
        <h2>League Teams (${lg.teams.length})</h2>
        <div class="sub">Click any team to manage roster & ratings</div>
      </div>
      <div class="grid cols-auto">${cards}</div>
    `;
  },

  wireTeams() {
    document.querySelectorAll(".team-card[data-team]").forEach(card => {
      card.addEventListener("click", () => UI.openTeam(card.dataset.team));
    });
    document.querySelectorAll("tr.clickable[data-team]").forEach(tr => {
      tr.addEventListener("click", () => UI.openTeam(tr.dataset.team));
    });
  },

  openTeam(teamId) {
    const lg = this.state.league;
    const t = League.getTeam(lg, teamId);
    if (!t) return;
    const roster = League.rosterOf(lg, teamId);
    const payroll = roster.reduce((s, p) => s + p.salary, 0);
    const overUnder = lg.settings.salaryCap - payroll;

    const hitters = roster.filter(p => !p.isPitcher).sort((a, b) => b.overall - a.overall);
    const pitchers = roster.filter(p => p.isPitcher).sort((a, b) => b.overall - a.overall);

    const rosterRows = (arr) => arr.map(p => {
      const injBadge = p.injury ? `<span class="badge red" style="margin-left:6px">${U.esc(p.injury.dlType)}</span>` : "";
      return `<div class="player-row" data-player="${p.id}">
        <div class="player-avatar">${GEN.avatarSVG({...p, team: t}, 36)}</div>
        <div>
          <div style="font-weight:700">${U.esc(p.name)} ${injBadge}</div>
          <div class="muted" style="font-size:11px">${p.position} • ${p.bats}/${p.throws} • Age ${p.age} • ${U.esc(p.trait)}</div>
        </div>
        <div class="num" style="color:${U.ratingColor(p.overall)};font-weight:800">${p.overall}</div>
        ${p.isPitcher
          ? `<div class="num col-extra">${U.fmtERA(p.seasonStats.era || 0)}</div>
             <div class="num col-extra">${p.seasonStats.w}-${p.seasonStats.l}</div>
             <div class="num col-extra">${p.seasonStats.k}K</div>`
          : `<div class="num col-extra">${U.fmtAvg(p.seasonStats.avg)}</div>
             <div class="num col-extra">${p.seasonStats.hr} HR</div>
             <div class="num col-extra">${p.seasonStats.rbi} RBI</div>`}
        <div class="num" style="font-size:11px;color:var(--text-dim)">${U.fmtMoney(p.salary)}</div>
      </div>`;
    }).join("");

    const teamRating = Math.round(U.avg(roster.map(p => p.overall)));
    const html = `
      <div class="player-detail-head">
        <div style="width:84px;height:84px">${GEN.logoSVG(t, 84)}</div>
        <div style="flex:1">
          <div class="name"><input id="edit-mascot" type="text" value="${U.esc(t.mascot)}" style="font-size:22px;font-weight:800;background:transparent;border:none;padding:0;color:var(--text);width:100%"/></div>
          <div class="meta"><input id="edit-city" type="text" value="${U.esc(t.city)}" style="background:transparent;border:none;color:var(--text-dim);padding:0;width:100%"/></div>
          <div class="meta" style="margin-top:4px">${t.wins}-${t.losses} • Est. ${t.established} • Avg OVR ${teamRating} • ${U.esc(t.conference)} Conf</div>
        </div>
        <div style="text-align:right">
          <div class="muted" style="font-size:11px;letter-spacing:1px">PAYROLL</div>
          <div style="font-size:20px;font-weight:800">${U.fmtMoney(payroll)}</div>
          <div class="muted" style="font-size:11px">Cap ${lg.settings.salaryCapOn ? U.fmtMoney(lg.settings.salaryCap) : "OFF"}</div>
          <div style="font-size:12px;color:${overUnder >= 0 ? 'var(--green)' : 'var(--red)'}">${overUnder >= 0 ? '+' : ''}${U.fmtMoney(overUnder)}</div>
        </div>
      </div>

      <div class="flex" style="margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <button id="t-regen-logo" class="btn small">Regenerate Logo</button>
        <button id="t-save" class="btn small primary">Save Team Edits</button>
        <button id="t-randomize" class="btn small">Randomize Name</button>
        <div class="spacer"></div>
      </div>

      <div class="card" style="margin-bottom:14px">
        <h3>Pitchers</h3>
        <div>${rosterRows(pitchers)}</div>
      </div>
      <div class="card">
        <h3>Position Players</h3>
        <div>${rosterRows(hitters)}</div>
      </div>
    `;
    UI.openModal(`${U.esc(t.city)} ${U.esc(t.mascot)}`, html);

    document.querySelectorAll("#modal-body .player-row[data-player]").forEach(r => {
      r.addEventListener("click", () => UI.openPlayer(r.dataset.player));
    });
    document.getElementById("t-regen-logo").addEventListener("click", () => {
      t.colors = GEN.teamColors();
      t.symbol = U.choice(DATA.logoSymbols);
      UI.openTeam(teamId);
      App.save();
    });
    document.getElementById("t-randomize").addEventListener("click", () => {
      const used = new Set(this.state.league.teams.map(x => x.name));
      used.delete(t.name);
      const { city, mascot } = GEN.teamName(used);
      t.city = city; t.mascot = mascot; t.name = `${city} ${mascot}`; t.abbreviation = GEN.abbr(city, mascot);
      UI.openTeam(teamId);
      App.save();
    });
    document.getElementById("t-save").addEventListener("click", () => {
      const city = document.getElementById("edit-city").value.trim() || t.city;
      const mascot = document.getElementById("edit-mascot").value.trim() || t.mascot;
      t.city = city; t.mascot = mascot; t.name = `${city} ${mascot}`;
      t.abbreviation = GEN.abbr(city, mascot);
      App.save();
      UI.toast("Team saved");
      UI.render();
      UI.openTeam(teamId);
    });
  },

  openPlayer(pid) {
    const lg = this.state.league;
    const p = League.getPlayer(lg, pid);
    if (!p) return;
    const t = p.teamId ? League.getTeam(lg, p.teamId) : null;
    const ratings = p.isPitcher
      ? ["velocity","control","movement","stamina","fastball","curveball","slider","changeup","fielding","arm","durability"]
      : ["contact","power","discipline","speed","fielding","arm","durability"];

    const ratingsHtml = `
      <div class="rating-grid">
        ${ratings.map(k => `
          <div class="label">${k}</div>
          <div class="rating-bar"><div style="width:${p.ratings[k]}%; background:${U.ratingColor(p.ratings[k])}"></div></div>
          <input class="editable" data-rating="${k}" type="number" min="20" max="99" value="${Math.round(p.ratings[k])}" />
        `).join("")}
      </div>`;

    const careerHtml = (() => {
      const stats = p.isPitcher ? p.careerStats.pitching : p.careerStats.hitting;
      if (!stats.length) return '<div class="muted">No career stats yet.</div>';
      if (p.isPitcher) {
        return `<div class="scroll-wrap"><table class="tbl">
          <thead><tr><th>YR</th><th>Age</th><th class="num">W</th><th class="num">L</th><th class="num">ERA</th><th class="num">IP</th><th class="num">K</th><th class="num">BB</th><th class="num">SV</th></tr></thead>
          <tbody>${stats.slice().reverse().map(s => `<tr><td>${s.year || ""}</td><td>${s.age}</td><td class="num">${s.w || 0}</td><td class="num">${s.l || 0}</td><td class="num">${U.fmtERA(s.era || 0)}</td><td class="num">${s.ip || 0}</td><td class="num">${s.k || 0}</td><td class="num">${s.bb || 0}</td><td class="num">${s.saves || s.sv || 0}</td></tr>`).join("")}</tbody>
        </table></div>`;
      }
      return `<div class="scroll-wrap"><table class="tbl">
        <thead><tr><th>YR</th><th>Age</th><th class="num">AB</th><th class="num">H</th><th class="num">HR</th><th class="num">RBI</th><th class="num">AVG</th><th class="num">OBP</th><th class="num">SLG</th><th class="num">SB</th></tr></thead>
        <tbody>${stats.slice().reverse().map(s => `<tr><td>${s.year || ""}</td><td>${s.age}</td><td class="num">${s.ab || 0}</td><td class="num">${s.h || 0}</td><td class="num">${s.hr || 0}</td><td class="num">${s.rbi || 0}</td><td class="num">${U.fmtAvg(s.avg || 0)}</td><td class="num">${U.fmtAvg(s.obp || 0)}</td><td class="num">${U.fmtAvg(s.slg || 0)}</td><td class="num">${s.sb || 0}</td></tr>`).join("")}</tbody>
      </table></div>`;
    })();

    const awards = (p.awards || []).slice().reverse().map(a => `<span class="chip"><span style="color:var(--gold)">★</span> ${a.year} ${a.type}</span>`).join(" ");

    const html = `
      <div class="player-detail-head">
        <div class="player-avatar" style="background:#1a2030">${GEN.avatarSVG({...p, team: t || {colors:["#222","#fff"], mascot:"--"}}, 84)}</div>
        <div style="flex:1">
          <div class="name"><input id="edit-pname" type="text" value="${U.esc(p.name)}" style="background:transparent;border:none;color:var(--text);padding:0;font-size:22px;font-weight:800;width:100%"/></div>
          <div class="meta">${p.position} • ${p.bats}/${p.throws} • Age ${p.age} • ${U.esc(p.trait)} • ${t ? `<span style="color:${t.colors[1]}">${U.esc(t.name)}</span>` : '<span class="badge">Free Agent</span>'}</div>
          <div class="meta">OVR <strong style="color:${U.ratingColor(p.overall)}">${p.overall}</strong> · POT <strong>${p.potential}</strong> · Salary ${U.fmtMoney(p.salary)} · Yrs Exp ${p.yearsExp}</div>
          ${p.injury ? `<div style="margin-top:6px"><span class="badge red">IL ${p.injury.dlType}</span> ${U.esc(p.injury.name)} (${p.injury.daysOut}d)</div>` : ''}
        </div>
      </div>

      ${awards ? `<div class="card tight" style="margin-bottom:14px"><strong style="font-size:12px;letter-spacing:1px;color:var(--text-dim)">CAREER AWARDS</strong><div style="margin-top:8px">${awards}</div></div>` : ''}

      <div class="card" style="margin-bottom:14px">
        <h3>Ratings (editable)</h3>
        ${ratingsHtml}
        <div class="flex" style="margin-top:10px"><button id="p-save" class="btn small primary">Save Player</button><div class="spacer"></div><button id="p-regen-avatar" class="btn small">New Portrait</button></div>
      </div>

      <div class="card">
        <h3>Career Stats</h3>
        ${careerHtml}
      </div>
    `;
    UI.openModal(U.esc(p.name), html);

    document.getElementById("p-save").addEventListener("click", () => {
      const newName = document.getElementById("edit-pname").value.trim();
      if (newName) p.name = newName;
      document.querySelectorAll("input[data-rating]").forEach(inp => {
        const k = inp.dataset.rating;
        p.ratings[k] = U.clamp(parseInt(inp.value, 10) || p.ratings[k], 20, 99);
      });
      p.overall = p.isPitcher
        ? Math.round((p.ratings.velocity + p.ratings.control + p.ratings.movement + p.ratings.stamina) / 4)
        : Math.round((p.ratings.contact * 1.1 + p.ratings.power + p.ratings.discipline + p.ratings.speed * 0.8 + p.ratings.fielding * 0.8) / 4.7);
      App.save();
      UI.toast("Player saved");
      UI.openPlayer(pid);
    });
    document.getElementById("p-regen-avatar").addEventListener("click", () => {
      p.id = U.uuid();
      UI.openPlayer(p.id);
    });
  },

  // ===== Standings =====
  renderStandings(lg) {
    const groups = ["American", "National"].map(conf => {
      const teams = lg.teams.filter(t => t.conference === conf);
      const sorted = teams.sort((a, b) => {
        const wa = a.wins / Math.max(1, a.wins + a.losses);
        const wb = b.wins / Math.max(1, b.wins + b.losses);
        return wb - wa || (b.runsScored - b.runsAllowed) - (a.runsScored - a.runsAllowed);
      });
      const leader = sorted[0];
      const rows = sorted.map((t, i) => {
        const pct = (t.wins / Math.max(1, t.wins + t.losses)).toFixed(3).replace(/^0/, "");
        const gb = leader ? ((leader.wins - t.wins) + (t.losses - leader.losses)) / 2 : 0;
        const playoffMark = i < (lg.settings.playoffTeamsPerConference || 4) ? '<span style="color:var(--accent)">●</span> ' : '';
        return `<tr class="clickable" data-team="${t.id}">
          <td>${playoffMark}${i + 1}</td>
          <td>${UI.miniLogo(t, 22)} <strong>${t.abbreviation}</strong> <span class="muted">${U.esc(t.name)}</span></td>
          <td class="num">${t.wins}</td><td class="num">${t.losses}</td>
          <td class="num">${pct}</td>
          <td class="num">${gb === 0 ? '—' : gb.toFixed(1)}</td>
          <td class="num">${t.runsScored}</td>
          <td class="num">${t.runsAllowed}</td>
          <td class="num">${t.runsScored - t.runsAllowed >= 0 ? '+' : ''}${t.runsScored - t.runsAllowed}</td>
        </tr>`;
      }).join("");
      return `<div class="card">
        <div class="section-title"><h2>${conf} Conference</h2><div class="sub">● = playoff spot</div></div>
        <div class="scroll-wrap"><table class="tbl">
          <thead><tr><th>#</th><th>Team</th><th class="num">W</th><th class="num">L</th><th class="num">PCT</th><th class="num">GB</th><th class="num">RS</th><th class="num">RA</th><th class="num">DIFF</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>`;
    }).join('<div style="height:14px"></div>');
    return groups;
  },

  // ===== Schedule =====
  renderSchedule(lg) {
    // Show upcoming 14 days + recent 4 days
    const cur = lg.day;
    const byDay = {};
    lg.schedule.forEach(g => { (byDay[g.day] = byDay[g.day] || []).push(g); });
    const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);
    const start = Math.max(0, cur - 4);
    const end = Math.min(days[days.length - 1], cur + 14);
    let html = `<div class="section-title"><h2>Schedule</h2><div class="sub">Day ${cur} of ${days[days.length - 1] || 0}</div></div>`;
    for (let d = start; d <= end; d++) {
      const games = byDay[d];
      if (!games || games.length === 0) continue;
      const isToday = d === cur;
      html += `<div class="day-block">
        <div class="day-head">Day ${d} — ${U.dateFromDay(lg.year, d)} ${isToday ? '<span class="badge gold">TODAY</span>' : ''}</div>
        ${games.map(g => UI.gameRow(lg, g)).join("")}
      </div>`;
    }
    return html;
  },

  wireSchedule() {
    document.querySelectorAll(".game-row[data-game]").forEach(row => {
      row.addEventListener("click", () => {
        const gid = row.dataset.game;
        const g = this.state.league.schedule.find(x => x.id === gid);
        if (!g) return;
        if (g.played) UI.showGameBox(g);
        else UI.playGameLive(g);
      });
    });
  },

  showGameBox(g) {
    const lg = this.state.league;
    const home = League.getTeam(lg, g.home);
    const away = League.getTeam(lg, g.away);
    const ls = g.linescore || { home: [], away: [], homeH: 0, awayH: 0 };
    let lsHtml = '<div class="linescore-row head"><div class="name-cell">TEAM</div>';
    for (let i = 0; i < 9; i++) lsHtml += `<div class="cell">${i + 1}</div>`;
    lsHtml += '<div class="cell">R</div><div class="cell">H</div><div class="cell">E</div></div>';
    const buildRow = (team, runsArr, totalR, totalH) => {
      let row = `<div class="linescore-row"><div class="name-cell">${team.abbreviation}</div>`;
      for (let i = 0; i < 9; i++) row += `<div class="cell">${runsArr[i] != null ? runsArr[i] : '–'}</div>`;
      row += `<div class="cell" style="color:var(--accent);font-weight:800">${totalR}</div><div class="cell">${totalH}</div><div class="cell">0</div></div>`;
      return row;
    };
    lsHtml += buildRow(away, ls.away, g.score.away, ls.awayH);
    lsHtml += buildRow(home, ls.home, g.score.home, ls.homeH);

    UI.openModal(`${away.name} ${g.score.away} — ${g.score.home} ${home.name}`, `
      <div class="game-scoreline" style="padding:8px 0 12px">
        <div class="score-team away"><div class="score-logo">${GEN.logoSVG(away, 56)}</div><div><div class="score-name">${away.abbreviation}</div><div class="muted" style="font-size:11px">${away.wins}-${away.losses}</div></div><div class="score-num">${g.score.away}</div></div>
        <div class="game-mid"><div class="inning">FINAL</div></div>
        <div class="score-team home"><div class="score-num">${g.score.home}</div><div><div class="score-name">${home.abbreviation}</div><div class="muted" style="font-size:11px">${home.wins}-${home.losses}</div></div><div class="score-logo">${GEN.logoSVG(home, 56)}</div></div>
      </div>
      <div class="game-linescore" style="padding:0">${lsHtml}</div>
    `);
  },

  playGameLive(game) {
    const lg = this.state.league;
    const home = League.getTeam(lg, game.home);
    const away = League.getTeam(lg, game.away);
    if (!home || !away) return;
    const result = Sim.liveSim(lg, game);

    document.getElementById("away-logo").innerHTML = GEN.logoSVG(away, 56);
    document.getElementById("home-logo").innerHTML = GEN.logoSVG(home, 56);
    document.getElementById("away-name").textContent = away.abbreviation;
    document.getElementById("home-name").textContent = home.abbreviation;
    document.getElementById("away-runs").textContent = "0";
    document.getElementById("home-runs").textContent = "0";
    document.getElementById("game-title").textContent = `${away.name} at ${home.name}`;
    document.getElementById("inning-label").textContent = "Top 1st";
    document.getElementById("count-label").textContent = "0 out";
    document.getElementById("play-feed").innerHTML = "";

    // Build linescore skeleton
    UI.renderLinescoreSkeleton(home, away);

    document.getElementById("game-overlay").classList.remove("hidden");
    UI.livePlayback = { plays: result.plays, idx: 0, fast: false, paused: false, result, game, home, away };
    UI.startPlayback();
    App.save();
  },

  renderLinescoreSkeleton(home, away) {
    const el = document.getElementById("linescore");
    let html = '<div class="linescore-row head"><div class="name-cell"></div>';
    for (let i = 1; i <= 9; i++) html += `<div class="cell">${i}</div>`;
    html += '<div class="cell">R</div><div class="cell">H</div><div class="cell">E</div></div>';
    const buildRow = (team, prefix) => {
      let row = `<div class="linescore-row" id="ls-${prefix}"><div class="name-cell">${team.abbreviation}</div>`;
      for (let i = 0; i < 9; i++) row += `<div class="cell" data-ls="${prefix}-${i}">–</div>`;
      row += `<div class="cell" data-ls="${prefix}-R">0</div><div class="cell" data-ls="${prefix}-H">0</div><div class="cell">0</div></div>`;
      return row;
    };
    html += buildRow(away, "a");
    html += buildRow(home, "h");
    el.innerHTML = html;
  },

  startPlayback() {
    const lp = UI.livePlayback;
    if (!lp) return;
    document.getElementById("game-play").textContent = "Pause";
    lp.paused = false;
    UI._tickPlayback();
  },

  _tickPlayback() {
    const lp = UI.livePlayback;
    if (!lp || lp.paused) return;
    if (lp.idx >= lp.plays.length) {
      // Done
      document.getElementById("inning-label").textContent = "FINAL";
      document.getElementById("count-label").textContent = "";
      const last = `<div class="feed-line end">FINAL: ${lp.away.abbreviation} ${lp.result.awayRuns} — ${lp.result.homeRuns} ${lp.home.abbreviation}</div>`;
      const feed = document.getElementById("play-feed");
      feed.innerHTML += last;
      feed.scrollTop = feed.scrollHeight;
      document.getElementById("game-play").textContent = "Done";
      return;
    }
    const play = lp.plays[lp.idx++];
    UI.applyPlayToUI(play);
    const interval = lp.fast ? 70 : 350;
    UI._playbackT = setTimeout(() => UI._tickPlayback(), interval);
  },

  applyPlayToUI(play) {
    const inn = play.inning;
    const top = play.top;
    document.getElementById("inning-label").textContent = `${top ? "Top" : "Bot"} ${inn}`;
    document.getElementById("count-label").textContent = `${play.outs} out${play.outs !== 1 ? "s" : ""}`;
    document.getElementById("away-runs").textContent = play.scoreAway;
    document.getElementById("home-runs").textContent = play.scoreHome;
    // Linescore
    if (play.kind === "end") {
      const prefix = top ? "a" : "h";
      const cell = document.querySelector(`[data-ls="${prefix}-${inn - 1}"]`);
      if (cell) cell.textContent = play.runs;
      document.querySelector(`[data-ls="a-R"]`).textContent = play.scoreAway;
      document.querySelector(`[data-ls="h-R"]`).textContent = play.scoreHome;
    }
    // Feed line
    const feed = document.getElementById("play-feed");
    const line = document.createElement("div");
    line.className = `feed-line ${play.kind || ""}`;
    line.textContent = play.text;
    feed.appendChild(line);
    feed.scrollTop = feed.scrollHeight;
  },

  togglePlayback() {
    const lp = UI.livePlayback;
    if (!lp) return;
    if (lp.idx >= lp.plays.length) { UI.closeGame(); return; }
    if (lp.paused) {
      lp.paused = false;
      document.getElementById("game-play").textContent = "Pause";
      UI._tickPlayback();
    } else {
      lp.paused = true;
      clearTimeout(UI._playbackT);
      document.getElementById("game-play").textContent = "Resume";
    }
  },

  fastForward() {
    const lp = UI.livePlayback;
    if (!lp) return;
    lp.fast = !lp.fast;
    document.getElementById("game-fast").textContent = lp.fast ? "Normal" : "Fast";
  },

  finishGame() {
    const lp = UI.livePlayback;
    if (!lp) return;
    clearTimeout(UI._playbackT);
    while (lp.idx < lp.plays.length) UI.applyPlayToUI(lp.plays[lp.idx++]);
    document.getElementById("inning-label").textContent = "FINAL";
    document.getElementById("count-label").textContent = "";
    document.getElementById("game-play").textContent = "Done";
  },

  closeGame() {
    clearTimeout(UI._playbackT);
    UI.livePlayback = null;
    document.getElementById("game-overlay").classList.add("hidden");
    UI.render();
  },

  // ===== Leaders =====
  renderLeaders(lg) {
    const minAB = Math.max(50, Math.floor(lg.day * 1.5));
    const minIP = Math.max(15, Math.floor(lg.day * 0.4));
    const hitters = lg.players.filter(p => !p.isPitcher && p.seasonStats.ab >= minAB);
    const pitchers = lg.players.filter(p => p.isPitcher && p.seasonStats.ip >= minIP);
    const cats = [
      { title: "Batting Avg", arr: hitters.slice().sort((a, b) => b.seasonStats.avg - a.seasonStats.avg), get: p => U.fmtAvg(p.seasonStats.avg) },
      { title: "Home Runs", arr: lg.players.slice().sort((a, b) => b.seasonStats.hr - a.seasonStats.hr), get: p => p.seasonStats.hr },
      { title: "RBI", arr: lg.players.slice().sort((a, b) => b.seasonStats.rbi - a.seasonStats.rbi), get: p => p.seasonStats.rbi },
      { title: "Runs", arr: lg.players.slice().sort((a, b) => b.seasonStats.r - a.seasonStats.r), get: p => p.seasonStats.r },
      { title: "Stolen Bases", arr: lg.players.slice().sort((a, b) => b.seasonStats.sb - a.seasonStats.sb), get: p => p.seasonStats.sb },
      { title: "OPS", arr: hitters.slice().sort((a, b) => (b.seasonStats.obp + b.seasonStats.slg) - (a.seasonStats.obp + a.seasonStats.slg)), get: p => U.fmtAvg(p.seasonStats.obp + p.seasonStats.slg) },
      { title: "ERA", arr: pitchers.slice().sort((a, b) => a.seasonStats.era - b.seasonStats.era), get: p => U.fmtERA(p.seasonStats.era) },
      { title: "Wins", arr: pitchers.slice().sort((a, b) => b.seasonStats.w - a.seasonStats.w), get: p => p.seasonStats.w },
      { title: "Strikeouts (P)", arr: pitchers.slice().sort((a, b) => b.seasonStats.k - a.seasonStats.k), get: p => p.seasonStats.k },
      { title: "Saves", arr: pitchers.slice().sort((a, b) => b.seasonStats.sv - a.seasonStats.sv), get: p => p.seasonStats.sv }
    ];
    const html = cats.map(c => `<div class="card">
      <h3>${c.title}</h3>
      ${c.arr.slice(0, 10).map((p, i) => `<div class="flex between" style="padding:5px 0;font-size:13px;border-bottom:1px dashed rgba(255,255,255,0.05);cursor:pointer" data-player="${p.id}">
        <span><strong style="color:var(--text-dim);margin-right:6px">${i + 1}</strong>${U.esc(p.name)} <span class="muted" style="font-size:11px">${UI.teamAbbr(lg, p.teamId)}</span></span>
        <strong>${c.get(p)}</strong>
      </div>`).join("")}
    </div>`).join("");
    return `<div class="section-title"><h2>League Leaders</h2><div class="sub">${lg.year} season — min ${minAB} AB / ${minIP} IP</div></div>
      <div class="grid cols-3">${html}</div>`;
  },

  wireLeaders() {
    document.querySelectorAll("#view [data-player]").forEach(el => {
      el.addEventListener("click", () => UI.openPlayer(el.dataset.player));
    });
  },

  // ===== Free Agency =====
  renderFreeAgency(lg) {
    const filtered = lg.freeAgents.slice().sort((a, b) => b.overall - a.overall).slice(0, 60);
    const rows = filtered.map(p => `
      <div class="player-row" data-player="${p.id}">
        <div class="player-avatar">${GEN.avatarSVG(p, 36)}</div>
        <div>
          <div style="font-weight:700">${U.esc(p.name)}</div>
          <div class="muted" style="font-size:11px">${p.position} • Age ${p.age} • OVR ${p.overall} • ${U.esc(p.trait)}</div>
        </div>
        <div class="num" style="color:${U.ratingColor(p.overall)};font-weight:800">${p.overall}</div>
        <div class="num col-extra">${p.yearsExp}y</div>
        <div class="num col-extra">${p.isPitcher ? `${p.ratings.velocity}V` : `${p.ratings.power}P`}</div>
        <div class="num col-extra">${p.isPitcher ? `${p.ratings.control}C` : `${p.ratings.contact}C`}</div>
        <div class="num" style="font-size:11px;color:var(--text-dim)">${U.fmtMoney(p.salary)}</div>
      </div>
    `).join("");
    const teamOptions = lg.teams.map(t => `<option value="${t.id}">${U.esc(t.name)}</option>`).join("");
    return `
      <div class="section-title">
        <h2>Free Agency</h2>
        <div class="sub">${lg.freeAgents.length} players available · Showing top 60</div>
      </div>
      <div class="card">
        <div class="flex between" style="margin-bottom:10px">
          <div class="muted">Click any player to sign or view details.</div>
          <div class="flex">
            <label class="field" style="margin:0">Signing Team <select id="fa-team">${teamOptions}</select></label>
            <label class="field" style="margin:0">Years <select id="fa-years"><option>1</option><option selected>3</option><option>5</option><option>7</option></select></label>
          </div>
        </div>
        <div>${rows || '<div class="muted">No free agents available.</div>'}</div>
      </div>`;
  },

  wireFA() {
    document.querySelectorAll(".player-row[data-player]").forEach(r => {
      r.addEventListener("click", () => {
        const pid = r.dataset.player;
        const tid = document.getElementById("fa-team").value;
        const years = parseInt(document.getElementById("fa-years").value, 10);
        const res = League.signFreeAgent(this.state.league, pid, tid, years);
        if (res === "cap") UI.toast("Salary cap exceeded! Disable cap or pick another team.");
        else if (res === true) { UI.toast("Signed!"); App.save(); UI.render(); }
        else UI.toast("Sign failed.");
      });
    });
  },

  // ===== Draft =====
  renderDraft(lg) {
    if (!lg.draft) return `<div class="section-title"><h2>Amateur Draft</h2></div><div class="card"><div class="muted">Draft will be available after the season ends.</div></div>`;
    const d = lg.draft;
    const totalPicks = lg.teams.length * 5;
    const remaining = totalPicks - d.results.length;
    const upcoming = d.pickOrder.slice(d.currentOrder % d.pickOrder.length, d.currentOrder % d.pickOrder.length + 5);
    const nextTeam = League.getTeam(lg, d.pickOrder[d.currentOrder % d.pickOrder.length]);
    const top = d.prospects.slice(0, 30);

    const teamOpts = lg.teams.map(t => `<option value="${t.id}"${nextTeam && t.id === nextTeam.id ? ' selected' : ''}>${U.esc(t.name)}</option>`).join("");

    const prospectCards = top.map((p, i) => `
      <div class="draft-card" data-player="${p.id}">
        <div class="pick">#${i + 1}</div>
        <div>
          <div style="font-weight:700">${U.esc(p.name)}</div>
          <div class="muted" style="font-size:11px">${p.position} • Age ${p.age} • POT ${p.potential}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:18px;font-weight:800;color:${U.ratingColor(p.overall)}">${p.overall}</div>
          <button class="btn small primary draft-pick" data-pick="${p.id}">Draft</button>
        </div>
      </div>
    `).join("");

    const resultsHtml = d.results.slice().reverse().slice(0, 20).map(r => {
      const t = League.getTeam(lg, r.teamId);
      const p = League.getPlayer(lg, r.playerId);
      if (!t || !p) return "";
      return `<div class="flex between" style="padding:6px 0;border-bottom:1px dashed rgba(255,255,255,0.05);font-size:13px">
        <span>#${r.pick} ${UI.miniLogo(t, 20)} <strong>${t.abbreviation}</strong></span>
        <span>${U.esc(p.name)} <span class="muted">${p.position} OVR ${p.overall}</span></span>
      </div>`;
    }).join("");

    return `
      <div class="section-title">
        <h2>Amateur Draft — ${d.year}</h2>
        <div class="sub">Pick ${d.results.length + 1} of ${totalPicks} · ${remaining} remaining</div>
      </div>
      <div class="grid cols-3" style="margin-bottom:14px">
        <div class="card">
          <h3>On The Clock</h3>
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
            ${nextTeam ? UI.miniLogo(nextTeam, 48) : ''}
            <div>
              <div style="font-weight:800">${nextTeam ? U.esc(nextTeam.name) : '—'}</div>
              <div class="muted" style="font-size:12px">Pick #${d.results.length + 1}</div>
            </div>
          </div>
          <div style="margin-top:10px">
            <label class="field">Drafting As <select id="draft-team">${teamOpts}</select></label>
            <button id="draft-cpu" class="btn small">Let CPU Auto-Pick</button>
            <button id="draft-sim" class="btn small">Sim Remaining</button>
            <button id="draft-finish" class="btn small primary" style="margin-top:6px">Finish Draft</button>
          </div>
        </div>
        <div class="card">
          <h3>Upcoming Picks</h3>
          ${upcoming.map((tid, i) => {
            const t = League.getTeam(lg, tid);
            return t ? `<div class="flex between" style="padding:4px 0;font-size:13px"><span>${UI.miniLogo(t, 18)} ${U.esc(t.abbreviation)}</span><span class="muted">#${d.results.length + 1 + i}</span></div>` : '';
          }).join("")}
        </div>
        <div class="card">
          <h3>Recent Picks</h3>
          ${resultsHtml || '<div class="muted">No picks yet.</div>'}
        </div>
      </div>

      <div class="card">
        <h3>Top Prospects</h3>
        <div class="grid cols-2">${prospectCards}</div>
      </div>
    `;
  },

  wireDraft() {
    document.querySelectorAll(".draft-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("draft-pick")) return;
        UI.openPlayer(card.dataset.player);
      });
    });
    document.querySelectorAll(".draft-pick").forEach(btn => {
      btn.addEventListener("click", () => {
        App.userDraftPick(btn.dataset.pick);
      });
    });
    const cpuBtn = document.getElementById("draft-cpu");
    if (cpuBtn) cpuBtn.addEventListener("click", () => App.cpuDraftOne());
    const simBtn = document.getElementById("draft-sim");
    if (simBtn) simBtn.addEventListener("click", () => App.simDraftAll());
    const finBtn = document.getElementById("draft-finish");
    if (finBtn) finBtn.addEventListener("click", () => App.finishDraft());
  },

  // ===== Playoffs =====
  renderPlayoffs(lg) {
    if (!lg.playoffs && lg.phase !== "playoffs") {
      const standings = League.standings(lg);
      const conf = (name) => standings.filter(t => t.conference === name);
      const perConf = lg.settings.playoffTeamsPerConference || 4;
      const a = conf("American").slice(0, perConf);
      const b = conf("National").slice(0, perConf);
      const renderSeeds = (teams) => teams.map((t, i) => `
        <div class="flex between" style="padding:6px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px;background:rgba(255,255,255,0.03)">
          <span>${UI.miniLogo(t, 20)} <strong>${t.abbreviation}</strong> ${U.esc(t.name)}</span>
          <select class="seed-edit" data-conf="${t.conference}" data-team="${t.id}" data-pos="${i}">
            ${[...Array(perConf)].map((_, j) => `<option value="${j}"${j === i ? ' selected' : ''}>Seed ${j + 1}</option>`).join("")}
          </select>
        </div>`).join("");
      return `
        <div class="section-title">
          <h2>Playoff Picture</h2>
          <div class="sub">${League.isRegularSeasonComplete(lg) ? "Regular season complete — start playoffs!" : "Regular season in progress"}</div>
        </div>
        <div class="grid cols-2">
          <div class="card"><h3>American Conference Seeds</h3>${renderSeeds(a)}</div>
          <div class="card"><h3>National Conference Seeds</h3>${renderSeeds(b)}</div>
        </div>
        <div class="card" style="margin-top:14px">
          <div class="flex between">
            <div>
              <div class="muted" style="font-size:12px">Teams per conference</div>
              <select id="po-perconf">${[2,4,6,8].map(n => `<option value="${n}"${n === perConf ? ' selected' : ''}>${n}</option>`).join("")}</select>
            </div>
            <button id="po-start" class="btn primary" ${League.isRegularSeasonComplete(lg) ? "" : "disabled"}>Start Playoffs</button>
          </div>
        </div>
      `;
    }
    // Render bracket
    const po = lg.playoffs;
    const renderMatch = (m) => {
      const ht = League.getTeam(lg, m.high);
      const lt = League.getTeam(lg, m.low);
      if (!ht || !lt) return "";
      const winHigh = m.winner === m.high;
      const winLow = m.winner === m.low;
      return `<div class="bracket-match">
        <div class="team ${winHigh ? 'win' : (m.winner ? 'lose' : '')}"><span><span class="seed">${ht.playoffSeed || ""}</span>${UI.miniLogo(ht, 18)} ${ht.abbreviation}</span><strong>${m.wins.high}</strong></div>
        <div class="team ${winLow ? 'win' : (m.winner ? 'lose' : '')}"><span><span class="seed">${lt.playoffSeed || ""}</span>${UI.miniLogo(lt, 18)} ${lt.abbreviation}</span><strong>${m.wins.low}</strong></div>
      </div>`;
    };
    const round0 = po.rounds[0];
    const round1 = po.rounds[1];
    const round2 = po.rounds[2];
    return `
      <div class="section-title"><h2>Playoffs — ${lg.year}</h2><div class="sub">${po.rounds[po.round].name}</div></div>
      <div class="card">
        <div class="flex" style="margin-bottom:10px">
          <button id="po-next" class="btn primary">Sim Next Round</button>
          <button id="po-sim-all" class="btn">Sim All</button>
          <div class="spacer"></div>
        </div>
        <div class="bracket">
          <div class="bracket-col">${[...round0.A, ...round0.B].map(renderMatch).join("")}</div>
          <div class="bracket-col">${[...(round1.A||[]), ...(round1.B||[])].map(renderMatch).join("")}</div>
          <div class="bracket-col">${(round2.A||[]).map(renderMatch).join("")}</div>
          <div class="bracket-col">${po.rounds[2].A?.[0]?.winner ? `<div class="bracket-match" style="background:linear-gradient(180deg,#ffd54a22,transparent);border-color:var(--gold)"><div class="team win"><span>🏆 ${League.getTeam(lg, po.rounds[2].A[0].winner)?.name}</span></div><div class="muted center" style="margin-top:6px">${lg.year} CHAMPIONS</div></div>` : '<div class="muted">TBD</div>'}</div>
        </div>
      </div>
    `;
  },

  wirePlayoffs() {
    const startBtn = document.getElementById("po-start");
    if (startBtn) startBtn.addEventListener("click", () => App.startPlayoffsCustom());
    const perConf = document.getElementById("po-perconf");
    if (perConf) perConf.addEventListener("change", (e) => {
      this.state.league.settings.playoffTeamsPerConference = parseInt(e.target.value, 10);
      UI.render();
    });
    const nextBtn = document.getElementById("po-next");
    if (nextBtn) nextBtn.addEventListener("click", () => App.simPlayoffRound());
    const allBtn = document.getElementById("po-sim-all");
    if (allBtn) allBtn.addEventListener("click", () => App.simAllPlayoffs());
  },

  // ===== History =====
  renderHistory(lg) {
    const recent = lg.history.slice(0, 30);
    const hofers = lg.retiredPlayers.filter(p => p.hof).slice(0, 30);
    return `
      <div class="section-title"><h2>League History</h2><div class="sub">${lg.history.length} years on record</div></div>
      <div class="grid cols-2">
        <div class="card">
          <h3>Recent Champions</h3>
          <div class="scroll-wrap"><table class="tbl">
            <thead><tr><th>Year</th><th>Champion</th><th>Runner-Up</th><th>MVP</th><th>Cy Young</th><th>HR Leader</th></tr></thead>
            <tbody>${recent.map(r => {
              const c = League.getTeam(lg, r.champion);
              const ru = League.getTeam(lg, r.runnerUp);
              return `<tr><td>${r.year}</td>
                <td>${c ? UI.miniLogo(c, 18) + ' ' + U.esc(c.name) : '—'}</td>
                <td>${ru ? UI.miniLogo(ru, 18) + ' ' + U.esc(ru.name) : '—'}</td>
                <td>${U.esc(r.mvp || '')}</td>
                <td>${U.esc(r.cy || '')}</td>
                <td>${r.hrLeader ? U.esc(r.hrLeader.name) + ' (' + r.hrLeader.hr + ')' : ''}</td>
              </tr>`;
            }).join("")}</tbody>
          </table></div>
        </div>
        <div class="card">
          <h3>Hall of Fame</h3>
          ${hofers.length ? hofers.map(p => `<div class="flex between" style="padding:6px 0;border-bottom:1px dashed rgba(255,255,255,0.06);font-size:13px"><span>${U.esc(p.name)} <span class="muted">${p.position}</span></span><strong>${(p.awards || []).length} awards</strong></div>`).join("") : '<div class="muted">No inductees yet.</div>'}
        </div>
      </div>
    `;
  },

  // ===== Settings =====
  renderSettings(lg) {
    return `
      <div class="section-title"><h2>Settings & Save</h2></div>
      <div class="grid cols-2">
        <div class="card">
          <h3>League Settings</h3>
          <label class="field">Games per season
            <input id="set-games" type="number" min="20" max="200" value="${lg.gamesPerSeason}" />
          </label>
          <label class="field">Salary cap ($)
            <input id="set-cap" type="number" min="50000000" max="600000000" step="1000000" value="${lg.settings.salaryCap}" />
          </label>
          <label class="toggle">
            <input id="set-capon" type="checkbox" ${lg.settings.salaryCapOn ? "checked" : ""}/>
            <span>Salary cap enforcement</span>
          </label>
          <label class="field" style="margin-top:14px">Playoff teams per conference
            <select id="set-poteams">
              ${[2,4,6,8].map(n => `<option value="${n}"${n === lg.settings.playoffTeamsPerConference ? ' selected' : ''}>${n}</option>`).join("")}
            </select>
          </label>
          <label class="field">Injury rate
            <select id="set-inj">
              ${[0.25, 0.5, 1.0, 1.5, 2.0].map(v => `<option value="${v}"${v === lg.settings.injuryRate ? ' selected' : ''}>${v}x</option>`).join("")}
            </select>
          </label>
          <button id="set-save" class="btn primary" style="margin-top:6px">Save Settings</button>
        </div>
        <div class="card">
          <h3>Save / Load</h3>
          <div class="muted" style="font-size:12px;margin-bottom:10px">All data is auto-saved to this browser's local storage.</div>
          <button id="save-export" class="btn">Export Save (JSON)</button>
          <button id="save-import" class="btn">Import Save (JSON)</button>
          <div class="divider"></div>
          <h3>League Reset</h3>
          <label class="field">Number of teams (new league)
            <input id="new-teams" type="number" min="4" max="32" value="30" />
          </label>
          <label class="field">Games per season
            <input id="new-games" type="number" min="20" max="200" value="162" />
          </label>
          <button id="new-league" class="btn danger">Start New League (wipes current save)</button>
        </div>
      </div>
    `;
  },

  wireSettings() {
    document.getElementById("set-save").addEventListener("click", () => {
      const lg = this.state.league;
      lg.gamesPerSeason = parseInt(document.getElementById("set-games").value, 10) || lg.gamesPerSeason;
      lg.settings.salaryCap = parseInt(document.getElementById("set-cap").value, 10);
      lg.settings.salaryCapOn = document.getElementById("set-capon").checked;
      lg.settings.playoffTeamsPerConference = parseInt(document.getElementById("set-poteams").value, 10);
      lg.settings.injuryRate = parseFloat(document.getElementById("set-inj").value);
      App.save();
      UI.toast("Settings saved");
    });
    document.getElementById("save-export").addEventListener("click", () => {
      const data = Storage.exportJSON(this.state);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `diamond-dynasty-${this.state.league.year}.json`; a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById("save-import").addEventListener("click", () => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = ".json,application/json";
      inp.onchange = () => {
        const file = inp.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = Storage.importJSON(e.target.result);
            this.state.league = data.league;
            App.save();
            UI.toast("Save loaded");
            UI.render();
          } catch (err) { UI.toast("Import failed"); }
        };
        reader.readAsText(file);
      };
      inp.click();
    });
    document.getElementById("new-league").addEventListener("click", () => {
      if (!confirm("Start new league? This will wipe the current save.")) return;
      const n = parseInt(document.getElementById("new-teams").value, 10) || 30;
      const g = parseInt(document.getElementById("new-games").value, 10) || 162;
      App.newLeague({ numTeams: U.clamp(n, 4, 32), gamesPerSeason: U.clamp(g, 20, 200) });
    });
  }
};
