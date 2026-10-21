import base64

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
AUDIO = ("question.wav", b"RIFF-fake-audio", "audio/wav")


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["mock"] is True


def test_languages():
    codes = [lang["code"] for lang in client.get("/api/v1/languages").json()]
    assert codes == ["fr", "bci", "dyu"]


def test_asr():
    response = client.post("/api/v1/asr", files={"audio": AUDIO}, data={"language": "bci"})
    assert response.status_code == 200
    assert response.json()["language"] == "bci"


def test_asr_empty_audio():
    response = client.post(
        "/api/v1/asr", files={"audio": ("vide.wav", b"", "audio/wav")}, data={"language": "bci"}
    )
    assert response.status_code == 400


def test_asr_unknown_language():
    response = client.post("/api/v1/asr", files={"audio": AUDIO}, data={"language": "en"})
    assert response.status_code == 422


def test_translate():
    response = client.post(
        "/api/v1/translate", json={"text": "Bonjour", "source": "fr", "target": "dyu"}
    )
    assert response.status_code == 200
    assert "Bonjour" in response.json()["text"]


def test_chat():
    response = client.post("/api/v1/chat", json={"message": "Quelle heure est-il ?"})
    assert response.status_code == 200
    assert response.json()["reply"]


def test_tts_returns_wav():
    response = client.post("/api/v1/tts", json={"text": "Akwaba", "language": "bci"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert response.content[:4] == b"RIFF"


def test_assistant():
    response = client.post("/api/v1/assistant", files={"audio": AUDIO}, data={"language": "dyu"})
    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "dyu"
    assert base64.b64decode(body["audio_base64"])[:4] == b"RIFF"
