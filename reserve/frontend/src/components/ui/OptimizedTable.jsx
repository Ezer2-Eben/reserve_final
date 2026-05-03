// src/components/ui/OptimizedTable.jsx
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Flex,
    HStack,
    IconButton,
    Input,
    Select,
    Spinner,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
} from '@chakra-ui/react';
import React, { useCallback, useMemo } from 'react';

const OptimizedTable = React.memo(({
  data = [],
  columns = [],
  loading = false,
  error = null,
  searchable = false,
  searchValue = '',
  onSearchChange = () => {},
  searchPlaceholder = 'Rechercher...',
  pagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  pageSize = 10,
  onPageSizeChange = () => {},
  sortable = false,
  sortColumn = '',
  sortDirection = 'asc',
  onSort = () => {},
  emptyMessage = 'Aucune donnée disponible',
  actions = [],
  onAction = () => {},
  ...props
}) => {
  // Mémoriser les données filtrées et triées
  const processedData = useMemo(() => {
    let result = [...data];

    // Tri
    if (sortable && sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Recherche
    if (searchable && searchValue) {
      result = result.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return value && value.toString().toLowerCase().includes(searchValue.toLowerCase());
        })
      );
    }

    // Pagination
    if (pagination) {
      const startIndex = (currentPage - 1) * pageSize;
      result = result.slice(startIndex, startIndex + pageSize);
    }

    return result;
  }, [data, sortable, sortColumn, sortDirection, searchable, searchValue, pagination, currentPage, pageSize, columns]);

  // Mémoriser les handlers
  const handleSort = useCallback((columnKey) => {
    if (!sortable) return;
    
    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  }, [sortable, sortColumn, sortDirection, onSort]);

  const handleAction = useCallback((action, item) => {
    onAction(action, item);
  }, [onAction]);

  // Rendu du header de tri
  const renderSortHeader = useCallback((column) => {
    if (!sortable) return column.label;

    const isSorted = sortColumn === column.key;
    const icon = isSorted 
      ? (sortDirection === 'asc' ? '↑' : '↓')
      : '↕';

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(column.key)}
        _hover={{ bg: 'gray.100' }}
        fontWeight="semibold"
        color={isSorted ? 'brand.500' : 'gray.600'}
      >
        {column.label} {icon}
      </Button>
    );
  }, [sortable, sortColumn, sortDirection, handleSort]);

  // Rendu d'une cellule
  const renderCell = useCallback((item, column) => {
    const value = item[column.key];

    if (column.render) {
      return column.render(value, item);
    }

    if (column.type === 'badge') {
      return (
        <Badge colorScheme={column.badgeColor || 'blue'}>
          {value}
        </Badge>
      );
    }

    if (column.type === 'date') {
      return new Date(value).toLocaleDateString('fr-FR');
    }

    if (column.type === 'number') {
      return value?.toLocaleString('fr-FR');
    }

    return value || '-';
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner size="lg" color="brand.500" />
        <Text ml={3}>Chargement en cours...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Text>{error}</Text>
      </Alert>
    );
  }

  return (
    <Box {...props}>
      {/* Barre de recherche */}
      {searchable ? <Flex mb={4} gap={4}>
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            maxW="300px"
          />
          {pagination ? <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              maxW="120px"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </Select> : null}
        </Flex> : null}

      {/* Tableau */}
      <TableContainer>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th key={column.key}>
                  {renderSortHeader(column)}
                </Th>
              ))}
              {actions.length > 0 && <Th>Actions</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {processedData.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} textAlign="center" py={8}>
                  <Text color="gray.500">{emptyMessage}</Text>
                </Td>
              </Tr>
            ) : (
              processedData.map((item, index) => (
                <Tr key={item.id || index} _hover={{ bg: 'gray.50' }}>
                  {columns.map((column) => (
                    <Td key={column.key}>
                      {renderCell(item, column)}
                    </Td>
                  ))}
                  {actions.length > 0 && (
                    <Td>
                      <HStack spacing={2}>
                        {actions.map((action) => (
                          <Tooltip key={action.key} label={action.label}>
                            <IconButton
                              icon={action.icon}
                              size="sm"
                              variant="ghost"
                              colorScheme={action.colorScheme || 'gray'}
                              onClick={() => handleAction(action.key, item)}
                              aria-label={action.label}
                            />
                          </Tooltip>
                        ))}
                      </HStack>
                    </Td>
                  )}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && totalPages > 1 ? <Flex justify="space-between" align="center" mt={4}>
          <Text fontSize="sm" color="gray.600">
            Page {currentPage} sur {totalPages}
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
            >
              <ChevronRightIcon />
            </Button>
          </HStack>
        </Flex> : null}
    </Box>
  );
});

OptimizedTable.displayName = 'OptimizedTable';

export default OptimizedTable;








