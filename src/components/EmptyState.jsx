import Icon from "./Icon";

export default function EmptyState({ icon = "sparkles", title, description }) {
  return <div className="empty-state card"><span><Icon name={icon} size={25}/></span><h3>{title}</h3><p>{description}</p></div>;
}
