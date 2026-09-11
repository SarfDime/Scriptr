import { groq } from 'next-sanity'

const sanityImageFunction = groq`
fn sanityImage::full($image) = $image{ asset, crop, hotspot, "alt": asset->altText};
`

const personQueryFunction = groq`
fn person::full($person) = $person{
    _id,
    name,
    title,
    defined(picture)=>{ "picture": sanityImage::full(picture) }
};
` //TODO: Check if person query works if yes ,use person::full(@) wherever a person reference is needed

const sanityFunctionQueries = groq`
${sanityImageFunction}
${personQueryFunction}

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

fn sanityButton::full($button) = $button{
    "buttonLabel": stringTitle,
    _id,
    defined(buttonColorVariant) => {"buttonColorVariant": buttonColorVariant},
    ...linkSelector::full(@),
};

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

export { personQueryFunction, sanityFunctionQueries, sanityImageFunction }
