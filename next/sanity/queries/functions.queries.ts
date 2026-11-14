import { localizedProjection, localizedValue } from './localized.queries'

const sanityImageFunction = /* groq */ `
fn sanityImage::full($image) = $image{ asset, crop, hotspot, "alt": asset->altText};
`

const personQueryFunction = /* groq */ `
fn person::full($person) = $person{
    _id,
    ${localizedProjection('name', 'localizedName')},
    ${localizedProjection('title', 'localizedTitle')},
    "picture": sanityImage::full(picture)
};
`

// TODO: expand this once nav/button links can target academic entities and the
// website's database pages again. For now the only destination is customLink.
const linkSelectorFunction = /* groq */ `
fn linkSelector::full($link) = $link{
    defined(customLink) => {customLink},
};
`

const sanityButtonFunction = /* groq */ `
fn sanityButton::full($button) = $button{
    "buttonLabel": ${localizedValue('localizedTitle')},
    _id,
    defined(buttonColorVariant) => {"buttonColorVariant": buttonColorVariant},
    ...linkSelector::full(@),
};
`

const portableTextFunction = /* groq */ `
fn portableText::full($portableText) = $portableText{
    ...,
    children[]{
    ...,
    _type == "image" => {
        asset, 
        "alt": asset->altText,
        "aspectRatio": asset->metadata.dimensions.aspectRatio,
    },
    _type == "buttonReference" => @->{...sanityButton::full(@)},
    },
    markDefs[]{
    ...,
    }
};
`

const sanityFunctionQueries = /* groq */ `
${linkSelectorFunction}
${sanityImageFunction}
${sanityButtonFunction}
${portableTextFunction}
${personQueryFunction}
`

export {
  linkSelectorFunction,
  personQueryFunction,
  portableTextFunction,
  sanityButtonFunction,
  sanityFunctionQueries,
  sanityImageFunction,
}
