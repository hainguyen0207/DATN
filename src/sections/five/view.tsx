// @mui
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// components
import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

export default function FiveView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography variant="h4"> Page Five </Typography>

      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 3,
        }}
      >
        <Box
          sx={{
            mt: 5,
            width: 0.2,
            height: "calc(100vh - 208px)",
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
            border: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        />
        <Box
          sx={{
            mt: 5,
            width: 0.8,
            height: "calc(100vh - 208px)",
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
            border: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        />
      </Box>
    </Container>
  );
}
