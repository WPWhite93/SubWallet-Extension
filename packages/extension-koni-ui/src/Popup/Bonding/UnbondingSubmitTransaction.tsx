// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ActionContext } from '@subwallet/extension-koni-ui/components';
import Button from '@subwallet/extension-koni-ui/components/Button';
import InputAddress from '@subwallet/extension-koni-ui/components/InputAddress';
import InputBalance from '@subwallet/extension-koni-ui/components/InputBalance';
import Spinner from '@subwallet/extension-koni-ui/components/Spinner';
import useGetNetworkJson from '@subwallet/extension-koni-ui/hooks/screen/home/useGetNetworkJson';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { getUnbondingTxInfo } from '@subwallet/extension-koni-ui/messaging';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import UnbondingAuthTransaction from '@subwallet/extension-koni-ui/Popup/Bonding/components/UnbondingAuthTransaction';
import UnbondingResult from '@subwallet/extension-koni-ui/Popup/Bonding/components/UnbondingResult';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BN } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
}

function UnbondingSubmitTransaction ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const navigate = useContext(ActionContext);
  const { currentAccount: { account }, unbondingParams } = useSelector((state: RootState) => state);
  const selectedNetwork = unbondingParams.selectedNetwork as string;
  const bondedAmount = unbondingParams.bondedAmount as number;

  const networkJson = useGetNetworkJson(selectedNetwork);
  const [amount, setAmount] = useState(bondedAmount);
  const [isReadySubmit, setIsReadySubmit] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isClickNext, setIsClickNext] = useState(false);

  const [fee, setFee] = useState('');
  const [balanceError, setBalanceError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extrinsicHash, setExtrinsicHash] = useState('');
  const [isTxSuccess, setIsTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');

  const goHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (!isClickNext) {
      if (amount > 0 && amount <= bondedAmount) {
        setIsReadySubmit(true);
      } else {
        setIsReadySubmit(false);

        if (amount > bondedAmount) {
          show(`Your total stake is ${bondedAmount} ${networkJson.nativeToken as string}`);
        }
      }
    }
  }, [amount, bondedAmount, isClickNext, networkJson.decimals, networkJson.nativeToken, show, showAuth, showResult]);

  const convertToBN = useCallback(() => {
    const stringValue = (parseFloat(bondedAmount.toString()) * (10 ** (networkJson.decimals as number))).toString();

    return new BN(stringValue);
  }, [bondedAmount, networkJson.decimals]);

  const handleResend = useCallback(() => {
    setExtrinsicHash('');
    setIsTxSuccess(false);
    setTxError('');
    setShowResult(false);
    setShowAuth(true);
    setIsClickNext(false);
  }, []);

  const handleChangeAmount = useCallback((value: BN | string) => {
    let parsedValue;

    if (value instanceof BN) {
      parsedValue = parseFloat(value.toString()) / (10 ** (networkJson.decimals as number));
    } else {
      parsedValue = parseFloat(value) / (10 ** (networkJson.decimals as number));
    }

    if (isNaN(parsedValue)) {
      setAmount(-1);
    } else {
      setAmount(parsedValue);
    }
  }, [networkJson.decimals]);

  const handleClickCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleConfirm = useCallback(() => {
    setLoading(true);
    getUnbondingTxInfo({
      address: account?.address as string,
      amount,
      networkKey: selectedNetwork
    })
      .then((resp) => {
        setLoading(false);
        setIsClickNext(true);
        setFee(resp.fee);
        setBalanceError(resp.balanceError);
        setShowAuth(true);
        setShowResult(false);
      })
      .catch(console.error);
  }, [account?.address, amount, selectedNetwork]);

  return (
    <div className={className}>
      <Header
        isShowNetworkSelect={false}
        showCancelButton={false}
        showSubHeader
        subHeaderName={t<string>('Unstaking action')}
      />

      {!showResult && <div
        className={'bonding-submit-container'}
      >
        <InputAddress
          autoPrefill={false}
          className={'receive-input-address'}
          defaultValue={account?.address}
          help={t<string>('The account which you will unstake')}
          isDisabled={true}
          isSetDefaultValue={true}
          label={t<string>('Unstake from account')}
          networkPrefix={networkJson.ss58Format}
          type='allPlus'
          withEllipsis
        />

        <div className={'unbonding-input'}>
          <InputBalance
            autoFocus
            className={'submit-bond-amount-input'}
            decimals={networkJson.decimals}
            defaultValue={convertToBN()}
            help={`Type the amount you want to unstake. The maximum amount is ${bondedAmount} ${networkJson.nativeToken as string}`}
            inputAddressHelp={''}
            isError={false}
            isZeroable={false}
            label={t<string>('Amount')}
            onChange={handleChangeAmount}
            placeholder={'0'}
            siDecimals={networkJson.decimals}
            siSymbol={networkJson.nativeToken}
          />
        </div>

        <div className='bonding-submit__separator' />

        <div className={'bonding-btn-container'}>
          <Button
            className={'bonding-cancel-button'}
            isDisabled={loading}
            onClick={handleClickCancel}
          >
            Cancel
          </Button>
          <Button
            isDisabled={!isReadySubmit}
            onClick={handleConfirm}
          >
            {
              loading
                ? <Spinner />
                : <span>Next</span>
            }
          </Button>
        </div>
      </div>}

      {showAuth && !showResult &&
        <UnbondingAuthTransaction
          amount={amount}
          balanceError={balanceError}
          fee={fee}
          selectedNetwork={selectedNetwork}
          setExtrinsicHash={setExtrinsicHash}
          setIsTxSuccess={setIsTxSuccess}
          setShowConfirm={setShowAuth}
          setShowResult={setShowResult}
          setTxError={setTxError}
        />
      }

      {!showAuth && showResult &&
        <UnbondingResult
          backToHome={goHome}
          extrinsicHash={extrinsicHash}
          handleResend={handleResend}
          isTxSuccess={isTxSuccess}
          networkKey={selectedNetwork}
          txError={txError}
        />
      }
    </div>
  );
}

