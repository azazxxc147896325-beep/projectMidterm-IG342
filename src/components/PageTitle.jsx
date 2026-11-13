export default function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title">
      <div><span>{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </div>
  );
}
