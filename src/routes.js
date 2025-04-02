import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';

const routes = [
  {
    path: '/',
    element: Home,
    private: true,
  },
  {
    path: '/login',
    element: Login,
    private: false,
  },
  {
    path: '/register',
    element: Register,
    private: false,
  },
  {
    path: '/products',
    element: Products,
    private: true,
  },
  {
    path: '/products/:id',
    element: ProductDetail,
    private: true,
  },
  {
    path: '/admin',
    element: Admin,
    private: true,
    adminOnly: true,
  },
];

export default routes; 