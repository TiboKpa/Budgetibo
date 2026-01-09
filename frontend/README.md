# Budgetibo

## Démarrage rapide

### Backend
```bash
cd backend
npm install
npm run dev
# API: http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# UI: http://localhost:5173
```

## Notes
- SQLite est stocké dans `backend/database/budgetibo.db`.
- Les sous-catégories sont libres et mémorisées via `subcategories` (autocomplete).
- Bouton **Copier fixes**: duplique revenus/dépenses fixes depuis un mois source.
- Bouton **Clôturer**: saisie de l'épargne réelle et verrouillage logique du mois.
