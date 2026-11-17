import { useCallback, useState } from 'react';

export function usePagination(initialLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 1,
  });

  const handlePageChange = useCallback((nextPage) => {
    setPage(Math.max(1, nextPage));
  }, []);

  const handleLimitChange = useCallback((nextLimit) => {
    setLimit(Number(nextLimit));
    setPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    pagination,
    setPagination,
    handlePageChange,
    handleLimitChange,
    resetPage,
  };
}
