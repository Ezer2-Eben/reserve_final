import {
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    Heading,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Spinner,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
    Alert,
    AlertIcon,
    Tooltip,
    IconButton,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiSearch, FiRefreshCw, FiActivity, FiLogIn, FiPlusCircle, FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';

import { journalService } from '../../services/apiService';

const ACTION_CONFIG = {
    CREATE:  { color: 'green',  icon: <FiPlusCircle />, label: 'Création'     },
    UPDATE:  { color: 'blue',   icon: <FiEdit2 />,      label: 'Modification'  },
    DELETE:  { color: 'red',    icon: <FiTrash2 />,     label: 'Suppression'   },
    LOGIN:   { color: 'purple', icon: <FiLogIn />,      label: 'Connexion'     },
    UPLOAD:  { color: 'orange', icon: <FiUpload />,     label: 'Upload'        },
};

const MODULE_COLORS = {
    ALERTE:       'red',
    PROJET:       'blue',
    DOCUMENT:     'orange',
    RESERVE:      'green',
    UTILISATEUR:  'purple',
    AUTH:         'cyan',
};

const Historique = () => {
    const [journal, setJournal]           = useState([]);
    const [filtered, setFiltered]         = useState([]);
    const [isLoading, setIsLoading]       = useState(true);
    const [error, setError]               = useState(null);
    const [searchTerm, setSearchTerm]     = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchJournal = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await journalService.getAll();
            setJournal(data);
            setFiltered(data);
        } catch (err) {
            console.error('Erreur chargement journal:', err);
            setError('Impossible de charger le journal d\'activité. Vérifiez que le serveur est démarré.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchJournal(); }, []);

    useEffect(() => {
        let result = journal;
        if (moduleFilter) result = result.filter(e => e.module === moduleFilter);
        if (actionFilter) result = result.filter(e => e.action === actionFilter);
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.description?.toLowerCase().includes(s) ||
                e.utilisateur?.toLowerCase().includes(s) ||
                e.module?.toLowerCase().includes(s)
            );
        }
        setFiltered(result);
    }, [searchTerm, moduleFilter, actionFilter, journal]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const getActionBadge = (action) => {
        const cfg = ACTION_CONFIG[action] || { color: 'gray', label: action };
        return <Badge colorScheme={cfg.color} display="flex" alignItems="center" gap={1}>{cfg.label}</Badge>;
    };

    const getModuleBadge = (module) => {
        const color = MODULE_COLORS[module] || 'gray';
        return <Badge colorScheme={color} variant="outline">{module}</Badge>;
    };

    if (error) {
        return (
            <Alert status="error" borderRadius="lg">
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <VStack spacing={6} align="stretch">
                {/* En-tête */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <HStack spacing={2} mb={1}>
                            <FiActivity size={24} color="#16a34a" />
                            <Heading size="lg" color="gray.700">Journal d'Activité</Heading>
                        </HStack>
                        <Text color="gray.500">
                            Historique automatique de toutes les actions effectuées dans le système
                        </Text>
                    </Box>
                    <Tooltip label="Actualiser">
                        <IconButton
                            icon={<FiRefreshCw />}
                            colorScheme="brand"
                            variant="outline"
                            onClick={fetchJournal}
                            isLoading={isLoading}
                            aria-label="Actualiser"
                        />
                    </Tooltip>
                </Flex>

                {/* Statistiques rapides */}
                <HStack spacing={4} flexWrap="wrap">
                    {['CREATE','UPDATE','DELETE','LOGIN'].map(action => {
                        const cfg = ACTION_CONFIG[action];
                        const count = journal.filter(e => e.action === action).length;
                        return (
                            <Box key={action} bg="white" border="1px" borderColor="gray.200"
                                borderRadius="lg" px={4} py={3} minW="120px" shadow="sm">
                                <Text fontSize="xs" color="gray.500">{cfg?.label}</Text>
                                <Text fontSize="2xl" fontWeight="bold" color={`${cfg?.color}.500`}>{count}</Text>
                            </Box>
                        );
                    })}
                    <Box bg="white" border="1px" borderColor="gray.200"
                        borderRadius="lg" px={4} py={3} minW="120px" shadow="sm">
                        <Text fontSize="xs" color="gray.500">Total</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="gray.700">{journal.length}</Text>
                    </Box>
                </HStack>

                {/* Filtres */}
                <HStack spacing={3} flexWrap="wrap">
                    <InputGroup maxW="320px">
                        <InputLeftElement pointerEvents="none">
                            <FiSearch color="gray" />
                        </InputLeftElement>
                        <Input
                            placeholder="Rechercher dans le journal..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <Select maxW="180px" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                        <option value="">Tous les modules</option>
                        {['RESERVE','PROJET','ALERTE','DOCUMENT','UTILISATEUR','AUTH'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </Select>

                    <Select maxW="180px" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                        <option value="">Toutes les actions</option>
                        {Object.entries(ACTION_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </Select>

                    {(moduleFilter || actionFilter || searchTerm) && (
                        <Button variant="ghost" size="sm" onClick={() => {
                            setModuleFilter(''); setActionFilter(''); setSearchTerm('');
                        }}>
                            Effacer les filtres
                        </Button>
                    )}
                </HStack>

                {/* Tableau */}
                <Card shadow="sm" border="1px" borderColor="gray.200">
                    <CardBody p={0}>
                        {isLoading ? (
                            <Box textAlign="center" py={12}>
                                <Spinner size="xl" color="brand.500" thickness="3px" />
                                <Text mt={4} color="gray.500">Chargement du journal d'activité...</Text>
                            </Box>
                        ) : filtered.length === 0 ? (
                            <Box textAlign="center" py={12}>
                                <FiActivity size={48} color="#CBD5E0" />
                                <Text mt={3} color="gray.400" fontSize="lg">
                                    {journal.length === 0
                                        ? 'Aucune activité enregistrée. Les actions effectuées dans le système apparaîtront ici automatiquement.'
                                        : 'Aucun résultat pour ces filtres.'}
                                </Text>
                            </Box>
                        ) : (
                            <Box overflowX="auto">
                                <Table variant="simple" size="md">
                                    <Thead bg="gray.50">
                                        <Tr>
                                            <Th px={4} py={3} color="gray.700">Date & Heure</Th>
                                            <Th px={4} py={3} color="gray.700">Action</Th>
                                            <Th px={4} py={3} color="gray.700">Module</Th>
                                            <Th px={4} py={3} color="gray.700">Description</Th>
                                            <Th px={4} py={3} color="gray.700">Utilisateur</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {filtered.map((entry, index) => (
                                            <Tr
                                                key={entry.id}
                                                bg={index % 2 === 0 ? 'white' : 'gray.50'}
                                                _hover={{ bg: 'green.50' }}
                                                transition="background-color 0.15s"
                                            >
                                                <Td px={4} py={3} whiteSpace="nowrap">
                                                    <Text fontSize="sm" color="gray.600">
                                                        {formatDate(entry.dateAction)}
                                                    </Text>
                                                </Td>
                                                <Td px={4} py={3}>{getActionBadge(entry.action)}</Td>
                                                <Td px={4} py={3}>{getModuleBadge(entry.module)}</Td>
                                                <Td px={4} py={3}>
                                                    <Text fontSize="sm" noOfLines={2} maxW="400px">
                                                        {entry.description}
                                                    </Text>
                                                </Td>
                                                <Td px={4} py={3}>
                                                    <Badge colorScheme="gray" variant="subtle">
                                                        {entry.utilisateur || 'système'}
                                                    </Badge>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                        )}
                    </CardBody>
                </Card>

                <Text fontSize="xs" color="gray.400" textAlign="right">
                    {filtered.length} entrée{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
                    {journal.length !== filtered.length ? ` sur ${journal.length}` : ''}
                </Text>
            </VStack>
        </Box>
    );
};

export default Historique;
