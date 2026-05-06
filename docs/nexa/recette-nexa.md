# Recette Nexa

## Objectif

Valider le parcours MVP Nexa: question, absence de réponse fiable, ticket, affectation, réponse référent, validation demandeur, enrichissement de la base de connaissance et réutilisation.

## Préconditions

- Application publiée sous `/newNexus`.
- Compte de test disponible: `yannick / GroupeLaure`.
- Profil informatique pour administrer les référents, règles et connaissances.
- Nexa doit rester 100 % interne: le front appelle uniquement le backend Nexus.

## Scénarios à tester

1. Ouvrir Nexa depuis le bouton flottant.
2. Poser une question sans connaissance existante.
3. Vérifier que Nexa indique une réponse insuffisamment fiable et propose un ticket.
4. Créer le ticket avec module, catégorie, priorité, commentaire et pièce jointe facultative.
5. Ouvrir `Administration > Nexa`, sélectionner le ticket et contrôler l'affectation automatique.
6. Ajouter ou modifier l'affectation référent.
7. Saisir une réponse référent et la transmettre.
8. Valider la réponse côté demandeur.
9. Contrôler la création automatique d'une connaissance validée.
10. Reposer une question similaire et vérifier que Nexa répond depuis la base de connaissance.
11. Utiliser les boutons `Utile` et `À corriger` depuis les bulles et la base de connaissance.
12. Modifier une connaissance, vérifier la nouvelle version, puis archiver si nécessaire.
13. Contrôler les KPI Nexa: tickets, à traiter, connaissances, résolution auto, retours négatifs, index local.
14. Vérifier `Administration > Nexa > Paramètres IA locale`: seuils, indexation et statut moteur local.

## Points de sécurité

- Un utilisateur ne doit voir que les tickets dont il est demandeur, référent, responsable ou administrateur.
- Une connaissance non validée ou archivée ne doit pas alimenter les réponses utilisateurs non habilités.
- Les pièces jointes doivent être téléchargées uniquement via l'API backend avec contrôle de droit.
- L'API Ollama ne doit jamais être appelée directement par le navigateur.

## Résultat attendu

- Réponse automatique uniquement depuis une connaissance validée.
- Ticket créé lorsque la réponse n'est pas fiable.
- Base de connaissance enrichie uniquement après validation.
- Historique et audit minimum visibles dans la fiche ticket.
- Administration Nexa utilisable sans modification de code.
