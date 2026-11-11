import { groq } from 'next-sanity'
import { linkSelectorFunction, sanityImageFunction } from './functions.queries'

const navMenuQuery = groq`
${sanityImageFunction}
${linkSelectorFunction}

*[_id == $WEBSITE][0]{
  "navMenu": navMenu->{
    defined(title) => {title},
    defined(websiteLogo)=>{ "websiteLogo": sanityImage::full(websiteLogo) },
    navItems[]->{
      stringTitle,
      stringSubtitle,
      ...linkSelector::full(@),
      defined(new) => {new},
      defined(comingSoon) => {comingSoon},
      defined(disabled) => {disabled},
      defined(icon) => { "icon": sanityImage::full(icon) },
    },
  }
}.navMenu`

/**
 * Each study's site handle and logo, for the navbar's enrolled-studies list.
 * The profile holds Postgres rows, which carry no logo; this is the catalog's
 * copy of it, matched by the site handle the row does carry. Cached with the
 * rest of the study documents, so publishing a study refreshes it.
 */
const studyLogosQuery = groq`
${sanityImageFunction}

*[_type == "study" && defined(siteSlug.current)]{
  "siteSlug": siteSlug.current,
  "logo": sanityImage::full(logo),
}`

export { navMenuQuery, studyLogosQuery }
