(function exposeArcadeManifest(global) {
  "use strict";

  global.LottoMindArcadeGames = Object.freeze([
    {
      id: "gothtechnology",
      title: "GOTHTECHNOLOGY",
      path: "./games/gothtechnology2/",
      description: "Cross the Blackwood forest, break the signal lock, and fight your way into the vault.",
      category: "Action",
      tags: ["fighter", "vault", "keyboard", "gamepad"],
      image: "./games/gothtechnology2/assets/user-title/gothtechnology-cover-start-bg.webp",
      status: "Live",
      featured: true,
      controls: "Keyboard + gamepad",
      difficulty: "Advanced",
      accent: "ember"
    },
    {
      id: "jackpot-maze",
      title: "LottoMind: Jackpot Maze",
      path: "./games/lottomind-jackpot-maze/",
      description: "Collect secure number reveals, outsmart five comic villains, and open the neon vault.",
      category: "Arcade",
      tags: ["maze", "numbers", "vault", "strategy"],
      image: "./games/lottomind-jackpot-maze/public/assets/ui/lottomind-jackpot-maze-title-card-gpt2.webp",
      status: "Live",
      featured: true,
      controls: "Keyboard + touch",
      difficulty: "Intermediate",
      accent: "gold"
    },
    {
      id: "static-wave-2084",
      title: "2084 Static Wave",
      path: "./games/opengw-levels/",
      description: "Pilot the static signal through a fast neon combat grid with solo and multiplayer routes.",
      category: "Action",
      tags: ["arcade", "combat", "multiplayer", "neon"],
      image: "./games/opengw-levels/assets/2084/branding/marquee-gameplay-keyart.png",
      status: "Live",
      featured: true,
      controls: "Keyboard + gamepad",
      difficulty: "Advanced",
      accent: "cyan"
    },
    {
      id: "robot-rahbe",
      title: "Robot Rahbe",
      path: "./games/shadow-ops-canvas/",
      description: "Enter the Shadow Ops arena, survive the mission grid, and hold the tactical signal.",
      category: "Action",
      tags: ["shadow ops", "combat", "arena", "canvas"],
      image: "./games/shadow-ops-canvas/assets/backgrounds/robot-rahbe-gameplay-keyart-flipped.png",
      status: "Live",
      featured: false,
      controls: "Keyboard + touch",
      difficulty: "Intermediate",
      accent: "violet"
    },
    {
      id: "raytrace-pong",
      title: "Raytrace Pong",
      path: "./games/raytrace-pong-background/",
      description: "Play a light-traced Pong simulation where the ball illuminates the arena and casts live shadows.",
      category: "Simulation",
      tags: ["pong", "webgl", "light", "simulation"],
      image: "./assets/arcade/raytrace-pong-title.webp",
      status: "Live",
      featured: false,
      controls: "Keyboard",
      difficulty: "Casual",
      accent: "signal"
    },
    {
      id: "lottery-spheres",
      title: "Lottery Spheres in Motion",
      path: "./lottery-spheres.html#spheres",
      description: "Guide the glowing spheres, reroll a creative set, and bend the orbit path with your pointer.",
      category: "Arcade",
      tags: ["spheres", "numbers", "orbit", "creative"],
      image: "./assets/arcade/lottery-spheres-title.webp",
      status: "Live",
      featured: false,
      controls: "Pointer + touch",
      difficulty: "Casual",
      accent: "gold"
    },
    {
      id: "beat2lotto-lab",
      title: "Beat2Lotto+ Prompt Lab",
      path: "./prompt-lab.html",
      description: "Turn local beat energy into entertainment-only number signals and production-ready creative prompts.",
      category: "Creative Tools",
      tags: ["beats", "generator", "prompts", "audio"],
      image: "./assets/arcade/beat2lotto-prompt-lab-title.webp",
      status: "Live",
      featured: false,
      controls: "Pointer + keyboard",
      difficulty: "Casual",
      accent: "violet"
    },
    {
      id: "stem-studio",
      title: "LottoMind Stem Studio",
      path: "./lottomind-stem-studio/",
      description: "Mix stems, shape the live signal, and build a playable music route in the browser studio.",
      category: "Music & Rhythm",
      tags: ["music", "mixer", "stems", "studio"],
      image: "./assets/arcade/stem-studio-title.webp",
      status: "Live",
      featured: false,
      controls: "Pointer + keyboard",
      difficulty: "Intermediate",
      accent: "cyan"
    }
  ]);
})(window);
