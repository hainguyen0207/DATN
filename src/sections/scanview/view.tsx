// @mui
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// components
import { useSettingsContext } from 'src/components/settings';
import { Button, Divider } from '@mui/material';
import Iconify from 'src/components/iconify';
import ListCustom from 'src/components/list/List';
import ListItemCustom from 'src/components/list/ListItem';
import Scrollbar from 'src/components/scrollbar';

interface ScanViewProps {
  id: string;
  title: string;
  formScan: any;
  tableData: any;
  history: any[];
  data: any;
  onNewScan: () => any;
  onDeleteScan: (id: string) => any;
}

export default function ScanView({
  id,
  title,
  formScan,
  tableData,
  history,
  data,
  onNewScan,
  onDeleteScan,
}: ScanViewProps) {
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography variant="h4"> {title}</Typography>
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
              width: '100%',
            }}
            startIcon={<Iconify icon="bx:plus-circle" sx={{ color: 'primary.main' }} />}
            onClick={() => onNewScan()}
          >
            New Scan
          </Button>

          <Divider
            sx={{
              my: 1,
              color: (theme) =>
                `${settings.themeMode === 'dark' ? theme.palette.divider : theme.palette.info}`,
            }}
          >
            History
          </Divider>
          <Scrollbar sx={{ height: 'calc(100vh - 318px)' }}>
            <ListCustom sx={{ p: 0 }}>
              {history.map((item) => (
                <ListItemCustom
                  onDelete={() => onDeleteScan(item.id)}
                  key={item.id}
                  selected={item.id === id}
                  link={`?id=${item.id}`}
                  text={item.text}
                />
              ))}
            </ListCustom>
          </Scrollbar>
        </Box>

        <Box
          sx={{
            mt: 5,
            width: 0.8,
            p: 2,
            height: 'calc(100vh - 208px)',
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
            border: (theme) => `solid 1px ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              height: !data?.data ? 'calc(100% - 100px)' : '100%',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Scrollbar>{tableData}</Scrollbar>
          </Box>
          {data?.data ? null : formScan()}
        </Box>
      </Box>
    </Container>
  );
}
