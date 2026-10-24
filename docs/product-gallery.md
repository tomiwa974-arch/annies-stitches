# Product photos and popup behaviour

Admin product creation and editing supports a main photo plus up to 2 additional photos. Select multiple files under **Additional photos**. Each photo accepts JPG, PNG or WebP up to 8 MB; the combined request limit is 20 MB. Saving appends new photos to the gallery in selection order. Existing photos can be marked **Remove on save**. Cancelling leaves the saved gallery unchanged. File validation, gallery records and product changes use the existing upload rollback and database transaction.

The store popup and enlarged viewer use the same ordered, deduplicated list of at most three photos. Clicking a thumbnail changes the large preview without opening the viewer. Clicking the large preview opens that selected image in the enlarged viewer; next/previous buttons and arrow keys navigate, and Escape closes the viewer. Image indexes are bounded to the current list. The popup renders as a stable DOM subtree so size, colour, quantity and measurement state changes preserve the scroll container and input focus.

Validation covers multi-file uploads, saved photo removal and public gallery records. Browser checks cover scroll and focus retention while selecting sizes, changing quantity and typing measurements, plus opening and navigating each photo on desktop and phone widths.
