"use client";
import { BADGES } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import { Icon } from "./Icon";

export function BadgeGrid({ have, showHow }: { have: string[]; showHow?: boolean }) {
  const { tr } = useLang();
  return (
    <div className="badges">
      {BADGES.map((b) => {
        const ok = have.includes(b.id);
        return (
          <div key={b.id} className={"badge" + (ok ? "" : " lock")} title={tr(b.how)}>
            <div className="ic"><Icon name={ok ? b.icon : "lock"} /></div>
            <span>{tr(b.name)}</span>
            {showHow && <small className="muted" style={{ fontWeight: 500 }}>{tr(b.how)}</small>}
          </div>
        );
      })}
    </div>
  );
}
