import { encodeAddress } from "@polkadot/util-crypto";
import BigNumber from "bignumber.js";
import { Spinner } from "grommet";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useWeb3 } from "../../Web3Provider";
import { useAuctionContext } from "../shared/context/AuctionContext";
import { useStakeFormContext } from "../shared/context/StakeFormContext";

import { CFG_PLANCK, DOT_PLANCK, PARACHAIN_NAME } from "../shared/const";
import { formatCFG, formatDOT } from "../shared/format";

import { TextSpan } from "../shared/TextSpan";
import { onBreakpoint } from "../shared/responsive";
import { ExternalLink } from "../../Links";
import {
  REWARD_CFG_PER_DOT,
  REWARD_EARLY_BIRD_PERCENT,
  REWARD_LOYALTY_PERCENT,
  REWARD_REFERRAL_PERCENT,
} from "../shared/config";

const RewardsBreakdownStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8f8f8;
  border-radius: 6px;
  padding: 24px;

  text-align: center;

  ${onBreakpoint("M")} {
    text-align: left;
  }
`;

const TextHeading2 = styled.span<{ color?: string }>`
  font-size: 20px;
  line-height: 25px;
  font-weight: 600;
  color: ${({ theme, color }) =>
    theme.global.colors[color || ""] || color || "black"};
`;

const TextLabel = styled.span`
  font-size: 16px;
  line-height: 22px;
  font-weight: 500;

  color: #757575;
`;

const StatsItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const Divider = styled.div`
  height: 1px;
  background: #757575;
`;

const CustomSpinner = styled(Spinner)`
  height: 10px;
  width: 10px;
  display: inline-block;
  padding: 6px;
  margin-right: 8px;
`;

const SubscanLink = styled(ExternalLink)`
  color: #757575;
