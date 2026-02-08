import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';
import { Controller } from "react-hook-form";
import { styled } from '@mui/material/styles';

const StyledFormControl = styled(FormControl)(({ theme }) => ({
    width: '100%',
    '& .MuiOutlinedInput-root': {
        borderRadius: theme.shape.borderRadius,
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        '&:hover': {
            borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${theme.palette.primary.light}`,
        },
    },
    '& .MuiOutlinedInput-input': {
        padding: '14px 12px',
        fontSize: '0.95rem',
    },
    '& .MuiInputLabel-root': {
        fontSize: '0.95rem',
    },
    '& .MuiFormHelperText-root': {
        fontSize: '0.8rem',
        marginTop: '6px',
    },
}));

export default function MySelectField(props) {
    const { label, name, control, options = [] } = props;

    return (
        <StyledFormControl variant="outlined">
            <InputLabel id={`${name}-label`}>{label}</InputLabel>
            <Controller
                name={name}
                control={control}
                render={({
                    field: { onChange, value },
                    fieldState: { error },
                }) => (
                    <>
                        <Select
                            labelId={`${name}-label`}
                            id={`${name}-select`}
                            value={value || ''}
                            onChange={onChange}
                            label={label}
                            error={!!error}
                            variant="outlined"
                        >
                            <MenuItem value="">
                                <em>Sélectionnez une option</em>
                            </MenuItem>
                            {options.map((option, index) => (
                                <MenuItem key={index} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {error && <FormHelperText sx={{ color: '#d32f2f' }}>{error.message}</FormHelperText>}
                    </>
                )}
            />
        </StyledFormControl>
    );
}
