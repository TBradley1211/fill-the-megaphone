import megaphoneImage from "../assets/gators-megaphone.svg";

function Megaphone({ progress = 0 }) {
  const safeProgress = Math.min(
    Math.max(Number(progress) || 0, 0),
    100
  );

  return (
    <div
      className="megaphone-wrapper"
      role="img"
      aria-label={`Gators Cheer megaphone. Fundraiser is ${Math.round(
        safeProgress
      )}% complete.`}
      style={{
        "--megaphone-progress": `${safeProgress}%`,
      }}
    >
      <div className="megaphone-progress-visual" aria-hidden="true">
        <img
          src={megaphoneImage}
          alt=""
          className="megaphone-image megaphone-image-base"
        />

        <div className="megaphone-fill-layer">
          <img
            src={megaphoneImage}
            alt=""
            className="megaphone-image megaphone-image-fill"
          />
        </div>

        <span className="megaphone-shine" />
      </div>

      <span className="megaphone-progress-label">
        {Math.round(safeProgress)}% filled
      </span>
    </div>
  );
}

export default Megaphone;