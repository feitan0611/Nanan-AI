"""Endpoints texte : traduction et conversation avec le LLM."""

from fastapi import APIRouter

from app import mocks
from app.schemas import ChatRequest, ChatResponse, TranslationRequest, TranslationResponse

router = APIRouter(tags=["Texte"])


@router.post("/translate", response_model=TranslationResponse, summary="Traduction")
def translate(request: TranslationRequest):
    text = mocks.translate(request.text, request.source, request.target)
    return TranslationResponse(text=text, source=request.source, target=request.target)


@router.post("/chat", response_model=ChatResponse, summary="Question au LLM (en français)")
def chat(request: ChatRequest):
    return ChatResponse(reply=mocks.chat(request.message, request.history))
