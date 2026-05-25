import {
  Badge, Box, Button, Card, CardBody, Flex, FormControl, FormLabel,
  Heading, HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid,
  Spinner, Table, Tbody, Td, Text, Th, Thead, Tr, VStack,
  useDisclosure, useToast, Tag, Textarea, Icon, Stat, StatLabel, StatNumber
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiAlertTriangle, FiPlus, FiEdit2, FiTrash2, FiMapPin, FiUser,
  FiCalendar
} from 'react-icons/fi';

import { occupationService, reserveService } from '../../services/apiService';

const OCCUPATION_TYPES = {
  TEMPORAIRE: { label: 'Temporaire', color: 'blue' },
  ILLEGALE: { label: 'Illégale', color: 'red' },
  AUTORISEE: { label: 'Autorisée', color: 'green' }
};

const OCCUPATION_STATUS = {
  ACTIVE: { label: 'Active', color: 'red' },
  REGULARISEE: { label: 'Régularisée', color: 'green' },
  EVACUEE: { label: 'Évacuée', color: 'gray' },
  EN_COURS_EVACUATION: { label: 'En cours d\'évacuation', color: 'orange' }
};

const Occupations = () => {
  const [occupations, setOccupations] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    typeOccupation: 'TEMPORAIRE',
    statut: 'ACTIVE',
    occupant: '',
    superficie: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    reserve: { id: '' }
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [oList, rList] = await Promise.all([
        occupationService.getAll(),
        reserveService.getAll()
      ]);
      setOccupations(oList);
      setReserves(rList);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les occupations.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedOccupation(null);
    setFormData({
      typeOccupation: 'TEMPORAIRE',
      statut: 'ACTIVE',
      occupant: '',
      superficie: '',
      description: '',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      reserve: { id: reserves[0]?.id || '' }
    });
    onOpen();
  };

  const handleOpenEdit = (occ) => {
    setSelectedOccupation(occ);
    setFormData({
      typeOccupation: occ.typeOccupation || 'TEMPORAIRE',
      statut: occ.statut || 'ACTIVE',
      occupant: occ.occupant || '',
      superficie: occ.superficie || '',
      description: occ.description || '',
      dateDebut: occ.dateDebut || '',
      dateFin: occ.dateFin || '',
      reserve: { id: occ.reserve?.id || '' }
    });
    onOpen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reserve.id) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une réserve.',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    try {
      if (selectedOccupation) {
        await occupationService.update(selectedOccupation.id, formData);
        toast({
          title: 'Occupation mise à jour',
          status: 'success',
          duration: 3000
        });
      } else {
        await occupationService.create(formData);
        toast({
          title: 'Occupation enregistrée',
          description: formData.typeOccupation === 'ILLEGALE' ? 'Une alerte critique a été créée automatiquement.' : null,
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      }
      onClose();
      fetchData();
    } catch (err) {
      toast({
        title: 'Erreur de sauvegarde',
        description: err.response?.data?.message || 'Une erreur est survenue.',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette occupation ?')) return;
    try {
      await occupationService.delete(id);
      toast({
        title: 'Occupation supprimée',
        status: 'success',
        duration: 3000
      });
      fetchData();
    } catch (err) {
      toast({
        title: 'Erreur de suppression',
        status: 'error',
        duration: 3000
      });
    }
  };

  const filteredOccupations = occupations.filter((o) => {
    const matchesSearch = o.occupant?.toLowerCase().includes(search.toLowerCase()) || 
                          o.reserve?.nom?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || o.typeOccupation === filterType;
    const matchesStatut = !filterStatut || o.statut === filterStatut;
    return matchesSearch && matchesType && matchesStatut;
  });

  const kpis = {
    total: occupations.length,
    illegales: occupations.filter(o => o.typeOccupation === 'ILLEGALE' && o.statut !== 'EVACUEE').length,
    temporaires: occupations.filter(o => o.typeOccupation === 'TEMPORAIRE').length,
    autorisees: occupations.filter(o => o.typeOccupation === 'AUTORISEE').length
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="gray.800" mb={1}>
              Suivi des Occupations
            </Heading>
            <Text color="gray.500">
              Identifiez, gérez et contrôlez les occupations temporaires, autorisées ou illégales des réserves publiques.
            </Text>
          </Box>
          <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={handleOpenCreate}>
            Déclarer une Occupation
          </Button>
        </Flex>

        {/* KPIs */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5}>
          <Card border="1px" borderColor="gray.100" shadow="sm">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Total Occupations</StatLabel>
                <StatNumber color="gray.700">{kpis.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card border="1px" borderColor="gray.100" shadow="sm" bg="red.50">
            <CardBody>
              <Stat>
                <StatLabel color="red.600" fontWeight="bold">Occupations Illégales actives</StatLabel>
                <StatNumber color="red.700">{kpis.illegales}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card border="1px" borderColor="gray.100" shadow="sm" bg="blue.50">
            <CardBody>
              <Stat>
                <StatLabel color="blue.600" fontWeight="bold">Occupations Temporaires</StatLabel>
                <StatNumber color="blue.700">{kpis.temporaires}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card border="1px" borderColor="gray.100" shadow="sm" bg="green.50">
            <CardBody>
              <Stat>
                <StatLabel color="green.600" fontWeight="bold">Autorisations Spéciales</StatLabel>
                <StatNumber color="green.700">{kpis.autorisees}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filtres */}
        <Card border="1px" borderColor="gray.100" shadow="sm">
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Input
                placeholder="Rechercher par occupant ou réserve..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} placeholder="Tous les types d'occupations">
                {Object.entries(OCCUPATION_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Select>
              <Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} placeholder="Tous les statuts">
                {Object.entries(OCCUPATION_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Select>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Table */}
        <Card border="1px" borderColor="gray.100" shadow="sm">
          <CardBody p={0}>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Occupant / Réserve</Th>
                    <Th>Type d'Occupation</Th>
                    <Th>Statut</Th>
                    <Th>Superficie (ha)</Th>
                    <Th>Date Début</Th>
                    <Th>Date Fin</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredOccupations.length > 0 ? (
                    filteredOccupations.map((o) => (
                      <Tr key={o.id}>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            <HStack>
                              <Icon as={FiUser} color="gray.400" />
                              <Text fontWeight="semibold" color="gray.700">{o.occupant || 'Inconnu'}</Text>
                            </HStack>
                            <HStack spacing={1} color="gray.500" fontSize="xs">
                              <Icon as={FiMapPin} />
                              <Text>{o.reserve?.nom}</Text>
                            </HStack>
                          </VStack>
                        </Td>
                        <Td>
                          <Tag colorScheme={OCCUPATION_TYPES[o.typeOccupation]?.color || 'gray'}>
                            {OCCUPATION_TYPES[o.typeOccupation]?.label || o.typeOccupation}
                          </Tag>
                        </Td>
                        <Td>
                          <Badge colorScheme={OCCUPATION_STATUS[o.statut]?.color || 'gray'} px={2} py={1} borderRadius="full">
                            {OCCUPATION_STATUS[o.statut]?.label || o.statut}
                          </Badge>
                        </Td>
                        <Td color="gray.700" fontWeight="medium">{o.superficie ? `${o.superficie} ha` : 'N/A'}</Td>
                        <Td fontSize="sm" color="gray.600">{o.dateDebut || 'N/A'}</Td>
                        <Td fontSize="sm" color="gray.600">
                          {o.dateFin ? (
                            <HStack>
                              <Icon as={FiCalendar} />
                              <Text>{o.dateFin}</Text>
                            </HStack>
                          ) : (
                            <Text color="gray.400" fontStyle="italic">Indéterminée</Text>
                          )}
                        </Td>
                        <Td textAlign="right">
                          <HStack spacing={2} justify="flex-end">
                            <IconButton
                              size="sm"
                              icon={<FiEdit2 />}
                              aria-label="Modifier"
                              onClick={() => handleOpenEdit(o)}
                            />
                            <IconButton
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              icon={<FiTrash2 />}
                              aria-label="Supprimer"
                              onClick={() => handleDelete(o.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={10}>
                        <VStack spacing={2}>
                          <Icon as={FiAlertTriangle} boxSize={8} color="gray.300" />
                          <Text color="gray.500">Aucune occupation enregistrée.</Text>
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>

      {/* Modal Création / Édition */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <form onSubmit={handleSubmit}>
          <ModalContent>
            <ModalHeader>{selectedOccupation ? 'Modifier l\'occupation' : 'Enregistrer une nouvelle occupation'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Réserve concernée</FormLabel>
                    <Select
                      value={formData.reserve.id}
                      onChange={(e) => setFormData({ ...formData, reserve: { id: e.target.value } })}
                    >
                      <option value="" disabled>Sélectionner la réserve</option>
                      {reserves.map((r) => (
                        <option key={r.id} value={r.id}>{r.nom}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Type d'occupation</FormLabel>
                    <Select
                      value={formData.typeOccupation}
                      onChange={(e) => setFormData({ ...formData, typeOccupation: e.target.value })}
                    >
                      {Object.entries(OCCUPATION_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired>
                  <FormLabel>Nom de l'occupant (Collectivité, tiers ou entreprise)</FormLabel>
                  <Input
                    placeholder="Ex: M. Jean Dupont ou Coopérative Agricole"
                    value={formData.occupant}
                    onChange={(e) => setFormData({ ...formData, occupant: e.target.value })}
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Statut actuel</FormLabel>
                    <Select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    >
                      {Object.entries(OCCUPATION_STATUS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Superficie occupée (ha)</FormLabel>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Ex: 0.75"
                      value={formData.superficie}
                      onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Date de début</FormLabel>
                    <Input
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Date de fin (prévue ou contractuelle)</FormLabel>
                    <Input
                      type="date"
                      value={formData.dateFin}
                      onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Description détaillée / Informations complémentaires</FormLabel>
                  <Textarea
                    placeholder="Détails sur l'usage de la parcelle, litige potentiel, etc..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
              <Button type="submit" colorScheme="brand">Enregistrer</Button>
            </ModalFooter>
          </ModalContent>
        </form>
      </Modal>
    </Box>
  );
};

export default Occupations;
