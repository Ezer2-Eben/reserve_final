// src/pages/dashboard/overview.jsx
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Grid,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Flex
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiFileText,
  FiFolder,
  FiMap,
  FiArrowUpRight,
  FiArrowDownRight,
  FiShield
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import {
  alerteService,
  documentService,
  historiqueService,
  projetService,
  reserveService,
  utilisateurService,
  litigeService
} from '../../services/apiService';


const chartData = [
  { name: 'Jan', reserves: 10, alertes: 2 },
  { name: 'Fév', reserves: 12, alertes: 3 },
  { name: 'Mar', reserves: 15, alertes: 1 },
  { name: 'Avr', reserves: 16, alertes: 5 },
  { name: 'Mai', reserves: 22, alertes: 2 },
  { name: 'Juin', reserves: 28, alertes: 4 },
];

const StatCard = ({ title, value, icon, change, changeType, isLoading }) => {
  if (isLoading) {
    return (
      <Card shadow="sm" border="1px" borderColor="gray.100" borderRadius="xl">
        <CardBody>
          <Center py={8}>
            <Spinner size="md" color="brand.500" />
          </Center>
        </CardBody>
      </Card>
    );
  }

  const isPositive = changeType === 'increase';

  return (
    <Card 
      shadow="sm" 
      border="1px" 
      borderColor="gray.100" 
      borderRadius="xl"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} 
      transition="all 0.2s"
    >
      <CardBody>
        <HStack justify="space-between" align="center" mb={4}>
          <Box
            p={2}
            borderRadius="lg"
            bg="brand.50"
            color="brand.600"
          >
            <Icon as={icon} boxSize={5} />
          </Box>
          {change && (
            <Badge 
              colorScheme={isPositive ? 'green' : 'red'} 
              bg={isPositive ? 'green.50' : 'red.50'}
              color={isPositive ? 'green.600' : 'red.600'}
              px={2} 
              py={1} 
              borderRadius="full"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Icon as={isPositive ? FiArrowUpRight : FiArrowDownRight} />
              {change}
            </Badge>
          )}
        </HStack>
        <VStack align="flex-start" spacing={1}>
          <Text fontSize="sm" color="gray.500" fontWeight="600">
            {title}
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="gray.800" lineHeight="1">
            {value}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
};

