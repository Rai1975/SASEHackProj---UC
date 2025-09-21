import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Button,
  Collapse,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";

export default function JournalCalendar({ apiBaseUrl }) {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const formattedDate = selectedDate.format("YYYY-MM-DD");

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const currentDayOfWeek = selectedDate.day();
  const [selectedDayName, setSelectedDayName] = useState(days[currentDayOfWeek]);

  const handleDayChange = (event, newDay) => {
    if (newDay !== null) {
      setSelectedDayName(newDay);
      
      // Find the closest date matching the selected day
      const targetDayIndex = days.indexOf(newDay);
      const currentDayIndex = selectedDate.day();
      
      let daysToAdd = targetDayIndex - currentDayIndex;
      // If negative, we need to move forward to the next occurrence
      if (daysToAdd < 0) daysToAdd += 7;
      
      // If it's the same day but we want the next occurrence
      if (daysToAdd === 0 && newDay === selectedDayName) daysToAdd = 7;
      
      const newDate = selectedDate.add(daysToAdd, 'day');
      setSelectedDate(newDate);
    }
  };

  // When date changes from calendar, update selected day name
  const handleDateChange = (newValue) => {
    setSelectedDate(newValue);
    setSelectedDayName(days[newValue.day()]);
  };

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/call_logs/by_date?date=${formattedDate}`);
        if (!res.ok) throw new Error("Failed to fetch journal entries");
        const data = await res.json();
        setEntries(data.entries || []);
      } catch (err) {
        setError(err.message);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [formattedDate, apiBaseUrl]);

  const handleToggleExpand = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Journal Calendar
        </Typography>

        {/* Day Selection Nav Bar */}
        <Paper elevation={3} sx={{ p: 2, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={selectedDayName}
            exclusive
            onChange={handleDayChange}
            aria-label="day of week"
            sx={{ flexWrap: 'wrap' }}
          >
            {days.map((day, index) => (
              <ToggleButton 
              key={day} 
              value={day} 
              aria-label={day}
              sx={{
                borderRadius: '50%', 
                minWidth: '40px', 
                width: '40px',
                height: '40px',
                margin: '0 4px',
                p: 0
              }}
              >
              {dayInitials [index]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Paper>

        {/* Calendar - With Circle Selection*/}
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <DateCalendar
            value={selectedDate}
            onChange={handleDateChange}
            sx={{
              '& .MuiPickersDay-root': {
                borderRadius: '50%'
              },
              '& .Mui-selected': {
                borderRadius: '50%'
              },
              '& .MuiPickersDay-today': {
                borderRadius: '50%'
              }
            }}
          />
        </Paper>

        {/* Journal Entries */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6">
            Entries on {selectedDayName}, {formattedDate}
          </Typography>
          <Divider sx={{ my: 1 }} />

          {loading ? (
            <CircularProgress size={24} />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : entries.length > 0 ? (
            <Grid container spacing={2}>
              {entries.map((entry, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      {/* Show created_at as time */}
                      <Typography variant="body1">
                        {dayjs(entry.created_at).format("h:mm A")}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => handleToggleExpand(index)}>
                        {expanded === index ? "Hide Insight" : "Show Insight"}
                      </Button>
                    </CardActions>
                    <Collapse in={expanded === index} timeout="auto" unmountOnExit>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Raw Text
                        </Typography>
                        <Typography variant="body2">{entry.raw_text}</Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Insight
                        </Typography>
                        <Typography variant="body2">{entry.insight}</Typography>
                      </CardContent>
                    </Collapse>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No entries for this date.
            </Typography>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
}
