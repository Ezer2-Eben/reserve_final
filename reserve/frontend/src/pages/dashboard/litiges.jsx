import {
  Badge, Box, Button, Card, CardBody, Flex, FormControl, FormLabel,
  Heading, HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid,
  Spinner, Table, Tbody, Td, Text, Th, Thead, Tooltip, Tr, VStack,
  useDisclosure, useToast, Tag, Textarea, Icon, Stat, StatLabel, StatNumber
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import {
  FiPlus, FiEdit2, FiTrash2, FiShield,
  FiCalendar, FiMapPin
} from 'react-icons/fi';
import { litigeService, reserveService } from '../../services/apiService';

const LITIGE_TYPES = {
  OCCUPATION_ILLEGALE: { label: 'Occupation Illégale', color: 'red' },
  DOUBLE_AFFECTATION: { label: 'Double Affectation', color: 'orange' },
  VIOLATION_URBANISME: { label: 'Violation Urbanisme', color: 'yellow' },
  LITIGE_FONCIER: { label: 'Litige Foncier', color: 'purple' },
  AUTRE: { label: 'Autre', color: 'gray' }
};

const LITIGE_STATUS = {
  OUVERT: { label: 'Ouvert', color: 'red' },
  EN_COURS: { label: 'En Cours', color: 'orange' },
  RESOLU: { label: 'Résolu', color: 'green' },
  FERME: { label: 'Fermé', color: 'gray' }
};

const Litiges = () => {
  const [litiges, setLitiges] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [selectedLitige, setSelectedLitige] = useState(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'LITIGE_FONCIER',
    statut: 'OUVERT',
    partiesImpliquees: '',
    procedureJuridique: '',
    dateOuverture: '',
    dateEcheance: '',
    reserve: { id: '' }
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [lList, rList] = await Promise.all([
        litigeService.getAll(),
        reserveService.getAll()
      ]);
      setLitiges(lList);
      setReserves(rList);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les litiges.',
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
    setSelectedLitige(null);
    setFormData({
      titre: '',
      description: '',
      type: 'LITIGE_FONCIER',
      statut: 'OUVERT',
      partiesImpliquees: '',
      procedureJuridique: '',
      dateOuverture: new Date().toISOString().split('T')[0],
      dateEcheance: '',
      reserve: { id: reserves[0]?.id || '' }
    });
    onOpen();
  };

  const handleOpenEdit = (litige) => {
    setSelectedLitige(litige);
    setFormData({
      titre: litige.titre || '',
      description: litige.description || '',
      type: litige.type || 'LITIGE_FONCIER',
      statut: litige.statut || 'OUVERT',
      partiesImpliquees: litige.partiesImpliquees || '',
      procedureJuridique: litige.procedureJuridique || '',
      dateOuverture: litige.dateOuverture || '',
      dateEcheance: litige.dateEcheance || '',
      reserve: { id: litige.reserve?.id || '' }
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
      if (selectedLitige) {
        await litigeService.update(selectedLitige.id, formData);
        toast({
          title: 'Litige mis à jour',
          status: 'success',
          duration: 3000
        });
      } else {
        await litigeService.create(formData);
        toast({
          title: 'Litige créé avec succès',
          status: 'success',
          duration: 3000
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
    if (!window.confirm('Voulez-vous vraiment supprimer ce litige ?')) return;
    try {
      await litigeService.delete(id);
      toast({
        title: 'Litige supprimé',
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

  const filteredLitiges = litiges.filter((l) => {
    const matchesSearch = l.titre?.toLowerCase().includes(search.toLowerCase()) || 
                          l.reserve?.nom?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || l.type === filterType;
    const matchesStatut = !filterStatut || l.statut === filterStatut;
    return matchesSearch && matchesType && matchesStatut;
  });

  const kpis = {
    total: litiges.length,
    ouvert: litiges.filter(l => l.statut === 'OUVERT').length,
    enCours: litiges.filter(l => l.statut === 'EN_COURS').length,
    resolu: litiges.filter(l => l.statut === 'RESOLU').length,
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
              Gestion des Conflits & Litiges
            </Heading>
            <Text color="gray.500">
              Enregistrez, suivez et résolvez les conflits fonciers et juridiques sur vos réserves
            </Text>
          </Box>
          <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={handleOpenCreate}>
            Déclarer un Litige
          </Button>
        </Flex>

        {/* KPIs */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5}>
          <Card border="1px" borderColor="gray.100" shadow="sm">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Total Conflits</StatLabel>
                <StatNumber color="gray.700">{kpis.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card border="1px" borderColor="gray.100" shadow="sm" bg="red.50">
            <CardBody>
              <Stat>
                <StatLabel color="red.600" fontWeight="bold">Ouverts</StatLabel>
                <StatNumber color="red.700">{kpis.ouvert}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card border="1px" borderColor="gray.100" shadow="sm" bg="orange.50">
            <CardBody>
              <Stat>
                <StatLabel color="orange.600" fontWeight="bold">En cours de traitement</StatLabel>
                <StatNumber color="orange.700">{kpis.enCours}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card border="1px" borderColor="gray.100" shadow="sm" bg="green.50">
            <CardBody>
              <Stat>
                <StatLabel color="green.600" fontWeight="bold">Résolus</StatLabel>
                <StatNumber color="green.700">{kpis.resolu}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filtres */}
        <Card border="1px" borderColor="gray.100" shadow="sm">
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Input
                placeholder="Rechercher par titre ou réserve..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} placeholder="Tous les types de litiges">
                {Object.entries(LITIGE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Select>
              <Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} placeholder="Tous les statuts">
                {Object.entries(LITIGE_STATUS).map(([k, v]) => (
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
                    <Th>Titre / Réserve</Th>
                    <Th>Type</Th>
                    <Th>Statut</Th>
                    <Th>Parties Impliquées</Th>
                    <Th>Date Ouverture</Th>
                    <Th>Échéance</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredLitiges.length > 0 ? (
                    filteredLitiges.map((l) => (
                      <Tr key={l.id}>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            <Text fontWeight="semibold" color="gray.700">{l.titre}</Text>
                            <HStack spacing={1} color="gray.500" fontSize="xs">
                              <Icon as={FiMapPin} />
                              <Text>{l.reserve?.nom}</Text>
                            </HStack>
                          </VStack>
                        </Td>
                        <Td>
                          <Tag colorScheme={LITIGE_TYPES[l.type]?.color || 'gray'}>
                            {LITIGE_TYPES[l.type]?.label || l.type}
                          </Tag>
                        </Td>
                        <Td>
                          <Badge colorScheme={LITIGE_STATUS[l.statut]?.color || 'gray'} px={2} py={1} borderRadius="full">
                            {LITIGE_STATUS[l.statut]?.label || l.statut}
                          </Badge>
                        </Td>
                        <Td maxW="200px" isTruncated>
                          <Tooltip label={l.partiesImpliquees}>
                            <Text fontSize="sm" color="gray.600">{l.partiesImpliquees || 'N/A'}</Text>
                          </Tooltip>
                        </Td>
                        <Td fontSize="sm" color="gray.600">{l.dateOuverture || 'N/A'}</Td>
                        <Td fontSize="sm" color="gray.600">
                          {l.dateEcheance ? (
                            <HStack>
                              <Icon as={FiCalendar} color={new Date(l.dateEcheance) < new Date() && l.statut !== 'RESOLU' ? 'red.500' : 'gray.400'} />
                              <Text color={new Date(l.dateEcheance) < new Date() && l.statut !== 'RESOLU' ? 'red.600' : 'gray.600'}>{l.dateEcheance}</Text>
                            </HStack>
                          ) : 'N/A'}
                        </Td>
                        <Td textAlign="right">
                          <HStack spacing={2} justify="flex-end">
                            <IconButton
                              size="sm"
                              icon={<FiEdit2 />}
                              aria-label="Modifier"
                              onClick={() => handleOpenEdit(l)}
                            />
                            <IconButton
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              icon={<FiTrash2 />}
                              aria-label="Supprimer"
                              onClick={() => handleDelete(l.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={10}>
                        <VStack spacing={2}>
                          <Icon as={FiShield} boxSize={8} color="gray.300" />
                          <Text color="gray.500">Aucun litige ou conflit ne correspond aux filtres.</Text>
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
            <ModalHeader>{selectedLitige ? 'Modifier le litige' : 'Déclarer un nouveau litige'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Titre du Litige / Conflit</FormLabel>
                  <Input
                    placeholder="Ex: Double affectation sur parcelle B12"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  />
                </FormControl>

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
                    <FormLabel>Type de Conflit</FormLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      {Object.entries(LITIGE_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Statut du Conflit</FormLabel>
                    <Select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    >
                      {Object.entries(LITIGE_STATUS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Date d'ouverture</FormLabel>
                    <Input
                      type="date"
                      value={formData.dateOuverture}
                      onChange={(e) => setFormData({ ...formData, dateOuverture: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Date Échéance / Rappel important</FormLabel>
                  <Input
                    type="date"
                    value={formData.dateEcheance}
                    onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Parties impliquées (occupants, tiers, administrations)</FormLabel>
                  <Input
                    placeholder="Ex: M. X, Cadastre municipal..."
                    value={formData.partiesImpliquees}
                    onChange={(e) => setFormData({ ...formData, partiesImpliquees: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description détaillée du litige</FormLabel>
                  <Textarea
                    placeholder="Détails du différend..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Procédure Juridique / Actions réglementaires en cours</FormLabel>
                  <Textarea
                    placeholder="Ex: Constat d'huissier dressé le..., tribunal de..."
                    value={formData.procedureJuridique}
                    onChange={(e) => setFormData({ ...formData, procedureJuridique: e.target.value })}
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

export default Litiges;
