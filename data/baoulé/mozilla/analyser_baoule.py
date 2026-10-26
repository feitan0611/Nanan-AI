from pathlib import Path
import csv

DOSSIER = Path(__file__).parent

print("=" * 45)
print("       ANALYSE DU DATASET BAOULE")
print("=" * 45)

def lire_tsv(nom_fichier):
    chemin = DOSSIER / nom_fichier

    if not chemin.exists():
        print(f"\n❌ Fichier introuvable : {nom_fichier}")
        return []

    with open(chemin, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


# =========================
# 1. DONNÉES VALIDÉES
# =========================

data = lire_tsv("validated.tsv")

print(f"\nNombre total de lignes : {len(data)}")

if data:
    # Locuteurs
    locuteurs = set(
        ligne["client_id"]
        for ligne in data
        if ligne.get("client_id")
    )

    # Transcriptions vides
    textes_vides = sum(
        1 for ligne in data
        if not ligne.get("sentence", "").strip()
    )

    # Votes
    up_votes = sum(
        int(ligne.get("up_votes", 0) or 0)
        for ligne in data
    )

    down_votes = sum(
        int(ligne.get("down_votes", 0) or 0)
        for ligne in data
    )

    print(f"Nombre de locuteurs : {len(locuteurs)}")
    print(f"Transcriptions vides : {textes_vides}")
    print(f"Total up_votes : {up_votes}")
    print(f"Total down_votes : {down_votes}")

    # Vérification des fichiers audio
    clips = DOSSIER / "clips"

    audios_trouves = 0
    audios_manquants = 0

    for ligne in data:
        chemin_audio = clips / ligne["path"]

        if chemin_audio.exists():
            audios_trouves += 1
        else:
            audios_manquants += 1

    print(f"Audios trouvés : {audios_trouves}")
    print(f"Audios manquants : {audios_manquants}")

print("\n" + "=" * 45)
print("       RÉPARTITION FOURNIE PAR COMMON VOICE")
print("=" * 45)

# =========================
# 2. TRAIN / DEV / TEST
# =========================

for nom in ["train.tsv", "dev.tsv", "test.tsv"]:
    data_split = lire_tsv(nom)
    print(f"{nom:<12} : {len(data_split)} lignes")

print("\n" + "=" * 45)
print("Analyse terminée.")
print("=" * 45)

print("\n" + "=" * 45)
print("     VÉRIFICATION DES SPLITS")
print("=" * 45)

def chemins_et_locuteurs(data):
    chemins = set()
    locuteurs = set()

    for ligne in data:
        if ligne.get("path"):
            chemins.add(ligne["path"])
        if ligne.get("client_id"):
            locuteurs.add(ligne["client_id"])

    return chemins, locuteurs


validated_paths, validated_locuteurs = chemins_et_locuteurs(data)

splits = {}

for nom in ["train.tsv", "dev.tsv", "test.tsv"]:
    split_data = lire_tsv(nom)
    chemins, locuteurs = chemins_et_locuteurs(split_data)
    splits[nom] = chemins

    print(f"\n{nom}")
    print(f"  Exemples : {len(split_data)}")
    print(f"  Locuteurs : {len(locuteurs)}")
    print(f"  Présents dans validated : {len(chemins & validated_paths)}")
    print(f"  Non présents dans validated : {len(chemins - validated_paths)}")

# Vérification des chevauchements
print("\n--- Chevauchements entre les splits ---")

print(
    "Train ∩ Dev :",
    len(splits["train.tsv"] & splits["dev.tsv"])
)

print(
    "Train ∩ Test :",
    len(splits["train.tsv"] & splits["test.tsv"])
)

print(
    "Dev ∩ Test :",
    len(splits["dev.tsv"] & splits["test.tsv"])
)