import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Shimmer animation
const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const ShimmerBox = styled(Box)(({ theme }) => ({
    animation: `${shimmer} 2s infinite linear`,
    background: `linear-gradient(
        to right,
        ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 8%,
        ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} 18%,
        ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 33%
    )`,
    backgroundSize: '1000px 100%',
}));

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="circular" width={40} height={40} />
            </Box>
            <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={16} />
        </CardContent>
    </Card>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton = () => (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="text" width="50%" height={28} />
                <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>
            <Skeleton variant="rectangular" width="100%" height={1} sx={{ mb: 2 }} />
            {[1, 2, 3, 4].map((i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="70%" height={20} />
                        <Skeleton variant="text" width="50%" height={16} />
                    </Box>
                    <Skeleton variant="circular" width={24} height={24} />
                </Box>
            ))}
        </CardContent>
    </Card>
);

// List Item Skeleton
export const ListItemSkeleton = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
        </Box>
        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
    </Box>
);

// Full Dashboard Skeleton
export const DashboardSkeleton = () => (
    <Box>
        {/* Header Skeleton */}
        <ShimmerBox sx={{ mb: 3, p: 3, borderRadius: 3, height: 120 }} />

        {/* Stats Cards Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                    <StatsCardSkeleton />
                </Grid>
            ))}
        </Grid>

        {/* Action Cards Skeleton */}
        <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Grid item xs={6} sm={4} md={2} key={i}>
                        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        </Box>

        {/* Content Cards Skeleton */}
        <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} md={6} key={i}>
                    <DashboardCardSkeleton />
                </Grid>
            ))}
        </Grid>
    </Box>
);

export default DashboardSkeleton;