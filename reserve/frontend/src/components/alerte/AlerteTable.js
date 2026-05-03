import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  Flex,
  Button,
  Spinner,
  Text,
  Select,
  Stack,
  Badge,
} from '@chakra-ui/react';
import PropTypes from 'prop-types';


import { getAllAlertes } from '../../api/alerte';

const niveauColor = {
  Faible: 'green',
  Modéré: 'orange',
  Critique: 'red',
};
const ROWS_PER_PAGE = 5;

const AlerteTable = ({ refreshKey }) => {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // À chaque changement de refreshKey (issu de onSuccess), on recharge les alertes
  useEffect(() => {
    const loadAlertes = async () => {
      setLoading(true);
      try {
        const data = await getAllAlertes();
        setAlertes(data);
      } catch (err) {
        console.error('Erreur chargement alertes :', err);
        setError('Impossible de charger les alertes.');
      } finally {
        setLoading(false);
      }
    };
    loadAlertes();
  }, [refreshKey]);

  // Filtrage par type, description ou ID de réserve
  const filtered = useMemo(() => {
    if (!search) return alertes;
    return alertes.filter(a =>
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      String(a.reserve?.id).includes(search)
    );
  }, [alertes, search]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const current = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, page]);

  if (loading) return <Flex justify="center" py={10}><Spinner size="lg" /></Flex>;
  if (error)   return <Text color="red.500" textAlign="center">{error}</Text>;
  if (!alertes.length) return <Text textAlign="center">Aucune alerte en base.</Text>;

  return (
    <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
      {/* Barre de recherche */}
      <Flex mb={4} flexDir={{ base: 'column', md: 'row' }} justify="space-between">
        <Input
          mb={{ base: 2, md: 0 }}
          placeholder="Rechercher (type, desc, ID réserve…)"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <Select
          w={{ base: '100%', md: '200px' }}
          placeholder="Filtrer par niveau"
          onChange={e => {
            setSearch(e.target.value || '');
            setPage(1);
          }}
        >
          <option value="Faible">Faible</option>
          <option value="Modéré">Modéré</option>
          <option value="Critique">Critique</option>
        </Select>
      </Flex>

      {/* Tableau */}
      <TableContainer>
        <Table variant="striped" size="sm">
          <Thead>
            <Tr>
              <Th>ID Alerte</Th>
              <Th>Type</Th>
              <Th>Description</Th>
              <Th>Niveau</Th>
              <Th>ID Réserve</Th>
            </Tr>
          </Thead>
          <Tbody>
            {current.map(a => (
              <Tr key={a.id} _hover={{ bg: 'gray.50' }}>
                <Td>{a.id}</Td>
                <Td>{a.type}</Td>
                <Td maxW="300px" whiteSpace="pre-wrap">{a.description}</Td>
                <Td>
                  <Badge colorScheme={niveauColor[a.niveau] || 'gray'}>
                    {a.niveau}
                  </Badge>
                </Td>
                <Td>{a.reserve?.id ?? '–'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Stack direction="row" spacing={2} justify="center" mt={4}>
        <Button size="sm" onClick={() => setPage(p => Math.max(p - 1, 1))} isDisabled={page === 1}>
          Précédent
        </Button>
        <Text alignSelf="center">Page {page} / {totalPages}</Text>
        <Button size="sm" onClick={() => setPage(p => Math.min(p + 1, totalPages))} isDisabled={page === totalPages}>
          Suivant
        </Button>
      </Stack>
    </Box>
  );
};

AlerteTable.propTypes = {
  refreshKey: PropTypes.number.isRequired,
};

export default AlerteTable;
