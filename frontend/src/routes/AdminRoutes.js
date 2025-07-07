import React from 'react'; 
import { Routes, Route } from 'react-router-dom'; 
import AdminLayout from '../components/admin/AdminLayout';  

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard'; 
import WordsList from '../pages/admin/WordsList'; 
import WordValidation from '../pages/admin/WordValidation'; 
import WordForm from '../pages/admin/WordForm'; 
import ConjugationManager from '../pages/admin/ConjugationManager'; 
import UserManagement from '../pages/admin/UserManagement'; 
import StatisticsPage from '../pages/admin/StatisticsPage'; 
import SettingsPage from '../pages/admin/SettingsPage'; 
import HelpPage from '../pages/admin/HelpPage'; 
import ProtectedRoute from './ProtectedRoute';  

const AdminRoutes = () => {   
  return (     
    <Routes>
      <Route       
        path="/admin"       
        element={         
          <ProtectedRoute requiredRoles={['admin', 'expert']}>           
            <AdminLayout />         
          </ProtectedRoute>       
        }     
      >       
        <Route index element={<AdminDashboard />} />       
        <Route path="words" element={<WordsList />} />       
        <Route path="validation" element={<WordValidation />} />       
        <Route path="add-word" element={<WordForm />} />       
        <Route path="edit-word/:id" element={<WordForm />} />       
        <Route path="conjugation/:wordId" element={<ConjugationManager />} />       
        <Route          
          path="users"          
          element={           
            <ProtectedRoute requiredRoles={['admin']}>             
              <UserManagement />           
            </ProtectedRoute>         
          }        
        />       
        <Route path="stats" element={<StatisticsPage />} />       
        <Route path="settings" element={<SettingsPage />} />       
        <Route path="help" element={<HelpPage />} />     
      </Route>   
    </Routes>
  ); 
};  

export default AdminRoutes;