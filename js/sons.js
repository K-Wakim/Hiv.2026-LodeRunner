// js/sons.js

export class Sons {
    constructor() {
        this.audios = {
            ramasseLingot: new Audio("assets/sons/ramasseLingot.mp3"),
            tombe: new Audio("assets/sons/tombe.mp3"),
            mort: new Audio("assets/sons/mort.mp3"),
            gameOver: new Audio("assets/sons/gameOver.mp3"),
            victoire: new Audio("assets/sons/victory.mp3"),
            prochainNiveau: new Audio("assets/sons/prochainNiveau.wav"),
            detruitBrique: new Audio("assets/sons/detruitBrique.wav"),
            briqueRespawn: new Audio("assets/sons/briqueRespawn.flac"),
            gardeTombeDansBrique: new Audio("assets/sons/gardeTombeDansBrique.mp3"),
            gardeRespawn: new Audio("assets/sons/gardeRespawn.flac"),
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