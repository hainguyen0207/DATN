import { LoadingButton } from '@mui/lab';
import {
  alpha,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  emphasize,
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
import { DataArray } from '@mui/icons-material';
import { decode } from 'punycode';
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
  const title = 'XSS Scanner';
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
  const [blindFile, setBlindFile] = useState<any>(null);
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
          {!blindFile ? (
            <Button
              component="label"
              sx={{ minWidth: 100, ml: 1 }}
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<Iconify icon="quill:attachment" sx={{ color: 'primary.main' }} />}
            >
              Blind
              <VisuallyHiddenInput
                type="file"
                onChange={(event) => setBlindFile(event.target.files?.item(0))}
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
              {blindFile ? truncateString(blindFile?.name, 10) : truncateString('payload file', 10)}
              <VisuallyHiddenInput
                type="file"
                onChange={(event) => setBlindFile(event.target.files)}
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
    localStorage.setItem('xss-scan-history', newDataStr);
    setHistory(newData);
    navigate(`?id=${uuid}`);
  };

  const handleDeleteScan = (idScan: string) => {
    const newData = history.filter((item) => item.id !== idScan);
    const newDataStr = JSON.stringify(newData);
    localStorage.setItem('xss-scan-history', newDataStr);
    setHistory(newData);
  };

  const handleScan = async () => {
    if (param && requestFile) {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('request_file', requestFile);
        formData.append('payload_file', payloadFile);
        formData.append('blind_file', blindFile);
        formData.append('params_to_scan', param);
        formData.append('download_log', downloadLog ? 'true' : 'false');
        const res = await axiosInstance.post('/xss-scanner', formData, {
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
                item.text = `Scan ${requestFile?.name || 'file'}`;
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
                text: `Scan ${requestFile?.name || 'file'}`,
                link: uuid,
                data: res.data.result,
                scanned: true,
                downloadLink: res?.data?.log_path || '',
              },
              ...history,
            ];
          }
          const newDataStr = JSON.stringify(newData);
          localStorage.setItem('xss-scan-history', newDataStr);
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
    const dataStr = localStorage.getItem('xss-scan-history') || '[]';
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
  content_type: string;
  results: any[];
  invalid_params: any[];
  valid_params: any[];
  encoded_characters: string[];
  non_encoded_characters: string[];
  security_headers: any;
}

const PathView = ({ data, downloadLink }: PathViewProps) => {
  const handleDownload = () => {
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = 'http://127.0.0.1:2727/log-xss-scanner';
      link.download = 'xss_log.json';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  return (
    <Box>
      {data?.content_type ? (
        <>
          <h3>Content Type:</h3>
          <Typography component="code" marginLeft={1}>
            {data?.content_type || ''}
          </Typography>
        </>
      ) : null}
      {data?.encoded_characters?.length ? (
        <>
          <h3>Encoded Character:</h3>
          <Breadcrumbs aria-label="breadcrumb" maxItems={20} separator="|">
            {data?.encoded_characters?.map((charecter, index) => (
              <StyledBreadcrumb key={`non-encode-char-${index}`} label={charecter} />
            ))}
          </Breadcrumbs>
        </>
      ) : null}
      {data?.non_encoded_characters?.length ? (
        <>
          <h3>Non Encoded Character:</h3>
          <Breadcrumbs aria-label="breadcrumb" maxItems={20} separator="|">
            {data?.non_encoded_characters?.map((charecter, index) => (
              <StyledBreadcrumb key={`non-encode-char-${index}`} label={charecter} />
            ))}
          </Breadcrumbs>
        </>
      ) : null}

      {data?.security_headers ? (
        <>
          <h3>Security Headers:</h3>
          <h4 style={{ marginLeft: 8 }}>Cookie Attributes:</h4>
          <Breadcrumbs sx={{ ml: 1 }} aria-label="breadcrumb" maxItems={20} separator="|">
            {Object.keys(data?.security_headers?.cookie_attributes).map((key) => (
              <StyledBreadcrumb
                key={`cookie-attributes-${key}`}
                label={`${key}: ${data?.security_headers?.cookie_attributes[key]}`}
              />
            ))}
          </Breadcrumbs>
          <TableContainer
            component={Paper}
            sx={{ border: (theme) => `solid 1px ${theme.palette.divider}`, my: 2 }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '50%' }} align="left">
                    Header
                  </TableCell>
                  <TableCell sx={{ width: '50%' }} align="left">
                    Value
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.security_headers?.security_headers?.map((headerItem: any, index: number) => (
                  <TableRow key={`shead-key-${index}`}>
                    <TableCell sx={{ width: '50%' }} align="left">
                      {headerItem?.header}
                    </TableCell>
                    <TableCell sx={{ width: '50%' }} align="left">
                      {headerItem?.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
                  XSS detected
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
                    {decodeHTML(row?.payload)}
                  </TableCell>
                  <TableCell sx={{ width: '10%' }} align="center">
                    {row?.xss_detected ? (
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

const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    '&:hover, &:focus': {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    '&:active': {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

function truncateString(str: string, maxLength: number = 50): string {
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}

function decodeHTML(input: string): string {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = input;
  return textArea.value;
}
