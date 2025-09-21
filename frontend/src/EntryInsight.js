import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';

function EntryInsight({ apiBaseUrl }) {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntryDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/call_logs/entry/${entryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch entry details');
        }
        const data = await response.json();
        setEntry(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntryDetails();
  }, [entryId, apiBaseUrl]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 3 }}
      >
        Back to Calendar
      </Button>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : entry ? (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Entry Insight
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {dayjs(entry.created_at).format('MMMM D, YYYY • h:mm A')}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Raw Text
            </Typography>
            <Typography variant="body1" paragraph>
              {entry.raw_text}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Insight
            </Typography>
            <Typography variant="body1">
              {entry.insight}
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Typography>Entry not found</Typography>
      )}
    </Container>
  );
}

export default EntryInsight;