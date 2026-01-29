"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Season = { id: string; name: string };

export default function SeasonSwitcher(props: { seasons: Season[]; currentId: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const returnTo = useMemo(() => {
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, sp]);

  const [seasonId, setSeasonId] = useState(props.currentId);

  return (
    <form action="/season" method="post" className="flex items-center gap-2">
      <input type="hidden" name="return_to" value={returnTo} />

      <select
        name="season_id"
        value={seasonId}
        onChange={(e) => {
          setSeasonId(e.target.value);
          (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
        }}
        className="border rounded-md px-2 py-2 bg-background text-sm max-w-[220px]"
        title="Seleziona stagione"
      >
        {props.seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </form>
  );
}
