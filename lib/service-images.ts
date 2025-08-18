// lib/service-images.ts
// Service image mapping utility

interface ServiceImageMapping {
  keywords: string[];
  image: string;
  fallbackColor: string;
}

// Available service images from assets
const SERVICE_IMAGE_MAPPINGS: ServiceImageMapping[] = [
  {
    keywords: ['haircut', 'cut', 'trim', 'style', 'scissor'],
    image: '/assets/services-1.png',
    fallbackColor: 'from-slate-800 to-slate-900'
  },
  {
    keywords: ['beard', 'facial', 'trim', 'grooming', 'shave'],
    image: '/assets/services-2.png',
    fallbackColor: 'from-amber-800 to-amber-900'
  },
  {
    keywords: ['wash', 'shampoo', 'treatment', 'conditioning'],
    image: '/assets/services-3.png',
    fallbackColor: 'from-blue-800 to-blue-900'
  },
  {
    keywords: ['color', 'coloring', 'dye', 'highlight', 'tint'],
    image: '/assets/services-4.png',
    fallbackColor: 'from-purple-800 to-purple-900'
  },
  {
    keywords: ['package', 'combo', 'full', 'complete', 'premium'],
    image: '/assets/services-5.png',
    fallbackColor: 'from-emerald-800 to-emerald-900'
  }
];

// Fallback images for rotation
const FALLBACK_IMAGES = [
  '/assets/services-1.png',
  '/assets/services-2.png',
  '/assets/services-3.png',
  '/assets/services-4.png',
  '/assets/services-5.png'
];

// Fallback gradient colors
const FALLBACK_COLORS = [
  'from-slate-800 to-slate-900',
  'from-amber-800 to-amber-900',
  'from-blue-800 to-blue-900',
  'from-purple-800 to-purple-900',
  'from-emerald-800 to-emerald-900',
  'from-red-800 to-red-900',
  'from-indigo-800 to-indigo-900',
  'from-teal-800 to-teal-900'
];

/**
 * Get the best matching image for a service based on its name and description
 */
export function getServiceImage(serviceName: string, description?: string): string {
  const searchText = `${serviceName} ${description || ''}`.toLowerCase();
  
  // Find the best matching service image
  for (const mapping of SERVICE_IMAGE_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (searchText.includes(keyword)) {
        return mapping.image;
      }
    }
  }
  
  // Fallback: use service name hash to consistently pick same image
  const hash = hashString(serviceName);
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

/**
 * Get a consistent gradient color for a service
 */
export function getServiceGradient(serviceName: string, description?: string): string {
  const searchText = `${serviceName} ${description || ''}`.toLowerCase();
  
  // Find the best matching gradient
  for (const mapping of SERVICE_IMAGE_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (searchText.includes(keyword)) {
        return mapping.fallbackColor;
      }
    }
  }
  
  // Fallback: use service name hash to consistently pick same gradient
  const hash = hashString(serviceName);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

/**
 * Simple string hash function for consistent image selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get service image with error handling
 */
export function getServiceImageSafe(serviceName: string, description?: string): {
  src: string;
  gradient: string;
  alt: string;
} {
  return {
    src: getServiceImage(serviceName, description),
    gradient: getServiceGradient(serviceName, description),
    alt: `${serviceName} service image`
  };
}

/**
 * Preload service images for better performance
 */
export function preloadServiceImages(): void {
  if (typeof window !== 'undefined') {
    FALLBACK_IMAGES.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }
}