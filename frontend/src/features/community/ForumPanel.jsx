import { useId } from "react";

import Card from "../../components/common/Card";
import { MessagesSquare } from "../../components/common/icons";
import cx from "../../utils/cx";

// posts: [{ id, title, author }]. Empty until Phase 3. Rendered as plain text.
function ForumPanel({ posts = [], className = "" }) {
  const titleId = useId();

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className={cx("flex h-full flex-col gap-3 p-5", className)}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-canvas text-accent">
          <MessagesSquare className="size-5" aria-hidden="true" />
        </span>
        <h2 id={titleId} className="text-lg font-semibold text-fg">
          Discussion forum
        </h2>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm leading-6 text-muted">
          Coming soon: talk about your favorite anime with other users.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li key={post.id} className="py-2">
              <p className="truncate text-sm font-medium text-fg">
                {post.title}
              </p>
              <p className="truncate text-xs text-muted">{post.author}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default ForumPanel;
