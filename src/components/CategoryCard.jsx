function CategoryCard({
  title,
  description,
  progress,
  totalText,
  buttonText,
  buttonLink,
  external = false,
}) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <article className="category-card">
      <h3>{title}</h3>

      <p>{description}</p>

      <div
        className="progress-track"
        role="progressbar"
        aria-label={`${title} progress`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={safeProgress}
      >
        <div
          className="progress-fill"
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      <span className="category-total">{totalText}</span>

      <a
        className="action-button"
        href={buttonLink}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
      >
        {buttonText}
      </a>
    </article>
  );
}

export default CategoryCard;