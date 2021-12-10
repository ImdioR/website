import React, { useEffect, useMemo, useState } from "react";
import { TopList } from "../shared/Leaderboard";
import { formatDOT, truncateAddress } from "../shared/format";
import { PARACHAIN_NAME } from "../shared/const";

type TopContributorsResponse = {
  numberOfContributions: number;
  account: string;
  amount: string;
}[];

export const TopContributors: React.FC = () => {
  const [topContributors, setTopContributors] = useState<
    TopContributorsResponse
  >();
  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await fetch("/.netlify/functions/getTopContributors", {
        method: "POST",
        body: JSON.stringify({ amount: 5, parachain: PARACHAIN_NAME }),
      });

      const json = await response.json();

      if (mounted) {
        setTopContributors(json);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const listItems = useMemo(
    () =>
      topContributors
        ? topContributors.map((item) => ({
            label: truncateAddress(item.account),
            value: `${formatDOT(item.amount)} DOT`,
          }))
        : [],
    [topContributors]
  );

  return <TopList title="Top contributors" items={listItems} />;
};