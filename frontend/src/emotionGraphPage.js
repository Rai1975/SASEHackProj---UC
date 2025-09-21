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
  CircularProgress,
} from "@mui/material";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";

export default function StimulusEmotionPage({ apiBaseUrl }) {
  const [data, setData] = useState({});
  const [stimulus, setStimulus] = useState("");
  const [index, setIndex] = useState(0);
  const [insights, setInsights] = useState([]);
  const [insightIndex, setInsightIndex] = useState(0);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/stimulus/emotion-mapping`);
        const json = await res.json();
        setData(json);

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

  useEffect(() => {
    if (!stimulus) return;
    const fetchInsights = async () => {
        setLoadingInsights(true);
        try {
        const res = await fetch(`${apiBaseUrl}/insight/get-by-stim-id?id=${data[stimulus][0].stim_id}`);
        const json = await res.json();

        const sorted = [...json.entries].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        setInsights(sorted);
        setInsightIndex(0);
        } catch (err) {
        console.error("Failed to fetch insights:", err);
        setInsights([]);
        } finally {
        setLoadingInsights(false);
        }
    };

    fetchInsights();
    }, [stimulus, apiBaseUrl, data]);


  const handleStimulusChange = (e) => {
    setStimulus(e.target.value);
    setIndex(0);
  };

  const entries = stimulus && data[stimulus] ? data[stimulus] : [];
  const currentEntry = entries[index];
  const currentInsight = insights[insightIndex];

  // Fetch insights whenever the current stimulus entry changes
  useEffect(() => {
    const fetchInsights = async () => {
    //   if (!currentEntry || !currentEntry.stim_id) return;
      setLoadingInsights(true);
      try {
        const res = await fetch(
          `${apiBaseUrl}/insight/get-by-stim-id?id=${currentEntry.stim_id}`
        );
        const json = await res.json();
        // Filter insights to the same day
        const entryDate = dayjs(currentEntry.created_at).format("YYYY-MM-DD");
        const filtered = json.entries.filter(
          (ins) =>
            dayjs(ins.created_at).format("YYYY-MM-DD") === entryDate
        );
        setInsights(filtered);
      } catch (err) {
        console.error("Failed to fetch insights:", err);
        setInsights([]);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [currentEntry, apiBaseUrl]);

  if (!stimulus || entries.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading data...</Typography>
      </Container>
    );
  }

  // Transform into radar chart format
  const radarData = Object.entries(currentEntry.emotions).map(
    ([emotion, value]) => ({
      emotion,
      value,
    })
  );

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
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
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

      <Box mt={3}>
        <Typography variant="h6">Insights</Typography>
        <Divider sx={{ my: 1 }} />

        {loadingInsights ? (
            <CircularProgress size={24} />
        ) : currentInsight ? (
            <>
            <Typography variant="body2" gutterBottom>
                {currentInsight.insight}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {new Date(currentInsight.created_at).toLocaleString()}
            </Typography>

            {/* Time navigation for insights */}
            <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                variant="outlined"
                disabled={insightIndex === 0}
                onClick={() => setInsightIndex((prev) => prev - 1)}
                >
                Previous
                </Button>
                <Typography>
                {insightIndex + 1} / {insights.length}
                </Typography>
                <Button
                variant="outlined"
                disabled={insightIndex === insights.length - 1}
                onClick={() => setInsightIndex((prev) => prev + 1)}
                >
                Next
                </Button>
            </Box>
            </>
        ) : (
            <Typography variant="body2" color="text.secondary">
            No insights available.
            </Typography>
        )}
        </Box>
    </Container>
  );
}
