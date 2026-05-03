// src/components/alerte/AlerteForm.jsx
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import PropTypes from 'prop-types';


import { createAlerte } from '../../api/alerte';
import { fetchReserves } from '../../api/reserve';

const AlerteForm = ({ onSuccess }) => {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [niveau, setNiveau] = useState('');
  const [reserveId, setReserveId] = useState('');
  const [reserves, setReserves] = useState([]);
  const [loadingReserves, setLoadingReserves] = useState(true);
  const [errorReserves, setErrorReserves] = useState('');
  const toast = useToast();

  useEffect(() => {
    const loadReserves = async () => {
      try {
        const data = await fetchReserves();
        // data est déjà un tableau List<Reserve>
        setReserves(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erreur chargement réserves :', err);
        setErrorReserves("Impossible de charger les réserves.");
      } finally {
        setLoadingReserves(false);
      }
    };
    loadReserves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !description || !niveau || !reserveId) return;

    try {
      await createAlerte({
        type,
        description,
        niveau,
        reserve: { id: reserveId },
      });
      toast({
        title: 'Alerte créée avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Reset form
      setType('');
      setDescription('');
      setNiveau('');
      setReserveId('');
      onSuccess();  // pour rafraîchir la table
    } catch (err) {
      console.error('Erreur création alerte :', err);
      toast({
        title: 'Erreur lors de la création.',
        description: err.message || 'Veuillez réessayer.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  if (loadingReserves) {
    return (
      <Box textAlign="center" py={6}>
        <Spinner size="lg" />
      </Box>
    );
  }
  if (errorReserves) {
    return (
      <Alert status="error" mb={4}>
        <AlertIcon /> {errorReserves}
      </Alert>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit} p={6} bg="white" borderRadius="md" boxShadow="sm" mb={6}>
      <FormControl mb={4} isRequired>
        <FormLabel>Type d'alerte</FormLabel>
        <Input
          placeholder="Ex : Incendie"
          value={type}
          onChange={e => setType(e.target.value)}
        />
      </FormControl>

      <FormControl mb={4} isRequired>
        <FormLabel>Description</FormLabel>
        <Textarea
          placeholder="Détails de l'alerte…"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </FormControl>

      <FormControl mb={4} isRequired>
        <FormLabel>Niveau de gravité</FormLabel>
        <Select
          placeholder="Sélectionner un niveau"
          value={niveau}
          onChange={e => setNiveau(e.target.value)}
        >
          <option value="Faible">Faible</option>
          <option value="Modéré">Modéré</option>
          <option value="Critique">Critique</option>
        </Select>
      </FormControl>

      <FormControl mb={6} isRequired>
        <FormLabel>ID de la réserve</FormLabel>
        <Select
          placeholder="Sélectionner un ID de réserve"
          value={reserveId}
          onChange={e => setReserveId(e.target.value)}
        >
          {reserves.map(r => (
            <option key={r.id} value={r.id}>
              {r.id}
            </option>
          ))}
        </Select>
      </FormControl>

      <Button type="submit" colorScheme="blue" w="full">
        Enregistrer l’alerte
      </Button>
    </Box>
  );
};

AlerteForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default AlerteForm;
