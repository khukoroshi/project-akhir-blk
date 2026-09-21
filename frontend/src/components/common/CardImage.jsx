import { Link } from "react-router-dom";
import formatStatus from "../../utils/formatStatus";

const CardImage = ({ data }) => {
  const title =
    data.title?.english ||
    data.title?.romaji ||
    data.title?.native ||
    "Unknown Anime";

  const score = data.averageScore ? (data.averageScore / 10).toFixed(1) : null;

  return (
    <Link
      to={`/anime/${data.id}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      {/* ========================= */}
      {/* COVER */}
      {/* ========================= */}

      <div className="relative aspect-[2/3] overflow-hidden bg-slate-100">
        <img
          src={data.coverImage?.large}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay */}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60" />

        {/* Score */}

        <div className="absolute left-2.5 top-2.5 rounded-lg bg-slate-900/85 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
          {score ? `★ ${score}` : "N/A"}
        </div>

        {/* Format */}

        {data.format && (
          <div className="absolute right-2.5 top-2.5 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-800 backdrop-blur">
            {data.format}
          </div>
        )}

        {/* Hover detail */}

        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-lg bg-black/70 px-3 py-2 text-center text-xs font-semibold text-white backdrop-blur">
            View Details
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* CONTENT */}
      {/* ========================= */}

      <div className="p-3">
        {/* TITLE */}

        <h3
          className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-slate-900 dark:text-white"
          title={title}
        >
          {title}
        </h3>

        {/* INFO */}

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{data.episodes ? `${data.episodes} eps` : "Unknown eps"}</span>

          <span className="truncate">
            {data.status ? formatStatus(data.status) : "Unknown"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CardImage;
