"""Endpoints audio : reconnaissance vocale (ASR) et synthèse vocale (TTS)."""

import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app import mocks
from app.schemas import Language, SpeechRequest, TranscriptionResponse

router = APIRouter(tags=["Audio"])


@router.post("/asr", response_model=TranscriptionResponse, summary="Audio -> texte")
async def speech_to_text(
    audio: UploadFile = File(description="Fichier audio (wav, webm, mp3...)"),
    language: Language = Form(),
):
    start = time.perf_counter()
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="Le fichier audio est vide.")
    text = mocks.transcribe(content, language)
    return TranscriptionResponse(
        text=text,
        language=language,
        confidence=0.9,
        duration_ms=int((time.perf_counter() - start) * 1000),
    )


@router.post(
    "/tts",
    summary="Texte -> audio",
    response_class=Response,
    responses={200: {"content": {"audio/wav": {}}}},
)
def text_to_speech(request: SpeechRequest):
    audio = mocks.synthesize(request.text, request.language)
    return Response(content=audio, media_type="audio/wav")
