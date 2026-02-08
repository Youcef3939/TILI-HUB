import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Stack,
    IconButton,
    Paper,
    Popover
} from '@mui/material';
import {
    CalendarMonth,
    FilterAlt,
    ChevronLeft,
    ChevronRight
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

const DateRangeFilter = ({ onFilterChange }) => {
    // Anchor element for the popover
    const [anchorEl, setAnchorEl] = useState(null);

    // Filter type and date range
    const [filterType, setFilterType] = useState('month');
    const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
    const [endDate, setEndDate] = useState(dayjs());

    // Current month/year for custom navigation
    const [currentMonth, setCurrentMonth] = useState(dayjs().month());
    const [currentYear, setCurrentYear] = useState(dayjs().year());

    // Apply filters on component mount
    useEffect(() => {
        handleApplyFilter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Open the filter popover
    const handleOpenFilter = (event) => {
        setAnchorEl(event.currentTarget);
    };

    // Close the filter popover
    const handleCloseFilter = () => {
        setAnchorEl(null);
    };

    // Apply the selected filter
    const handleApplyFilter = () => {
        let start, end;

        switch (filterType) {
            case 'today':
                start = dayjs().startOf('day');
                end = dayjs().endOf('day');
                break;
            case 'week':
                start = dayjs().subtract(7, 'day').startOf('day');
                end = dayjs().endOf('day');
                break;
            case 'month':
                start = dayjs().subtract(30, 'day').startOf('day');
                end = dayjs().endOf('day');
                break;
            case 'quarter':
                start = dayjs().subtract(90, 'day').startOf('day');
                end = dayjs().endOf('day');
                break;
            case 'year':
                start = dayjs().subtract(365, 'day').startOf('day');
                end = dayjs().endOf('day');
                break;
            case 'current_month':
                start = dayjs().startOf('month');
                end = dayjs().endOf('month');
                break;
            case 'current_quarter':
                // Calculate current quarter
                const quarter = Math.floor(dayjs().month() / 3);
                start = dayjs().month(quarter * 3).startOf('month');
                end = dayjs().month(quarter * 3 + 2).endOf('month');
                break;
            case 'current_year':
                start = dayjs().startOf('year');
                end = dayjs().endOf('year');
                break;
            case 'previous_month':
                start = dayjs().subtract(1, 'month').startOf('month');
                end = dayjs().subtract(1, 'month').endOf('month');
                break;
            case 'previous_quarter':
                // Calculate previous quarter
                const prevQuarter = Math.floor(dayjs().subtract(3, 'month').month() / 3);
                start = dayjs().subtract(3, 'month').month(prevQuarter * 3).startOf('month');
                end = dayjs().subtract(3, 'month').month(prevQuarter * 3 + 2).endOf('month');
                break;
            case 'previous_year':
                start = dayjs().subtract(1, 'year').startOf('year');
                end = dayjs().subtract(1, 'year').endOf('year');
                break;
            case 'specific_month':
                start = dayjs().year(currentYear).month(currentMonth).startOf('month');
                end = dayjs().year(currentYear).month(currentMonth).endOf('month');
                break;
            case 'custom':
                start = startDate.startOf('day');
                end = endDate.endOf('day');
                break;
            default:
                start = dayjs().subtract(30, 'day').startOf('day');
                end = dayjs().endOf('day');
        }

        // Call the parent component's filter change handler
        onFilterChange({
            startDate: start.format('YYYY-MM-DD'),
            endDate: end.format('YYYY-MM-DD'),
            filterType,
            displayLabel: getDisplayLabel(start, end, filterType)
        });

        // Close the popover
        handleCloseFilter();
    };


    const getDisplayLabel = (start, end, type) => {
        switch (type) {
            case 'today':
                return "Aujourd'hui";
            case 'week':
                return "7 derniers jours";
            case 'month':
                return "30 derniers jours";
            case 'quarter':
                return "90 derniers jours";
            case 'year':
                return "365 derniers jours";
            case 'current_month':
                return start && start.isValid() ? `${start.format('MMMM YYYY')}` : 'Mois courant';
            case 'current_quarter':
                return start && start.isValid() ? `T${Math.floor(start.month() / 3) + 1} ${start.year()}` : 'Trimestre courant';
            case 'current_year':
                return start && start.isValid() ? `${start.year()}` : 'Année courante';
            case 'previous_month':
                return start && start.isValid() ? `${start.format('MMMM YYYY')}` : 'Mois précédent';
            case 'previous_quarter':
                return start && start.isValid() ? `T${Math.floor(start.month() / 3) + 1} ${start.year()}` : 'Trimestre précédent';
            case 'previous_year':
                return start && start.isValid() ? `${start.year()}` : 'Année précédente';
            case 'specific_month':
                return start && start.isValid() ? `${start.format('MMMM YYYY')}` : 'Mois spécifique';
            case 'custom':
                return (start && end && start.isValid() && end.isValid())
                    ? `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`
                    : 'Période personnalisée';
            default:
                return "30 derniers jours";
        }
    };

    // Navigate previous month
    const handlePreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prevYear => prevYear - 1);
        } else {
            setCurrentMonth(prevMonth => prevMonth - 1);
        }
    };

    // Navigate next month
    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prevYear => prevYear + 1);
        } else {
            setCurrentMonth(prevMonth => prevMonth + 1);
        }
    };

    // Check if the filter popover is open
    const open = Boolean(anchorEl);
    const id = open ? 'date-filter-popover' : undefined;

    // Get current filter label
    const [currentFilterLabel, setCurrentFilterLabel] = useState("30 derniers jours");

    useEffect(() => {
        const start = filterType === 'custom' ? startDate :
            filterType === 'specific_month' ? dayjs().year(currentYear).month(currentMonth).startOf('month') :
                null;
        const end = filterType === 'custom' ? endDate :
            filterType === 'specific_month' ? dayjs().year(currentYear).month(currentMonth).endOf('month') :
                null;

        if (start && end) {
            setCurrentFilterLabel(getDisplayLabel(start, end, filterType));
        } else {
            setCurrentFilterLabel(getDisplayLabel(null, null, filterType));
        }
    }, [filterType, startDate, endDate, currentMonth, currentYear]);

    return (
        <Box>
            {/* Filter Button */}
            <Button
                variant="outlined"
                color="primary"
                startIcon={<FilterAlt />}
                onClick={handleOpenFilter}
                aria-describedby={id}
                sx={{ borderRadius: '8px' }}
            >
                {currentFilterLabel}
            </Button>

            {/* Filter Popover */}
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseFilter}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        p: 3,
                        width: 340,
                        borderRadius: '12px',
                    }
                }}
            >
                <Typography variant="h6" fontWeight="600" mb={2}>
                    Filtrer par période
                </Typography>

                {/* Date Range Type Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="filter-type-label">Type de période</InputLabel>
                    <Select
                        labelId="filter-type-label"
                        id="filter-type-select"
                        value={filterType}
                        label="Type de période"
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <MenuItem value="today">Aujourd'hui</MenuItem>
                        <MenuItem value="week">7 derniers jours</MenuItem>
                        <MenuItem value="month">30 derniers jours</MenuItem>
                        <MenuItem value="quarter">90 derniers jours</MenuItem>
                        <MenuItem value="year">365 derniers jours</MenuItem>
                        <MenuItem value="current_month">Mois courant</MenuItem>
                        <MenuItem value="current_quarter">Trimestre courant</MenuItem>
                        <MenuItem value="current_year">Année courante</MenuItem>
                        <MenuItem value="previous_month">Mois précédent</MenuItem>
                        <MenuItem value="previous_quarter">Trimestre précédent</MenuItem>
                        <MenuItem value="previous_year">Année précédente</MenuItem>
                        <MenuItem value="specific_month">Mois spécifique</MenuItem>
                        <MenuItem value="custom">Période personnalisée</MenuItem>
                    </Select>
                </FormControl>

                {/* Month Selector (for specific_month) */}
                {filterType === 'specific_month' && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '8px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <IconButton onClick={handlePreviousMonth} size="small">
                                <ChevronLeft />
                            </IconButton>
                            <Typography variant="subtitle1" fontWeight="medium">
                                {dayjs().month(currentMonth).format('MMMM')} {currentYear}
                            </Typography>
                            <IconButton onClick={handleNextMonth} size="small">
                                <ChevronRight />
                            </IconButton>
                        </Box>
                    </Paper>
                )}

                {/* Custom Date Range */}
                {filterType === 'custom' && (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack spacing={2} mb={3}>
                            <DatePicker
                                label="Date de début"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                renderInput={(params) => <TextField {...params} />}
                                maxDate={endDate}
                            />
                            <DatePicker
                                label="Date de fin"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                renderInput={(params) => <TextField {...params} />}
                                minDate={startDate}
                                maxDate={dayjs()}
                            />
                        </Stack>
                    </LocalizationProvider>
                )}

                {/* Apply Filter Button */}
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleApplyFilter}
                    sx={{
                        borderRadius: '8px',
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    Appliquer le filtre
                </Button>
            </Popover>
        </Box>
    );
};

export default DateRangeFilter;