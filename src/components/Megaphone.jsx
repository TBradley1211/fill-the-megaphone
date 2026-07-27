import megaphoneImage from "../assets/gators-megaphone.svg";

function Megaphone({ progress = 0 }) {
  const safeProgress = Math.min(
    Math.max(Number(progress) || 0, 0),
    100
  );

  return (
    <div className="megaphone-wrapper">
      <img
        src={megaphoneImage}
        alt={`Gators Cheer megaphone. Fundraiser is ${safeProgress}% complete.`}
        className="megaphone-image"
      />
    </div>
  );
}

export default Megaphone;