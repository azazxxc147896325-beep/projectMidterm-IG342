import { useEffect, useState } from "react";

export default function AnimatedBackground() {
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const syncVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  return <div className={`animated-background${hidden ? " motion-paused" : ""}`} aria-hidden="true">
    <i className="ambient-circle ambient-circle-one" />
    <i className="ambient-circle ambient-circle-two" />
    {[0, 1, 2, 3].map((index) => <svg key={index} className={`ambient-quote ambient-quote-${index}`} viewBox="0 0 64 64" fill="none">
      <path d="M12 36h14V20H12v16c0 9 5 13 12 14M38 36h14V20H38v16c0 9 5 13 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>)}
  </div>;
}
