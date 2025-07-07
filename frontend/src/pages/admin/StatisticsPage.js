import React, { useState, useEffect } from 'react';

// Simulation d'un composant de graphique avec Recharts
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const StatisticsPage = () => {
  const [statistics, setStatistics] = useState({
    totalWords: 0,
    wordsByType: [],
    contributionsByUser: [],
    monthlyContributions: [],
    wordValidationStatus: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Simulation de récupération des statistiques
      // Dans un vrai projet, appelez votre API pour obtenir ces données
      const mockStatistics = {
        totalWords: 1245,
        wordsByType: [
          { name: 'Nom', count: 487 },
          { name: 'Verbe', count: 356 },
          { name: 'Adjectif', count: 245 },
          { name: 'Adverbe', count: 157 },
          { name: 'Expression', count: 120 }
        ],
        contributionsByUser: [
          { name: 'Admin', contributions: 142 },
          { name: 'Expert Linguistique', contributions: 87 },
          { name: 'Contributeur1', contributions: 45 },
          { name: 'Contributeur2', contributions: 32 },
          { name: 'Contributeur3', contributions: 21 }
        ],
        monthlyContributions: [
          { month: 'Jan', contributions: 45 },
          { month: 'Fev', contributions: 62 },
          { month: 'Mar', contributions: 78 },
          { month: 'Avr', contributions: 95 },
          { month: 'Mai', contributions: 110 }
        ],
        wordValidationStatus: [
          { name: 'Validés', count: 987 },
          { name: 'En attente', count: 187 },
          { name: 'Rejetés', count: 71 }
        ]
      };

      setStatistics(mockStatistics);
      setLoading(false);
    } catch (err) {
      setError('Impossible de charger les statistiques');
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement des statistiques...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="statistics-page">
      <h1>Tableau de bord des statistiques</h1>

      <div className="statistics-summary">
        <div className="total-words-card">
          <h2>Nombre total de mots</h2>
          <p>{statistics.totalWords}</p>
        </div>
      </div>

      <div className="statistics-charts">
        <div className="chart-container">
          <h2>Répartition des mots par type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statistics.wordsByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2>Contributions mensuelles</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statistics.monthlyContributions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="contributions" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2>Statut de validation des mots</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statistics.wordValidationStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2>Top contributeurs</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statistics.contributionsByUser}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="contributions" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="statistics-details">
        <div className="word-type-breakdown">
          <h3>Détail des types de mots</h3>
          <ul>
            {statistics.wordsByType.map(type => (
              <li key={type.name}>
                {type.name}: {type.count} mots ({((type.count / statistics.totalWords) * 100).toFixed(1)}%)
              </li>
            ))}
          </ul>
        </div>

        <div className="validation-status-details">
          <h3>Statut de validation</h3>
          <ul>
            {statistics.wordValidationStatus.map(status => (
              <li key={status.name}>
                {status.name}: {status.count} mots ({((status.count / statistics.totalWords) * 100).toFixed(1)}%)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;