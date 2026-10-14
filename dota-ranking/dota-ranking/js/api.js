import { BASE_URL, API_KEY, RANKED_LOBBY_TYPE, MATCH_LIMIT } from './config.js';

const MATCH_FIELDS = [
  'match_id', 'player_slot', 'radiant_win', 'start_time',
  'hero_id', 'kills', 'deaths', 'assists',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(path, params = {}, attempt = 0) {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
    else url.searchParams.set(key, value);
  }
  if (API_KEY) url.searchParams.set('api_key', API_KEY);

  let res;
  try {
    res = await fetch(url);
  } catch {
    if (attempt < 2) {
      await sleep(1000 * (attempt + 1));
      return get(path, params, attempt + 1);
    }
    throw new Error('Sem conexão com a API do OpenDota.');
  }

  if (res.status === 429 || res.status >= 500) {
    if (attempt < 3) {
      await sleep(2500 * (attempt + 1));
      return get(path, params, attempt + 1);
    }
    throw new Error(
      res.status === 429
        ? 'Limite de requisições atingido. Aguarde 1 minuto e atualize.'
        : `Erro ${res.status} na API do OpenDota.`
    );
  }
  if (!res.ok) throw new Error(`Erro ${res.status} na API do OpenDota.`);
  return res.json();
}

export const getProfile = (id) => get(`/players/${id}`);

export const getRankedWL = (id) =>
  get(`/players/${id}/wl`, { lobby_type: RANKED_LOBBY_TYPE });

export const getRankedMatches = (id) =>
  get(`/players/${id}/matches`, {
    lobby_type: RANKED_LOBBY_TYPE,
    limit: MATCH_LIMIT,
    project: MATCH_FIELDS,
  });

export const getRankedHeroes = (id) =>
  get(`/players/${id}/heroes`, { lobby_type: RANKED_LOBBY_TYPE });

export async function getHeroNames() {
  const list = await get('/heroes');
  return Object.fromEntries(list.map((h) => [h.id, h.localized_name]));
}
