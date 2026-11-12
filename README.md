# IA Chok Chokan

Studio de clips IA de Chok Chokan.

**V1 — du son au scénario** : tu envoies ta musique, tes photos et tes idées ; l'appli transcrit les paroles (Whisper large v3, en français, guidé par tes paroles), te laisse corriger chaque ligne, puis écrit le scénario du clip plan par plan, calé sur les paroles, avec les prompts image et vidéo.

Tout passe par ton FreeLLMAPI (`/v1/audio/transcriptions` et `/v1/chat/completions`). La clé unifiée est collée dans ⚙️ Réglages et reste dans le navigateur (ou en variable `FREELLMAPI_KEY` côté serveur).

## Réglages (variables d'environnement, toutes facultatives)

| Variable | Défaut |
|---|---|
| `FREELLMAPI_URL` | `https://freellmapi.prixbasmalin.prod.page/v1` |
| `FREELLMAPI_KEY` | vide (clé saisie dans l'appli) |
| `STT_MODEL` | `whisper-large-v3` |
| `CHAT_MODEL` | `auto` |

## Lancer

```
node server.js
```

Aucune dépendance (Node 20+).

## Prochaines étapes

1. Images de chaque plan avec le visage de l'artiste
2. Animation vidéo de chaque plan
3. Synchro des lèvres sur les plans « performance »
4. Montage automatique calé sur le beat
