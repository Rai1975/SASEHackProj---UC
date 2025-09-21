import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [data, setData] = useState({});
  const [stimulus, setStimulus] = useState("");
  const [index, setIndex] = useState(0);
  const [allInsights, setAllInsights] = useState([]); // Store all insights for current stimulus
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/stimulus/emotion-mapping`);
        const json = await res.json();
        setData(json);

        // Check for pre-selected stimulus from URL params or navigation state
        const preSelectedStimId = searchParams.get('stimId') || location.state?.stimId;
        const preSelectedStimulus = searchParams.get('stimulus') || location.state?.stimulus;

        let selectedStimulus = null;

        // If we have a stimulus name, use it directly
        if (preSelectedStimulus && json[preSelectedStimulus]) {
          selectedStimulus = preSelectedStimulus;
        }
        // If we have a stimId, find the corresponding stimulus
        else if (preSelectedStimId) {
          selectedStimulus = Object.keys(json).find(stimulusKey =>
            json[stimulusKey].some(entry => entry.stim_id === preSelectedStimId)
          );
        }

        // Use pre-selected stimulus or fallback to first available
        const finalStimulus = selectedStimulus || Object.keys(json)[0];
        if (finalStimulus) {
          setStimulus(finalStimulus);
          setIndex(0);
        }
      } catch (err) {
        console.error("Failed to fetch:", err);
      }
    };

    fetchData();
  }, [apiBaseUrl, searchParams, location.state]);

  // Fetch all insights when stimulus changes
  useEffect(() => {
    if (!stimulus || !data[stimulus]) return;

    const fetchAllInsights = async () => {
      setLoadingInsights(true);
      try {
        const res = await fetch(`${apiBaseUrl}/insight/get-by-stim-id?id=${data[stimulus][0].stim_id}`);
        const json = await res.json();

        const sorted = [...json.entries].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        setAllInsights(sorted);
      } catch (err) {
        console.error("Failed to fetch insights:", err);
        setAllInsights([]);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchAllInsights();
  }, [stimulus, apiBaseUrl, data]);

  const handleStimulusChange = (e) => {
    setStimulus(e.target.value);
    setIndex(0);
  };

  const entries = stimulus && data[stimulus] ? data[stimulus] : [];
  const currentEntry = entries[index];

  // Get the current insight that corresponds to the current entry index
  const currentInsight = allInsights[index] || null;

  if (!stimulus || entries.length === 0) {
    return (
      <Container sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress size={40} sx={{ color: '#4F46E5', mb: 2 }} />
        <Typography sx={{ color: '#6B7280', fontFamily: '"Courier New", monospace' }}>
          gathering your thoughts...
        </Typography>
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
    <Container maxWidth="md" sx={{ mt: 4, mb: 6, px: { xs: 2, sm: 3 } }}>

      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2.25rem' },
            fontFamily: '"Courier New", monospace',
            fontWeight: '400',
            color: '#374151',
            mb: 2,
            letterSpacing: '0.5px'
          }}
        >
          emotional journey 🌊
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontStyle: 'italic',
            color: '#9CA3AF',
            fontWeight: '300'
          }}
        >
          exploring the feelings behind your thoughts
        </Typography>
      </Box>

      {/* Stimulus Picker */}
      <FormControl
        fullWidth
        sx={{
          mb: 4,
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: '#FEFCFB',
            border: '1px solid rgba(156, 163, 175, 0.2)',
            '& fieldset': {
              border: 'none'
            },
            '&:hover': {
              borderColor: 'rgba(79, 70, 229, 0.3)',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.1)'
            },
            '&.Mui-focused': {
              borderColor: '#4F46E5',
              boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)'
            }
          },
          '& .MuiInputLabel-root': {
            color: '#6B7280',
            '&.Mui-focused': {
              color: '#4F46E5'
            }
          }
        }}
      >
        <InputLabel>Choose your stimulus</InputLabel>
        <Select value={stimulus} onChange={handleStimulusChange}>
          {Object.keys(data).map((word) => (
            <MenuItem
              key={word}
              value={word}
              sx={{
                fontSize: '0.95rem',
                py: 1,
                '&:hover': {
                  bgcolor: 'rgba(79, 70, 229, 0.05)'
                }
              }}
            >
              {word}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Radar Chart */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 4 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(156, 163, 175, 0.2)',
          bgcolor: '#FEFCFB',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(79, 70, 229, 0.3)',
            boxShadow: '0 8px 25px rgba(79, 70, 229, 0.1)'
          }
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            fontWeight: '500',
            color: '#374151',
            mb: 1
          }}
        >
          {stimulus}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            color: '#9CA3AF',
            fontStyle: 'italic',
            mb: 2
          }}
        >
          {new Date(currentEntry.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
        <Divider sx={{ mb: 3, bgcolor: 'rgba(156, 163, 175, 0.2)' }} />

        <Box sx={{ width: "100%", height: { xs: 350, sm: 450 } }}>
          <ResponsiveContainer>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid
                stroke="rgba(156, 163, 175, 0.3)"
                strokeWidth={1}
              />
              <PolarAngleAxis
                dataKey="emotion"
                tick={{
                  fontSize: 12,
                  fill: '#6B7280',
                  fontWeight: '500'
                }}
                className="capitalize"
              />
              <PolarRadiusAxis
                domain={[0, 1]}
                tick={{
                  fontSize: 10,
                  fill: '#9CA3AF'
                }}
                tickCount={4}
              />
              <Radar
                name={stimulus}
                dataKey="value"
                stroke="#4F46E5"
                fill="rgba(79, 70, 229, 0.2)"
                fillOpacity={0.4}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: '#4F46E5',
                  strokeWidth: 2,
                  stroke: '#FEFCFB'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>

        {/* Navigation */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={3}
          sx={{
            bgcolor: 'rgba(248, 250, 252, 0.6)',
            borderRadius: 2,
            p: 2,
            border: '1px solid rgba(226, 232, 240, 0.5)'
          }}
        >
          <Button
            variant="outlined"
            disabled={index === 0}
            onClick={() => setIndex((prev) => prev - 1)}
            sx={{
              borderRadius: 2,
              borderColor: 'rgba(79, 70, 229, 0.3)',
              color: '#4F46E5',
              '&:hover': {
                borderColor: '#4F46E5',
                bgcolor: 'rgba(79, 70, 229, 0.05)'
              },
              '&:disabled': {
                borderColor: 'rgba(156, 163, 175, 0.3)',
                color: '#9CA3AF'
              }
            }}
          >
            ← Previous
          </Button>
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6B7280',
              fontFamily: '"Courier New", monospace'
            }}
          >
            {index + 1} of {entries.length}
          </Typography>
          <Button
            variant="outlined"
            disabled={index === entries.length - 1}
            onClick={() => setIndex((prev) => prev + 1)}
            sx={{
              borderRadius: 2,
              borderColor: 'rgba(79, 70, 229, 0.3)',
              color: '#4F46E5',
              '&:hover': {
                borderColor: '#4F46E5',
                bgcolor: 'rgba(79, 70, 229, 0.05)'
              },
              '&:disabled': {
                borderColor: 'rgba(156, 163, 175, 0.3)',
                color: '#9CA3AF'
              }
            }}
          >
            Next →
          </Button>
        </Box>
      </Paper>

      {/* Insights Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 3,
          border: '1px solid rgba(156, 163, 175, 0.2)',
          bgcolor: '#FEFCFB',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(79, 70, 229, 0.3)',
            boxShadow: '0 8px 25px rgba(79, 70, 229, 0.1)'
          }
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            fontWeight: '500',
            color: '#374151',
            mb: 1
          }}
        >
          gentle reflections 🌸
        </Typography>
        <Divider sx={{ mb: 3, bgcolor: 'rgba(156, 163, 175, 0.2)' }} />

        <Box
          sx={{
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {loadingInsights ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: '#4F46E5', mr: 2 }} />
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', fontStyle: 'italic' }}>
                gathering insights...
              </Typography>
            </Box>
          ) : currentInsight ? (
            <Box>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  lineHeight: 1.7,
                  color: '#374151',
                  mb: 2,
                  fontStyle: 'italic'
                }}
              >
                "{currentInsight.insight}"
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#9CA3AF',
                  fontSize: '0.8rem',
                  fontFamily: '"Courier New", monospace'
                }}
              >
                reflected on {new Date(currentInsight.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: '#9CA3AF',
                fontStyle: 'italic',
                textAlign: 'center',
                fontSize: '0.875rem'
              }}
            >
              sometimes silence holds the deepest wisdom ✨
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}