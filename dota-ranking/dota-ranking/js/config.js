// Configurações do app.
export const BASE_URL = 'https://api.opendota.com/api';

// lobby_type 7 = partida ranqueada (confirme em GET /constants/lobby_type).
export const RANKED_LOBBY_TYPE = 7;

// Quantas partidas ranqueadas buscar por jogador (usadas nas últimas 5 e na sequência).
export const MATCH_LIMIT = 100;

// Para disputar "melhor taxa de vitória", o jogador precisa ter ao menos N partidas ranqueadas.
export const MIN_GAMES_WINRATE = 20;

// Quantos heróis mais jogados mostrar por jogador.
export const TOP_HEROES = 3;

// Quantos amigos carregar ao mesmo tempo (cada amigo faz 3 chamadas).
export const CONCURRENCY = 3;

// Tempo de validade do cache local.
export const CACHE_TTL_MS = 10 * 60 * 1000;
export const HEROES_TTL_MS = 24 * 60 * 60 * 1000;

// Chave opcional do OpenDota (aumenta o limite de requisições).
// Atenção: em um site público a chave fica visível para qualquer pessoa.
export const API_KEY = '';
