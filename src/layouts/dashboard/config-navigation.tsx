import { useMemo } from 'react';
import Iconify from 'src/components/iconify';
// routes
import { paths } from 'src/routes/paths';
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function useNavData() {
  const data = useMemo(
    () => [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: 'overview v5.0.0',
        items: [
          { title: 'CVE Scanner', path: paths.dashboard.root, icon: <Iconify icon="solar:bug-bold" sx={{ color: 'primary.main' }} /> },
          { title: 'CVE Search', path: paths.dashboard.two, icon: <Iconify icon="solar:rounded-magnifer-bug-bold" sx={{ color: 'primary.main' }} /> },
          { title: 'Pathtraversal Scanner', path: paths.dashboard.three, icon: <Iconify icon="solar:folder-path-connect-bold" sx={{ color: 'primary.main' }} /> },
          { title: 'SQLi Scanner', path: paths.dashboard.four, icon: <Iconify icon="mdi:sql-query" sx={{ color: 'primary.main' }} /> },
          { title: 'XSS Scanner', path: paths.dashboard.five, icon: <Iconify icon="cuida:scope-outline" sx={{ color: 'primary.main' }} /> },
        ],
      },
    ],
    []
  );

  return data;
}