`;

type StatType = {
  value?: string;
  label: string;
  color?: string;
};
const Stat: React.FC<StatType> = ({ value, label, color }) => {
  const { crowdloanPhase } = useAuctionContext();

  const isAuctionEnded = crowdloanPhase === "ended";

  if (!isAuctionEnded && new BigNumber(value || 0).isZero()) return null;
  return (
    <StatsItem>
      <TextHeading2 color={color}>
        {value ? (
          formatCFG(value, 3, false, true, true)
        ) : (
          <CustomSpinner color="brand" />
        )}{" "}
        CFG
      </TextHeading2>
      <TextLabel>{label}</TextLabel>
    </StatsItem>
  );
};

type RewardDataResponse = {
  contributionAmount?: string;
  earlyBirdBonus?: string;
  firstCrowdloanBonus?: string;
  numberOfReferrals?: string;
  referralBonus?: string;
  isFirst250PrevCrwdloan?: boolean;
};

export const RewardsBreakdown: React.FC<{}> = () => {
  const { selectedAccount } = useWeb3();
  const [rewardsData, setRewardsData] = useState<RewardDataResponse>({});

  const { dotAmount, referralCode } = useStakeFormContext();
  const { isEarlyBird, crowdloanPhase } = useAuctionContext();

  const [stakedAmount, setStakedAmount] = useState<string>();

  const [rewardStaking, setRewardStaking] = useState<string>();
  const [rewardEarlyBird, setRewardEarlyBird] = useState<string>();
  const [rewardReferral, setRewardReferral] = useState<string>();
  const [rewardLoyalty, setRewardLoyalty] = useState<string>();
  const [totalRewards, setTotalRewards] = useState<string>();

  const hasRewards = !new BigNumber(totalRewards || 0).isZero();
  const isAuctionEnded = crowdloanPhase === "ended";

  useEffect(() => {
    if (!rewardsData) {
      return;
    }
    const curAmountNum =
      Number.isNaN(parseFloat(dotAmount)) || isAuctionEnded
        ? 0
        : parseFloat(dotAmount);

    const earlyBirdFactor = isEarlyBird ? REWARD_EARLY_BIRD_PERCENT / 100 : 0;
    const referralFactor = referralCode ? REWARD_REFERRAL_PERCENT / 100 : 0;
    const loyaltyFactor = rewardsData.isFirst250PrevCrwdloan
      ? REWARD_LOYALTY_PERCENT / 100
      : 0;

    // convert values in BN
    const curAmount = new BigNumber(curAmountNum * DOT_PLANCK);
    const dataAmount = new BigNumber(rewardsData.contributionAmount || 0);
    const totalAmount = curAmount.plus(dataAmount);
    const dataEarlyBirdBonus = new BigNumber(rewardsData.earlyBirdBonus || 0);
    const dataReferralBonus = new BigNumber(rewardsData.referralBonus || 0);

    // calculate rewards
    const curStakingBonus = curAmount
      .div(DOT_PLANCK) // to DOT
      .times(REWARD_CFG_PER_DOT)
      .times(CFG_PLANCK); // to CFG
    const dataStakingBonus = dataAmount
      .div(DOT_PLANCK) // to DOT
      .times(REWARD_CFG_PER_DOT)
      .times(CFG_PLANCK); // to CFG

    const totalStakingBonus = curStakingBonus.plus(dataStakingBonus);

    const curEarlyBirdBonus = curStakingBonus.times(earlyBirdFactor);
    const totalEarlyBirdBonus = curEarlyBirdBonus.plus(dataEarlyBirdBonus);

    const curReferralBonus = curStakingBonus.times(referralFactor);
    const totalReferralBonus = curReferralBonus.plus(dataReferralBonus);

    const totalLoyaltyBonus = totalStakingBonus.times(loyaltyFactor);

    const totalBonus = totalStakingBonus
      .plus(totalEarlyBirdBonus)
      .plus(totalReferralBonus)
      .plus(totalLoyaltyBonus);

    // show values
    setStakedAmount(totalAmount.toString());
    setRewardStaking(totalStakingBonus.toString());
    setRewardEarlyBird(totalEarlyBirdBonus.toFixed());
    setRewardReferral(totalReferralBonus.toString());
    setRewardLoyalty(totalLoyaltyBonus.toString());
    setTotalRewards(totalBonus.toString());
  }, [dotAmount, referralCode, rewardsData]);

  useEffect(() => {
    (async () => {
      if (!selectedAccount?.address) {
        return;
      }
      const response = await fetch("/.netlify/functions/getRewardData", {
        method: "POST",
        body: JSON.stringify({
          address: encodeAddress(selectedAccount.address, 2),
          parachain: PARACHAIN_NAME,
        }),
      });

      const json = await response.json();

      setRewardsData(json);
    })();
  }, [selectedAccount?.address]);

  return (
    <RewardsBreakdownStyled>
      <div>
        <TextHeading2>Estimated rewards</TextHeading2>
      </div>
      <StatsItem>
        <TextSpan
          css={`
            font-size: 20px;
            line-height: 32px;
            font-weight: 600;
            color: #000;
          `}
        >
          {stakedAmount ? (
            formatDOT(stakedAmount, 3, false, true, true)
          ) : (
            <CustomSpinner color="brand" />
          )}{" "}
          DOT
        </TextSpan>
        <TextLabel>Staked amount</TextLabel>
      </StatsItem>

      {(hasRewards || isAuctionEnded) && (
        <>
          <Divider />

          <Stat value={rewardStaking} label="Base reward" />
          <Stat value={rewardEarlyBird} label="Early bird reward" />
          <Stat value={rewardReferral} label="Referral reward" />
          <Stat value={rewardLoyalty} label="Loyalty reward" />

          <Stat value={totalRewards} label="Total rewards" color="brand" />
        </>
      )}

      {selectedAccount?.address && (
        <>
          <Divider />
          <SubscanLink
            unstyled={0}
            href={`https://polkadot.subscan.io/account/${selectedAccount.address}`}
          >
            View account on Subscan
          </SubscanLink>
        </>
      )}
    </RewardsBreakdownStyled>
  );
};