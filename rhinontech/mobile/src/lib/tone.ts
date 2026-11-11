/**
 * Every module owns one block colour. Class strings are written out in full so Tailwind can see them.
 *  - solid:  fill + a foreground that is readable on it
 *  - text:   the colour as text on paper (light blocks use their darker twin)
 *  - dot:    fill only
 *  - soft:   a light tint for chips and quiet surfaces
 */
export type Tone =
  "coral" | "cobalt" | "sun" | "leaf" | "violet" | "rose" | "sky" | "ink" | "paper";

export type ToneClasses = {
  solid: string;
  text: string;
  dot: string;
  soft: string;
  border: string;
  outline: string;
};

export const TONES: Record<Tone, ToneClasses> = {
  coral: {
    solid: "bg-coral text-coral-foreground",
    text: "text-coral-deep",
    dot: "bg-coral",
    soft: "bg-coral/15",
    border: "border-coral",
    outline: "outline-coral",
  },
  cobalt: {
    solid: "bg-cobalt text-cobalt-foreground",
    text: "text-cobalt-deep",
    dot: "bg-cobalt",
    soft: "bg-cobalt/12",
    border: "border-cobalt",
    outline: "outline-cobalt",
  },
  sun: {
    solid: "bg-sun text-sun-foreground",
    text: "text-sun-deep",
    dot: "bg-sun",
    soft: "bg-sun/35",
    border: "border-sun",
    outline: "outline-sun",
  },
  leaf: {
    solid: "bg-leaf text-leaf-foreground",
    text: "text-leaf-deep",
    dot: "bg-leaf",
    soft: "bg-leaf/15",
    border: "border-leaf",
    outline: "outline-leaf",
  },
  violet: {
    solid: "bg-violet text-violet-foreground",
    text: "text-violet-deep",
    dot: "bg-violet",
    soft: "bg-violet/12",
    border: "border-violet",
    outline: "outline-violet",
  },
  rose: {
    solid: "bg-rose text-rose-foreground",
    text: "text-rose-deep",
    dot: "bg-rose",
    soft: "bg-rose/25",
    border: "border-rose",
    outline: "outline-rose",
  },
  sky: {
    solid: "bg-sky text-sky-foreground",
    text: "text-sky-deep",
    dot: "bg-sky",
    soft: "bg-sky/30",
    border: "border-sky",
    outline: "outline-sky",
  },
  ink: {
    solid: "bg-ink text-paper",
    text: "text-ink",
    dot: "bg-ink",
    soft: "bg-ink/8",
    border: "border-ink",
    outline: "outline-ink",
  },
  paper: {
    solid: "bg-card text-ink",
    text: "text-ink",
    dot: "bg-paper",
    soft: "bg-card",
    border: "border-line",
    outline: "outline-ink",
  },
};

const AVATAR_TONES: Tone[] = ["coral", "cobalt", "sun", "leaf", "violet", "rose", "sky"];

/** The main cast gets hand-picked colours so people who appear together never blur into one another. */
const PERSON_TONES: Record<string, Tone> = {
  "Kabir Mehra": "violet",
  "Aanya Rao": "coral",
  "Dev Malhotra": "cobalt",
  "Meera Kapoor": "rose",
  "Rohan Iyer": "leaf",
  "Zoya Khan": "sun",
  "Vikram Sethi": "ink",
  "Neha Joshi": "sky",
  "Arjun Nair": "rose",
  "Tara Bose": "leaf",
  "Isha Reddy": "sun",
  "Priya Nambiar": "sun",
  "Sameer Patil": "cobalt",
  "Tanvi Shah": "violet",
};

/** A stable colour for a name, so a person is the same colour on every screen. */
export function toneFor(name: string): Tone {
  const known = PERSON_TONES[name];
  if (known) return known;
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return AVATAR_TONES[h % AVATAR_TONES.length] ?? "cobalt";
}