const RecentActivity = ({ activities, isLoading }) => {
  return (
    <Card shadow="sm" border="1px" borderColor="gray.100" borderRadius="xl">
      <CardBody>
        <VStack align="stretch" spacing={5}>
          <Flex justify="space-between" align="center">
            <Heading size="md" color="gray.800">
              Activité récente
            </Heading>
            <Button variant="ghost" size="sm" color="brand.600">Voir tout</Button>
          </Flex>
          
          {isLoading ? (
            <Center py={8}>
              <Spinner size="md" color="brand.500" />
            </Center>
          ) : activities.length > 0 ? (
            <VStack spacing={4} w="full" align="stretch">
              {activities.slice(0, 5).map((activity, index) => (
                <HStack key={index} w="full" align="flex-start" spacing={4}>
                  <Box mt={1}>
                    <Box 
                      w="8px" h="8px" 
                      bg={activity.status === 'success' ? 'brand.500' : (activity.status === 'error' ? 'red.500' : 'orange.400')} 
                      borderRadius="full" 
                    />
                  </Box>
                  <VStack align="flex-start" spacing={0} flex={1}>
                    <Text fontSize="sm" fontWeight="600" color="gray.800">
                      {activity.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {activity.description}
                    </Text>
                  </VStack>
                  <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">Récent</Text>
                </HStack>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
              Aucune activité récente.
            </Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

const Overview = () => {
  const [stats, setStats] = useState({
    reserves: 0,
    alertes: 0,
    projets: 0,
    documents: 0,
    utilisateurs: 0,
    historiques: 0,
    litiges: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const [
          reserves,
          alertes,
          projets,
          documents,
          historiques,
          litiges
        ] = await Promise.all([
          reserveService.getAll().catch(() => []),
          alerteService.getAll().catch(() => []),
          projetService.getAll().catch(() => []),
          documentService.getAll().catch(() => []),
          historiqueService.getAll().catch(() => []),
          litigeService.getAll().catch(() => [])
        ]);

        let utilisateurs = [];
        if (isAdmin()) {
          try {
            utilisateurs = await utilisateurService.getAll();
          } catch (err) {
            // Ignore error
          }
        }

        setStats({
          reserves: reserves.length,
          alertes: alertes.length,
          projets: projets.length,
          documents: documents.length,
          utilisateurs: utilisateurs.length,
          historiques: historiques.length,
          litiges: litiges.length,
        });

        const activities = [];

        if (alertes && alertes.length > 0) {
          alertes.slice(-2).reverse().forEach(a => {
            activities.push({
              title: `Alerte : ${a.type || 'Nouveau'}`,
              description: a.description || `Alerte sur la réserve ${a.reserve?.nom || 'Inconnue'}`,
              status: a.niveau === 'CRITIQUE' ? 'error' : (a.niveau === 'ELEVEE' ? 'warning' : 'success')
            });
          });
        }

        if (reserves && reserves.length > 0) {
          reserves.slice(-2).reverse().forEach(r => {
            activities.push({
              title: `Nouvelle réserve : ${r.nom}`,
              description: `Localisation : ${r.localisation}`,
              status: 'success'
            });
          });
        }

        if (historiques && historiques.length > 0) {
          historiques.slice(-2).reverse().forEach(h => {
            activities.push({
              title: `Historique : ${h.natureActe}`,
              description: h.commentaire || `Mise à jour pour ${h.reserve?.nom}`,
              status: 'success'
            });
          });
        }

        if (activities.length === 0) {
          activities.push({ title: 'Système prêt', description: 'En attente de nouvelles données', status: 'success' });
        }

        setRecentActivities(activities);
      } catch (err) {
        console.error('Erreur', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  const statCards = [
    { title: 'Réserves actives', value: stats.reserves, icon: FiMap, change: '12%', changeType: 'increase' },
    { title: 'Alertes en cours', value: stats.alertes, icon: FiAlertTriangle, change: '5%', changeType: 'decrease' },
    { title: 'Projets initiés', value: stats.projets, icon: FiFolder, change: '8%', changeType: 'increase' },
    { title: 'Documents partagés', value: stats.documents, icon: FiFileText, change: '15%', changeType: 'increase' },
    { title: 'Conflits & Litiges', value: stats.litiges, icon: FiShield, change: null, changeType: 'increase' },
  ];

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="flex-end" wrap="wrap">
          <Box>
            <Heading size="lg" color="gray.800" mb={1} letterSpacing="tight">
              Vue d'ensemble
            </Heading>
            <Text color="gray.500" fontSize="md">
              Bienvenue dans votre système de gestion du domaine de l'État.
              Voici un résumé de la situation actuelle de votre patrimoine.
            </Text>
          </Box>
        </HStack>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={6}>
          {statCards.map((card, index) => (
            <StatCard key={index} {...card} isLoading={isLoading} />
          ))}
        </SimpleGrid>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Main Chart Card */}
          <Card shadow="sm" border="1px" borderColor="gray.100" borderRadius="xl">
            <CardBody>
              <VStack align="stretch" spacing={6} h="100%">
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="md" color="gray.800" mb={1}>Évolution des réserves</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Croissance au cours des 6 derniers mois
                    </Text>
                  </Box>
                  <HStack bg="gray.50" p={1} borderRadius="md" spacing={1}>
                    <Button size="xs" variant="ghost" bg="white" shadow="sm">6 Mois</Button>
                    <Button size="xs" variant="ghost" color="gray.500">1 An</Button>
                  </HStack>
                </Flex>

                <Box h="300px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReserves" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chakra-colors-brand-400)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--chakra-colors-brand-400)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#718096', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#718096', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="reserves" 
                        stroke="var(--chakra-colors-brand-500)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorReserves)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          <RecentActivity activities={recentActivities} isLoading={isLoading} />
        </Grid>
      </VStack>
    </Box>
  );
};

export default Overview;
