# IA Chok Chokan

Studio de clips IA de Chok Chokan — tout tourne dans le navigateur, sans serveur.

1. **Écoute du son** : Whisper large v3 (Groq, gratuit) note chaque mot avec son temps exact.
2. **Paroles calées sur la voix** : tu corriges un mot si besoin, les temps sont gardés.
3. **Vidéo paroles** (gratuit) : clip vertical style street, chaque mot claque pile sur la voix, rendu dans le téléphone (MP4 ou WebM).
4. **Scénario du clip** plan par plan (Groq Llama 3.3 70B, secours Gemini), avec prompts image et vidéo.
5. **Facultatif (fal.ai, payant)** : image de chaque plan avec ton visage (Nano Banana 2) et animation (Seedance 2.0) ; elles passent ensuite en fond de la vidéo paroles.

## Clés (dans ⚙️ Réglages, gardées seulement sur l'appareil)

| Clé | Où | Prix |
|---|---|---|
| Groq (obligatoire) | console.groq.com → API Keys | gratuite |
| Gemini (secours) | aistudio.google.com → Get API key | gratuite |
| fal.ai (images/vidéos) | fal.ai → Keys | payante à l'usage |

## En ligne

GitHub Pages : Settings → Pages → Branch `main`, dossier `/docs`.

Local : `node server.js` (Node 20+, aucune dépendance).
