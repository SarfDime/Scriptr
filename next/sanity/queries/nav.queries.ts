import { groq } from 'next-sanity'

const navMenuQuery = groq`
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
    },
  }
}.navMenu`

export { navMenuQuery }
