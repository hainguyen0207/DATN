import {
  alpha,
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ScanView from 'src/sections/scanview/view';
import Iconify from 'src/components/iconify';

import { useSettingsContext } from 'src/components/settings';
import axiosInstance from 'src/utils/axios';
import { LoadingButton } from '@mui/lab';
import { MarkdownRenderer } from 'src/components/markdown/markdow';
import { toast } from 'react-toastify';

export default function Page() {
  const title = 'CVE Search';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id') || '';
  const [history, setHistory] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
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
        required
        sx={{ mt: 0, p: 1, height: 50 }}
        fullWidth
        id="search"
        name="search"
        autoComplete="search"
        autoFocus
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Enter CVE ID"
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
            onClick={handleSearchCVE}
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
      text: `New Search`,
      link: uuid,
      scanned: false,
    };
    const newData = [scanForm, ...history];
    const newDataStr = JSON.stringify(newData);
    localStorage.setItem('cve-search-history', newDataStr);
    setHistory(newData);
    navigate(`?id=${uuid}`);
  };

  const handleDeleteScan = (idScan: string) => {
    const newData = history.filter((item) => item.id !== idScan);
    const newDataStr = JSON.stringify(newData);
    localStorage.setItem('cve-search-history', newDataStr);
    setHistory(newData);
  };

  const handleSearchCVE = async () => {
    if (search) {
      try {
        setLoading(true);
        const res = await axiosInstance.post(
          '/cve-search',
          {
            cve: search,
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
                item.data = res.data;
                item.text = `Search ${search}`;
                item.scanned = true;
              }
              return item;
            });
          } else {
            const uuid = uuidv4();
            newData = [
              {
                id: uuid,
                text: `Search ${search}`,
                link: uuid,
                data: res.data,
                scanned: true,
              },
              ...history,
            ];
          }
          const newDataStr = JSON.stringify(newData);
          localStorage.setItem('cve-search-history', newDataStr);
          setHistory(newData);
          setData((prev: any) => ({ ...prev, data: res.data }));
        } else {
          toast.error('Error search!!!');
        }
      } catch (error) {
        setLoading(false);
        toast.error('Error search!!!');
        console.log(error);
      }
    }
  };

  useEffect(() => {
    const dataStr = localStorage.getItem('cve-search-history') || '[]';
    const dataArr = JSON.parse(dataStr);
    if (Array.isArray(dataArr)) {
      setHistory(dataArr);
      const searchData = dataArr.find((item) => item.id === id);
      if (searchData) {
        setData(searchData);
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
        tableData={<SearchCVEView data={data?.data} />}
      />
    </>
  );
}

interface SearchCVEViewProps {
  data: DataSearchCVE;
}

interface DataSearchCVE {
  cve: string;
  github_results: any[];
  local_results: any[];
}

const SearchCVEView = ({ data, ...props }: SearchCVEViewProps) => (
  <Box {...props}>
    {data?.local_results.length ? (
      <>
        <h3>Local Exploits:</h3>
        <TableContainer
          component={Paper}
          sx={{ border: (theme) => `solid 1px ${theme.palette.divider}` }}
        >
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '5%' }} />
                <TableCell sx={{ width: '20%' }} align="left">
                  Name
                </TableCell>
                <TableCell sx={{ width: '10%' }} align="left">
                  EDB-ID
                </TableCell>
                <TableCell sx={{ width: '15%' }} align="left">
                  Author
                </TableCell>
                <TableCell sx={{ width: '20%' }} align="left">
                  Release Date
                </TableCell>
                <TableCell sx={{ width: '20%' }} align="left">
                  Last Update
                </TableCell>
                <TableCell sx={{ width: '10%' }} align="left">
                  Exploit URL
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.local_results?.map((row, index) => (
                <RowLocal key={`local_results_${index}`} row={row} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    ) : null}
    {data?.github_results.length ? (
      <>
        <h3>Github Expoloits</h3>
        <TableContainer
          component={Paper}
          sx={{ border: (theme) => `solid 1px ${theme.palette.divider}` }}
        >
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '30%' }} align="left">
                  Repository
                </TableCell>
                <TableCell sx={{ width: '10%' }} align="left">
                  Stars
                </TableCell>
                <TableCell sx={{ width: '20%' }} align="left">
                  Language
                </TableCell>
                <TableCell sx={{ width: '20%' }} align="left">
                  Updated
                </TableCell>
                <TableCell sx={{ width: '20%' }} align="left">
                  Clone URL
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.github_results?.map((row, index) => (
                <RowGitHub key={`github_results_${index}`} row={row} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    ) : null}
    {/* {!data?.local_results?.length && !data?.github_results?.length ? <Box>No Data</Box> : null} */}
  </Box>
);

interface RowLocalProps {
  row: RowLocalData;
}

interface RowLocalData {
  Name: string;
  'EDB-ID': string;
  Author: string;
  Code: string;
  'Exploit URL': string;
  Language: string;
  'Last Update': string;
  'Release Date': string;
}

interface RowGithubProps {
  row: RowGithubData;
}

interface RowGithubData {
  'Clone URL': string;
  Language: string;
  Repository: string;
  Stars: number;
  Updated: string;
}

const RowLocal = ({ row, ...props }: RowLocalProps) => {
  const [open, setOpen] = useState(false);
  const settings = useSettingsContext();
  return (
    <Fragment {...props}>
      <TableRow sx={{ borderBottom: 'unset' }}>
        <TableCell sx={{ width: '5%' }} align="left">
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <Iconify icon="mingcute:up-fill" /> : <Iconify icon="mingcute:down-fill" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ width: '20%' }} align="left">
          {row.Name}
        </TableCell>
        <TableCell sx={{ width: '10%' }} align="left">
          {row['EDB-ID']}
        </TableCell>
        <TableCell sx={{ width: '15%' }} align="left">
          {row.Author}
        </TableCell>
        <TableCell sx={{ width: '20%' }} align="left">
          {row['Release Date']}
        </TableCell>
        <TableCell sx={{ width: '20%' }} align="left">
          {row['Last Update']}
        </TableCell>
        <TableCell sx={{ width: '10%' }} align="left">
          <a href={row['Exploit URL']} target="_blank" rel="noopener noreferrer">
            View
          </a>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ width: '100%' }}>
              <h3>Code: </h3>
              <Box sx={{ display: 'flex', maxWidth: 'calc(100% - 16px)', justifyContent: 'center', borderRadius: 2 }}>
                <MarkdownRenderer>{`
\`\`\`${row.Language?.toLocaleLowerCase()}
${row.Code}
\`\`\`
`}</MarkdownRenderer>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
};

const RowGitHub = ({ row, ...props }: RowGithubProps) => (
  <TableRow {...props}>
    <TableCell>
      <a href={`https://github.com/${row.Repository}`} target="_blank" rel="noopener noreferrer">
        {row.Repository}
      </a>
    </TableCell>
    <TableCell>{row.Stars}</TableCell>
    <TableCell>{row.Language || 'Unknow'}</TableCell>
    <TableCell>{row.Updated}</TableCell>
    <TableCell>{row['Clone URL']}</TableCell>
  </TableRow>
);
