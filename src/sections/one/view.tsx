// @mui
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// components
import { useSettingsContext } from 'src/components/settings';
import {
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function OneView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography variant="h4"> CVE Scanner </Typography>
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
            height: 'calc(100vh - 208px)',
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
            border: (theme) => `solid 1px ${theme.palette.divider}`,
            padding: 2,
          }}
        >
            <Button
              variant="outlined"
              color="primary"
              sx={{
                width: '100%'
              }}
              startIcon={<Iconify icon="bx:plus-circle" sx={{ color: 'primary.main' }} />}
            >
              New Scan
            </Button>

          <Divider sx={{ my: 1, color: (theme) => `${theme.palette.divider}` }}>History</Divider>
          <List sx={{ p: 0 }}>
            <ListItem disablePadding sx={{ borderRadius: 1, py: 0 }}>
              <ListItemButton sx={{ borderRadius: 1 }} selected>
                <ListItemIcon>
                  <Iconify icon="solar:bug-bold" sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Inbox" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding sx={{ borderRadius: 1, py: 0 }}>
              <ListItemButton sx={{ borderRadius: 1 }}>
                <ListItemIcon>
                  <Iconify icon="solar:bug-bold" sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Drafts" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
        <Box
          sx={{
            mt: 5,
            width: 0.8,
            height: 'calc(100vh - 208px)',
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
            border: (theme) => `solid 1px ${theme.palette.divider}`,
          }}
        />
      </Box>
    </Container>
  );
}
