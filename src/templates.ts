// Rangoli template images that can be colored on the Template Studio page.
// The images live in the /images folder (served from public/images in the build).

export const templateImages = [
  {
    id: "peacock",
    name: "Peacock Rangoli",
    kind: "line-art",
    src: "/images/1097189527988881302.jpg",
  },
  {
    id: "flower-bloom",
    name: "Flower Bloom",
    kind: "line-art",
    src: "/images/37f1fa2612c26a46a9f1da680feff1cb.jpg",
  },
  {
    id: "floral-carpet",
    name: "Floral Carpet",
    kind: "line-art",
    src: "/images/829014243948581491.jpg",
  },
  {
    id: "designer",
    name: "Designer Rangoli",
    kind: "line-art",
    src: "/images/Designer.png",
  },
  {
    id: "easy-rangoli",
    name: "Easy Rangoli",
    kind: "colored",
    src: "/images/Easy-Rangoli-Design-6.webp",
  },
  {
    id: "peacock-embroidery",
    name: "Peacock Motif",
    kind: "colored",
    src: "/images/peacock-motif.jpg",
  },
  {
    id: "classic-rangoli",
    name: "Classic Rangoli",
    kind: "colored",
    src: "/images/Rangoli.jpg",
  },
] as const;

export type TemplateImageId = (typeof templateImages)[number]["id"];