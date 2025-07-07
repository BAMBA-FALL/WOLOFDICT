import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      // Simulation de récupération des utilisateurs
      // Dans un vrai projet, appelez votre API avec les filtres
      const mockUsers = [
        {
          id: 1,
          username: 'admin_principal',
          email: 'admin@example.com',
          role: 'admin',
          status: 'actif',
          lastLogin: '2024-04-23T14:30:00Z',
          contributions: 42
        },
        {
          id: 2,
          username: 'expert_linguistique',
          email: 'expert@example.com',
          role: 'expert',
          status: 'actif',
          lastLogin: '2024-04-22T09:15:00Z',
          contributions: 27
        },
        {
          id: 3,
          username: 'contributeur_1',
          email: 'contributeur1@example.com',
          role: 'user',
          status: 'actif',
          lastLogin: '2024-04-21T16:45:00Z',
          contributions: 5
        },
        {
          id: 4,
          username: 'contributeur_bloque',
          email: 'bloque@example.com',
          role: 'user',
          status: 'bloqué',
          lastLogin: '2024-04-20T11:20:00Z',
          contributions: 2
        }
      ];

      setUsers(mockUsers);
      setPagination(prev => ({
        ...prev,
        totalItems: mockUsers.length
      }));
      setLoading(false);
    } catch (err) {
      setError('Impossible de charger les utilisateurs');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserAction = async (userId, action) => {
    try {
      // Simulation d'actions sur les utilisateurs
      // Dans un vrai projet, appelez votre API pour ces actions
      switch (action) {
        case 'block':
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, status: 'bloqué' } : u
          ));
          break;
        case 'unblock':
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, status: 'actif' } : u
          ));
          break;
        case 'promote':
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, role: 'expert' } : u
          ));
          break;
        case 'demote':
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, role: 'user' } : u
          ));
          break;
        case 'delete':
          if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            setUsers(prev => prev.filter(u => u.id !== userId));
          }
          break;
        default:
          break;
      }
    } catch (err) {
      setError(`Impossible de ${action} l'utilisateur`);
    }
  };

  if (loading) return <div>Chargement des utilisateurs...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="user-management-page">
      <h1>Gestion des utilisateurs</h1>

      <div className="user-filters">
        <input 
          type="text"
          name="search"
          placeholder="Rechercher un utilisateur"
          value={filters.search}
          onChange={handleFilterChange}
        />

        <select 
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
        >
          <option value="">Tous les rôles</option>
          <option value="admin">Administrateurs</option>
          <option value="expert">Experts</option>
          <option value="user">Utilisateurs</option>
        </select>

        <select 
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="bloqué">Bloqués</option>
        </select>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Nom d'utilisateur</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Dernière connexion</th>
            <th>Contributions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(userData => (
            <tr key={userData.id}>
              <td>{userData.username}</td>
              <td>{userData.email}</td>
              <td>{userData.role === 'admin' ? 'Administrateur' : 
                    userData.role === 'expert' ? 'Expert' : 'Utilisateur'}</td>
              <td>
                <span className={`user-status ${userData.status}`}>
                  {userData.status === 'actif' ? 'Actif' : 'Bloqué'}
                </span>
              </td>
              <td>{new Date(userData.lastLogin).toLocaleString()}</td>
              <td>{userData.contributions}</td>
              <td>
                <div className="user-actions">
                  {/* Actions basées sur le rôle de l'utilisateur courant */}
                  {currentUser?.role === 'admin' && (
                    <>
                      {/* Blocage/Déblocage */}
                      {userData.status === 'actif' && userData.role !== 'admin' ? (
                        <button 
                          onClick={() => handleUserAction(userData.id, 'block')}
                          className="block-user-button"
                        >
                          Bloquer
                        </button>
                      ) : userData.status === 'bloqué' && (
                        <button 
                          onClick={() => handleUserAction(userData.id, 'unblock')}
                          className="unblock-user-button"
                        >
                          Débloquer
                        </button>
                      )}

                      {/* Promotion/Rétrogradation */}
                      {userData.role === 'user' ? (
                        <button 
                          onClick={() => handleUserAction(userData.id, 'promote')}
                          className="promote-user-button"
                        >
                          Promouvoir
                        </button>
                      ) : userData.role === 'expert' && (
                        <button 
                          onClick={() => handleUserAction(userData.id, 'demote')}
                          className="demote-user-button"
                        >
                          Rétrograder
                        </button>
                      )}

                      {/* Suppression */}
                      {userData.role !== 'admin' && (
                        <button 
                          onClick={() => handleUserAction(userData.id, 'delete')}
                          className="delete-user-button"
                        >
                          Supprimer
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button 
          disabled={pagination.currentPage === 1}
          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
        >
          Précédent
        </button>
        <span>
          Page {pagination.currentPage} sur {Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
        </span>
        <button 
          disabled={pagination.currentPage >= Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
        >
          Suivant
        </button>
      </div>

      <div className="user-management-help">
        <h3>Gestion des utilisateurs</h3>
        <ul>
          <li>Seuls les administrateurs peuvent gérer les utilisateurs</li>
          <li>Les administrateurs ne peuvent pas être bloqués ou supprimés</li>
          <li>La promotion permet de donner des droits d'expertise</li>
          <li>Un utilisateur bloqué ne peut plus contribuer</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;