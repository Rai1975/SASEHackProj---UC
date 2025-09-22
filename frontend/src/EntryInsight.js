import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';

function EntryInsight({ apiBaseUrl }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntryDetails = async () => {
      setLoading(true);
      try {
        // Get date from URL search params
        const searchParams = new URLSearchParams(location.search);
        const dateStr = searchParams.get('date');
        
        if (!dateStr) {
          throw new Error('No date provided');
        }

        // Format the date for the API call
        const formattedDate = dayjs(dateStr).format('YYYY-MM-DD');
        const time = dayjs(dateStr).format('HH:mm:ss');

        const response = await fetch(`${apiBaseUrl}/call_logs/by_date?date=${formattedDate}`);
        if (!response.ok) {
          throw new Error('Failed to fetch entry details');
        }

        const data = await response.json();
        
        // Find the specific entry matching our timestamp
        const matchingEntry = data.entries?.find(e => 
          dayjs(e.created_at).format('HH:mm:ss') === time
        );

        if (!matchingEntry) {
          throw new Error('Entry not found');
        }

        setEntry(matchingEntry);
        setError(null);
      } catch (err) {
        setError(err.message);
        setEntry(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEntryDetails();
  }, [apiBaseUrl, location.search]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/calendar')} 
        sx={{ mb: 3 }}
      >
        Back to Calendar
      </Button>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : entry ? (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Entry Details
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {dayjs(entry.created_at).format('MMMM D, YYYY • h:mm A')}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Raw Text
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {entry.raw_text}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="h5" gutterBottom color="primary">
              Insight
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {entry.insight}
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Alert severity="warning">Entry not found</Alert>
      )}
    </Container>
  );
}

export default EntryInsight;