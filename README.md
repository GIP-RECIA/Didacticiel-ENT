# didacticiel-ent

Ce projet permet de gérer le didacticiel (sous forme de tour) de présentation de l'ENT. Il se base sur le package [driver.js](https://github.com/kamranahmedse/driver.js).

## Configuration

La configuration requise est la suivante :

```
<script
  id="didacticiel-ent"
  type = "module"
  src="path/to/script"
  configUri="/path/to/config/didacticiel-configuration.json"
  getUserTourUri="/path/to/get/user/tour/uri"
  setUserTourUri="/path/to/set/user/tour/uri"
  askEachTime
></script>
```

configUri correspond à une URL où est stockée une configuration plus approfondie au format json.

getUserTourUri est l'url des prefs qui permet de savoir si l'utilisateur a déjà terminé le tour, afin de ne pas lui le reproposer à son arrivée.

setUserTourUri est l'url des prefs qui permet d'inscrire le fait que l'utilisateur a refusé ou terminé le tour.

askEachTime doit être présent s'il faut reproposer aux utilisateurs qui n'ont pas fini le tour à chaque ouverture de l'ENT. A éviter dans cette version, sinon le didacticiel est proposé à chaque ouverture de la page.

**L'id est necessaire et ne doit pas être modifié. Un seul didacticiel peut être présent à la fois dans une même page.**

### Configuration json

```json
{
  "pretourConfig": {
    "showProgress": false,
    "showButtons": ["next", "previous"],
    "prevBtnText": "Non merci",
    "doneBtnText": "Commencer",
    "animate": false
  },
```

Les seules options à changer dans cette partie de la configuration sont le texte des boutons. Un premier faux tour est utilisé en guise de modale pour demander à l'utilisateur s'il souhaite réaliser le tour de découverte, d'où la nomenclature "prev" et "done".

```json
  "pretourStepConfig":{
    "title": "Une minute pour découvrir l'ENT",
    "description": "Votre ENT regorge de possibilités ! Grâce à..."
  },
```

Le titre et la description peuvent être modifiés.

```json
  "tourConfig": {
    "showProgress": true,
    "showButtons": ["next", "previous"],
    "progressText": "{{current}} sur {{total}}",
    "nextBtnText": "Suivant",
    "prevBtnText": "Précédent",
    "doneBtnText": "Terminer",
    "allowClose": true,
    "animate": false
  },
```

La configuration globale du vrai tour.

```json
  "stepsConfig": [
    {
      "title": "Recherche",
      "description": "Cette barre vous permet de rechercher parmi les services de l'ENT.",
      "element": ".search-field",
      "showButtons": ["next"],
      "side": "bottom",
      "sideMobile": "bottom",
      "align": "center",
      "alignMobile": "center",
      "clickOnNextCssSelector": ".drawer-toggle"
    },
    {
      "title": "MédiaCentre",
      "description": "Ce service vous propose...",
      "element": "#nav-mediacentre",
      "side": "right",
      "sideMobile": "bottom",
      "align": "start",
      "alignMobile": "start",
      "clickOnPrevCssSelector": ".drawer-toggle"
    }
  ]
}
```

element doit être un selecteur CSS **simple** et permet de cibler un élément à mettre en valeur.
clickOnNextCssSelector correspond à un élément défini par un selecteur CSS **simple** sur lequel il faut simuler un click avant de passer à l'étape suivante.
Il en est de même pour clickOnPrevCssSelector pour les retours à l'étape précédente.

Dans l'exemple actuel, avant de mettre en évidence un élément du drawer, il faut cliquer dessus pour le déplier. Et quand on recule depuis le drawer, il faut également cliquer pour le fermer.

Pour le fonctionnement de side et align, se référer à la [documentation de driver.js](https://driverjs.com/docs/installation)
