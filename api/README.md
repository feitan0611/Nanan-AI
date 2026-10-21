# API Nanan AI (version mock)

API FastAPI de l'assistant vocal en baoulé et dioula.
**Toutes les réponses sont simulées** (`app/mocks.py`). Les vrais modèles les remplaceront à l'étape 9 du rétroplanning, sans changer les endpoints.

## Lancer l'API

```bash
cd api
python -m venv .venv
.venv\Scripts\activate        # Windows (macOS/Linux : source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Documentation interactive : http://127.0.0.1:8000/docs
- Tests : `pytest`

## Endpoints (`/api/v1`)

Langues : `fr` (français), `bci` (baoulé), `dyu` (dioula).

| Méthode | Route         | Entrée                                        | Sortie                                       |
|---------|---------------|-----------------------------------------------|----------------------------------------------|
| GET     | `/health`     | —                                             | `{status, version, mock}`                    |
| GET     | `/languages`  | —                                             | liste `{code, name}`                         |
| POST    | `/asr`        | formulaire : `audio` (fichier), `language`    | `{text, language, confidence, duration_ms}`  |
| POST    | `/translate`  | JSON : `{text, source, target}`               | `{text, source, target}`                     |
| POST    | `/chat`       | JSON : `{message, history?}`                  | `{reply}`                                    |
| POST    | `/tts`        | JSON : `{text, language}`                     | fichier `audio/wav`                          |
| POST    | `/assistant`  | formulaire : `audio` (fichier), `language`    | transcription, traductions, réponse, `audio_base64` (WAV) |

`/assistant` enchaîne tout le pipeline : audio → texte → français → LLM → langue locale → audio. C'est l'endpoint à utiliser depuis le frontend.

### Exemple frontend (JavaScript)

```js
const form = new FormData();
form.append("audio", blobDuMicro, "question.webm");
form.append("language", "bci");

const res = await fetch("http://127.0.0.1:8000/api/v1/assistant", { method: "POST", body: form });
const data = await res.json();
new Audio(`data:audio/wav;base64,${data.audio_base64}`).play();
```

## Structure

```
api/
├── app/
│   ├── main.py          # création de l'app, CORS, /health, /languages
│   ├── schemas.py       # modèles de requêtes / réponses
│   ├── mocks.py         # faux ASR, traduction, LLM, TTS (à remplacer)
│   └── routers/
│       ├── speech.py    # /asr, /tts
│       ├── text.py      # /translate, /chat
│       └── assistant.py # /assistant (pipeline complet)
└── tests/test_api.py
```
