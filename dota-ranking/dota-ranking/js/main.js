import { FRIENDS } from './friends.js';
import { CONCURRENCY, CACHE_TTL_MS, HEROES_TTL_MS } from './config.js';
import { getProfile, getRankedWL, getRankedMatches, getRankedHeroes, getHeroNames } from './api.js';
import { readCache, writeCache } from './cache.js';
import { buildPlayer, compareRank, highlights } from './stats.js';
import { renderBoard, renderHighlights, renderSkeleton, setStatus, setUpdated, setBusy } from './ui.js';

async function runPool(items, size, fn) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
}

async function loadHeroes(force) {
  if (!force) {
    const hit = readCache('heroes', HEROES_TTL_MS);
    if (hit) return hit.value;
  }
  try {
    const heroes = await getHeroNames();
    writeCache('heroes', heroes);
    return heroes;
  } catch {
    return readCache('heroes', Infinity)?.value || {}; // sem nomes de herói, o resto funciona
  }
}

async function loadPlayer(friend, force) {
  const key = `player:${friend.id}`;
  if (!force) {
    const hit = readCache(key, CACHE_TTL_MS);
    if (hit) return { player: hit.value, savedAt: hit.savedAt };
  }
  try {
    const [profile, wl, matches, heroStats] = await Promise.all([
      getProfile(friend.id),
      getRankedWL(friend.id),
      getRankedMatches(friend.id),
      getRankedHeroes(friend.id),
    ]);
    const player = buildPlayer(friend, profile, wl, matches, heroStats);
    return { player, savedAt: writeCache(key, player) };
  } catch (err) {
    return {
      player: { id: friend.id, name: friend.apelido, error: err.message || 'Não foi possível carregar.' },
      savedAt: null,
    };
  }
}

let loading = false;

async function load(force = false) {
  if (loading) return;
  loading = true;
  setBusy(true);
  renderSkeleton(FRIENDS.length);
  setStatus(`Carregando 0 de ${FRIENDS.length}…`);

  const results = [];
  const heroesPromise = loadHeroes(force);
  await runPool(FRIENDS, CONCURRENCY, async (friend) => {
    results.push(await loadPlayer(friend, force));
    setStatus(`Carregando ${results.length} de ${FRIENDS.length}…`);
  });
  const heroes = await heroesPromise;

  const players = results.map((r) => r.player);
  const ok = players.filter((p) => !p.error).sort(compareRank);
  const failed = players.filter((p) => p.error);

  renderHighlights(highlights(ok));
  renderBoard([...ok, ...failed], heroes);

  const times = results.map((r) => r.savedAt).filter(Boolean);
  setUpdated(times.length ? Math.min(...times) : null);
  setStatus(failed.length ? `${plural(failed.length)} não carregou. Clique em Atualizar para tentar de novo.` : '');
  setBusy(false);
  loading = false;
}

function plural(n) {
  return n === 1 ? '1 jogador' : `${n} jogadores`;
}

document.getElementById('refresh').addEventListener('click', () => load(true));
load(false);
