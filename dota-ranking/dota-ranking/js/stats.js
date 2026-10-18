import { MATCH_LIMIT, TOP_HEROES, MIN_GAMES_WINRATE } from './config.js';

const MEDALS = ['Arauto', 'Guardião', 'Cruzado', 'Arconte', 'Lenda', 'Ancião', 'Divino', 'Imortal'];

/** Slots 0-127 são Radiant, 128-255 são Dire. */
export function isWin(match) {
  return (match.player_slot < 128) === match.radiant_win;
}

/** Descarta partidas sem dados suficientes e ordena da mais recente para a mais antiga. */
export function cleanMatches(matches) {
  return (matches || [])
    .filter((m) => typeof m.radiant_win === 'boolean' && Number.isInteger(m.player_slot))
    .sort((a, b) => b.start_time - a.start_time);
}

/** Últimas N partidas, em ordem cronológica (a mais recente fica por último). */
export function lastN(matches, n = 5) {
  return cleanMatches(matches)
    .slice(0, n)
    .map((m) => ({
      matchId: m.match_id,
      win: isWin(m),
      heroId: m.hero_id,
      kills: m.kills,
      deaths: m.deaths,
      assists: m.assists,
      startTime: m.start_time,
    }))
    .reverse();
}

/** Sequência atual: quantas partidas seguidas com o mesmo resultado da mais recente. */
export function currentStreak(matches, limit = Infinity) {
  const sorted = cleanMatches(matches);
  if (sorted.length === 0) return { type: null, count: 0, capped: false };
  const firstIsWin = isWin(sorted[0]);
  let count = 0;
  for (const m of sorted) {
    if (isWin(m) !== firstIsWin) break;
    count += 1;
  }
  return {
    type: firstIsWin ? 'W' : 'L',
    count,
    capped: count === sorted.length && sorted.length >= limit,
  };
}

/** rank_tier: dezena = medalha (1-8), unidade = estrelas. */
export function medal(rankTier, leaderboardRank) {
  if (!rankTier) return null;
  const tier = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const name = MEDALS[tier - 1];
  if (!name) return null;
  if (tier === 8) {
    return { tier, stars: 0, label: leaderboardRank ? `Imortal #${leaderboardRank}` : 'Imortal' };
  }
  return { tier, stars, label: stars ? `${name} ${stars}` : name };
}

/**
 * Heróis mais jogados (por número de partidas ranqueadas), com o winrate de cada um.
 * Empate em jogos: mais vitórias primeiro.
 */
export function topHeroes(heroStats, n = TOP_HEROES) {
  return (heroStats || [])
    .map((h) => ({
      heroId: Number(h.hero_id),
      games: h.games || 0,
      win: h.win || 0,
    }))
    .filter((h) => h.games > 0)
    .map((h) => ({ ...h, winRate: h.win / h.games }))
    .sort((a, b) => b.games - a.games || b.win - a.win || a.heroId - b.heroId)
    .slice(0, n);
}

/**
 * Ordena pela medalha atual (rank_tier: medalha + estrelas).
 * Empate: imortais pela posição no leaderboard (menor é melhor), depois mais vitórias.
 * Quem não tem medalha fica por último.
 */
export function compareRank(a, b) {
  const at = a.rankTier || 0;
  const bt = b.rankTier || 0;
  if (at !== bt) return bt - at;
  const al = a.leaderboardRank || Infinity;
  const bl = b.leaderboardRank || Infinity;
  if (al !== bl) return al - bl;
  return b.win - a.win;
}

function leaders(players, score) {
  let best = 0;
  let list = [];
  for (const p of players) {
    const s = score(p);
    if (s > best) {
      best = s;
      list = [p];
    } else if (s === best && s > 0) {
      list.push(p);
    }
  }
  return { value: best, players: list };
}

export function highlights(players) {
  const ok = players.filter((p) => !p.error);
  return {
    bestWinRate: leaders(ok, (p) => (p.total >= MIN_GAMES_WINRATE ? p.winRate : 0)),
    mostMatches: leaders(ok, (p) => p.total),
    bestStreak: leaders(ok, (p) => (p.streak.type === 'W' ? p.streak.count : 0)),
  };
}

export function buildPlayer(friend, profile, wl, matches, heroStats) {
  const win = wl?.win ?? 0;
  const lose = wl?.lose ?? 0;
  const total = win + lose;
  const rankTier = profile?.rank_tier || null;
  const leaderboardRank = profile?.leaderboard_rank || null;
  return {
    id: friend.id,
    name: profile?.profile?.personaname || friend.apelido,
    avatar: profile?.profile?.avatarfull || '',
    obs: friend.obs || null,
    rankTier,
    leaderboardRank,
    medal: medal(rankTier, leaderboardRank),
    win,
    lose,
    total,
    winRate: total ? win / total : null,
    topHeroes: topHeroes(heroStats),
    last5: lastN(matches, 5),
    streak: currentStreak(matches, MATCH_LIMIT),
  };
}
