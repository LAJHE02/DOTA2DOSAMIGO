function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child);
  }
  return node;
}

const fmtDate = (unix) => new Date(unix * 1000).toLocaleDateString('pt-BR');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function setStatus(text) {
  document.getElementById('status').textContent = text;
}

export function setUpdated(savedAt) {
  const node = document.getElementById('updated');
  node.textContent = savedAt
    ? `Atualizado às ${new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : '';
}

export function setBusy(busy) {
  const btn = document.getElementById('refresh');
  btn.disabled = busy;
  btn.textContent = busy ? 'Carregando…' : 'Atualizar';
}

export function renderSkeleton(count) {
  const board = document.getElementById('board');
  board.replaceChildren(
    ...Array.from({ length: count }, () => el('li', { class: 'row skeleton', 'aria-hidden': 'true' }))
  );
  document.getElementById('highlights').replaceChildren();
}

function names(players) {
  return players.map((p) => p.name).join(', ');
}

export function renderHighlights(h) {
  const items = [
    { label: 'Melhor taxa de vitória', group: h.bestWinRate, unit: (n) => `${(n * 100).toFixed(1)}% de vitórias` },
    { label: 'Maior sequência de vitórias', group: h.bestStreak, unit: (n) => plural(n, 'seguida', 'seguidas') },
  ];
  const nodes = items.map(({ label, group, unit }) =>
    el(
      'div',
      { class: 'hl' },
      el('p', { class: 'hl-label', text: label }),
      group.players.length
        ? el('p', { class: 'hl-name', text: names(group.players) })
        : el('p', { class: 'hl-name muted', text: 'Ninguém no momento' }),
      group.players.length ? el('p', { class: 'hl-value', text: unit(group.value) }) : null
    )
  );
  document.getElementById('highlights').replaceChildren(...nodes);
}

function lastFiveCell(p, heroes) {
  const wrap = el('div', { class: 'cell c-last', 'data-label': 'Últimas 5' });
  const tiles = el('div', { class: 'tiles' });
  for (let i = 0; i < 5 - p.last5.length; i += 1) {
    tiles.append(el('span', { class: 'tile empty', 'aria-hidden': 'true' }));
  }
  for (const m of p.last5) {
    const hero = heroes[m.heroId] || 'Herói desconhecido';
    const result = m.win ? 'Vitória' : 'Derrota';
    const info = `${result} com ${hero}, ${m.kills}/${m.deaths}/${m.assists}, ${fmtDate(m.startTime)}`;
    tiles.append(
      el('a', {
        class: `tile ${m.win ? 'win' : 'loss'}`,
        href: `https://www.opendota.com/matches/${m.matchId}`,
        target: '_blank',
        rel: 'noopener noreferrer',
        title: info,
        'aria-label': info,
        text: m.win ? 'V' : 'D',
      })
    );
  }
  wrap.append(tiles);
  return wrap;
}

function heroesCell(p, heroes) {
  const wrap = el('div', { class: 'cell c-heroes', 'data-label': 'Heróis mais jogados' });
  if (p.topHeroes.length === 0) {
    wrap.append(el('span', { class: 'muted', text: 'Nenhuma partida ranqueada por herói' }));
    return wrap;
  }
  const list = el('ul', { class: 'heroes' });
  for (const h of p.topHeroes) {
    const pct = Math.round(h.winRate * 100);
    list.append(
      el(
        'li',
        { class: 'hero' },
        el('span', { class: 'hero-name', text: heroes[h.heroId] || `Herói ${h.heroId}` }),
        el(
          'span',
          { class: 'hero-stat' },
          el('b', { text: plural(h.games, 'partida', 'partidas') }),
          ` com ${pct}% de vitórias (${h.win}V ${h.games - h.win}D)`
        )
      )
    );
  }
  wrap.append(list);
  return wrap;
}

function streakCell(p) {
  const s = p.streak;
  const wrap = el('div', { class: 'cell c-streak', 'data-label': 'Sequência' });
  if (!s.type) {
    wrap.append(el('span', { class: 'muted', text: '—' }));
    return wrap;
  }
  const win = s.type === 'W';
  const count = `${s.count}${s.capped ? '+' : ''}`;
  const title = win
    ? `${count} ${s.count === 1 ? 'vitória seguida' : 'vitórias seguidas'}`
    : `${count} ${s.count === 1 ? 'derrota seguida' : 'derrotas seguidas'}`;
  wrap.append(el('span', { class: `streak ${win ? 'win' : 'loss'}`, title, 'aria-label': title, text: `${count}${win ? 'V' : 'D'}` }));
  return wrap;
}

function playerCell(p) {
  const name = el('a', {
    class: 'name',
    href: `https://www.opendota.com/players/${p.id}`,
    target: '_blank',
    rel: 'noopener noreferrer',
    text: p.name,
  });
  const text = el('div', { class: 'who' }, name);
  if (p.obs) text.append(el('p', { class: 'obs', text: `Obs.: ${p.obs}` }));
  const avatar = p.avatar
    ? el('img', { class: 'avatar', src: p.avatar, alt: '', width: '44', height: '44', loading: 'lazy', referrerpolicy: 'no-referrer' })
    : el('span', { class: 'avatar empty', 'aria-hidden': 'true' });
  return el('div', { class: 'cell c-player' }, avatar, text);
}

function medalCell(p) {
  const wrap = el('div', { class: 'cell c-medal', 'data-label': 'Medalha' });
  if (p.medal) {
    wrap.append(el('span', { class: 'medal-name', text: p.medal.label }));
  } else {
    wrap.append(el('span', { class: 'muted', text: 'Sem medalha' }));
  }
  return wrap;
}

function recordCell(p) {
  const wrap = el('div', { class: 'cell c-record', 'data-label': 'Vitórias e derrotas' });
  if (p.total === 0) {
    wrap.append(el('span', { class: 'muted', text: 'Sem partidas ranqueadas' }));
    return wrap;
  }
  const pct = Math.round(p.winRate * 100);
  wrap.append(
    el(
      'p',
      { class: 'record' },
      el('span', { class: 'w', text: `${p.win}V` }),
      ' ',
      el('span', { class: 'l', text: `${p.lose}D` }),
      el('span', { class: 'pct', text: ` ${pct}%` })
    ),
    el(
      'div',
      { class: 'bar', role: 'img', 'aria-label': `${pct}% de vitórias` },
      el('span', { style: `width:${pct}%` })
    )
  );
  return wrap;
}

function errorRow(p, pos) {
  return el(
    'li',
    { class: 'row failed' },
    el('div', { class: 'cell c-pos', text: String(pos) }),
    el('div', { class: 'cell c-player' }, el('div', { class: 'who' }, el('span', { class: 'name', text: p.name }), el('p', { class: 'obs', text: p.error }))),
  );
}

export function renderBoard(players, heroes) {
  const rows = players.map((p, i) => {
    const pos = i + 1;
    if (p.error) return errorRow(p, pos);
    return el(
      'li',
      { class: `row${pos === 1 ? ' first' : ''}` },
      el('div', { class: 'cell c-pos', text: String(pos) }),
      playerCell(p),
      medalCell(p),
      recordCell(p),
      el('div', { class: 'cell c-total', 'data-label': 'Partidas', text: p.total ? String(p.total) : '—' }),
      lastFiveCell(p, heroes),
      streakCell(p),
      heroesCell(p, heroes)
    );
  });
  document.getElementById('board').replaceChildren(...rows);
}
