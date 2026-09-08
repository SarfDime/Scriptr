import { groq } from 'next-sanity'

// TODO: Change link selector to not be all pages, since it's only selecting one page
const sanityFunctionQueries = groq`
fn sanityImage::full($image) = $image{ asset, crop, hotspot, cornerRadius, rounded, hexagon, edgeInset, "alt": asset->altText};

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

export { sanityFunctionQueries }
