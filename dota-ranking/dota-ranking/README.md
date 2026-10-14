# Ranking da galera no Dota

Webapp em JavaScript puro (ES modules) que usa a API do OpenDota para mostrar, só com partidas ranqueadas:
ranking pela medalha atual, últimas 5 partidas (V/D), heróis mais jogados, mais vitórias, mais partidas e maior sequência de vitórias.

## Como rodar

Módulos ES não funcionam abrindo o arquivo direto (file://). Use um servidor local:

    python3 -m http.server 8000     # depois abra http://localhost:8000
    # ou: npx serve

## Testes (lógica de cálculo)

    node --test test/stats.test.mjs

## Heróis mais jogados

Os 3 heróis com mais partidas ranqueadas de cada jogador, com a quantidade de partidas e o winrate de cada um.
Empate em partidas: quem tem mais vitórias vem primeiro. Ajuste a quantidade em `TOP_HEROES` (`js/config.js`).

## Onde mexer

- `js/friends.js`: lista de amigos (Steam32 account_id) e observações (ex.: conta boostada).
- `js/config.js`: tipo de lobby ranqueado (7), quantidade de partidas, cache e chave opcional da API.
- `js/stats.js`: regras de vitória, sequência, medalha e destaques.

## Observações

- Cada amigo precisa ter "Expor dados públicos de partidas" ativado no Dota.
- A ordem usa a medalha atual (`rank_tier`). Empate: imortais pela posição no leaderboard, depois mais vitórias ranqueadas.
- Os dados ficam em cache por 10 minutos; o botão "Atualizar" ignora o cache.
- Sequência acima de 100 aparece como "100+".
