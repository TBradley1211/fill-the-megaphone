const amazonWishlistUrl =
  "https://www.amazon.com/registries/gl/guest-view/QB2Y0VPD489R";

export const categories = [
  {
    id: 1,
    title: "Hydration & Snacks",
    description:
      "Water bottles, cooling towels, cases of water, and game-day snacks.",
    progress: 45,
    totalText: "45% covered",
    buttonText: "Shop Team Wishlist",
    buttonLink: amazonWishlistUrl,
    external: true,
  },
  {
    id: 2,
    title: "Team Accessories",
    description:
      "Bows and other accessories needed throughout the cheer season.",
    progress: 25,
    totalText: "25% covered",
    buttonText: "Shop Team Wishlist",
    buttonLink: amazonWishlistUrl,
    external: true,
  },
  {
    id: 3,
    title: "Banquet & Trophies",
    description:
      "Help us reach our $300 goal for the team banquet and end-of-season trophies.",
    progress: 30,
    totalText: "$90 of $300 covered",
    buttonText: "Sponsor This Need",
    buttonLink: "#donate",
    external: false,
  },
];