from pathlib import Path
import csv

DOSSIER = Path(__file__).parent
AUDIO = DOSSIER / "wav"

print("=" * 50)
print("       ANALYSE DU DATASET BAOULE - ZENODO")
print("=" * 50)


def lire_tsv(nom):
    chemin = DOSSIER / nom

    with open(chemin, "r", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f, delimiter="\t"))


# =========================
# 1. TRANSCRIPTIONS
# =========================

transcriptions = lire_tsv("transcription.tsv")

print(f"\nNombre de transcriptions : {len(transcriptions)}")
print(f"Colonnes : {list(transcriptions[0].keys())}")

textes_vides = sum(
    1 for ligne in transcriptions
    if not ligne["bci"].strip()
)

print(f"Transcriptions vides : {textes_vides}")


# =========================
# 2. FICHIERS AUDIO
# =========================

fichiers_audio = [
    f for f in AUDIO.rglob("*")
    if f.is_file()
]

print(f"\nNombre de fichiers audio : {len(fichiers_audio)}")

# On récupère uniquement les noms sans extension
ids_audio = {
    f.stem
    for f in fichiers_audio
}


# =========================
# 3. COMPARAISON AUDIO / TRANSCRIPTIONS
# =========================

ids_transcriptions = {
    ligne["id"]
    for ligne in transcriptions
}

audio_manquants = ids_transcriptions - ids_audio
audio_sans_transcription = ids_audio - ids_transcriptions

print("\n--- CORRESPONDANCE AUDIO / TRANSCRIPTION ---")

print(
    f"Transcriptions avec audio : "
    f"{len(ids_transcriptions & ids_audio)}"
)

print(
    f"Transcriptions sans audio : "
    f"{len(audio_manquants)}"
)

print(
    f"Audios sans transcription : "
    f"{len(audio_sans_transcription)}"
)

if audio_manquants:
    print("\n❌ Audio(s) manquant(s) :")
    for identifiant in sorted(audio_manquants):
        print(" -", identifiant)

if audio_sans_transcription:
    print("\n⚠️ Audio(s) sans transcription :")
    for identifiant in sorted(audio_sans_transcription):
        print(" -", identifiant)


# =========================
# 4. DOUBLONS DE TRANSCRIPTIONS
# =========================

textes = [
    ligne["bci"].strip()
    for ligne in transcriptions
    if ligne["bci"].strip()
]

print("\n--- QUALITÉ DES TEXTES ---")

print(f"Phrases différentes : {len(set(textes))}")
print(f"Doublons : {len(textes) - len(set(textes))}")


# =========================
# 5. TRAIN / TEST
# =========================

train = lire_tsv("train.tsv")
test = lire_tsv("test.tsv")

print("\n" + "=" * 50)
print("       RÉPARTITION ZENODO")
print("=" * 50)

print(f"Train : {len(train)}")
print(f"Test  : {len(test)}")
print(f"Total : {len(train) + len(test)}")

print("\nAnalyse terminée.")
print("=" * 50)