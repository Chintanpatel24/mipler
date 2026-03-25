import React from 'react';
import { type EdgeProps, getBezierPath } from 'reactflow';

/**
 * Custom "rope" edge that mimics a string tying two evidence cards together.
 */
export const RopeEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3,
  });

  return (
    <>
      {/* Shadow / glow */}
      <path
        id={`${id}-shadow`}
        style={{
          stroke: 'rgba(100,100,100,0.2)',
          strokeWidth: 4,
          fill: 'none',
        }}
        d={edgePath}
      />
      {/* Main rope line */}
      <path
        id={id}
        style={{
          stroke: '#666666',
          strokeWidth: 1.5,
          strokeDasharray: '6 3',
          strokeLinecap: 'round',
          fill: 'none',
          ...style,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {/* Source pin */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={3}
        fill="#555"
        stroke="#777"
        strokeWidth={1}
      />
      {/* Target pin */}
      <circle
        cx={targetX}
        cy={targetY}
        r={3}
        fill="#555"
        stroke="#777"
        strokeWidth={1}
      />
    </>
  );
};