import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MessageCircle, 
  Award, 
  Calendar, 
  PenTool, 
  Book, 
  Coffee, 
  HelpCircle,
  UserPlus,
  Plus,
  Star,
  Heart,
  ChevronRight,
  Send,
  Zap,
  ThumbsUp,
  CircleUser,
  Edit,
  FileText,
  GraduationCap,
  Globe,
  Mic,
  ArrowUp,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const CommunityPage = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [contributors, setContributors] = useState([]);
  const [events, setEvents] = useState([]);
  const [discussionTopics, setDiscussionTopics] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailSubscription, setEmailSubscription] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  
  // Classes conditionnelles selon le mode
  const getThemeClass = (lightClass, darkClass) => {
    return darkMode ? darkClass : lightClass;
  };

  // Charger les données simulées
  useEffect(() => {
    // Simuler le chargement des données
    setLoading(true);
    
    setTimeout(() => {
      setContributors(generateMockContributors());
      setEvents(generateMockEvents());
      setDiscussionTopics(generateMockDiscussions());
      setProjects(generateMockProjects());
      setLoading(false);
    }, 800);
  }, []);

  // Generer des données de contributeurs
  const generateMockContributors = () => {
    return [
      {
        id: 1,
        name: 'Fatou Diop',
        role: 'Expert linguistique',
        avatar: '/api/placeholder/64/64',
        contributions: 156,
        bio: 'Professeur de wolof à l\'Université Cheikh Anta Diop de Dakar, spécialiste en linguistique et traduction.',
        expertise: ['Prononciation', 'Grammaire', 'Culture'],
        badges: ['Expert', 'Top Contributeur'],
        joined: '2023-05-12',
        isFeatured: true
      },
      {
        id: 2,
        name: 'Amadou Sall',
        role: 'Traducteur',
        avatar: '/api/placeholder/64/64',
        contributions: 93,
        bio: 'Traducteur professionnel travaillant avec plusieurs ONG au Sénégal, passsionné par la préservation des langues africaines.',
        expertise: ['Traduction', 'Expressions idiomatiques'],
        badges: ['Traducteur Certifié'],
        joined: '2023-08-23',
        isFeatured: true
      },
      {
        id: 3,
        name: 'Sophie Martin',
        role: 'Étudiant',
        avatar: '/api/placeholder/64/64',
        contributions: 47,
        bio: 'Doctorante en linguistique africaine, recherche sur l\'influence du wolof dans la diaspora.',
        expertise: ['Recherche', 'Dialectes'],
        badges: ['Chercheur'],
        joined: '2024-01-15',
        isFeatured: false
      },
      {
        id: 4,
        name: 'Ousmane Diallo',
        role: 'Écrivain',
        avatar: '/api/placeholder/64/64',
        contributions: 78,
        bio: 'Auteur de plusieurs livres sur la culture sénégalaise et la langue wolof, conteur et gardien de traditions orales.',
        expertise: ['Littérature', 'Proverbes', 'Traditions orales'],
        badges: ['Créateur de Contenu'],
        joined: '2023-06-30',
        isFeatured: true
      },
      {
        id: 5,
        name: 'Mariama Seck',
        role: 'Modérateur',
        avatar: '/api/placeholder/64/64',
        contributions: 119,
        bio: 'Enseignante de langues vivantes passionnée par la pédagogie et le partage des connaissances.',
        expertise: ['Enseignement', 'Méthodologie'],
        badges: ['Modérateur', 'Pédagogue'],
        joined: '2023-07-05',
        isFeatured: false
      }
    ];
  };

  // Générer des événements
  const generateMockEvents = () => {
    return [
      {
        id: 1,
        title: 'Atelier d\'écriture wolof',
        date: '2025-05-15T14:00:00',
        location: 'En ligne (Zoom)',
        description: 'Apprenez les bases de l\'écriture en wolof avec notre expert linguiste Fatou Diop. Cet atelier interactif vous permettra de comprendre la structure et les règles de l\'écriture wolof.',
        organizer: 'WolofDict Team',
        registrationLink: '#',
        type: 'Atelier',
        image: '/api/placeholder/400/200',
        isFeatured: true
      },
      {
        id: 2,
        title: 'Table ronde: L\'avenir du wolof à l\'ère numérique',
        date: '2025-05-22T18:30:00',
        location: 'Institut Français de Dakar',
        description: 'Une discussion approfondie sur les défis et opportunités pour la langue wolof à l\'ère des technologies numériques et de l\'intelligence artificielle.',
        organizer: 'Association pour la Promotion des Langues Africaines',
        registrationLink: '#',
        type: 'Conférence',
        image: '/api/placeholder/400/200',
        isFeatured: true
      },
      {
        id: 3,
        title: 'Formation: Techniques de traduction wolof-français',
        date: '2025-06-05T10:00:00',
        location: 'En ligne (Zoom)',
        description: 'Formation intensive sur les techniques de traduction entre le wolof et le français, avec un focus sur les nuances culturelles et les expressions idiomatiques.',
        organizer: 'Centre de Traduction et d\'Interprétation',
        registrationLink: '#',
        type: 'Formation',
        image: '/api/placeholder/400/200',
        isFeatured: false
      },
      {
        id: 4,
        title: 'Journée de la langue wolof',
        date: '2025-06-20T09:00:00',
        location: 'Place de la Nation, Dakar',
        description: 'Célébration annuelle de la langue wolof avec des activités culturelles, des concours de poésie, des spectacles et des stands gastronomiques.',
        organizer: 'Ministère de la Culture du Sénégal',
        registrationLink: '#',
        type: 'Festival',
        image: '/api/placeholder/400/200',
        isFeatured: true
      },
      {
        id: 5,
        title: 'Webinaire: Enseigner le wolof aux enfants',
        date: '2025-07-10T16:00:00',
        location: 'En ligne (Teams)',
        description: 'Méthodes pédagogiques pour enseigner le wolof aux enfants de manière ludique et efficace. Destiné aux parents et aux enseignants.',
        organizer: 'Association des Enseignants de Wolof',
        registrationLink: '#',
        type: 'Webinaire',
        image: '/api/placeholder/400/200',
        isFeatured: false
      }
    ];
  };

  // Générer des discussions
  const generateMockDiscussions = () => {
    return [
      {
        id: 1,
        title: 'Différences entre le wolof parlé à Dakar et celui de Saint-Louis',
        author: {
          id: 2,
          name: 'Amadou Sall',
          avatar: '/api/placeholder/40/40'
        },
        date: '2025-04-18T09:23:00',
        replies: 24,
        views: 342,
        lastActivity: '2025-04-23T16:47:00',
        tags: ['Dialectes', 'Linguistique'],
        excerpt: 'J\'ai remarqué des différences significatives entre le wolof parlé dans la région de Dakar et celui de Saint-Louis. Quelqu\'un pourrait-il expliquer ces variations dialectales?'
      },
      {
        id: 2,
        title: 'Comment expliquer le concept de "Teranga" en français?',
        author: {
          id: 4,
          name: 'Ousmane Diallo',
          avatar: '/api/placeholder/40/40'
        },
        date: '2025-04-20T14:15:00',
        replies: 37,
        views: 516,
        lastActivity: '2025-04-24T11:32:00',
        tags: ['Traduction', 'Culture'],
        excerpt: 'Le concept de "Teranga" est central dans la culture sénégalaise, mais sa traduction en français ne capture pas toutes ses nuances. Comment l\'expliquer efficacement?'
      },
      {
        id: 3,
        title: 'Ressources pour apprendre la conjugaison en wolof',
        author: {
          id: 3,
          name: 'Sophie Martin',
          avatar: '/api/placeholder/40/40'
        },
        date: '2025-04-21T08:45:00',
        replies: 16,
        views: 289,
        lastActivity: '2025-04-23T19:12:00',
        tags: ['Apprentissage', 'Grammaire'],
        excerpt: 'Je cherche des ressources fiables pour apprendre la conjugaison des verbes en wolof. Avez-vous des recommandations de livres ou de sites web?'
      },
      {
        id: 4,
        title: 'Influence du français sur le wolof contemporain',
        author: {
          id: 1,
          name: 'Fatou Diop',
          avatar: '/api/placeholder/40/40'
        },
        date: '2025-04-22T16:30:00',
        replies: 29,
        views: 378,
        lastActivity: '2025-04-24T14:28:00',
        tags: ['Linguistique', 'Évolution'],
        excerpt: 'Comment le français a-t-il influencé l\'évolution du wolof contemporain, particulièrement dans les zones urbaines? Quels sont les emprunts lexicaux les plus courants?'
      },
      {
        id: 5,
        title: 'Prononciation des sons nasalisés en wolof',
        author: {
          id: 5,
          name: 'Mariama Seck',
          avatar: '/api/placeholder/40/40'
        },
        date: '2025-04-23T11:20:00',
        replies: 13,
        views: 214,
        lastActivity: '2025-04-24T09:45:00',
        tags: ['Prononciation', 'Phonétique'],
        excerpt: 'Je trouve la prononciation des sons nasalisés en wolof particulièrement difficile. Quelqu\'un aurait-il des astuces ou des exercices à suggérer?'
      }
    ];
  };

  // Générer des projets communautaires
  const generateMockProjects = () => {
    return [
      {
        id: 1,
        title: 'Dictionnaire illustré wolof-français pour enfants',
        description: 'Création d\'un dictionnaire illustré bilingue adapté aux enfants pour encourager l\'apprentissage précoce du wolof.',
        status: 'En cours',
        progress: 65,
        contributors: 12,
        leadContributor: {
          id: 5,
          name: 'Mariama Seck',
          avatar: '/api/placeholder/40/40'
        },
        category: 'Éducation',
        estimatedCompletion: '2025-08-30',
        isOpenForContribution: true
      },
      {
        id: 2,
        title: 'Application mobile de prononciation wolof',
        description: 'Développement d\'une application pour apprendre et pratiquer la prononciation correcte des mots et phrases en wolof, avec reconnaissance vocale.',
        status: 'En cours',
        progress: 40,
        contributors: 8,
        leadContributor: {
          id: 2,
          name: 'Amadou Sall',
          avatar: '/api/placeholder/40/40'
        },
        category: 'Technologie',
        estimatedCompletion: '2025-10-15',
        isOpenForContribution: true
      },
      {
        id: 3,
        title: 'Recueil de contes traditionnels wolof',
        description: 'Collecte, transcription et traduction de contes traditionnels wolof pour préserver ce patrimoine culturel immatériel.',
        status: 'En cours',
        progress: 85,
        contributors: 15,
        leadContributor: {
          id: 4,
          name: 'Ousmane Diallo',
          avatar: '/api/placeholder/40/40'
        },
        category: 'Culture',
        estimatedCompletion: '2025-06-30',
        isOpenForContribution: false
      },
      {
        id: 4,
        title: 'Corpus linguistique wolof',
        description: 'Constitution d\'un corpus linguistique digital pour faciliter la recherche académique sur la langue wolof.',
        status: 'En planification',
        progress: 15,
        contributors: 5,
        leadContributor: {
          id: 1,
          name: 'Fatou Diop',
          avatar: '/api/placeholder/40/40'
        },
        category: 'Recherche',
        estimatedCompletion: '2026-02-28',
        isOpenForContribution: true
      }
    ];
  };

  // Gestion de l'abonnement à la newsletter
  const handleSubscription = (e) => {
    e.preventDefault();
    
    if (emailSubscription && emailSubscription.includes('@')) {
      setSubscribed(true);
      setEmailSubscription('');
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setSubscribed(false);
      }, 3000);
    }
  };

  // Formatage de date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Formatage de date avec heure
  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculer le temps écoulé
  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return `Il y a ${diffInSeconds} secondes`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minutes`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heures`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `Il y a ${diffInDays} jours`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `Il y a ${diffInMonths} mois`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `Il y a ${diffInYears} ans`;
  };

  // Rendu conditionnel du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'contributors':
        return (
          <div className="space-y-8">
            <h2 className={`text-2xl font-bold mb-6 ${getThemeClass('text-gray-900', 'text-white')}`}>
              Nos Contributeurs
            </h2>
            
            {/* Contributeurs en vedette */}
            <div className="mb-10">
              <h3 className={`text-xl font-semibold mb-4 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                Contributeurs en vedette
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contributors
                  .filter(contributor => contributor.isFeatured)
                  .map(contributor => (
                    <div 
                      key={contributor.id}
                      className={`rounded-xl overflow-hidden border ${getThemeClass(
                        'bg-white border-gray-200',
                        'bg-gray-800 border-gray-700'
                      )}`}
                    >
                      <div className={`${getThemeClass('bg-blue-50', 'bg-blue-900/20')} p-4 flex items-center space-x-4`}>
                        <img 
                          src={contributor.avatar} 
                          alt={contributor.name} 
                          className="w-16 h-16 rounded-full border-2 border-white"
                        />
                        <div>
                          <h4 className={`font-bold ${getThemeClass('text-gray-900', 'text-white')}`}>
                            {contributor.name}
                          </h4>
                          <p className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-300')}`}>
                            {contributor.role}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <p className={`text-sm mb-4 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                          {contributor.bio}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {contributor.expertise.map((skill, index) => (
                            <span 
                              key={index}
                              className={`px-2 py-1 text-xs rounded-full ${getThemeClass(
                                'bg-gray-100 text-gray-700',
                                'bg-gray-700 text-gray-300'
                              )}`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <PenTool className={`w-4 h-4 mr-2 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
                            <span className={`text-sm ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                              {contributor.contributions} contributions
                            </span>
                          </div>
                          <Link 
                            to={`/contributors/${contributor.id}`} 
                            className={`text-sm flex items-center ${getThemeClass(
                              'text-blue-600 hover:text-blue-800', 
                              'text-blue-400 hover:text-blue-300'
                            )}`}
                          >
                            Profil complet
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Tous les contributeurs */}
            <div>
              <h3 className={`text-xl font-semibold mb-4 flex items-center justify-between ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                <span>Tous les contributeurs</span>
                <Link 
                  to="/contributors" 
                  className={`text-sm flex items-center ${getThemeClass(
                    'text-blue-600 hover:text-blue-800', 
                    'text-blue-400 hover:text-blue-300'
                  )}`}
                >
                  Voir tous
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </h3>
              
              <div className="overflow-hidden rounded-xl border ${getThemeClass('border-gray-200', 'border-gray-700')}">
                <div className={`overflow-x-auto ${getThemeClass('', '')}`}>
                  <table className="min-w-full divide-y ${getThemeClass('divide-gray-200', 'divide-gray-700')}">
                    <thead className={`${getThemeClass('bg-gray-50', 'bg-gray-800')}`}>
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contributeur
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contributions
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Spécialités
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Membre depuis
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${getThemeClass('bg-white', 'bg-gray-900')} divide-y ${getThemeClass('divide-gray-200', 'divide-gray-700')}`}>
                      {contributors.map((contributor) => (
                        <tr key={contributor.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src={contributor.avatar} alt={contributor.name} />
                              </div>
                              <div className="ml-4">
                                <div className={`font-medium ${getThemeClass('text-gray-900', 'text-white')}`}>
                                  {contributor.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              contributor.role === 'Expert linguistique'
                                ? getThemeClass('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300')
                                : contributor.role === 'Traducteur'
                                ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/30 text-blue-300')
                                : contributor.role === 'Modérateur'
                                ? getThemeClass('bg-purple-100 text-purple-800', 'bg-purple-900/30 text-purple-300')
                                : contributor.role === 'Écrivain'
                                ? getThemeClass('bg-amber-100 text-amber-800', 'bg-amber-900/30 text-amber-300')
                                : getThemeClass('bg-gray-100 text-gray-800', 'bg-gray-800 text-gray-300')
                            }`}>
                              {contributor.role}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                            {contributor.contributions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {contributor.expertise.slice(0, 2).map((skill, index) => (
                                <span 
                                  key={index}
                                  className={`px-2 py-0.5 text-xs rounded-full ${getThemeClass(
                                    'bg-gray-100 text-gray-700',
                                    'bg-gray-700 text-gray-300'
                                  )}`}
                                >
                                  {skill}
                                </span>
                              ))}
                              {contributor.expertise.length > 2 && (
                                <span className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-500')}`}>
                                  +{contributor.expertise.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                            {formatDate(contributor.joined)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'events':
        return (
          <div className="space-y-8">
            <h2 className={`text-2xl font-bold mb-6 ${getThemeClass('text-gray-900', 'text-white')}`}>
              Événements à venir
            </h2>
            
            {/* Événements en vedette */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {events
                .filter(event => event.isFeatured)
                .slice(0, 2)
                .map(event => (
                  <div 
                    key={event.id}
                    className={`rounded-xl overflow-hidden border ${getThemeClass(
                      'bg-white border-gray-200',
                      'bg-gray-800 border-gray-700'
                    )}`}
                  >
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-48 object-cover"
                    />
                    
                    <div className="p-5">
                      <div className={`flex items-center justify-between mb-3`}>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          event.type === 'Atelier'
                            ? getThemeClass('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300')
                            : event.type === 'Conférence'
                            ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/30 text-blue-300')
                            : event.type === 'Formation'
                            ? getThemeClass('bg-purple-100 text-purple-800', 'bg-purple-900/30 text-purple-300')
                            : event.type === 'Festival'
                            ? getThemeClass('bg-amber-100 text-amber-800', 'bg-amber-900/30 text-amber-300')
                            : getThemeClass('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')
                        }`}>
                          {event.type}
                        </span>
                        
                        <div className={`flex items-center text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(event.date)}
                        </div>
                      </div>
                      
                      <h3 className={`text-xl font-bold mb-2 ${getThemeClass('text-gray-900', 'text-white')}`}>
                        {event.title}
                      </h3>
                      
                      <p className={`text-sm mb-4 line-clamp-2 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                        {event.description}
                      </p>
                      
                      <div className={`flex items-center text-sm mb-4 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                        <Globe className="w-4 h-4 mr-1" />
                        {event.location}
                      </div>
                      
                      <a 
                        href={event.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center w-full py-2 px-4 rounded-lg ${getThemeClass(
                          'bg-blue-600 text-white hover:bg-blue-700',
                          'bg-blue-600 text-white hover:bg-blue-700'
                        )}`}
                      >
                        S'inscrire à l'événement
                      </a>
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Liste de tous les événements */}
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                Calendrier des événements
              </h3>
              
              <div className="space-y-4">
                {events.map(event => (
                  <div 
                    key={event.id}
                    className={`flex flex-col md:flex-row border rounded-xl overflow-hidden ${getThemeClass(
                      'bg-white border-gray-200',
                      'bg-gray-800 border-gray-700'
                    )}`}
                  >
                    <div className={`p-5 md:p-6 flex-grow`}>
                      <div className="flex flex-wrap gap-3 mb-3">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          event.type === 'Atelier'
                            ? getThemeClass('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300')
                            : event.type === 'Conférence'
                            ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/30 text-blue-300')
                            : event.type === 'Formation'
                            ? getThemeClass('bg-purple-100 text-purple-800', 'bg-purple-900/30 text-purple-300')
                            : event.type === 'Festival'
                            ? getThemeClass('bg-amber-100 text-amber-800', 'bg-amber-900/30 text-amber-300')
                            : getThemeClass('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')
                        }`}>
                          {event.type}
                        </span>
                        
                        <div className={`flex items-center text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDateTime(event.date)}
                        </div>
                      </div>
                      
                      <h3 className={`text-xl font-bold mb-2 ${getThemeClass('text-gray-900', 'text-white')}`}>
                        {event.title}
                      </h3>
                      
                      <p className={`text-sm mb-4 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                        {event.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className={`flex items-center text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                          <Globe className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                        
                        <div className={`flex items-center text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                          <Users className="w-4 h-4 mr-1" />
                          Organisé par: {event.organizer}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 md:p-0 md:flex md:items-center md:justify-center md:px-6 md:border-l ${getThemeClass('md:border-gray-200', 'md:border-gray-700')}`}>
                      <a 
                        href={event.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center py-2 px-4 rounded-lg ${getThemeClass(
                          'bg-blue-600 text-white hover:bg-blue-700',
                          'bg-blue-600 text-white hover:bg-blue-700'
                        )}`}
                      >
                        S'inscrire
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Proposer un événement */}
              <div className={`mt-8 p-6 rounded-xl ${getThemeClass('bg-blue-50', 'bg-blue-900/20')}`}>
                <h3 className={`text-xl font-semibold mb-2 ${getThemeClass('text-gray-900', 'text-white')}`}>
                  Vous organisez un événement lié à la langue wolof?
                </h3>
                <p className={`mb-4 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                  Nous sommes toujours à la recherche d'événements intéressants à partager avec notre communauté. Que ce soit un atelier, une conférence ou une formation, n'hésitez pas à nous le faire savoir.
                </p>
                <Link 
                  to="/submit-event" 
                  className={`inline-flex items-center ${getThemeClass(
                    'text-blue-600 hover:text-blue-800', 
                    'text-blue-400 hover:text-blue-300'
                  )}`}
                >
                  Proposer un événement
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        );
      
      case 'discussions':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${getThemeClass('text-gray-900', 'text-white')}`}>
                Forum de discussion
              </h2>
              
              <Link 
                to="/forum/new-topic" 
                className={`px-4 py-2 rounded-lg flex items-center ${getThemeClass(
                  'bg-blue-600 text-white hover:bg-blue-700',
                  'bg-blue-600 text-white hover:bg-blue-700'
                )}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau sujet
              </Link>
            </div>
            
            {/* Liste des discussions */}
            <div className="space-y-4">
              {discussionTopics.map(topic => (
                <div 
                  key={topic.id}
                  className={`rounded-xl border ${getThemeClass(
                    'bg-white border-gray-200 hover:border-blue-300',
                    'bg-gray-800 border-gray-700 hover:border-blue-600'
                  )} transition-all p-5`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                      <img 
                        src={topic.author.avatar} 
                        alt={topic.author.name} 
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <h3 className={`font-bold mb-1 ${getThemeClass('text-gray-900', 'text-white')}`}>
                          {topic.title}
                        </h3>
                        <div className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>
                          Par {topic.author.name} • {timeAgo(topic.date)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className={`text-sm flex items-center ${getThemeClass('text-gray-500', 'text-gray-400')}`}>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {topic.replies}
                      </div>
                      <div className={`text-sm flex items-center ${getThemeClass('text-gray-500', 'text-gray-400')}`}>
                        <Users className="w-4 h-4 mr-1" />
                        {topic.views}
                      </div>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-4 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                    {topic.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {topic.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full ${getThemeClass(
                            'bg-gray-100 text-gray-600',
                            'bg-gray-700 text-gray-300'
                          )}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <Link 
                      to={`/forum/topic/${topic.id}`} 
                      className={`flex items-center text-sm ${getThemeClass(
                        'text-blue-600 hover:text-blue-800',
                        'text-blue-400 hover:text-blue-300'
                      )}`}
                    >
                      Voir la discussion
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Voir plus de discussions */}
            <div className="text-center mt-8">
              <Link 
                to="/forum" 
                className={`inline-flex items-center px-6 py-3 rounded-lg ${getThemeClass(
                  'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  'bg-gray-700 text-gray-200 hover:bg-gray-600'
                )}`}
              >
                Voir toutes les discussions
              </Link>
            </div>
          </div>
        );
      
      case 'projects':
        return (
          <div className="space-y-8">
            <h2 className={`text-2xl font-bold mb-6 ${getThemeClass('text-gray-900', 'text-white')}`}>
              Projets Communautaires
            </h2>
            
            {/* Liste des projets */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {projects.map(project => (
                <div 
                  key={project.id}
                  className={`rounded-xl border ${getThemeClass(
                    'bg-white border-gray-200',
                    'bg-gray-800 border-gray-700'
                  )}`}
                >
                  <div className={`p-5 border-b ${getThemeClass('border-gray-200', 'border-gray-700')}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-bold ${getThemeClass('text-gray-900', 'text-white')}`}>
                        {project.title}
                      </h3>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        project.status === 'En cours'
                          ? getThemeClass('bg-green-100 text-green-800', 'bg-green-900/30 text-green-300')
                          : project.status === 'En planification'
                          ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/30 text-blue-300')
                          : getThemeClass('bg-amber-100 text-amber-800', 'bg-amber-900/30 text-amber-300')
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-4 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                      {project.description}
                    </p>
                    
                    {/* Barre de progression */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className={getThemeClass('text-gray-600', 'text-gray-400')}>
                          Progression: {project.progress}%
                        </span>
                        <span className={getThemeClass('text-gray-600', 'text-gray-400')}>
                          {project.isOpenForContribution ? 'Ouvert aux contributions' : 'Équipe fermée'}
                        </span>
                      </div>
                      <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${getThemeClass('bg-gray-200', 'bg-gray-700')}`}>
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          Fin prévue: {formatDate(project.estimatedCompletion)}
                        </span>
                      </div>
                      
                      <div className={`flex items-center ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                        <Users className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          {project.contributors} contributeurs
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <img 
                        src={project.leadContributor.avatar} 
                        alt={project.leadContributor.name} 
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <span className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                        Dirigé par {project.leadContributor.name}
                      </span>
                    </div>
                    
                    <Link 
                      to={`/projects/${project.id}`} 
                      className={`flex items-center text-sm ${getThemeClass(
                        'text-blue-600 hover:text-blue-800',
                        'text-blue-400 hover:text-blue-300'
                      )}`}
                    >
                      Détails
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Proposer un projet */}
            <div className={`p-6 rounded-xl border border-dashed text-center ${getThemeClass(
              'bg-gray-50 border-gray-300',
              'bg-gray-800/50 border-gray-600'
            )}`}>
              <h3 className={`text-xl font-semibold mb-2 ${getThemeClass('text-gray-900', 'text-white')}`}>
                Vous avez une idée de projet?
              </h3>
              <p className={`mb-6 max-w-2xl mx-auto ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                La communauté WolofDict encourage les initiatives pour promouvoir et préserver la langue wolof. Proposez votre projet et trouvez des collaborateurs passionnés!
              </p>
              <Link 
                to="/submit-project" 
                className={`inline-flex items-center px-6 py-3 rounded-lg ${getThemeClass(
                  'bg-blue-600 text-white hover:bg-blue-700',
                  'bg-blue-600 text-white hover:bg-blue-700'
                )}`}
              >
                <Plus className="w-5 h-5 mr-2" />
                Proposer un projet
              </Link>
            </div>
          </div>
        );
      
      default: // Overview tab
        return (
          <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Section de bienvenue */}
              <div>
                <h2 className={`text-2xl font-bold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>
                  Bienvenue dans notre communauté
                </h2>
                <p className={`mb-4 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                  WolofDict est bien plus qu'un simple dictionnaire en ligne. C'est une communauté dynamique de passionnés, d'apprenants et d'experts qui travaillent ensemble pour documenter, préserver et promouvoir la langue wolof.
                </p>
                <p className={`mb-4 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                  Rejoignez-nous dans cette aventure linguistique et culturelle, que vous soyez un locuteur natif, un apprenant débutant ou un chercheur en linguistique.
                </p>
                
                <div className="flex space-x-4 mt-6">
                  <Link 
                    to="/register" 
                    className={`px-5 py-2 rounded-lg flex items-center ${getThemeClass(
                      'bg-blue-600 text-white hover:bg-blue-700',
                      'bg-blue-600 text-white hover:bg-blue-700'
                    )}`}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Rejoindre
                  </Link>
                  <Link 
                    to="/how-to-contribute" 
                    className={`px-5 py-2 rounded-lg flex items-center ${getThemeClass(
                      'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}`}
                  >
                    <HelpCircle className="w-5 h-5 mr-2" />
                    Comment contribuer
                  </Link>
                </div>
              </div>
              
              {/* Statistiques de la communauté */}
              <div className={`rounded-xl p-6 ${getThemeClass('bg-blue-50', 'bg-blue-900/20')}`}>
                <h3 className={`text-xl font-semibold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>
                  Notre communauté en chiffres
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Users, number: '1,200+', label: 'Membres' },
                    { icon: Book, number: '3,000+', label: 'Entrées de dictionnaire' },
                    { icon: MessageCircle, number: '450+', label: 'Discussions' },
                    { icon: PenTool, number: '15,000+', label: 'Contributions' }
                  ].map((stat, index) => (
                    <div key={index} className={`p-4 rounded-lg ${getThemeClass('bg-white', 'bg-gray-800')}`}>
                      <stat.icon className={`w-8 h-8 mb-2 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
                      <div className={`text-2xl font-bold ${getThemeClass('text-gray-900', 'text-white')}`}>
                        {stat.number}
                      </div>
                      <div className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Sections de contenu */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Contributeurs', 
                  description: 'Découvrez les experts et passionnés qui enrichissent notre dictionnaire.', 
                  icon: Award, 
                  color: getThemeClass('text-amber-600', 'text-amber-400'),
                  bgColor: getThemeClass('bg-amber-50', 'bg-amber-900/20'),
                  link: 'contributors',
                  count: contributors.length
                },
                { 
                  title: 'Événements', 
                  description: 'Participez à nos ateliers, formations et rencontres autour de la langue wolof.', 
                  icon: Calendar, 
                  color: getThemeClass('text-green-600', 'text-green-400'),
                  bgColor: getThemeClass('bg-green-50', 'bg-green-900/20'),
                  link: 'events',
                  count: events.length
                },
                { 
                  title: 'Discussions', 
                  description: 'Échangez avec d\'autres membres sur des questions linguistiques et culturelles.', 
                  icon: MessageCircle, 
                  color: getThemeClass('text-blue-600', 'text-blue-400'),
                  bgColor: getThemeClass('bg-blue-50', 'bg-blue-900/20'),
                  link: 'discussions',
                  count: discussionTopics.length
                },
                { 
                  title: 'Projets', 
                  description: 'Contribuez à des initiatives collectives pour valoriser et préserver le wolof.', 
                  icon: Zap, 
                  color: getThemeClass('text-purple-600', 'text-purple-400'),
                  bgColor: getThemeClass('bg-purple-50', 'bg-purple-900/20'),
                  link: 'projects',
                  count: projects.length
                }
              ].map((section, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveTab(section.link)}
                  className={`rounded-xl p-5 text-left transition-all hover:shadow-md ${getThemeClass(
                    'bg-white border border-gray-200', 
                    'bg-gray-800 border border-gray-700'
                  )}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${section.bgColor}`}>
                    <section.icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-semibold ${getThemeClass('text-gray-900', 'text-white')}`}>
                      {section.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getThemeClass(
                      'bg-gray-100 text-gray-700',
                      'bg-gray-700 text-gray-300'
                    )}`}>
                      {section.count}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-3 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                    {section.description}
                  </p>
                  
                  <div className={`text-sm flex items-center ${getThemeClass(
                    'text-blue-600',
                    'text-blue-400'
                  )}`}>
                    Explorer
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              ))}
            </div>
            
            {/* Section des activités récentes */}
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${getThemeClass('text-gray-900', 'text-white')}`}>
                Activités récentes
              </h2>
              
              <div className={`rounded-xl overflow-hidden border ${getThemeClass(
                'bg-white border-gray-200',
                'bg-gray-800 border-gray-700'
              )}`}>
                <div className="divide-y ${getThemeClass('divide-gray-200', 'divide-gray-700')}">
                  {[
                    {
                      type: 'contribution',
                      user: { name: 'Fatou Diop', avatar: '/api/placeholder/32/32' },
                      action: 'a ajouté un nouveau mot',
                      target: 'Xalaat (Réflexion)',
                      time: '1 heure',
                      icon: PenTool,
                      color: getThemeClass('text-blue-600 bg-blue-100', 'text-blue-400 bg-blue-900/30')
                    },
                    {
                      type: 'event',
                      user: { name: 'Admin', avatar: '/api/placeholder/32/32' },
                      action: 'a créé un nouvel événement',
                      target: 'Atelier d\'écriture wolof',
                      time: '3 heures',
                      icon: Calendar,
                      color: getThemeClass('text-green-600 bg-green-100', 'text-green-400 bg-green-900/30')
                    },
                    {
                      type: 'discussion',
                      user: { name: 'Amadou Sall', avatar: '/api/placeholder/32/32' },
                      action: 'a commencé une discussion',
                      target: 'Différences entre le wolof parlé à Dakar et celui de Saint-Louis',
                      time: '5 heures',
                      icon: MessageCircle,
                      color: getThemeClass('text-amber-600 bg-amber-100', 'text-amber-400 bg-amber-900/30')
                    },
                    {
                      type: 'project',
                      user: { name: 'Mariama Seck', avatar: '/api/placeholder/32/32' },
                      action: 'a mis à jour le projet',
                      target: 'Dictionnaire illustré wolof-français pour enfants',
                      time: 'hier',
                      icon: Zap,
                      color: getThemeClass('text-purple-600 bg-purple-100', 'text-purple-400 bg-purple-900/30')
                    },
                    {
                      type: 'join',
                      user: { name: 'Moussa Diop', avatar: '/api/placeholder/32/32' },
                      action: 'a rejoint la communauté',
                      target: '',
                      time: 'hier',
                      icon: UserPlus,
                      color: getThemeClass('text-indigo-600 bg-indigo-100', 'text-indigo-400 bg-indigo-900/30')
                    }
                  ].map((activity, index) => (
                    <div key={index} className="p-4 flex items-start">
                      <div className={`rounded-full p-2 mr-3 ${activity.color}`}>
                        <activity.icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center">
                          <img 
                            src={activity.user.avatar} 
                            alt={activity.user.name} 
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className={`font-medium ${getThemeClass('text-gray-900', 'text-white')}`}>
                            {activity.user.name}
                          </span>
                        </div>
                        
                        <p className={`text-sm mt-1 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                          {activity.action} {activity.target && <strong>{activity.target}</strong>}
                        </p>
                        
                        <span className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-500')}`}>
                          Il y a {activity.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Soutenir le projet */}
            <div className={`rounded-xl p-8 ${getThemeClass(
              'bg-gradient-to-br from-blue-500 to-indigo-600',
              'bg-gradient-to-br from-blue-900 to-indigo-800'
            )} text-white`}>
              <div className="max-w-3xl mx-auto text-center">
                <Coffee className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Soutenez notre mission</h2>
                <p className="mb-6">
                  WolofDict est un projet à but non lucratif qui vise à préserver et promouvoir la langue wolof. Votre soutien nous aide à maintenir notre plateforme, organiser des événements et créer du contenu éducatif de qualité.
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <a 
                    href="#" 
                    className="px-6 py-3 rounded-lg bg-white text-blue-600 font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Faire un don
                  </a>
                  <a 
                    href="#" 
                    className="px-6 py-3 rounded-lg border border-white hover:bg-white/10 transition-colors"
                  >
                    Devenir sponsor
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-10 text-center">
        <h1 className={`text-4xl font-bold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>
          Communauté WolofDict
        </h1>
        <p className={`text-lg max-w-3xl mx-auto ${getThemeClass('text-gray-600', 'text-gray-300')}`}>
          Rejoignez des milliers de passionnés, d'apprenants et d'experts qui contribuent à préserver et à promouvoir la langue wolof.
        </p>
      </div>

      {/* Navigation entre les onglets */}
      <div className="mb-10">
        <div className={`flex flex-wrap gap-2 p-1 rounded-xl max-w-4xl mx-auto ${getThemeClass('bg-gray-100', 'bg-gray-800')}`}>
          {[
            { key: 'overview', label: 'Aperçu', icon: Zap },
            { key: 'contributors', label: 'Contributeurs', icon: Users },
            { key: 'events', label: 'Événements', icon: Calendar },
            { key: 'discussions', label: 'Discussions', icon: MessageCircle },
            { key: 'projects', label: 'Projets', icon: Star }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-grow sm:flex-grow-0 py-3 px-4 rounded-lg flex items-center justify-center transition-colors ${
                activeTab === tab.key 
                  ? getThemeClass('bg-white text-blue-600 shadow-sm', 'bg-gray-700 text-white')
                  : getThemeClass('text-gray-600 hover:text-gray-900 hover:bg-gray-200/50', 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50')
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="mb-16">
        {loading ? (
          <div className="py-12 text-center">
            <div className={`inline-block w-12 h-12 rounded-full border-4 border-t-blue-600 ${getThemeClass('border-gray-200', 'border-gray-700')} animate-spin mb-4`}></div>
            <p className={getThemeClass('text-gray-600', 'text-gray-400')}>Chargement des données...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Section d'abonnement à la newsletter */}
      <div className={`rounded-xl p-8 ${getThemeClass('bg-blue-50', 'bg-blue-900/20')} max-w-4xl mx-auto`}>
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${getThemeClass('text-gray-900', 'text-white')}`}>
            Restez informé
          </h2>
          <p className={`${getThemeClass('text-gray-600', 'text-gray-300')}`}>
            Abonnez-vous à notre newsletter pour recevoir les dernières actualités, événements et mises à jour.
          </p>
        </div>
        
        {subscribed ? (
          <div className={`bg-white p-4 rounded-lg text-center ${getThemeClass('text-green-600', 'text-green-500')}`}>
            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
            <p>Merci pour votre inscription! Vous recevrez bientôt notre newsletter.</p>
          </div>
        ) : (
          <form onSubmit={handleSubscription} className="max-w-lg mx-auto">
            <div className="flex">
              <input
                type="email"
                placeholder="Votre adresse email"
                value={emailSubscription}
                onChange={(e) => setEmailSubscription(e.target.value)}
                className={`flex-grow px-4 py-3 rounded-l-lg ${getThemeClass(
                  'bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
                  'bg-gray-700 border border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-900'
                )} focus:outline-none`}
                required
              />
              <button
                type="submit"
                className={`px-6 py-3 rounded-r-lg ${getThemeClass(
               'bg-blue-600 text-white hover:bg-blue-700',
                  'bg-blue-600 text-white hover:bg-blue-700'
                )}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs mt-3 ${getThemeClass('text-gray-500', 'text-gray-400')}`}>
              En vous inscrivant, vous acceptez de recevoir notre newsletter. Vous pouvez vous désabonner à tout moment.
            </p>
          </form>
        )}
      </div>
      
      {/* Bouton de retour en haut */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-600 text-white hover:bg-blue-700')}`}
        aria-label="Retour en haut"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CommunityPage;