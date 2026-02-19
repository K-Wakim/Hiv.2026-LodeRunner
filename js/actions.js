/*
 * LIBRAIRIES DE FONCTIONS POUR LES ACTIONS DU JOUEUR
 */

function rammasseLingot(joueur) {
  const col = Math.floor((joueur.x + joueur.w / 2) / TAILLE_CELLULE);
  const row = Math.floor((joueur.y + joueur.h / 2) / TAILLE_CELLULE);
  const t = cellule(joueur.niveau, col, row);
  if (t === LINGOT) {
    joueur.niveau[col][row] = VIDE;
    joueur.lingotsRamasses++;
    if (joueur.lingotsRamasses === joueur.lingotsTotal) {
      alert("Vous avez gagné !");
    }
  }
}

export { rammasseLingot };
