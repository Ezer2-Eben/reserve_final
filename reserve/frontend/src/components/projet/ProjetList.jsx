import { Badge, Box, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import DataTable from '../ui/DataTable';

const ProjetList = () => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Données simulées pour les projets
  const mockProjets = [
    {
      id: 1,
      nom: 'Conservation de la biodiversité',
      type: 'Conservation',
      statut: 'En cours',
      responsable: 'Dr. Marie Dupont',
      budget: 50000,
      dateDebut: '2024-01-15',
      dateFin: '2024-12-31',
      progression: 65,
      reserve: 'Pendjari'
    },
    {
      id: 2,
      nom: 'Étude des espèces menacées',
      type: 'Recherche',
      statut: 'Planification',
      responsable: 'Prof. Jean Martin',
      budget: 30000,
      dateDebut: '2024-03-01',
      dateFin: '2024-08-31',
      progression: 25,
      reserve: 'Fazao-Malfakassa'
    },
    {
      id: 3,
      nom: 'Programme d\'éducation environnementale',
      type: 'Éducation',
      statut: 'Terminé',
      responsable: 'Mme. Sophie Bernard',
      budget: 20000,
      dateDebut: '2023-09-01',
      dateFin: '2024-02-28',
      progression: 100,
      reserve: 'Kéran'
    },
    {
      id: 4,
      nom: 'Développement écotouristique',
      type: 'Écotourisme',
      statut: 'En cours',
      responsable: 'M. Pierre Durand',
      budget: 75000,
      dateDebut: '2024-02-01',
      dateFin: '2024-11-30',
      progression: 45,
      reserve: 'Oti-Kéran-Mandouri'
    },
    {
      id: 5,
      nom: 'Surveillance anti-braconnage',
      type: 'Conservation',
      statut: 'En cours',
      responsable: 'Capt. Ahmed Kone',
      budget: 40000,
      dateDebut: '2024-01-01',
      dateFin: '2024-12-31',
      progression: 80,
      reserve: 'Pendjari'
    },
    {
      id: 6,
      nom: 'Restoration des habitats',
      type: 'Conservation',
      statut: 'Planification',
      responsable: 'Dr. Lisa Johnson',
      budget: 60000,
      dateDebut: '2024-04-01',
      dateFin: '2025-03-31',
      progression: 10,
      reserve: 'Fazao-Malfakassa'
    },
    {
      id: 7,
      nom: 'Formation des gardes forestiers',
      type: 'Éducation',
      statut: 'En cours',
      responsable: 'M. Robert Wilson',
      budget: 25000,
      dateDebut: '2024-01-15',
      dateFin: '2024-06-15',
      progression: 70,
      reserve: 'Kéran'
    },
    {
      id: 8,
      nom: 'Étude climatique',
      type: 'Recherche',
      statut: 'Terminé',
      responsable: 'Dr. Sarah Chen',
      budget: 35000,
      dateDebut: '2023-06-01',
      dateFin: '2024-01-31',
      progression: 100,
      reserve: 'Oti-Kéran-Mandouri'
    }
  ];

  useEffect(() => {
    const loadProjets = async () => {
      try {
        setLoading(true);
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProjets(mockProjets);
      } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjets();
  }, []);

  // Configuration des colonnes
  const columns = [
    {
      key: 'nom',
      label: 'Nom du Projet',
      sortable: true,
      filterable: true
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge
          colorScheme={
            value === 'Conservation' ? 'green' :
            value === 'Recherche' ? 'blue' :
            value === 'Éducation' ? 'purple' : 'orange'
          }
          variant="subtle"
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge
          colorScheme={
            value === 'En cours' ? 'green' :
            value === 'Planification' ? 'yellow' :
            value === 'Terminé' ? 'blue' : 'red'
          }
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'responsable',
      label: 'Responsable',
      sortable: true,
      filterable: true
    },
    {
      key: 'budget',
      label: 'Budget (€)',
      sortable: true,
      render: (value) => (
        <Text fontWeight="medium">
          {value.toLocaleString()} €
        </Text>
      )
    },
    {
      key: 'progression',
      label: 'Progression',
      sortable: true,
      render: (value) => (
        <Box>
          <Text fontSize="sm" fontWeight="medium">
            {value}%
          </Text>
          <Box
            w="100%"
            bg="gray.200"
            borderRadius="full"
            h="4px"
            mt="1"
          >
            <Box
              w={`${value}%`}
              bg={
                value >= 80 ? 'green.500' :
                value >= 50 ? 'yellow.500' : 'red.500'
              }
              h="4px"
              borderRadius="full"
            />
          </Box>
        </Box>
      )
    },
    {
      key: 'reserve',
      label: 'Réserve',
      sortable: true,
      filterable: true
    }
  ];

  // Gestionnaires d'actions
  const handleAdd = () => {
    console.log('Ajouter un nouveau projet');
  };

  const handleEdit = (projet) => {
    console.log('Modifier le projet:', projet);
  };

  const handleDelete = (projet) => {
    console.log('Supprimer le projet:', projet);
    setProjets(prev => prev.filter(p => p.id !== projet.id));
  };

  const handleView = (projet) => {
    console.log('Voir les détails du projet:', projet);
  };

  return (
    <Box p={6}>
      <DataTable
        data={projets}
        columns={columns}
        title="Gestion des Projets"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        loading={loading}
        searchable={true}
        filterable={true}
        pagination={true}
        pageSize={8}
        emptyMessage="Aucun projet trouvé"
      />
    </Box>
  );
};

export default ProjetList; 