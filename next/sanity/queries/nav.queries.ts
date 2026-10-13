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

export { navMenuQuery }
