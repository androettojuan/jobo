import { createBrowserRouter } from 'react-router-dom'

import { AdminPage } from '@/pages/admin/AdminPage'
import { ChatPage } from '@/pages/ChatPage'
import { ChatsPage } from '@/pages/ChatsPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfessionalPage } from '@/pages/ProfessionalPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { RequestsPage } from '@/pages/RequestsPage'
import { SearchPage } from '@/pages/SearchPage'

import { AdminRoute } from './AdminRoute'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  {
    element: <AppLayout />,
    children: [
      // Públicas: se puede buscar y ver profesionales sin cuenta.
      { path: '/', element: <HomePage /> },
      { path: '/buscar', element: <SearchPage /> },
      { path: '/profesional/:uid', element: <ProfessionalPage /> },
      // Privadas: todo lo que implica identidad.
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/solicitudes', element: <RequestsPage /> },
          { path: '/chats', element: <ChatsPage /> },
          { path: '/chats/:chatId', element: <ChatPage /> },
          { path: '/perfil', element: <ProfilePage /> },
          {
            element: <AdminRoute />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
