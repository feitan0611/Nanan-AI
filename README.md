# Nanan AI

Assistant vocal en baoulé et dioula.

- [`api/`](api/README.md) : API FastAPI (version mock pour l'instant)

## Organisation des branches

- `main` : branche principale, version stable du projet.
  **Personne ne pousse directement sur `main`.** Seul le responsable du dépôt y fusionne le code, après relecture.
- Chaque membre travaille sur **sa propre branche**, créée depuis `main`, et pousse uniquement dessus.

```
main  ──●──────────●──────────●──   ← seul le responsable fusionne ici
         \        ↑          ↑
          ●──●──● (PR validée) |
           \                  |
            ●──●──●──●────────  (PR validée)
```

## Workflow

### 1. Première fois : récupérer le projet

```bash
git clone https://github.com/feitan0611/Nanan-AI.git
cd Nanan-AI
git checkout -b <ma-branche>
git push -u origin <ma-branche>
```

### 2. Travailler au quotidien (sur sa branche)

```bash
git add .
git commit -m "Description de ce que j'ai fait"
git push
```

Pousser au minimum à la fin de chaque séance de travail.

### 3. Proposer son travail : ouvrir une Pull Request (PR)

Sur GitHub : **Pull requests → New pull request**, avec :

- **base : `main`**
- **compare : `<ma-branche>`**

Le responsable relit la PR :
- si c'est correct, il la fusionne (**Merge pull request**) ;
- sinon, il laisse un commentaire et le membre corrige sur sa branche (`git push` met la PR à jour automatiquement).

**Les membres ne fusionnent jamais eux-mêmes.**

### 4. Récupérer le travail des autres (après chaque fusion dans `main`)

```bash
git checkout main
git pull
git checkout <ma-branche>
git merge main
```

À faire régulièrement pour éviter les conflits.

## Règles

1. Ne jamais pousser sur `main`.
2. Commiter souvent, avec des messages clairs.
3. Mettre sa branche à jour avec `main` après chaque fusion.
4. En cas de conflit, prévenir le responsable si besoin.
