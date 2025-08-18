// lib/barber-images.ts
// Barber image mapping and avatar generation utility

interface BarberImageMapping {
  firstNames: string[];
  image: string;
  fallbackColor: string;
}

// Available barber images from assets
const BARBER_IMAGE_MAPPINGS: BarberImageMapping[] = [
  {
    firstNames: ["alex", "alexander", "alessandro"],
    image: "/assets/ao-pixelate-black",
    fallbackColor: "from-slate-800 to-slate-900",
  },
  {
    firstNames: ["mike", "michael", "miguel", "mitchell"],
    image: "/assets/ao-pixelate-black.png",
    fallbackColor: "from-amber-800 to-amber-900",
  },
  {
    firstNames: ["chris", "christopher", "christian", "christie"],
    image: "/assets/ao-pixelate-black.png",
    fallbackColor: "from-blue-800 to-blue-900",
  },
];

// Fallback images for rotation
const FALLBACK_BARBER_IMAGES = [
  "/assets/ao-pixelate-black.png",
  "/assets/ao-pixelate-black.png",
  "/assets/ao-pixelate-black.png",
];

// Avatar gradient colors
const AVATAR_GRADIENT_COLORS = [
  "from-slate-700 to-slate-800",
  "from-amber-700 to-amber-800",
  "from-blue-700 to-blue-800",
  "from-emerald-700 to-emerald-800",
  "from-purple-700 to-purple-800",
  "from-red-700 to-red-800",
  "from-indigo-700 to-indigo-800",
  "from-teal-700 to-teal-800",
  "from-orange-700 to-orange-800",
  "from-pink-700 to-pink-800",
];

/**
 * Get the best matching image for a barber based on their name
 */
export function getBarberImage(
  firstName: string,
  lastName?: string,
  profileImageUrl?: string,
): string {
  // If custom profile image is provided, use it
  if (profileImageUrl && isValidImageUrl(profileImageUrl)) {
    return profileImageUrl;
  }

  const searchName = firstName.toLowerCase();

  // Find the best matching barber image
  for (const mapping of BARBER_IMAGE_MAPPINGS) {
    if (mapping.firstNames.includes(searchName)) {
      return mapping.image;
    }
  }

  // Fallback: use name hash to consistently pick same image
  const hash = hashString(firstName + (lastName || ""));
  return FALLBACK_BARBER_IMAGES[hash % FALLBACK_BARBER_IMAGES.length];
}

/**
 * Get a consistent avatar gradient color for a barber
 */
export function getBarberAvatarGradient(
  firstName: string,
  lastName?: string,
): string {
  const fullName = firstName + (lastName || "");
  const hash = hashString(fullName);
  return AVATAR_GRADIENT_COLORS[hash % AVATAR_GRADIENT_COLORS.length];
}

/**
 * Get barber initials for avatar fallback
 */
export function getBarberInitials(
  firstName: string,
  lastName?: string,
): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
  return firstInitial + lastInitial;
}

/**
 * Simple string hash function for consistent selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Validate if a URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();
    return (
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".webp") ||
      pathname.endsWith(".svg")
    );
  } catch {
    return false;
  }
}

/**
 * Get barber image with comprehensive fallback strategy
 */
export function getBarberImageSafe(
  firstName: string,
  lastName?: string,
  profileImageUrl?: string,
): {
  src: string;
  gradient: string;
  initials: string;
  alt: string;
  hasCustomImage: boolean;
} {
  const hasCustomImage = !!(
    profileImageUrl && isValidImageUrl(profileImageUrl)
  );

  return {
    src: getBarberImage(firstName, lastName, profileImageUrl),
    gradient: getBarberAvatarGradient(firstName, lastName),
    initials: getBarberInitials(firstName, lastName),
    alt: `${firstName} ${lastName || ""} profile picture`.trim(),
    hasCustomImage,
  };
}

/**
 * Preload barber images for better performance
 */
export function preloadBarberImages(): void {
  if (typeof window !== "undefined") {
    FALLBACK_BARBER_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }
}

/**
 * Generate a deterministic avatar style for a barber
 */
export function generateBarberAvatarStyle(
  firstName: string,
  lastName?: string,
): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
} {
  const hash = hashString(firstName + (lastName || ""));
  const colorIndex = hash % AVATAR_GRADIENT_COLORS.length;

  // Color mapping for consistent theming
  const colorThemes = [
    { bg: "bg-slate-700", text: "text-white", border: "border-slate-600" },
    { bg: "bg-amber-700", text: "text-white", border: "border-amber-600" },
    { bg: "bg-blue-700", text: "text-white", border: "border-blue-600" },
    { bg: "bg-emerald-700", text: "text-white", border: "border-emerald-600" },
    { bg: "bg-purple-700", text: "text-white", border: "border-purple-600" },
    { bg: "bg-red-700", text: "text-white", border: "border-red-600" },
    { bg: "bg-indigo-700", text: "text-white", border: "border-indigo-600" },
    { bg: "bg-teal-700", text: "text-white", border: "border-teal-600" },
    { bg: "bg-orange-700", text: "text-white", border: "border-orange-600" },
    { bg: "bg-pink-700", text: "text-white", border: "border-pink-600" },
  ];

  const theme = colorThemes[colorIndex];
  return {
    backgroundColor: theme.bg,
    textColor: theme.text,
    borderColor: theme.border,
  };
}
