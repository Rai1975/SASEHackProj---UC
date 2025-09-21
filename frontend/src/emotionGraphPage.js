import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Button,
} from "@mui/material";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

export default function StimulusEmotionPage({ apiBaseUrl }) {
  const [data, setData] = useState({});
  const [stimulus, setStimulus] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/stimulus/emotion-mapping`);
        const json = await res.json();
        setData(json);

        // Default stimulus = first one in result
        const firstStimulus = Object.keys(json)[0];
        if (firstStimulus) {
          setStimulus(firstStimulus);
          setIndex(0);
        }
      } catch (err) {
        console.error("Failed to fetch:", err);
      }
    };

    fetchData();
  }, [apiBaseUrl]);

  const handleStimulusChange = (e) => {
    setStimulus(e.target.value);
    setIndex(0);
  };

  if (!stimulus || !data[stimulus]) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading data...</Typography>
      </Container>
    );
  }

  const entries = data[stimulus];
  const currentEntry = entries[index];

  // Transform into radar chart format
  const radarData = Object.entries(currentEntry.emotions).map(([emotion, value]) => ({
    emotion,
    value,
  }));

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Stimulus → Emotion Mapping
      </Typography>

      {/* Stimulus Picker */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Stimulus</InputLabel>
        <Select value={stimulus} onChange={handleStimulusChange}>
          {Object.keys(data).map((word) => (
            <MenuItem key={word} value={word}>
              {word}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Radar Chart */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {stimulus} @ {new Date(currentEntry.created_at).toLocaleString()}
        </Typography>
        <Divider sx={{ my: 1 }} />

        <Box sx={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="emotion" />
              <PolarRadiusAxis domain={[0, 1]} />
              <Radar
                name={stimulus}
                dataKey="value"
                stroke="#1976d2"
                fill="#1976d2"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>

        {/* Time navigation */}
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button
            variant="outlined"
            disabled={index === 0}
            onClick={() => setIndex((prev) => prev - 1)}
          >
            Previous
          </Button>
          <Typography>
            {index + 1} / {entries.length}
          </Typography>
          <Button
            variant="outlined"
            disabled={index === entries.length - 1}
            onClick={() => setIndex((prev) => prev + 1)}
          >
            Next
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