export default React.memo(styled(UnbondingSubmitTransaction)(({ theme }: Props) => `
  .unbonding-input {
    margin-top: 20px;
  }

  .validator-att-title {
    color: ${theme.textColor2};
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .validator-verified {
    color: ${theme.textColor3};
    font-size: 12px;
  }

  .bonding-cancel-button {
    color: ${theme.textColor3};
    background: ${theme.buttonBackground1};
  }

  .bonding-btn-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  .bonding-submit__separator {
    margin-top: 30px;
    margin-bottom: 30px;
  }

  .bonding-submit__separator:before {
    content: "";
    height: 1px;
    display: block;
    background: ${theme.boxBorderColor};
  }

  .submit-bond-amount-input {
    margin-top: 15px;
  }

  .auth-bonding__input-address {
    margin-top: 25px;
  }

  .selected-validator-view {
    margin-top: 10px;
    background: ${theme.accountAuthorizeRequest};
    border-radius: 8px;
  }

  .validator-att-value {
    color: ${theme.textColor3};
    font-size: 14px;
  }

  .validator-att-value-error {
    color: ${theme.errorColor};
    font-size: 14px;
  }

  .validator-att-value-warning {
    color: ${theme.iconWarningColor};
    font-size: 14px;
  }

  .validator-att {
    width: 50%;
  }

  .validator-att-container {
    width: 100%;
    margin-bottom: 15px;
    display: flex;
    gap: 20px;
  }

  .validator-detail-container {
    background: ${theme.accountAuthorizeRequest};
    padding: 10px 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 0 0 8px 8px;
  }

  .validator-item-toggle {
    border-style: solid;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 2.5px;
  }

  .validator-item-toggle-container {
    display: flex;
    align-items: center;
  }

  .validator-expected-return {
    font-size: 14px;
    color: ${theme.textColor3};
  }

  .validator-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .identityIcon {
    border: 2px solid ${theme.checkDotColor};
  }

  .validator-header {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .validator-item-container {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.backgroundAccountAddress};
    padding: 10px 15px;
    border-radius: 8px;
    gap: 10px;
  }

  .selected-validator {
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
  }

  .bonding-input-filter-container {
    padding: 0 15px 12px;
  }

  .bonding-submit-container {
    overflow-y: scroll;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 10px;
  }
`));