# Generated fashion imagery

Created with the built-in image generation tool. These are original fictional fashion concepts, not photographs of existing inventory or a real person. No laptop photos, uploaded pictures, stock photos, or existing image references were supplied to generation.

All final assets are saved in `public/images/generated/`. The concept catalogue is defined in `resources/generated-fashion-catalogue.json`. Product prices are preview values; stock starts at zero and can be configured in admin. Category covers, works, products, and product gallery images are real database records using the existing admin fields.

## Generation prompt set

Every prompt requested a single realistic professional fashion photograph with accurate textile/skin detail, natural directional light, restrained luxury styling, no collage, no text, logos, or watermarks, and no local/reference image input.

- `evening.png`: Vertical 2:3 full-length fictional adult Black Nigerian woman in a burgundy evening gown with a structured corset bodice, sculptural shoulders, and flowing skirt; warm stone architectural studio, full hem visible.
- `corset.png`: Vertical 2:3 full-length fictional adult Black Nigerian woman in an elegant ivory corset midi dress with a square neckline, sculptural seams, and brown heeled sandals; warm stone studio, full body visible.
- `asoebi.png`: Landscape 3:2 campaign with two fictional adult Black Nigerian women wearing coordinated emerald-and-gold Aso-Ebi dresses and gele headwraps; limestone courtyard, full outfits visible.
- `menswear.png`: Landscape 3:2 full-length fictional adult Black Nigerian man in an embroidered ivory senator tunic and matching trousers, with leather loafers; warm neutral architectural studio.
- `bridal.png`: Vertical 2:3 fictional adult Black Nigerian bride in an ivory satin gown with lace sleeves, a high neckline, and a delicate long veil; stone atelier with arched window light, full hem visible.
- `custom.png`: Square full-length campaign with fictional adult Black Nigerian woman and man; rust tailored women's trouser suit and chocolate men's two-piece suit with ivory shirt; limestone studio.
- `studio.png`: Landscape 3:2 architectural photograph of a fictional tailoring atelier: cream plaster, walnut tables, sewing machine, burgundy and ivory fabrics, dress forms with evening dress and men's jacket, arched-window daylight; no people or lettering.
- `suit.png`: Vertical 2:3 full-length fictional adult Black Nigerian man in a chocolate Western two-piece suit with open-collar ivory shirt and leather shoes; warm stone studio.

## Responsive covers

`ResponsiveFashionImage` reads the loaded image's natural dimensions. Portraits retain their shape, square pictures stay square, and landscape covers use a compact ratio between 1.6:1 and 2:1. `object-fit: contain` keeps the whole garment visible. This applies to collection covers and the work galleries reached through those covers, including future admin uploads.

## Database installation and checks

The initial connected database contained no categories, works, products, product images, or collection records. Test pictures were hardcoded application fallbacks. Those image references and sample products were replaced or removed; there were no existing image rows to delete. The empty-state snapshot is retained under ignored `tmp/image-refresh/`.

- `node scripts/install-generated-catalogue.cjs`: Install/update the concept catalogue without deleting existing products, users, or orders. Running again updates the generated category cover and matching concept product image paths.
- `node scripts/verify-generated-catalogue.cjs`: Check database image references and generated asset dimensions.
