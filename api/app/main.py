"""Point d'entrée de l'API Nanan AI.

Lancement : uvicorn app.main:app --reload  (depuis le dossier api/)
Documentation interactive : http://127.0.0.1:8000/docs
"""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import assistant, speech, text
from app.schemas import HealthResponse, Language, LanguageInfo

VERSION = "0.1.0"

app = FastAPI(
    title="Nanan AI",
    description="Assistant vocal en baoulé et dioula. **Version mock** : les réponses sont simulées.",
    version=VERSION,
)

# Le frontend tourne sur un autre port en développement.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api/v1")


@api.get("/health", response_model=HealthResponse, tags=["Système"])
def health():
    return HealthResponse(status="ok", version=VERSION, mock=True)


@api.get("/languages", response_model=list[LanguageInfo], tags=["Système"])
def languages():
    return [
        LanguageInfo(code=Language.fr, name="Français"),
        LanguageInfo(code=Language.bci, name="Baoulé"),
        LanguageInfo(code=Language.dyu, name="Dioula"),
    ]


api.include_router(speech.router)
api.include_router(text.router)
api.include_router(assistant.router)
app.include_router(api)
