import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  CircularProgress,
  Divider,
  Button,
  CardActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import { ChevronRight, TouchApp } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import EmotionRadar from "./emotionGraph";

export default function HomePage({ apiBaseUrl }) {
  const navigate = useNavigate();
  const [affirmation, setAffirmation] = useState("");
  const [reminders, setReminders] = useState("");
  const [advice, setAdvice] = useState([]);
  const [topStims, setTopStims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);
  const [selectedAdvice, setSelectedAdvice] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [affirmRes, remindersRes, adviceRes, topStimsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/get-todays-affirmation`),
          fetch(`${apiBaseUrl}/get-todays-reminders`),
          fetch(`${apiBaseUrl}/get-todays-advice`),
          fetch(`${apiBaseUrl}/stimulus/week-top-emotions`),
        ]);

        const affirmJson = await affirmRes.json();
        const remindersJson = await remindersRes.json();
        const adviceJson = await adviceRes.json();
        const topStimsJson = await topStimsRes.json();

        setAffirmation(affirmJson.affirmation || "");
        setReminders(remindersJson.reminders || "");
        setAdvice(Object.entries(adviceJson.advice || {}));
        setTopStims(topStimsJson.top_stims || []);
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl]);

  const handleStimulusClick = (stimulusName) => {
    navigate(`/emotionGraphPage?stimulus=${encodeURIComponent(stimulusName)}`);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4, px: { xs: 2, sm: 3 } }}>
      {/* Greeting */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="400"
          gutterBottom
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem' },
            textAlign: { xs: 'center', sm: 'left' },
            color: '#374151',
            mb: 2,
            fontFamily: '"Courier New", monospace',
            letterSpacing: '0.5px'
          }}
        >
          Hey there ✨
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            textAlign: { xs: 'center', sm: 'left' },
            fontStyle: 'italic',
            lineHeight: 1.6,
            color: '#9CA3AF',
            fontWeight: '300',
            maxWidth: '600px'
          }}
        >
          {affirmation || "Taking things one breath at a time 🌸"}
        </Typography>
      </Box>

      {/* Cards section - Centered and side by side on mobile */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={2} sx={{ maxWidth: { xs: '100%', sm: 'none' } }}>
          {/* Things to look forward to */}
          <Grid item xs={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'rgba(156, 163, 175, 0.2)',
                bgcolor: '#FEFCFB',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  borderColor: 'rgba(79, 70, 229, 0.3)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 25px rgba(79, 70, 229, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: '500',
                    textAlign: 'left',
                    color: '#374151',
                    mb: 2
                  }}
                >
                  Little joys ahead 🌼
                </Typography>
                <Divider sx={{ mb: 2, bgcolor: 'rgba(156, 163, 175, 0.2)' }} />
                <Box
                  sx={{
                    textAlign: 'left',
                    '& p': {
                      margin: '0.5rem 0',
                      fontSize: { xs: '0.85rem', sm: '0.875rem' },
                      color: '#6B7280',
                      lineHeight: 1.6
                    },
                    '& ul, & ol': {
                      paddingLeft: { xs: '1rem', sm: '1.5rem' },
                      fontSize: { xs: '0.85rem', sm: '0.875rem' },
                      color: '#6B7280'
                    },
                    '& li': {
                      marginBottom: '0.5rem',
                      lineHeight: 1.5
                    }
                  }}
                >
                  {reminders ? (
                    <ReactMarkdown>{reminders}</ReactMarkdown>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.85rem', sm: '0.875rem' },
                        fontStyle: 'italic',
                        color: '#9CA3AF'
                      }}
                    >
                      Your future holds beautiful moments ✨
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Advice card */}
          <Grid item xs={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'rgba(156, 163, 175, 0.2)',
                bgcolor: '#FEFCFB',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  borderColor: 'rgba(79, 70, 229, 0.3)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 25px rgba(79, 70, 229, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: '500',
                    textAlign: 'left',
                    color: '#374151',
                    mb: 2
                  }}
                >
                  Gentle wisdom 🌱
                </Typography>
                <Divider sx={{ mb: 2, bgcolor: 'rgba(156, 163, 175, 0.2)' }} />
                {advice.length > 0 ? (
                  <List dense sx={{ p: 0 }}>
                    {advice.map(([title, body], idx) => (
                      <ListItem
                        key={idx}
                        onClick={() => {
                          setSelectedAdvice({ title, body });
                          setAdviceModalOpen(true);
                        }}
                        sx={{
                          px: { xs: 1, sm: 1.5 },
                          py: 0.75,
                          mb: 0.5,
                          cursor: 'pointer',
                          borderRadius: 2,
                          bgcolor: 'rgba(248, 250, 252, 0.6)',
                          border: '1px solid rgba(226, 232, 240, 0.5)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            bgcolor: 'rgba(79, 70, 229, 0.05)',
                            borderColor: 'rgba(79, 70, 229, 0.2)',
                            transform: 'translateX(6px)'
                          },
                          '&:active': {
                            bgcolor: 'rgba(79, 70, 229, 0.08)'
                          }
                        }}
                      >
                        <TouchApp
                          sx={{
                            mr: 1.5,
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            color: '#4F46E5',
                            opacity: 0.8
                          }}
                        />
                        <ListItemText
                          primary={title}
                          primaryTypographyProps={{
                            fontSize: { xs: '0.85rem', sm: '0.875rem' },
                            fontWeight: 500,
                            color: '#374151',
                            lineHeight: 1.4
                          }}
                        />
                        <ChevronRight
                          sx={{
                            fontSize: { xs: '1.1rem', sm: '1.2rem' },
                            color: '#6B7280',
                            opacity: 0.7
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.85rem', sm: '0.875rem' },
                      fontStyle: 'italic',
                      textAlign: 'left',
                      color: '#9CA3AF'
                    }}
                  >
                    Sometimes the best advice is simply to breathe 🍃
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Top Stims section */}
      {topStims.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: '500',
              textAlign: 'center',
              mb: 3,
              color: '#374151'
            }}
          >
            What's been on your mind 💭
          </Typography>
          <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
            {topStims.slice(0, 3).map((stim, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Paper
                  elevation={0}
                  onClick={() => handleStimulusClick(stim.name)}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    border: '1px solid rgba(156, 163, 175, 0.2)',
                    bgcolor: '#FEFCFB',
                    width: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      borderColor: 'rgba(79, 70, 229, 0.4)',
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(79, 70, 229, 0.15)',
                      bgcolor: 'rgba(79, 70, 229, 0.02)'
                    },
                    '&:active': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px rgba(79, 70, 229, 0.2)'
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      fontWeight: '500',
                      textAlign: 'center',
                      textTransform: 'capitalize',
                      mb: 2,
                      color: '#4F46E5'
                    }}
                  >
                    {stim.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: '#9CA3AF',
                      mb: 3,
                      fontStyle: 'italic'
                    }}
                  >
                    {stim.mentions} gentle mentions
                  </Typography>
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmotionRadar stimulus={stim.name} emotions={stim.emotions} />
                  </Box>

                  {/* Click indicator */}
                  <Box
                    sx={{
                      mt: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.7,
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    <TouchApp
                      sx={{
                        fontSize: '1rem',
                        color: '#4F46E5',
                        mr: 0.5
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#6B7280',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    >
                      Click to explore
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Advice Modal */}
      <Dialog
        open={adviceModalOpen}
        onClose={() => setAdviceModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            m: { xs: 2, sm: 4 },
            maxHeight: '80vh',
            borderRadius: 3,
            bgcolor: '#FEFCFB',
            border: '1px solid rgba(156, 163, 175, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{
          fontSize: { xs: '1.2rem', sm: '1.4rem' },
          fontWeight: '500',
          pb: 1,
          color: '#374151'
        }}>
          {selectedAdvice?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <DialogContentText sx={{
            fontSize: { xs: '0.95rem', sm: '1rem' },
            lineHeight: 1.7,
            textAlign: 'left',
            color: '#6B7280'
          }}>
            {selectedAdvice?.body}
          </DialogContentText>
        </DialogContent>
        <CardActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => setAdviceModalOpen(false)}
            variant="contained"
            size="medium"
            sx={{
              borderRadius: 2,
              bgcolor: '#4F46E5',
              '&:hover': {
                bgcolor: '#3730A3'
              },
              px: 4,
              py: 1
            }}
          >
            Got it ✨
          </Button>
        </CardActions>
      </Dialog>
    </Container>
  );
}