import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
// sections
import ScanView from 'src/sections/scanview/view';
import {
  alpha,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import axiosInstance from 'src/utils/axios';
import { LoadingButton } from '@mui/lab';
import { useSettingsContext } from 'src/components/settings';
import { toast } from 'react-toastify';
// ----------------------------------------------------------------------

export default function Page() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id') || '';
  const [history, setHistory] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [target, setTarget] = useState<string>('');
  const title = 'CVE Scanner';
  const settings = useSettingsContext();

  const handleAddNewScan = () => {
    const uuid = uuidv4();
    const scanForm = {
      id: uuid,
      text: `New Scan`,
      link: uuid,
      scanned: false,
    };
    const newData = [scanForm, ...history];
    const newDataStr = JSON.stringify(newData);
    localStorage.setItem('cve-scan-history', newDataStr);
    setHistory(newData);
    navigate(`?id=${uuid}`);
  };

  const handleDeleteScan = (idScan: string) => {
    const newData = history.filter((item) => item.id !== idScan);
    const newDataStr = JSON.stringify(newData);
    localStorage.setItem('cve-scan-history', newDataStr);
    setHistory(newData);
  };

  const handleScan = async () => {
    if (target) {
      try {
        setLoading(true);
        const res = await axiosInstance.post(
          '/cve-scan',
          {
            target,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        setLoading(false);
        if (res.status === 200) {
          let newData;
          if (id) {
            newData = history.map((item) => {
              if (item.id === id) {
                item.data = res.data.results;
                item.text = `Scan ${target}`;
                item.scanned = true;
              }
              return item;
            });
          } else {
            const uuid = uuidv4();
            newData = [
              {
                id: uuid,
                text: `Scan ${target}`,
                link: uuid,
                data: res.data.results,
                scanned: true,
              },
              ...history,
            ];
          }
          const newDataStr = JSON.stringify(newData);
          localStorage.setItem('cve-scan-history', newDataStr);
          setHistory(newData);
          setData((prev: any) => ({ ...prev, data: res.data.results }));
        } else {
          toast.error("Error scan!!!")
        }

        // reset state
        setTarget("")
      } catch (error) {
        setLoading(false);
        toast.error("Error scan!!!")
        console.log(error);
      }
    }
  };

  const form = () => (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: 100,
        flexDirection: 'column',
        borderRadius: 2,
        padding: 1,
        bgcolor: (theme) =>
          settings.themeMode === 'dark' ? alpha(theme.palette.grey[500], 0.2) : 'white',
        border: (theme) => `solid 1px ${theme.palette.divider}`,
        justifyContent: 'space-between',
      }}
    >
      <TextField
        variant="standard"
        margin="normal"
        required
        sx={{ mt: 0, p: 1, height: 50 }}
        fullWidth
        id="search"
        name="search"
        autoComplete="search"
        autoFocus
        onChange={(e) => setTarget(e.target.value)}
        placeholder="Enter target to scan"
        InputProps={{
          disableUnderline: true,
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', height: 50 }}>
        <Box>
          <LoadingButton
            sx={{ minWidth: 100, ml: 1 }}
            loading={loading}
            variant="contained"
            color="primary"
            size="small"
            onClick={handleScan}
          >
            Scan
          </LoadingButton>
        </Box>
      </Box>
    </Box>
  );

  useEffect(() => {
    const dataStr = localStorage.getItem('cve-scan-history') || '[]';
    const dataArr = JSON.parse(dataStr);
    if (Array.isArray(dataArr)) {
      setHistory(dataArr);
      const scannedData = dataArr.find((item) => item.id === id);
      if (scannedData) {
        setData(scannedData);
      }
    }
  }, [id]);

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <ScanView
        history={history}
        data={data}
        id={id}
        title={title}
        formScan={form}
        onNewScan={handleAddNewScan}
        onDeleteScan={handleDeleteScan}
        tableData={<TableCVE rows={data?.data || []} />}
      />
    </>
  );
}

interface TableCVEProps {
  rows: cveScan[];
}

interface cveScan {
  service_name: string;
  service_version: string;
  cves: string[];
}

const TableCVE = ({ rows }: TableCVEProps) =>
  rows.length ? (
    <TableContainer
      component={Paper}
      sx={{ border: (theme) => `solid 1px ${theme.palette.divider}` }}
    >
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Service Name</TableCell>
            <TableCell align="center">Service Version</TableCell>
            <TableCell align="left">CVEs</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.map((row: any, index: number) => (
            <TableRow
              key={`row-${index}`}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell sx={{ width: '20%' }}>{row.service_name}</TableCell>
              <TableCell sx={{ width: '20%' }} align="center">
                {row.service_version}
              </TableCell>
              <TableCell sx={{ width: '60%' }} align="left">
                {row?.cves?.join(', ')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ) : null;
