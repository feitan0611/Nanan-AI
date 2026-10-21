"""Endpoint de bout en bout utilisé par le frontend."""

import base64

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app import mocks
from app.schemas import AssistantResponse, Language

router = APIRouter(tags=["Assistant"])


@router.post(
    "/assistant",
    response_model=AssistantResponse,
    summary="Audio en langue locale -> réponse texte + audio",
)
async def assistant(
    audio: UploadFile = File(description="Question enregistrée au micro"),
    language: Language = Form(),
):
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="Le fichier audio est vide.")

    transcription = mocks.transcribe(content, language)
    transcription_fr = mocks.translate(transcription, language, Language.fr)
    reply_fr = mocks.chat(transcription_fr, [])
    reply = mocks.translate(reply_fr, Language.fr, language)
    audio_reply = mocks.synthesize(reply, language)

    return AssistantResponse(
        transcription=transcription,
        transcription_fr=transcription_fr,
        reply_fr=reply_fr,
        reply=reply,
        language=language,
        audio_base64=base64.b64encode(audio_reply).decode("ascii"),
    )
