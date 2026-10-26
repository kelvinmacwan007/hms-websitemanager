// Animation definitions consumed by Tailwind's animate utilities.
export const websiteKeyframes = {
  "button-move-up-alternate": {
    "0%": {
      transform: "translateY(0)",
    },
    "50%": {
      transform: "translateY(110%)",
    },
    "51%": {
      transform: "translateY(-110%)",
    },
    "100%": {
      transform: "translateY(0)",
    },
  },
  "hotel-card-blob": {
    "0%,\n  100%": {
      transform: "translate(0, 0)",
    },
    "25%": {
      transform: "translate(67%, 0)",
    },
    "50%": {
      transform: "translate(67%, 67%)",
    },
    "75%": {
      transform: "translate(0, 67%)",
    },
  },
  "lightbox-fade-in": {
    from: {
      opacity: "0",
    },
    to: {
      opacity: "1",
    },
  },
  "lightbox-zoom-in": {
    from: {
      opacity: "0",
      transform: "scale(0.94)",
    },
    to: {
      opacity: "1",
      transform: "scale(1)",
    },
  },
  "hero-arrive": {
    from: {
      opacity: "0.45",
      transform: "scale(1.035)",
    },
    to: {
      opacity: "0.75",
      transform: "scale(1)",
    },
  },
  "reveal-up": {
    from: {
      opacity: "0",
      transform: "translateY(22px)",
    },
    to: {
      opacity: "1",
      transform: "translateY(0)",
    },
  },
  "checkbox-spark": {
    "0%": {
      opacity: "0",
      transform:
        "scale(0) rotate(var(--spark-angle, 0deg)) translateX(var(--checkbox-spark-offset))",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      opacity: "0",
      transform:
        "scale(1) rotate(var(--spark-angle, 0deg))\n      translateX(calc(var(--checkbox-spark-offset) * 1.5))",
    },
  },
  "particle-1": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(-20px, -20px) scale(1)",
      opacity: "0",
    },
  },
  "particle-2": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(20px, -20px) scale(1)",
      opacity: "0",
    },
  },
  "particle-3": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(20px, 20px) scale(1)",
      opacity: "0",
    },
  },
  "particle-4": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(-20px, 20px) scale(1)",
      opacity: "0",
    },
  },
  "particle-5": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(-30px, 0px) scale(1)",
      opacity: "0",
    },
  },
  "particle-6": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(30px, 0px) scale(1)",
      opacity: "0",
    },
  },
  "particle-7": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0px, -30px) scale(1)",
      opacity: "0",
    },
  },
  "particle-8": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0px, 30px) scale(1)",
      opacity: "0",
    },
  },
  "particle-out-1": {
    "0%": {
      transform: "translate(-20px, -20px) scale(1)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
  },
  "particle-out-2": {
    "0%": {
      transform: "translate(20px, -20px) scale(1)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
  },
  "particle-out-3": {
    "0%": {
      transform: "translate(20px, 20px) scale(1)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
  },
  "particle-out-4": {
    "0%": {
      transform: "translate(-20px, 20px) scale(1)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
  },
  "particle-out-5": {
    "0%": {
      transform: "translate(-30px, 0px) scale(1)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
  },
  "particle-out-6": {
    "0%": {
      transform: "translate(30px, 0px) scale(1)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
  },
  "particle-out-7": {
    "0%": {
      transform: "translate(0px, -30px) scale(1)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
  },
  "particle-out-8": {
    "0%": {
      transform: "translate(0px, 30px) scale(1)",
      opacity: "0",
    },
    "50%": {
      opacity: "1",
    },
    "100%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0",
    },
  },
};
