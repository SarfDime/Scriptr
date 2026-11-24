const Z_INDEX = {
  TOASTER: 'z-101',
  NAV_BAR: 'z-99',
  FEEDBACK: 'z-98',
  /** In front of the page content, below the chrome above it: the falling snow. */
  SNOW: 'z-97',
  POPOVER: 'z-30',
  INFO_BANNER: 'z-22',
  CTA_CARD: 'z-21',
  SKELETON: 'z-20',
  LANGUAGE_PICKER: 'z-19',
  COMING_SOON_BADGE: 'z-2',
} as const
/** Image `sizes` values must be selected from this app-specific registry. */
const IMAGE_SIZES = {
  UNIVERSITY_HERO: '(min-width: 640px) 50vw, 100vw',
  FILE_PREVIEW: '(min-width: 768px) 70vw, 100vw',
  SCRIPT_THUMBNAIL: '320px',
  CATALOG_CARD: '320px',
  OVERVIEW_CARD: '(min-width: 1024px) 50vw, 100vw',
  LARGE_AVATAR: '(min-width: 1024px) 50vw, 100vw',
  AVATAR: '4rem',
  PORTABLE_TEXT_IMAGE:
    '(max-width: 480px) 300px, (max-width: 768px) 420px, (max-width: 1350px) 550px, 700px',
  LINK_LOGO: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
} as const

export { IMAGE_SIZES, Z_INDEX }
