import { createBrowserRouter } from 'react-router-dom'

import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminProfessionalsPage } from '@/pages/admin/AdminProfessionalsPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { ChatPage } from '@/pages/ChatPage'
import { ChatsPage } from '@/pages/ChatsPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { NewRequestPage } from '@/pages/NewRequestPage'
import { ProfessionalDashboardPage } from '@/pages/ProfessionalDashboardPage'
import { ProfessionalEditPage } from '@/pages/ProfessionalEditPage'
import { ProfessionalPage } from '@/pages/ProfessionalPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { RequestDetailPage } from '@/pages/RequestDetailPage'
import { RequestsPage } from '@/pages/RequestsPage'
import { ReviewPage } from '@/pages/ReviewPage'

import { AdminRoute } from './AdminRoute'
import { RouteError } from './RouteError'
import { RedirectToHome } from './RedirectToHome'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  { path: '/registro', element: <RegisterPage />, errorElement: <RouteError /> },
  {
    element: <AppLayout />,
    // Cualquier error de render dentro de la app cae acá y no en el cartel
    // por defecto de React Router.
    errorElement: <RouteError />,
    children: [
      // Públicas: se puede buscar y ver profesionales sin cuenta.
      { path: '/', element: <HomePage /> },
      // Buscar vive en la home; la ruta queda por los enlaces ya repartidos,
      // que pueden traer ?categoria= y la home sabe leer.
      { path: '/buscar', element: <RedirectToHome /> },
      { path: '/profesional/:uid', element: <ProfessionalPage /> },
      // Privadas: todo lo que implica identidad.
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/solicitudes', element: <RequestsPage /> },
          { path: '/solicitudes/:requestId', element: <RequestDetailPage /> },
          { path: '/solicitudes/:requestId/resena', element: <ReviewPage /> },
          { path: '/profesional/:uid/solicitar', element: <NewRequestPage /> },
          { path: '/chats', element: <ChatsPage /> },
          { path: '/chats/:chatId', element: <ChatPage /> },
          { path: '/notificaciones', element: <NotificationsPage /> },
          { path: '/perfil', element: <ProfilePage /> },
          { path: '/mi-trabajo', element: <ProfessionalDashboardPage /> },
          { path: '/perfil/profesional', element: <ProfessionalEditPage /> },
          {
            element: <AdminRoute />,
            children: [
              {
                path: '/admin',
                element: <AdminLayout />,
                children: [
                  { index: true, element: <AdminReportsPage /> },
                  { path: 'categorias', element: <AdminCategoriesPage /> },
                  { path: 'profesionales', element: <AdminProfessionalsPage /> },
                  { path: 'usuarios', element: <AdminUsersPage /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
