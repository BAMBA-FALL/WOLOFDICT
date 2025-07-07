// =============================================================================
// 🧪 TEST DES SERVICES WOLOFDICT
// =============================================================================

const services = require('./backend/src/services');

async function testServices() {
  console.log('🧪 Test des services WolofDict...');
  console.log('📦 Services disponibles:', Object.keys(services).filter(k => !k.includes('All')));

  try {
    // Test initialisation
    console.log('🔧 Initialisation des services...');
    const results = await services.initializeAllServices();

    // Statistiques
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    console.log('\n📊 Résultats d\'initialisation:');
    console.log('  ✅ Réussis: ' + successful);
    console.log('  ❌ Échoués: ' + failed);
    console.log('  ⏭️  Ignorés: ' + skipped);

    // Détails des erreurs
    const errors = results.filter(r => r.status === 'error');
    if (errors.length > 0) {
      console.log('❌ Erreurs détaillées:');
      errors.forEach(error => {
        console.log('  - ' + error.service + ': ' + error.error);
      });
    }

    // Test statut
    console.log('📋 Statut des services:');
    const status = services.getServiceStatus();
    status.forEach(s => {
      const icon = s.initialized ? '✅' : '❌';
      console.log('  ' + icon + ' ' + s.name + ' (' + (s.initialized ? 'initialisé' : 'non initialisé') + ')');
    });

    // Test services principaux
    console.log('🔍 Test des services principaux...');

    // Test AuthService
    if (services.AuthService.isInitialized) {
      try {
        const testUser = { id: 1, email: 'test@test.com', role: 'user' };
        const tokens = services.AuthService.generateTokens(testUser);
        console.log('  ✅ AuthService: Génération tokens OK');
      } catch (error) {
        console.log('  ❌ AuthService: ' + error.message);
      }
    }

    // Test EmailService
    if (services.EmailService.isInitialized) {
      try {
        console.log('  ✅ EmailService: ' + Object.keys(services.EmailService.templates).length + ' templates chargés');
      } catch (error) {
        console.log('  ❌ EmailService: ' + error.message);
      }
    }

    console.log('🎉 Test terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

testServices();
