# KALYVO

## Organisation des branches

- `main` : version stable / production. On ne pousse jamais directement dessus.
- `develop` : branche d'intégration. Les fonctionnalités terminées y sont fusionnées.
- `feature/<nom>` : une branche par fonctionnalité, créée depuis `develop`.
- `fix/<nom>` : corrections de bugs, créées depuis `develop`.

## Workflow

```bash
git checkout develop
git pull
git checkout -b feature/ma-fonctionnalite
# ... travail + commits ...
git push -u origin feature/ma-fonctionnalite
```

Puis ouvrir une Pull Request vers `develop`.
