const sanityImageFunction = /* groq */ `
fn sanityImage::full($image) = $image{ asset, crop, hotspot, "alt": asset->altText};
`

const personQueryFunction = /* groq */ `
fn person::full($person) = $person{
    _id,
    name,
    title,
    "picture": sanityImage::full(picture)
};
`

const linkSelectorFunction = /* groq */ `
fn linkSelector::full($link) = $link{
    defined(linkType) => {linkType},
    defined(page) => {
    "pageSlug": select(
            page->._type == "page" => page->.pageSlug,
            page->.slug
        )
    },
    defined(section) => {"sectionSlug": section->.slug},
    defined(customLink) => {customLink},
};
`

const sanityButtonFunction = /* groq */ `
fn sanityButton::full($button) = $button{
    "buttonLabel": stringTitle,
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
