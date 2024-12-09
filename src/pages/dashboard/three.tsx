import { LoadingButton } from '@mui/lab';
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { Helmet } from 'react-helmet-async';
import { v4 as uuidv4 } from 'uuid';
// sections
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/utils/axios';
import ScanView from 'src/sections/scanview/view';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { MarkdownRenderer } from 'src/components/markdown/markdow';
import { toast } from 'react-toastify';
// ----------------------------------------------------------------------

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function Page() {
  const title = 'Path Traversal Scanner';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id') || '';
  const [history, setHistory] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [param, setParam] = useState<string>('');
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [downloadLog, setDownloadLog] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestFile, setRequestFile] = useState<any>(null);
  const [payloadFile, setPayloadFile] = useState<any>(null);
  const settings = useSettingsContext();

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
        sx={{ mt: 0, p: 1, height: 50 }}
        fullWidth
        id="param"
        name="param"
        autoComplete="param"
        autoFocus
        onChange={(e) => setParam(e.target.value)}
        placeholder="Parameters to Scan (comma-separated)"
        InputProps={{
          disableUnderline: true,
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', height: 50 }}>
        <Box display="flex" alignItems="center">
          {!requestFile ? (
            <Button
              component="label"
              variant="outlined"
              color="primary"
              size="small"
              sx={{ minWidth: 100 }}
              startIcon={<Iconify icon="quill:attachment" sx={{ color: 'primary.main' }} />}
            >
              Request
              <VisuallyHiddenInput
                type="file"
                onChange={(event) => setRequestFile(event.target.files?.item(0))}
                multiple
              />
            </Button>
          ) : (
            <Button
              component="label"
              variant="outlined"
              color="primary"
              size="small"
              sx={{
                minWidth: 100,
              }}
              startIcon={<Iconify icon="mdi:file" sx={{ color: 'primary.main' }} />}
            >
              {requestFile
                ? truncateString(requestFile?.name, 10)
                : truncateString('request file', 10)}
              <VisuallyHiddenInput
                type="file"
                onChange={(event) => setRequestFile(event.target.files?.item(0))}
                multiple
              />
            </Button>
          )}
          {!payloadFile ? (
            <Button
              component="label"
              sx={{ minWidth: 100, ml: 1 }}
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<Iconify icon="quill:attachment" sx={{ color: 'primary.main' }} />}
            >
              Payload
              <VisuallyHiddenInput
                type="file"
                onChange={(event) => setPayloadFile(event.target.files?.item(0))}
                multiple
              />
            </Button>
          ) : (
            <Button
              component="label"
              variant="outlined"
              color="primary"
              size="small"
              sx={{
                ml: 1,
                minWidth: 100,
              }}
              startIcon={<Iconify icon="mdi:file" sx={{ color: 'primary.main' }} />}
            >
              {payloadFile
                ? truncateString(payloadFile?.name, 10)
                : truncateString('payload file', 10)}
              <VisuallyHiddenInput
                type="file"
                onChange={(event) => setPayloadFile(event.target.files)}
                multiple
              />
            </Button>
          )}
        </Box>
        <Box>
          <Checkbox checked={downloadLog} onChange={() => setDownloadLog(!downloadLog)} />
          <Typography component="span" fontSize={10}>
            Download log after scan
          </Typography>

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
    localStorage.setItem('path-scan-history', newDataStr);
    setHistory(newData);
    navigate(`?id=${uuid}`);
  };

  const handleDeleteScan = (idScan: string) => {
    const newData = history.filter((item) => item.id !== idScan);
    const newDataStr = JSON.stringify(newData);
    localStorage.setItem('path-scan-history', newDataStr);
    setHistory(newData);
  };

  const handleScan = async () => {
    if (param && requestFile) {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('request_file', requestFile);
        formData.append('payload_file', payloadFile);
        formData.append('params_to_scan', param);
        formData.append('download_log', downloadLog ? 'true' : 'false');
        const res = await axiosInstance.post('/path-traversal-scanner', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setLoading(false);
        if (res.status === 200) {
          let newData;
          if (id) {
            newData = history.map((item) => {
              if (item.id === id) {
                item.data = res.data.result;
                item.text = `Scan ${param}`;
                item.scanned = true;
                item.downloadLink = res?.data?.log_path || '';
              }
              return item;
            });
          } else {
            const uuid = uuidv4();
            newData = [
              {
                id: uuid,
                text: `Scan ${param}`,
                link: uuid,
                data: res.data.result,
                scanned: true,
                downloadLink: res?.data?.log_path || '',
              },
              ...history,
            ];
          }
          const newDataStr = JSON.stringify(newData);
          localStorage.setItem('path-scan-history', newDataStr);
          setHistory(newData);
          setData((prev: any) => ({ ...prev, data: res.data.result }));
          setDownloadLink(res?.data?.log_path || '');
        } else {
          toast.error("Error scan!!!")
        }
        // clear file state
        setRequestFile(null);
        setPayloadFile(null);
      } catch (error) {
        setLoading(false);
        toast.error("Error scan!!!")
        console.log(error);
      }
    }
  };

  useEffect(() => {
    const dataStr = localStorage.getItem('path-scan-history') || '[]';
    const dataArr = JSON.parse(dataStr);
    if (Array.isArray(dataArr)) {
      setHistory(dataArr);
      const searchData = dataArr.find((item) => item.id === id);
      if (searchData) {
        setData(searchData);
        setDownloadLink(searchData.downloadLink || '');
      }
    }
  }, [id]);

  return (
    <>
      <Helmet>
        <title>Path Traversal Scanner</title>
      </Helmet>

      <ScanView
        onNewScan={handleAddNewScan}
        onDeleteScan={handleDeleteScan}
        formScan={form}
        history={history}
        data={data}
        title={title}
        id={id}
        tableData={<PathView data={data?.data} downloadLink={downloadLink} />}
      />
    </>
  );
}

