/**
 * Copyright Zendesk, Inc.
 *
 * Use of this source code is governed under the Apache License, Version 2.0
 * found at http://www.apache.org/licenses/LICENSE-2.0.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { strokeWidthFrames, dasharrayFrames, rotationFrames } from './utils/spinner-coordinates';
import { LoadingPlaceholder, SpinnerCircle, StyledSVG } from './styled-elements';

const COMPONENT_ID = 'loaders.spinner';

export default class Spinner extends React.Component {
  constructor(props) {
    super(props);

    this.strokeWidthValues = this.computeFrames(strokeWidthFrames);
    this.rotationValues = this.computeFrames(rotationFrames);
    this.dasharrayValues = this.computeFrames(dasharrayFrames);
  }

  static propTypes = {
    /**
     * Size of the loader. Can inherit from `font-size` styling.
     **/
    size: PropTypes.any,
    /**
     * Duration (ms) of the animation. Default is 1250ms.
     **/
    duration: PropTypes.number,
    /**
     * Color of the loader. Can inherit from `color` styling.
     **/
    color: PropTypes.string,
    /**
     * Delay in MS to begin loader rendering. This helps prevent
     * quick flashes of the loader during normal loading times.
     **/
    delayMS: PropTypes.number
  };

  static defaultProps = {
    size: 'inherit',
    color: 'inherit',
    delayMS: 750,
    duration: 1250
  };

  state = {
    frame: 0,
    rawFrame: 0,
    totalFrames: 99,
    delayComplete: false,
    timestamp: 0
  };

  computeFrames = frames => {
    const { duration } = this.props;

    return Object.entries(frames).reduce((acc, item, index, arr) => {
      const [frame, value] = item;
      const [nextFrame, nextValue] = arr[index + 1] || ['100', arr[0][1]];
      const diff = nextFrame - frame - 1;
      const frameHz = 1000 / 60;

      let subDuration = (duration / 100) * diff;
      let lastValue = value;

      acc[frame] = value;
      for (let idx = 0; idx < diff; idx++) {
        lastValue = lastValue + (nextValue - lastValue) * (frameHz / subDuration);
        subDuration = (duration / 100) * (diff - idx);

        acc[parseInt(frame, 10) + idx + 1] = lastValue;
      }
      acc[nextFrame] = nextValue;

      return acc;
    }, {});
  };

  componentDidMount() {
    const { delayMS } = this.props;

    this.renderingDelayTimeout = setTimeout(() => {
      this.setState({ delayComplete: true }, () => {
        this.performAnimationFrame();
      });
    }, delayMS);
  }

  componentWillUnmount() {
    clearTimeout(this.renderingDelayTimeout);
    cancelAnimationFrame(this.animationFrame);
  }

  performAnimationFrame = (nowTime = 0) => {
    const { totalFrames, rawFrame, timestamp } = this.state;
    const { duration } = this.props;
    const elapsedTime = nowTime - timestamp;

    this.setState(
      () => {
        const frameMultiplier = (totalFrames + 1) / duration;
        const nextValue = rawFrame + elapsedTime * frameMultiplier;
        const actualFrame = Math.floor(nextValue);
        const frame = actualFrame % totalFrames;
        const currentRawFrame = nextValue % totalFrames;

        return { frame, rawFrame: currentRawFrame, timestamp: nowTime };
      },
      () => {
        this.animationFrame = requestAnimationFrame(this.performAnimationFrame);
      }
    );
  };

  render() {
    const { size, color, delayMS, ...other } = this.props;
    const { delayComplete, frame } = this.state;

    if (!delayComplete && delayMS !== 0) {
      return <LoadingPlaceholder fontSize={size}>&nbsp;</LoadingPlaceholder>;
    }

    const strokeWidthValue = this.strokeWidthValues[frame];
    const rotationValue = this.rotationValues[frame];
    const dasharrayValue = this.dasharrayValues[frame];

    return (
      <StyledSVG
        fontSize={size}
        color={color}
        width="80"
        height="80"
        data-garden-id={COMPONENT_ID}
        {...other}
      >
        <SpinnerCircle
          strokeDasharray={`${dasharrayValue} 250`}
          strokeWidth={strokeWidthValue}
          transform={`rotate(${rotationValue})`}
        />
      </StyledSVG>
    );
  }
}
