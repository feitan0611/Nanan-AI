"""Fausses implémentations des modèles (ASR, traduction, LLM, TTS).

À remplacer par les vrais modèles à l'étape 9 du rétroplanning.
Chaque fonction garde la même signature que celle attendue de la version réelle.
"""

import io
import math
import struct
import wave

from app.schemas import Language

SAMPLE_RATE = 16_000

_SAMPLE_TEXTS = {
    Language.fr: "Bonjour, quel temps fait-il à Abidjan aujourd'hui ?",
    Language.bci: "[mock baoulé] Akwaba, ɔ yo sɛ ?",
    Language.dyu: "[mock dioula] I ni ce, i ka kɛnɛ wa ?",
}


def transcribe(audio: bytes, language: Language) -> str:
    """ASR : renvoie un texte fixe dans la langue demandée."""
    return _SAMPLE_TEXTS[language]


def translate(text: str, source: Language, target: Language) -> str:
    """Traduction : préfixe le texte avec la paire de langues."""
    if source == target:
        return text
    return f"[mock {source.value}->{target.value}] {text}"


def chat(message: str, history: list) -> str:
    """LLM : réponse fixe qui reprend le message reçu."""
    return f"Réponse simulée de Nanan AI à : « {message} »"


def synthesize(text: str, language: Language) -> bytes:
    """TTS : génère un bip WAV (16 kHz, mono) d'une durée liée à la longueur du texte."""
    duration = min(0.5 + len(text) * 0.02, 3.0)
    n_samples = int(SAMPLE_RATE * duration)
    frames = b"".join(
        struct.pack("<h", int(8000 * math.sin(2 * math.pi * 440 * i / SAMPLE_RATE)))
        for i in range(n_samples)
    )
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(frames)
    return buffer.getvalue()
