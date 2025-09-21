import React from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";

const EmotionRadar = ({ stimulus, emotions }) => {
  // `emotions` is expected to be an object like:
  // { Anger: 0.3, Happiness: 0.02, Sadness: 0.1, Fear: 0.4, Surprise: 0.15, Disgust: 0.2 }

  const data = Object.entries(emotions).map(([emotion, value]) => ({
    emotion,
    value
  }));

  return (
    <div style={{ width: "100%", height: 400 }}>
      <h3>{stimulus} → Emotion Mapping</h3>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="emotion" />
          <PolarRadiusAxis domain={[0, 1]} /> {/* values normalized between 0 and 1 */}
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
