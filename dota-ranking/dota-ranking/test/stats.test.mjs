import test from 'node:test';
import assert from 'node:assert/strict';
import { isWin, lastN, currentStreak, medal, compareRank, highlights, buildPlayer, topHeroes } from '../js/stats.js';

// Jogador no Radiant (slot 3) ou Dire (slot 131)
const m = (t, slot, radiantWin) => ({ match_id: t, start_time: t, player_slot: slot, radiant_win: radiantWin });

test('isWin: Radiant e Dire', () => {
  assert.equal(isWin(m(1, 3, true)), true);
  assert.equal(isWin(m(1, 3, false)), false);
  assert.equal(isWin(m(1, 131, false)), true);
  assert.equal(isWin(m(1, 131, true)), false);
});

test('lastN: pega as 5 mais recentes em ordem cronológica, mesmo se a API vier desordenada', () => {
  const ms = [m(3, 3, true), m(7, 3, false), m(1, 3, true), m(5, 3, true), m(2, 3, false), m(6, 3, true), m(4, 3, false)];
  const r = lastN(ms, 5);
  assert.deepEqual(r.map((x) => x.matchId), [3, 4, 5, 6, 7]);
  assert.deepEqual(r.map((x) => x.win), [true, false, true, true, false]);
});

test('currentStreak: vitórias e derrotas seguidas', () => {
  assert.deepEqual(currentStreak([m(3, 3, true), m(2, 3, true), m(1, 3, false)]), { type: 'W', count: 2, capped: false });
  assert.deepEqual(currentStreak([m(3, 3, false), m(2, 3, true)]), { type: 'L', count: 1, capped: false });
  assert.deepEqual(currentStreak([]), { type: null, count: 0, capped: false });
});

test('currentStreak: marca "capped" quando a sequência ocupa todo o limite', () => {
  const ms = Array.from({ length: 4 }, (_, i) => m(i + 1, 3, true));
  assert.equal(currentStreak(ms, 4).capped, true);
  assert.equal(currentStreak(ms, 10).capped, false);
});

test('partidas sem dados são ignoradas', () => {
  assert.equal(lastN([{ match_id: 1, start_time: 1 }], 5).length, 0);
});

test('medal', () => {
  assert.equal(medal(53).label, 'Lenda 3');
  assert.equal(medal(80, 120).label, 'Imortal #120');
  assert.equal(medal(null), null);
});

test('compareRank: medalha e estrelas, imortal por leaderboard, sem medalha por último', () => {
  const lenda3 = { rankTier: 53, win: 10 };
  const lenda4 = { rankTier: 54, win: 5 };
  const divino1 = { rankTier: 71, win: 1 };
  const imortalA = { rankTier: 80, leaderboardRank: 50, win: 1 };
  const imortalB = { rankTier: 80, leaderboardRank: 900, win: 99 };
  const semMedalha = { rankTier: null, win: 500 };
  const lenda3Mais = { rankTier: 53, win: 30 };
  const ordenado = [semMedalha, lenda3, imortalB, lenda4, divino1, imortalA, lenda3Mais].sort(compareRank);
  assert.deepEqual(ordenado, [imortalA, imortalB, divino1, lenda4, lenda3Mais, lenda3, semMedalha]);
});

test('highlights: empates listam todos e streak de derrota não conta', () => {
  const p = (id, win, total, type, count) => ({ id, win, total, streak: { type, count } });
  const h = highlights([p(1, 100, 200, 'W', 4), p(2, 100, 150, 'L', 9), p(3, 90, 300, 'W', 4)]);
  assert.deepEqual(h.mostWins.players.map((x) => x.id), [1, 2]);
  assert.deepEqual(h.bestStreak.players.map((x) => x.id), [1, 3]);
  assert.equal(h.bestStreak.value, 4);
});

test('buildPlayer: perfil privado usa apelido e não quebra', () => {
  const p = buildPlayer({ id: 1, apelido: 'x', obs: 'Conta boostada.' }, {}, { win: 0, lose: 0 }, []);
  assert.equal(p.name, 'x');
  assert.equal(p.obs, 'Conta boostada.');
  assert.equal(p.total, 0);
  assert.equal(p.winRate, null);
  assert.equal(p.medal, null);
});

test('topHeroes: 3 mais jogados, com winrate; empate em jogos decide por vitórias', () => {
  const stats = [
    { hero_id: 1, games: 2, win: 2 },
    { hero_id: 2, games: 40, win: 20 },
    { hero_id: '3', games: 25, win: 10 }, // hero_id como string
    { hero_id: 4, games: 25, win: 15 },
    { hero_id: 5, games: 0, win: 0 },
    { hero_id: 6, games: 3, win: 0 },
  ];
  const r = topHeroes(stats);
  assert.deepEqual(r.map((h) => h.heroId), [2, 4, 3]);
  assert.equal(r[0].games, 40);
  assert.equal(r[0].winRate, 0.5);
  assert.equal(r[1].winRate, 0.6);
  assert.deepEqual(topHeroes([{ hero_id: 1, games: 1, win: 1 }]).map((h) => h.heroId), [1]);
  assert.deepEqual(topHeroes(undefined), []);
});
