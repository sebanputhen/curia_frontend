import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Church, Building2, Users, Wallet } from 'lucide-react';

// Import your existing chart components
import Echart from "../components/chart/EChart";
import LineChart from "../components/chart/LineChart";
import { useFinancialYear } from './FinancialYearContext';
import axiosInstance from "../axiosConfig"; // Import your configured axios instance
import { isAuthenticated } from "../utils/auth"; // Import auth check

// Styled Components
const DashboardContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  position: 'relative',
  zIndex: 1,
}));

const StatWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const IconBox = styled(Box)(({ color }) => ({
  width: 56,
  height: 56,
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${color}20, ${color}40)`,
  color: color,
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  marginTop: theme.spacing(1),
  background: 'linear-gradient(45deg, #1a237e, #0d47a1)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
}));

const ChartCard = styled(Card)(({ theme }) => ({
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: theme.spacing(3),
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
}));

const StyledSelect = styled(FormControl)(({ theme }) => ({
  minWidth: 200,
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: '#ffffff',
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const Home = () => {
  const { selectedYear1, formattedYear, startDate, endDate, updateYear } = useFinancialYear();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState({
    totalAmount: 0,
    parishCount: 0,
    foraneCount: 0,
    familyCount: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication when component mounts
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    
    fetchYearlyData(selectedYear1);
  }, [selectedYear1]);

  const fetchYearlyData = async (year) => {
    try {
      setError(null);
      
      // Check authentication before making API call
      if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
      }

      // Use your configured axios instance instead of fetch
      const response = await axiosInstance.get(`/transaction/yearlyData/${year}`);
      
      const data = response.data;
      setStats({
        totalAmount: data.totalAmount || 0,
        parishCount: data.parishCount || 0,
        foraneCount: data.foraneCount || 0,
        familyCount: data.familyCount || 0,
      });
    } catch (error) {
      console.error('Error fetching yearly data:', error);
      
      if (error.response?.status === 401) {
        // Token expired or invalid
        window.location.href = '/login';
        return;
      }
      
      setError(error.response?.data?.message || 'Failed to fetch yearly data');
      setStats({
        totalAmount: 0,
        parishCount: 0,
        foraneCount: 0,
        familyCount: 0,
      });
    }
  };

  const statisticsCards = [
    {
      title: "Forane",
      value: stats.foraneCount,
      icon: <Building2 size={24} />,
      color: "#4f46e5"
    },
    {
      title: "Parish",
      value: stats.parishCount,
      icon: <Church size={24} />,
      color: "#7c3aed"
    },
    {
      title: "Family",
      value: stats.familyCount,
      icon: <Users size={24} />,
      color: "#059669"
    },
    {
      title: "Total Collection",
      value: stats.totalAmount.toLocaleString(),
      icon: <Wallet size={24} />,
      color: "#ea580c"
    },
  ];

  return (
    <DashboardContainer>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #1a237e, #0d47a1)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}>
                Dashboard Overview
              </Typography>
              <StyledSelect>
                <InputLabel>Select Year</InputLabel>
                <Select
                  value={selectedYear1}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Select Year"
                >
                  {[2026,2025, 2024, 2023, 2022, 2021].map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </StyledSelect>
            </Box>
          </Grid>

          {/* Show error if exists */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Grid>
          )}

          {statisticsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StyledCard>
                <StyledCardContent>
                  <StatWrapper>
                    <Box>
                      <Typography variant="subtitle1" sx={{ 
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}>
                        {stat.title}
                      </Typography>
                      <StatValue>
                        {stat.value}
                      </StatValue>
                    </Box>
                    <IconBox color={stat.color}>
                      {stat.icon}
                    </IconBox>
                  </StatWrapper>
                </StyledCardContent>
              </StyledCard>
            </Grid>
          ))}

          <Grid item xs={12} md={6}>
            <ChartCard>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 3
              }}>
                Forane Wise Analysis
              </Typography>
              <Echart selectedYear={selectedYear1} />
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 3
              }}>
                Year-wise Contribution Trends
              </Typography>
              <LineChart selectedYear={selectedYear1} />
            </ChartCard>
          </Grid>
        </Grid>
      </Container>
    </DashboardContainer>
  );
};

export default Home;