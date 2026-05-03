// src/utils/testAPI.js
import { reserveService } from '../services/apiService';

export const testReserveAPI = async () => {
  console.log('=== TEST API RÉSERVES ===');
  
  try {
    // Test 1: Récupérer toutes les réserves
    console.log('1. Test récupération des réserves...');
    const reserves = await reserveService.getAll();
    console.log('✅ Réserves récupérées:', reserves.length);
    
    // Test 2: Créer une nouvelle réserve
    console.log('2. Test création d\'une réserve...');
    const testData = {
      nom: 'Test Réserve ' + new Date().getTime(),
      localisation: 'Test Localisation',
      superficie: 100,
      type: 'Parc National',
      statut: 'ACTIF',
      latitude: 10.5,
      longitude: 1.2,
      zone: 'POLYGON((1.2 10.5, 1.3 10.5, 1.3 10.6, 1.2 10.6, 1.2 10.5))'
    };
    
    const newReserve = await reserveService.create(testData);
    console.log('✅ Réserve créée:', newReserve);
    
    // Test 3: Récupérer la réserve créée
    if (newReserve.id) {
      console.log('3. Test récupération de la réserve créée...');
      const retrievedReserve = await reserveService.getById(newReserve.id);
      console.log('✅ Réserve récupérée:', retrievedReserve);
    }
    
    console.log('=== TOUS LES TESTS RÉUSSIS ===');
    return { success: true, message: 'Tous les tests API sont passés' };
    
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error);
    console.error('Détails de l\'erreur:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    return { 
      success: false, 
      error: error.message,
      details: {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      }
    };
  }
};

export const testAllAPIs = async () => {
  console.log('=== TEST TOUTES LES APIS ===');
  
  const results = {
    reserves: await testReserveAPI(),
    // Ajouter d'autres tests ici si nécessaire
  };
  
  const allSuccess = Object.values(results).every(result => result.success);
  
  if (allSuccess) {
    console.log('🎉 TOUS LES TESTS API SONT PASSÉS !');
  } else {
    console.log('❌ CERTAINS TESTS API ONT ÉCHOUÉ');
  }
  
  return results;
};



