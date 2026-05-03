// src/components/ui/AnimatedTable.jsx
import {
    Badge,
    Box,
    HStack,
    IconButton,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Select,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    VStack
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useMemo, useState } from 'react';
import { FiChevronUp, FiChevronDown, FiMoreVertical, FiSearch } from 'react-icons/fi';

import { TableLoadingSpinner } from './LoadingSpinner';

// Animation d'entrée pour les lignes du tableau
const fadeInRow = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AnimatedTable = ({
  data = [],
  columns = [],
  isLoading = false,
  searchable = true,
  sortable = true,
  filterable = true,
  selectable = false,
  onRowClick,
  onSelectionChange,
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucune donnée disponible",
  maxHeight = "400px",
  variant = "default",
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Fonction de tri
  const sortData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Fonction de filtrage
  const filteredData = useMemo(() => {
    let result = sortData;

    // Filtrage par recherche
    if (searchTerm) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtrage par colonnes spécifiques
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => String(item[key]).includes(value));
      }
    });

    return result;
  }, [sortData, searchTerm, filters]);

  // Gestion du tri
  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Gestion de la sélection
  const handleRowSelection = (id) => {
    if (!selectable) return;

    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  // Gestion de l'expansion des lignes
  const handleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Rendu de l'en-tête de tri
  const renderSortHeader = (column) => {
    if (!sortable || !column.sortable) {
      return column.header;
    }

    const isSorted = sortConfig.key === column.key;
    const isAsc = sortConfig.direction === 'asc';

    return (
      <HStack spacing={1} cursor="pointer" onClick={() => handleSort(column.key)}>
        <Text>{column.header}</Text>
        {isSorted ? (
          isAsc ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
        ) : (
          <Box w={4} />
        )}
      </HStack>
    );
  };

  // Rendu d'une cellule
  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }

    const value = item[column.key];

    // Rendu spécial selon le type
    switch (column.type) {
      case 'badge':
        return (
          <Badge
            colorScheme={column.badgeColor || 'blue'}
            variant={column.badgeVariant || 'solid'}
          >
            {value}
          </Badge>
        );
      case 'status': {
        const statusColors = {
          active: 'green',
          inactive: 'red',
          pending: 'yellow',
          completed: 'blue',
        };
        return (
          <Badge colorScheme={statusColors[value] || 'gray'}>
            {value}
          </Badge>
        );
      }
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR');
      case 'datetime':
        return new Date(value).toLocaleString('fr-FR');
      case 'number':
        return value?.toLocaleString('fr-FR');
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      default:
        return value;
    }
  };

  // Rendu des filtres
  const renderFilters = () => {
    if (!filterable) return null;

    return (
      <HStack spacing={4} mb={4} flexWrap="wrap">
        {columns
          .filter(col => col.filterable !== false)
          .map(column => (
            <Box key={column.key} minW="150px">
              <Select
                placeholder={`Filtrer ${column.header}`}
                value={filters[column.key] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  [column.key]: e.target.value
                }))}
                size="sm"
              >
                {Array.from(new Set(data.map(item => item[column.key])))
                  .filter(Boolean)
                  .map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </Select>
            </Box>
          ))}
      </HStack>
    );
  };

  if (isLoading) {
    return <TableLoadingSpinner rows={5} />;
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Barre de recherche et filtres */}
      {(searchable || filterable) && (
        <Box p={4} bg={bg} borderRadius="lg" border="1px" borderColor={borderColor}>
          {searchable && (
            <HStack mb={4}>
              <Box position="relative" w="full">
                <Box 
                  position="absolute" 
                  left="12px" 
                  top="50%" 
                  transform="translateY(-50%)"
                  color="gray.400"
                  pointerEvents="none"
                >
                  <FiSearch />
                </Box>
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  pl="40px"
                  size="sm"
                />
              </Box>
            </HStack>
          )}
          {renderFilters()}
        </Box>
      )}

      {/* Tableau */}
      <TableContainer
        maxH={maxHeight}
        overflowY="auto"
        bg={bg}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <Table variant={variant} size="sm">
          <Thead position="sticky" top={0} bg={bg} zIndex={1}>
            <Tr>
              {selectable && (
                <Th w="50px">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allIds = filteredData.map(item => item.id);
                        setSelectedRows(new Set(allIds));
                        onSelectionChange?.(allIds);
                      } else {
                        setSelectedRows(new Set());
                        onSelectionChange?.([]);
                      }
                    }}
                  />
                </Th>
              )}
              {columns.map(column => (
                <Th
                  key={column.key}
                  cursor={sortable && column.sortable !== false ? 'pointer' : 'default'}
                  _hover={sortable && column.sortable !== false ? { bg: hoverBg } : {}}
                  transition="background 0.2s"
                >
                  {renderSortHeader(column)}
                </Th>
              ))}
              <Th w="50px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredData.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + (selectable ? 2 : 1)} textAlign="center" py={8}>
                  <Text color="gray.500">{emptyMessage}</Text>
                </Td>
              </Tr>
            ) : (
              filteredData.map((item, index) => (
                <Tr
                  key={item.id || index}
                  css={{
                    animation: `${fadeInRow} 0.3s ease-out ${index * 0.05}s both`
                  }}
                  cursor={onRowClick ? 'pointer' : 'default'}
                  onClick={() => onRowClick?.(item)}
                  _hover={{ bg: hoverBg }}
                  transition="background 0.2s"
                  bg={selectedRows.has(item.id) ? 'brand.50' : 'transparent'}
                >
                  {selectable && (
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(item.id)}
                        onChange={() => handleRowSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Td>
                  )}
                  {columns.map(column => (
                    <Td key={column.key}>
                      {renderCell(item, column)}
                    </Td>
                  ))}
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList>
                        <MenuItem onClick={() => handleRowExpansion(item.id)}>
                          {expandedRows.has(item.id) ? 'Réduire' : 'Développer'}
                        </MenuItem>
                        <MenuItem>Modifier</MenuItem>
                        <MenuItem color="red.500">Supprimer</MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Informations sur les résultats */}
      <HStack justify="space-between" px={2}>
        <Text fontSize="sm" color="gray.500">
          {filteredData.length} résultat(s) sur {data.length} total
        </Text>
        {selectedRows.size > 0 && (
          <Text fontSize="sm" color="brand.500">
            {selectedRows.size} élément(s) sélectionné(s)
          </Text>
        )}
      </HStack>
    </VStack>
  );
};

export default AnimatedTable;