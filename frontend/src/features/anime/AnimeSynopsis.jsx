import DOMPurify from "dompurify";

import Card from "../../components/common/Card";

function AnimeSynopsis({ description }) {
  // Sanitize HTML from AniList; allow only basic formatting tags.
  const safeDescription = DOMPurify.sanitize(description || "", {
    ALLOWED_TAGS: ["br", "i", "b", "em", "strong", "p", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });

  return (
    <Card
      as="section"
      aria-labelledby="synopsis-heading"
      className="p-4 sm:p-6"
    >
      <h2 id="synopsis-heading" className="mb-3 text-xl font-semibold">
        Synopsis
      </h2>
      {safeDescription ? (
        <div
          className="max-w-4xl leading-7 text-muted [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
      ) : (
        <p className="text-muted">No synopsis available.</p>
      )}
    </Card>
  );
}

export default AnimeSynopsis;
