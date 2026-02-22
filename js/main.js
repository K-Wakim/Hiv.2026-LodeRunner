import { niv1 } from "./niveau.js";
import {
  dessinerBeton,
  dessinerBrique,
  dessinerEchelle,
  dessinerCorde,
  dessinerLingot,
} from "./dessiner.js";

import {
  dessinerBordure,
  dessinerNoms,
  dessinerScore,
  dessinerTemps,
  dessinerTitre,
  dessinerNiveauCourant,
  dessinerVie,
} from "./hud.js";

import { Joueur } from "./joueur.js";
import { input, keys } from "./input.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.focus(); // Pour que le canvas detecte les événements clavier

// Images
const objLingot = new Image();
objLingot.src = "assets/images/lingot.png";

// Joueur
const joueur = new Joueur(
  niv1,
  14,
  14,
  "assets/images/imgJoueur/BaseRunner.png",
);

// Input
input(canvas, joueur);

// Dessiner le niveau
function dessinerNiveau() {
  dessinerBordure(canvas, ctx);
  dessinerTitre(ctx, canvas);
  dessinerNoms(ctx, canvas);
  dessinerScore(ctx, canvas, joueur.score);
  dessinerTemps(ctx, canvas);
  dessinerNiveauCourant(ctx, canvas);
  dessinerVie(ctx, canvas, joueur.vie);

  joueur.niveau.forEach((ligne, y) => {
    ligne.forEach((caseType, x) => {
      if (caseType === "Be") dessinerBeton(ctx, x * 32, y * 32 + 32);
      if (caseType === "B") dessinerBrique(ctx, x * 32, y * 32 + 32);
      if (caseType === "C") dessinerCorde(ctx, x * 32, y * 32 + 32);
      if (caseType === "L" && objLingot.complete)
        dessinerLingot(ctx, x * 32, y * 32 + 32, objLingot);
    });
  });

  joueur.niveau.forEach((ligne, y) => {
    ligne.forEach((caseType, x) => {
      if (caseType === "E") dessinerEchelle(ctx, x * 32, y * 32 + 32);
    });
  });
}

function redessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dessinerNiveau();
  joueur.dessiner(ctx);
}

function update() {
  if (keys.left) joueur.deplacementHorizontal(-1, keys);
  if (keys.right) joueur.deplacementHorizontal(1, keys);
  if (keys.up) joueur.monterEchelle();
  if (keys.down) joueur.lacherCorde();
  if (keys.down) joueur.descendreEchelle();

  // Gravité/tomber
  joueur.appliquerGravite();

  joueur.ramasserLingot();

  joueur.death();

  // échelle pour passer au prochaine niveau
  if (joueur.nbrLingots === 6) {
    joueur.niveau[1][18] = "E";
    joueur.niveau[2][18] = "E";
    joueur.niveau[3][18] = "E";
  }

  redessiner();
}

objLingot.onload = () => redessiner();
redessiner();

setInterval(update, 16);
