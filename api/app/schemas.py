"""Schémas de requêtes et de réponses de l'API Nanan AI."""

from enum import Enum

from pydantic import BaseModel, Field


class Language(str, Enum):
    """Langues prises en charge (codes ISO 639)."""

    fr = "fr"  # français
    bci = "bci"  # baoulé
    dyu = "dyu"  # dioula


class LanguageInfo(BaseModel):
    code: Language
    name: str


class HealthResponse(BaseModel):
    status: str
    version: str
    mock: bool


class TranscriptionResponse(BaseModel):
    text: str
    language: Language
    confidence: float = Field(ge=0, le=1)
    duration_ms: int


class TranslationRequest(BaseModel):
    text: str = Field(min_length=1)
    source: Language
    target: Language


class TranslationResponse(BaseModel):
    text: str
    source: Language
    target: Language


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1)
    language: Language


class AssistantResponse(BaseModel):
    """Résultat complet : audio -> texte -> français -> LLM -> langue locale -> audio."""

    transcription: str
    transcription_fr: str
    reply_fr: str
    reply: str
    language: Language
    audio_base64: str = Field(description="Réponse vocale, WAV encodé en base64")
