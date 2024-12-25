import React, { FC } from "react";
import styled from "styled-components";

interface LoaderProps {
  className?: string;
  size?: number;
  color?: string;
  speed?: number;
}

interface StyledWrapperProps {
  size: number;
  color: string;
  speed: number;
}

const Loader: FC<LoaderProps> = ({ 
  className = '', 
  size = 54, 
  color = 'rgb(255,255,255)', 
  speed = 1.5 
}) => {
  return (
    <StyledWrapper className={className} size={size} color={color} speed={speed}>
      <div className="loader">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`bar${i + 1}`} />
        ))}
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<StyledWrapperProps>`
  .loader {
    position: relative;
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    border-radius: 10px;
  }

  .loader div {
    width: 8%;
    height: 24%;
    background: ${props => props.color};
    position: absolute;
    left: 50%;
    top: 30%;
    opacity: 0;
    border-radius: 50px;
    box-shadow: 0 0 3px rgba(0,0,0,0.2);
    animation: fade458 ${props => props.speed}s linear infinite;
  }

  @keyframes fade458 {
    0% {
      opacity: 1;
    }
    40% {
      opacity: 0.5;
    }
    60% {
      opacity: 0.1;
    }
    100% {
      opacity: 1;
    }
  }

  ${[...Array(12)].map((_, i) => `
    .loader .bar${i + 1} {
      transform: rotate(${30 * i}deg) translate(0, -130%);
      animation-delay: ${-1.2 + (0.1 * i)}s;
    }
  `)}
`;

export default Loader;