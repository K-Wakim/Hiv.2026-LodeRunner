// js/sons.js

export class Sons {
  constructor() {
    this.audios = {
      briqueRespawn: new Audio("assets/sons/briqueRespawn.flac"),
      detruitBrique: new Audio("assets/sons/detruitBrique.wav"),
      gameOver: new Audio("assets/sons/gameOver.wav"),
      gardeRespawn: new Audio("assets/sons/gardeRespawn.flac"),
      gardeTombeDansBrique: new Audio("assets/sons/gardeTombeDansBrique.mp3"),
      mort: new Audio("assets/sons/mort.mp3"),
      prochainNiveau: new Audio("assets/sons/prochainNiveau.wav"),
      ramasseLingot: new Audio("assets/sons/ramasseLingot.wav"),
      tombe: new Audio("assets/sons/tombe.wav"),
      victoire: new Audio("assets/sons/victory.mp3"),
    };

    // Preload les sons (évite délais)
    Object.values(this.audios).forEach((audio) => {
      audio.preload = "auto";
    });
  }

  jouer(son) {
    const audio = this.audios[son];
    if (!audio) return;

    const clone = audio.cloneNode(true);
    clone.play().catch(() => {});
  }
}
