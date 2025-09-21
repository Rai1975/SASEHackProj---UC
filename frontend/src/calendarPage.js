import React, { useState, useEffect, use } from "react";
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
  IconButton,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import dayjs from "dayjs";

import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

// Add dayjs plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export default function JournalCalendar({ apiBaseUrl }) {
  const today = dayjs().startOf('day');

   const currentWeekStart = today.subtract(today.day(), 'day');

  const [weekStart, setWeekStart] = useState(today.subtract(today.day(), 'day'));

  const [selectedDate, setSelectedDate] = useState(dayjs());
  
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const formattedDate = selectedDate.format("YYYY-MM-DD");

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const currentDayOfWeek = selectedDate.day();
  const [selectedDayName, setSelectedDayName] = useState(days[currentDayOfWeek]);

  // Generate week days based on current week start
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    return {
      date: weekStart.add(i, 'day'),
      dayName: days[i],
      dayInitial: dayInitials[i],
      isSelectable: weekStart.add(i, 'day').isSameOrBefore(today, 'day')
    };
  });

  // Handle navigation between weeks
  const goToPreviousWeek = () => {
    setWeekStart(weekStart.subtract(7, 'day'));
  };

  const goToNextWeek = () => {
    // Calculate the next week start date
    const nextWeekStart = weekStart.add(7, 'day');
    
    // Allow navigation as long as we're not going beyond the current week
    if (nextWeekStart.isSameOrBefore(currentWeekStart, 'day')) {
      setWeekStart(nextWeekStart);
    } else {
      // If we're not already at the current week, go to the current week
      if (!weekStart.isSame(currentWeekStart, 'day')) {
        setWeekStart(currentWeekStart);
      }
    }
  };

  const isCurrentWeek = weekStart.isSame(currentWeekStart,'day');

  // Handle day selection from circular buttons
  const handleDaySelect = (date, dayName) => {
    // Only allow selecting non-future dates
    if (date.isSameOrBefore(today, 'day')) {
      setSelectedDate(date);
      setSelectedDayName(dayName);
    }
  };

  // When date changes from calendar, update selected day name
  const handleDateChange = (newValue) => {
    if (newValue.isSameOrBefore(today,'day')) {
      setSelectedDate(newValue);
      setSelectedDayName(days[newValue.day()]);

      const newValueWeekStart = newValue.subtract(newValue.day(),'day');
      if (!newValueWeekStart.isSame(weekStart, 'day')) {
        setWeekStart(newValueWeekStart);
      }
    }
  };

  const toggleCalendar = () => {
    setCalendarExpanded(!calendarExpanded);
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
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h3" gutterBottom>
            {selectedDayName}
          </Typography>
          <Typography variant="h4" color="text.secondary">
            {selectedDate.format('MMM D')}
          </Typography>
        </Box>

        {/* Day Selection Nav Bar */}
        <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 4, 
          display: 'flex',
          flexDirection: 'column', 
          alignItems: 'center' 
          }}
        >
          {/* Week Navigation */}
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 1 }}>
            <IconButton onClick={goToPreviousWeek} size="small">
              <ChevronLeftIcon />
            </IconButton>
            
            <Typography variant="subtitle1">
              {weekStart.format('MMM D')} - {weekStart.add(6, 'day').format('MMM D, YYYY')}
            </Typography>
            
            <IconButton 
              onClick={goToNextWeek} 
              disabled={isCurrentWeek}
              size="small"
              sx={{ color: isCurrentWeek ? 'grey.400' : 'inherit' }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>

           {/* Day Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
            {weekDays.map((day) => (
              <Box 
                key={day.dayName}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Typography variant="caption" sx={{ mb: 0.5 }}>
                  {day.date.format('D')}
                </Typography>
                <Button 
                  onClick={() => handleDaySelect(day.date, day.dayName)}
                  disabled={!day.isSelectable}
                  variant={selectedDate.format('YYYY-MM-DD') === day.date.format('YYYY-MM-DD') ? "contained" : "text"}
                  sx={{
                    borderRadius: '50%', 
                    minWidth: '40px', 
                    width: '40px',
                    height: '40px',
                    p: 0,
                    backgroundColor: selectedDate.format('YYYY-MM-DD') === day.date.format('YYYY-MM-DD') ? 'primary.main' : 'transparent',
                    color: !day.isSelectable ? 'text.disabled' : 
                           selectedDate.format('YYYY-MM-DD') === day.date.format('YYYY-MM-DD') ? 'white' : 'text.primary'
                  }}
                >
                  {day.dayInitial}
                </Button>
              </Box>
            ))}
          </Box>

          {/* Dropdown Arrow for Calendar */}
            <IconButton 
              onClick={toggleCalendar}
              size="small"
              aria-label={calendarExpanded ? "collapse calendar" : "expand calendar"}
              sx={{ mt: 0.5 }}
            >
              {calendarExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>

        </Paper>

        {/* Calendar - With Circle Selection*/}
        <Collapse in={calendarExpanded} timeout="auto">
          <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <DateCalendar
            value={selectedDate}
            onChange={handleDateChange}
            maxDate={today}
            sx={{
              '& .MuiPickersDay-root': {
                borderRadius: '50%'
              },
              '& .Mui-selected': {
                borderRadius: '50%'
              },
              '& .MuiPickersDay-today': {
                borderRadius: '50%'
              },
              '& .MuiPickersDay-dayOutsideMonth': {
                opacity: 0.5
              }
            }}
          />
        </Paper>
        </Collapse>
        

        {/* Journal Entries */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6">
            Today's Entries
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
