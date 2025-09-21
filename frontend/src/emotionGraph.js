import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const EmotionRadar = ({ stimulus, emotions, height = 220 }) => {
  // Transform emotions into chart-friendly data
  const data = Object.entries(emotions).map(([emotion, value]) => ({
    emotion,
    value,
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="70%"
          data={data}
          margin={{ top: 10, bottom: 10, left: 0, right: 0 }}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="emotion" />
          <PolarRadiusAxis domain={[0, 1]} />
          <Radar
            name={stimulus}
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmotionRadar;
