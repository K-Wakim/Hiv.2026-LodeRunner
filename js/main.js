import { niv1 } from "./niveau.js";
import {
  dessinerBeton,
  dessinerBrique,
  dessinerEchelle,
  dessinerCorde,
  dessinerLingot,
  dessinerGameOver,
  dessinerVictoire,
} from "./dessiner.js";

import {
  dessinerBordure,
  dessinerNoms,
  dessinerScore,
  dessinerTemps,
  dessinerTitre,
  dessinerNiveauCourant,
  dessinerVie,
  animerHorloge,
} from "./hud.js";

import { Joueur } from "./joueur.js";
import { input, keys } from "./input.js";
import { Sons } from "./sons.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.focus(); // Pour que le canvas detecte les événements clavier

let etatJeu = "play";
let tempsFin = 0;

let niveauActuel = 1;

// Images
const objLingot = new Image();
objLingot.src = "assets/images/lingot.png";

const sons = new Sons();

// Joueur
const joueur = new Joueur(
  niv1,
  14,
  14,
  "assets/images/imgJoueur/BaseRunner.png",
  sons,
);

let tempsEcoule = "00:00";
let tempsInitial = null;

// Input
input(canvas, joueur);

// Dessiner le niveau
function dessinerNiveau() {
  dessinerBordure(canvas, ctx);
  dessinerTitre(ctx, canvas);
  dessinerNoms(ctx, canvas);
  dessinerScore(ctx, canvas, joueur.score);
  dessinerTemps(ctx, canvas, tempsEcoule);
  dessinerNiveauCourant(ctx, canvas, String(niveauActuel));
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
  if (etatJeu !== "play") {
    const t = performance.now() - tempsFin;
    redessiner();
    if (etatJeu === "gameover") dessinerGameOver(ctx, canvas, t);
    if (etatJeu === "win") dessinerVictoire(ctx, canvas, t);
    return;
  }

  if (joueur.vie <= 0) {
    etatJeu = "gameover";
    tempsFin = performance.now();
    return;
  }

  // Conditions pour passer au prochain niveau
  if (joueur.nbrLingots === 6 && joueur.col === 18 && joueur.row === -1) {
    console.log("Niveau terminé !");
    niveauActuel++;
    // For now, we only have one level, so we reset the current level
    const score = joueur.score;
    joueur.reset(14, 14, score);
    console.log(joueur.scoreInit);
    tempsInitial = null; // Reset timer for next level
  }

  // Conditions de victoire
  // for now setting to false to avoid winning immediately when testing
  if (
    joueur.nbrLingots === 6 &&
    joueur.col === 18 &&
    joueur.row === -1 &&
    niveauActuel === 10
  ) {
    etatJeu = "win";
    tempsFin = performance.now();
    dessinerVictoire(ctx, canvas, 0);
    return;
  }

  if (keys.jouer) {
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
      joueur.niveau[0][18] = "E";
      joueur.niveau[1][18] = "E";
      joueur.niveau[2][18] = "E";
      joueur.niveau[3][18] = "E";
    }

    if (tempsInitial === null) tempsInitial = Date.now();

    tempsEcoule = animerHorloge(ctx, canvas, tempsInitial);
  }
  joueur.mettreAJourAnimation(keys);

  redessiner();
}

objLingot.onload = () => redessiner();
redessiner();

setInterval(update, 16);
