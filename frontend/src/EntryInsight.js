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
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import EmotionRadar from "./emotionGraph";


function EntryInsight({ apiBaseUrl }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stims, setStims] = useState([]);

  useEffect(() => {
    const fetchEntryDetails = async () => {
      setLoading(true);
      try {
        // Get date from URL search params
        const searchParams = new URLSearchParams(location.search);
        const dateStr = searchParams.get('date');
        const call_id = searchParams.get('call_id');
        
        if (!dateStr) {
          throw new Error('No date provided');
        }

        // Format the date for the API call
        const formattedDate = dayjs(dateStr).format('YYYY-MM-DD');
        const time = dayjs(dateStr).format('HH:mm:ss');

        
        // Fetch both entry and stims data
        const [entryResponse, stimsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/call_logs/by_date?date=${formattedDate}`),
          fetch(`${apiBaseUrl}/stimulus/get-by-call-id?call_id=${call_id}`)
        ]);

        if (!entryResponse.ok || !stimsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [entryData, stimsData] = await Promise.all([
          entryResponse.json(),
          stimsResponse.json()
        ]);

        const matchingEntry = entryData.entries?.find(e => 
          dayjs(e.created_at).format('HH:mm:ss') === time
        );

        if (!matchingEntry) {
          throw new Error('Entry not found');
        }

        setEntry(matchingEntry);
        setStims(stimsData.stims || []);
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
          <Divider sx={{ my: 3 }} />
          <Box>
            <Typography variant="h5" gutterBottom color="primary">
              Top Stimulants
            </Typography>
            <Grid container spacing={3}>
              {stims.map((stim, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index} alignContent={'center'}>
                  <Box sx={{ 
                      p: 2, 
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 1,
                    width: '200px'
                  }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {stim.name}
                    </Typography>
                    <EmotionRadar stimulus={stim.name} emotions={stim.emotions} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

        </Paper>
      ) : (
        <Alert severity="warning">Entry not found</Alert>
      )}
    </Container>
  );
}

export default EntryInsight;