import cx from "../../utils/cx";

export default function Card({
  as: Tag = "div",
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={cx(
        "rounded-md border border-border bg-subtle text-fg",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
