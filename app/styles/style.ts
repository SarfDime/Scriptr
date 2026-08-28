const MARKDOWN_COLOR_CODES = {
  cerulean: '#2975bf',
  gold: '#ffcc04',
  darkGrey: '#4d5155',
  red: '#e53e3e',
  green: '##22b573',
}
const Z_INDEX = {
  TOASTER: 'z-101',
  DIALOG_BACKDROP: 'z-100',
  NAV_BAR: 'z-99',
  FEEDBACK: 'z-98',
  INFO_BANNER: 'z-22',
  CTA_CARD: 'z-21',
  SKELETON: 'z-20',
  LANGUAGE_PICKER: 'z-19',
  COMING_SOON_BADGE: 'z-2',
}
const IMAGE_SIZES = {
  FEATURED_CARD_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 300px, (max-width: 768px) 420px, (max-width: 1304px) 550px, 700px',
  DOWNLOAD_SECTION_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 210px, (max-width: 768px) 250px, (max-width: 1304px) 350px, 500px',
  FEATURED_SECTION_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 300px, (max-width: 768px) 420px, (max-width: 1350px) 550px, 700px',
  PERSON_TEAM_SECTION_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 280px, (max-width: 768px) 360px, (max-width: 1024px) 390px, 390px',
  PARTNER_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 130px, (max-width: 768px) 130px, (max-width: 1024px) 250px, 350px',
  TESTIMONIAL_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 100px, (max-width: 768px) 100px, (max-width: 1024px) 230px, 300px',
  ICON_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 24px, (max-width: 768px) 32px, (max-width: 1024px) 40px, 48px',
  SMALL_ICON_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 16px, (max-width: 768px) 20px, (max-width: 1024px) 24px, 32px',
  LARGE_ICON_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 32px, (max-width: 768px) 48px, (max-width: 1024px) 64px, 80px',
  VERY_LARGE_ICON_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 48px, (max-width: 768px) 64px, (max-width: 1024px) 80px, 96px',
  AVATAR_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 40px, (max-width: 768px) 48px, (max-width: 1024px) 56px, 64px',
  THUMBNAIL_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 150px, (max-width: 768px) 200px, (max-width: 1024px) 250px, 300px',
  CONTENT_CARD_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 400px, 480px',
  HERO_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 600px, (max-width: 768px) 900px, (max-width: 1304px) 1200px, 1500px',
  BLOG_POST_IMAGE_OPTIMIZATION:
    '(max-width: 480px) 300px, (max-width: 768px) 420px, (max-width: 1304px) 550px, 700px',
  NEXTJS_IMAGE_DEFAULT_SIZE_PROPERTY:
    '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}

export { MARKDOWN_COLOR_CODES, Z_INDEX, IMAGE_SIZES }
