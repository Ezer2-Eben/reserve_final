import {
  Box, Button, Card, CardBody, Flex, Heading, HStack, Icon, SimpleGrid,
  Spinner, Stat, StatLabel, StatNumber, Text, VStack, Table, Tbody,
  Td, Th, Thead, Tr, Badge, useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import {
  FiFileText, FiDownload, FiMap, FiAlertTriangle, FiFolder
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { rapportService } from '../../services/apiService';

const COLORS = ['#3182CE', '#DD6B20', '#38A169', '#E53E3E', '#805AD5'];

const Rapports = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await rapportService.getStats();
      setStats(data);
    } catch (err) {
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les statistiques globales.',
        status: 'error',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = (type) => {
    toast({
      title: `Préparation de l'export ${type.toUpperCase()}`,
      description: 'Le fichier va être téléchargé dans quelques instants.',
      status: 'info',
      duration: 3000,
      isClosable: true
    });
    
    // Déclenchement du téléchargement réel depuis l'API backend
    const url = type === 'excel' ? rapportService.exportExcelUrl() : rapportService.exportPdfUrl();
    
    // Créer un lien caché pour déclencher le téléchargement avec le token JWT
    const token = localStorage.getItem('token');
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      return response.blob();
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = type === 'excel' ? 'Rapport_Reserves.xlsx' : 'Rapport_Reserves.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: 'Export réussi',
        description: `Votre document ${type.toUpperCase()} a été généré et téléchargé avec succès !`,
        status: 'success',
        duration: 3000
      });
    })
    .catch(() => {
      toast({
        title: 'Erreur d\'export',
        description: 'Une erreur s\'est produite lors de la génération du fichier.',
        status: 'error',
        duration: 3000
      });
    });
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  // Adapter les données pour Recharts
  const pieData = stats && stats.parStatut 
    ? Object.entries(stats.parStatut).map(([name, value]) => ({ name, value }))
    : [];

  const barData = stats ? [
    { name: 'Réserves', total: stats.totalReserves },
    { name: 'Projets', total: stats.totalProjets },
    { name: 'Documents', total: stats.totalDocuments },
    { name: 'Litiges', total: stats.totalLitiges },
  ] : [];

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="gray.800" mb={1}>
              Rapports & Statistiques
            </Heading>
            <Text color="gray.500">
              Analysez la situation foncière globale et téléchargez des rapports au format Excel et PDF.
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="green"
              variant="outline"
              onClick={() => handleExport('excel')}
            >
              Export Excel
            </Button>
            <Button
              leftIcon={<FiFileText />}
              colorScheme="red"
              onClick={() => handleExport('pdf')}
            >
              Rapport PDF
            </Button>
          </HStack>
        </Flex>

        {/* KPIs principaux */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card border="1px" borderColor="gray.100" shadow="sm">
            <CardBody>
              <HStack justify="space-between">
                <Stat>
                  <StatLabel color="gray.500">Superficie administrative totale</StatLabel>
                  <StatNumber color="brand.500" fontSize="3xl">{stats?.superficieTotal} ha</StatNumber>
                </Stat>
                <Icon as={FiMap} boxSize={8} color="brand.200" />
              </HStack>
            </CardBody>
          </Card>
          <Card border="1px" borderColor="gray.100" shadow="sm">
            <CardBody>
              <HStack justify="space-between">
                <Stat>
                  <StatLabel color="gray.500">Taux d'occupation litigieuse</StatLabel>
                  <StatNumber color="red.500" fontSize="3xl">
                    {stats?.totalReserves ? Math.round((stats.occupationsIllegales / stats.totalReserves) * 100) : 0}%
                  </StatNumber>
                </Stat>
                <Icon as={FiAlertTriangle} boxSize={8} color="red.200" />
              </HStack>
            </CardBody>
          </Card>
          <Card border="1px" borderColor="gray.100" shadow="sm">
            <CardBody>
              <HStack justify="space-between">
                <Stat>
                  <StatLabel color="gray.500">Projets Planifiés & Actifs</StatLabel>
                  <StatNumber color="green.500" fontSize="3xl">{stats?.totalProjets}</StatNumber>
                </Stat>
                <Icon as={FiFolder} boxSize={8} color="green.200" />
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Graphiques */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Donut par statut */}
          <Card border="1px" borderColor="gray.100" shadow="sm">
            <CardBody>
              <Heading size="md" mb={4} color="gray.700">Distribution par Statut de Réserve</Heading>
              <Box h="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          {/* Bar Chart indicateurs clés */}
          <Card border="1px" borderColor="gray.100" shadow="sm">
            <CardBody>
              <Heading size="md" mb={4} color="gray.700">Indicateurs Fonciers Clés</Heading>
              <Box h="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#3182CE" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Détail statistique sous forme tabulaire */}
        <Card border="1px" borderColor="gray.100" shadow="sm">
          <CardBody>
            <Heading size="md" mb={4} color="gray.700">Résumé des Indicateurs Métier</Heading>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Indicateur</Th>
                    <Th>Quantité / Valeur</Th>
                    <Th>Statut / Tendance</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td fontWeight="semibold">Total des Réserves Administratives</Td>
                    <Td>{stats?.totalReserves}</Td>
                    <Td><Badge colorScheme="blue">Stable</Badge></Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Alertes de Risques Actives</Td>
                    <Td>{stats?.alertesActives}</Td>
                    <Td>
                      <Badge colorScheme={stats?.alertesActives > 0 ? 'red' : 'green'}>
                        {stats?.alertesActives > 0 ? 'Action requise' : 'Aucun risque'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Occupations Illégales en cours</Td>
                    <Td>{stats?.occupationsIllegales}</Td>
                    <Td>
                      <Badge colorScheme={stats?.occupationsIllegales > 0 ? 'red' : 'green'}>
                        {stats?.occupationsIllegales > 0 ? 'Attention' : 'Sécurisé'}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Procédures Litigieuses ouvertes</Td>
                    <Td>{stats?.litigesOuverts} / {stats?.totalLitiges}</Td>
                    <Td><Badge colorScheme="orange">Sous contrôle</Badge></Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Rapports;