interface PathViewProps {
  data: pathScan | null;
  downloadLink: string;
}

interface pathScan {
  message: string;
  request_details: any;
  results: any[];
  invalid_params: any[];
  valid_params: any[];
}

const PathView = ({ data, downloadLink }: PathViewProps) => {
  const handleDownload = () => {
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = 'http://127.0.0.1:2727/log-path-traversal-scanner';
      link.download = 'path_traversal_log.json';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const requestDetail = JSON.stringify(data?.request_details, null, 2);
  return (
    <Box>
      {data?.request_details ? (
        <>
          <h3>Request Detail:</h3>
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', mb: 2 }}>
            <MarkdownRenderer>{`
\`\`\`json
${requestDetail}
\`\`\`
`}</MarkdownRenderer>
          </Box>
        </>
      ) : null}
      {data ? <h3>Results:</h3> : null}
      {data?.results.length ? (
        <TableContainer
          component={Paper}
          sx={{ border: (theme) => `solid 1px ${theme.palette.divider}`, mb: 2 }}
        >
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '30%' }} align="left">
                  Parameter
                </TableCell>
                <TableCell sx={{ width: '60%' }} align="left">
                  Payload
                </TableCell>
                <TableCell sx={{ width: '10%' }} align="center">
                  Vulnerable
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.results?.map((row, index) => (
                <TableRow key={`path-key-${index}`}>
                  <TableCell sx={{ width: '30%' }} align="left">
                    {row?.parameter}
                  </TableCell>
                  <TableCell sx={{ width: '60%' }} align="left">
                    {row?.payload}
                  </TableCell>
                  <TableCell sx={{ width: '10%' }} align="center">
                  {row?.vulnerable ? (
                      <Chip label="True" color="success" />
                    ) : (
                      <Chip label="False" color="error" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {downloadLink ? (
        <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleDownload}>
          Download Log
        </Button>
      ) : null}
    </Box>
  );
};

function truncateString(str: string, maxLength: number = 50): string {
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}
