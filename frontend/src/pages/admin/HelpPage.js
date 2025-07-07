import React, { useState } from 'react';

const HelpPage = () => {
  const [activeSection, setActiveSection] = useState(null);

  const helpSections = [
    {
      title: 'Ajouter un mot',
      content: `
        Pour ajouter un nouveau mot au dictionnaire :
        1. Naviguez vers "Ajouter un mot" dans le menu admin
        2. Remplissez tous les champs obligatoires
        3. Incluez la traduction, la prononciation et des exemples
        4. Soumettez le mot pour validation
        
        Conseils :
        - Soyez précis dans vos définitions
        - Vérifiez l'orthographe et la grammaire
        - Fournissez des exemples d'utilisation clairs
      `
    },
    {
      title: 'Validation des mots',
      content: `
        Le processus de validation garantit la qualité des entrées :
        1. Les nouveaux mots sont marqués "En attente"
        2. Les experts linguistiques examinent chaque entrée
        3. Le mot peut être :
           - Validé : ajouté au dictionnaire
           - Rejeté : nécessite des modifications
        
        Critères de validation :
        - Exactitude de la traduction
        - Clarté de la définition
        - Pertinence des exemples
      `
    },
    {
      title: 'Gestion des utilisateurs',
      content: `
        Seuls les administrateurs peuvent gérer les utilisateurs :
        - Bloquer/Débloquer des comptes
        - Promouvoir des utilisateurs au statut d'expert
        - Supprimer des comptes
        
        Rôles utilisateurs :
        - Utilisateur : peut contribuer
        - Expert : peut valider des mots
        - Administrateur : gestion complète
      `
    },
    {
      title: 'Conjugaisons',
      content: `
        Gérer les conjugaisons des verbes :
        1. Accédez à la page de conjugaison depuis la liste des mots
        2. Sélectionnez le temps verbal (présent, passé, futur)
        3. Ajoutez/modifiez les formes de conjugaison
        4. Incluez différents pronoms wolof
        
        Conseils :
        - Soyez exhaustif
        - Incluez les variations pronominales
        - Vérifiez la grammaire wolof
      `
    }
  ];

  const toggleSection = (title) => {
    setActiveSection(activeSection === title ? null : title);
  };

  return (
    <div className="help-page">
      <h1>Centre d'aide du Dictionnaire Wolof/Français</h1>

      <div className="help-search">
        <input 
          type="text"
          placeholder="Rechercher une aide"
        />
        <button>Rechercher</button>
      </div>

      <div className="help-sections">
        {helpSections.map(section => (
          <div key={section.title} className="help-section">
            <div 
              className="help-section-header"
              onClick={() => toggleSection(section.title)}
            >
              <h2>{section.title}</h2>
              <span>{activeSection === section.title ? '▼' : '►'}</span>
            </div>
            
            {activeSection === section.title && (
              <div className="help-section-content">
                <pre>{section.content}</pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="additional-help">
        <h3>Besoin d'aide supplémentaire ?</h3>
        <div className="contact-info">
          <p>Email de support : support@dictionnaire-wolof.com</p>
          <p>Communauté Discord : Rejoignez notre serveur pour discuter</p>
          <p>FAQ complète : Consultez notre documentation en ligne</p>
        </div>
      </div>

      <div className="community-contributions">
        <h3>Contribuer au projet</h3>
        <ul>
          <li>Partagez vos connaissances linguistiques</li>
          <li>Aidez à améliorer les définitions</li>
          <li>Signalez des erreurs</li>
          <li>Participez à nos ateliers de langue</li>
        </ul>
      </div>
    </div>
  );
};

export default HelpPage;