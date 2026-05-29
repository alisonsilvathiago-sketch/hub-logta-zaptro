import React from 'react';
import { NavLink } from 'react-router-dom';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

const tabs = [
  { to: LOGSTOKA_ROUTES.PRODUCTS, label: 'Cadastro', end: true },
  { to: LOGSTOKA_ROUTES.PRODUCT_GROUPS, label: 'Grupos' },
  { to: LOGSTOKA_ROUTES.PRODUCT_PUBLICATION, label: 'Publicação' },
  { to: LOGSTOKA_ROUTES.PRODUCT_SYNC, label: 'Sincronização' },
];

const ProductsSectionNav: React.FC = () => (
  <nav className="ls-products-nav" aria-label="Produtos">
    {tabs.map(({ to, label, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) => `ls-products-nav__item${isActive ? ' ls-products-nav__item--active' : ''}`}
      >
        {label}
      </NavLink>
    ))}
  </nav>
);

export default ProductsSectionNav;
