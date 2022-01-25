// Copyright 2017-2022 @polkadot/ authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ReactTooltip from 'react-tooltip';
import styled, { ThemeContext } from 'styled-components';

import { Theme } from '@polkadot/extension-koni-ui/components';

function rootElement () {
  return typeof document === 'undefined'
    ? null // This hack is required for server side rendering
    : document.getElementById('tooltips');
}

interface Props {
  className?: string;
  clickable?: boolean;
  dataFor?: string;
  effect?: 'solid' | 'float';
  offset?: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
  place?: 'bottom' | 'top' | 'right' | 'left';
  text: React.ReactNode;
  trigger: string;
}

function Tooltip ({ className = '', clickable = false, effect = 'solid', offset, place = 'top', text, trigger }: Props): React.ReactElement<Props> | null {
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const theme = themeContext.id;
  const [tooltipContainer] = useState(
    typeof document === 'undefined'
      ? {} as HTMLElement // This hack is required for server side rendering
      : document.createElement('div')
  );

  useEffect((): () => void => {
    const root = rootElement();

    root && root.appendChild(tooltipContainer);

    return (): void => {
      root && root.removeChild(tooltipContainer);
    };
  }, [tooltipContainer]);

  return ReactDOM.createPortal(
    <ReactTooltip
      backgroundColor={theme === 'dark' ? '#fff' : ''}
      className={`ui--Tooltip ${className}`}
      clickable={clickable}
      effect={effect}
      id={trigger}
      offset={offset}
      place={place}
      textColor={theme === 'dark' ? '#00072D' : ''}
    >
      {className?.includes('address') ? <div>{text}</div> : text}
    </ReactTooltip>,
    tooltipContainer
  );
}

export default React.memo(styled(Tooltip)`
  > div {
    overflow: hidden;
  }

  &.ui--Tooltip {
    z-index: 1100;
    max-width: 300px;
    text-align: center;
  }

  table {
    border: 0;
    overflow: hidden;
    width: 100%;

    td {
      text-align: left;
    }

    td:first-child {
      opacity: 0.75;
      padding-right: 0.25rem;
      text-align: right;
      white-space: nowrap;
    }
  }

  div+table,
  table+div {
    margin-top: 0.75rem;
  }

  > div+div {
    margin-top: 0.5rem;
  }

  &.address div {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .faded {
    margin-top: 0;
    opacity: 0.75 !important;
    font-size: 0.85em !important;

    .faded {
      font-size: 1em !important;
    }
  }

  .faded+.faded {
    margin-top: 0;
  }

  .row+.row {
    margin-top: 0.5rem;
  }
`);